-- Admin panel: admin accounts, write access for admins, hidden products, image storage.

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
create policy "admins see themselves" on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Hidden products stay in the database (orders reference them) but leave the shop.
alter table public.products add column active boolean not null default true;
create index on public.products (active);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

-- Shoppers see active products only; admins see everything.
drop policy "catalogue is public" on public.products;
create policy "active products are public" on public.products for select to anon, authenticated
  using (active or (select public.is_admin()));

-- Admin writes on the catalogue.
create policy "admins manage categories" on public.categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins manage products" on public.products for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins manage variants" on public.product_variants for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins manage sizes" on public.product_sizes for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins manage reviews" on public.reviews for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Orders: admins read everything and may change only the status.
create policy "admins read orders" on public.orders for select to authenticated
  using ((select public.is_admin()));
create policy "admins update orders" on public.orders for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins read order lines" on public.order_lines for select to authenticated
  using ((select public.is_admin()));
revoke update on public.orders from anon, authenticated;
grant update (status) on public.orders to authenticated;

-- Product photos: public bucket, admins upload/replace/delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;
create policy "admins upload product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "admins update product images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "admins delete product images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

-- Save a product with its options and sizes in one transaction. Runs as the caller, so RLS still applies.
create or replace function public.admin_save_product(p jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := nullif(p->>'id', '')::uuid;
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  if jsonb_array_length(coalesce(p->'variants', '[]')) = 0 then raise exception 'Add at least one option'; end if;
  if jsonb_array_length(coalesce(p->'sizes', '[]')) = 0 then raise exception 'Add at least one size'; end if;

  if v_id is null then
    insert into public.products (slug, category_slug, name, sub, material, finish, colour, design, price_paise, mrp_paise,
      rating, rating_count, ships_fast, deal, images, dims, summary, position, active)
    values (p->>'slug', p->>'category_slug', p->>'name', p->>'sub', p->>'material', p->>'finish', p->>'colour', p->>'design',
      (p->>'price_paise')::int, (p->>'mrp_paise')::int, coalesce((p->>'rating')::numeric, 0), coalesce((p->>'rating_count')::int, 0),
      (p->>'ships_fast')::boolean, (p->>'deal')::boolean, array(select jsonb_array_elements_text(p->'images')),
      p->>'dims', p->>'summary', coalesce((select max(position) + 1 from public.products), 0), (p->>'active')::boolean)
    returning id into v_id;
  else
    update public.products set
      slug = p->>'slug', category_slug = p->>'category_slug', name = p->>'name', sub = p->>'sub', material = p->>'material',
      finish = p->>'finish', colour = p->>'colour', design = p->>'design', price_paise = (p->>'price_paise')::int,
      mrp_paise = (p->>'mrp_paise')::int, ships_fast = (p->>'ships_fast')::boolean, deal = (p->>'deal')::boolean,
      images = array(select jsonb_array_elements_text(p->'images')), dims = p->>'dims', summary = p->>'summary',
      active = (p->>'active')::boolean
    where id = v_id;
    if not found then raise exception 'Product not found'; end if;
  end if;

  delete from public.product_variants where product_id = v_id;
  insert into public.product_variants (product_id, group_name, name, swatch, delta_paise, position)
  select v_id, v->>'group_name', v->>'name', v->>'swatch', (v->>'delta_paise')::int, (o - 1)::int
  from jsonb_array_elements(p->'variants') with ordinality as t(v, o);

  delete from public.product_sizes where product_id = v_id;
  insert into public.product_sizes (product_id, name, delta_paise, position)
  select v_id, s->>'name', (s->>'delta_paise')::int, (o - 1)::int
  from jsonb_array_elements(p->'sizes') with ordinality as t(s, o);

  return v_id;
end;
$$;
revoke all on function public.admin_save_product(jsonb) from public, anon;
grant execute on function public.admin_save_product(jsonb) to authenticated;

-- To make someone an admin after they create an account (run in the SQL editor):
--   insert into public.admins (user_id) select id from auth.users where email = 'owner@example.com';
