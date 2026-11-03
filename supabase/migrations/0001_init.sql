-- Airawat store schema. Money is integer paise. Times are timestamptz (UTC).
-- Access: catalogue is public read; orders are only written through place_order()
-- (which recomputes prices) and only read through get_order() or by their owner.

create extension if not exists pgcrypto;

create table public.categories (
  slug text primary key,
  name text not null,
  room text not null,
  blurb text not null,
  image text not null,
  subs text[] not null default '{}',
  position int not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  category_slug text not null references public.categories(slug) on delete restrict,
  name text not null,
  sub text not null,
  material text not null,
  finish text not null,
  colour text not null,
  design text not null,
  price_paise int not null check (price_paise > 0),
  mrp_paise int not null check (mrp_paise >= price_paise),
  currency text not null default 'INR',
  rating numeric(2,1) not null default 0 check (rating between 0 and 5),
  rating_count int not null default 0,
  ships_fast boolean not null default false,
  deal boolean not null default false,
  images text[] not null default '{}',
  dims text not null default '',
  summary text not null default '',
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.products (category_slug, price_paise);
create index on public.products (rating_count desc);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  group_name text not null,
  name text not null,
  swatch text not null,
  delta_paise int not null default 0,
  position int not null default 0,
  unique (product_id, name)
);
create index on public.product_variants (product_id);

create table public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  delta_paise int not null default 0,
  position int not null default 0,
  unique (product_id, name)
);
create index on public.product_sizes (product_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author text not null,
  city text not null default '',
  stars smallint not null check (stars between 1 and 5),
  body text not null,
  created_at timestamptz not null default now()
);
create index on public.reviews (product_id, created_at desc);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  guest_token uuid not null default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  name text not null,
  phone text not null,
  email text not null,
  address jsonb not null,
  payment_method text not null check (payment_method in ('upi', 'card', 'cod')),
  coupon text,
  mrp_paise int not null,
  subtotal_paise int not null,
  bundle_paise int not null default 0,
  coupon_paise int not null default 0,
  total_paise int not null check (total_paise >= 0),
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.orders (user_id, created_at desc);

create table public.order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name text not null,
  image text not null,
  variant_name text not null,
  size_name text not null,
  qty int not null check (qty between 1 and 10),
  unit_price_paise int not null,
  mrp_paise int not null,
  warranty boolean not null default false
);
create index on public.order_lines (order_id);

create table public.wishlists (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- Row level security ------------------------------------------------------
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_sizes enable row level security;
alter table public.reviews enable row level security;
alter table public.orders enable row level security;
alter table public.order_lines enable row level security;
alter table public.wishlists enable row level security;

create policy "catalogue is public" on public.categories for select to anon, authenticated using (true);
create policy "catalogue is public" on public.products for select to anon, authenticated using (true);
create policy "catalogue is public" on public.product_variants for select to anon, authenticated using (true);
create policy "catalogue is public" on public.product_sizes for select to anon, authenticated using (true);
create policy "reviews are public" on public.reviews for select to anon, authenticated using (true);

create policy "owners read their orders" on public.orders for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "owners read their order lines" on public.order_lines for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));

create policy "own wishlist" on public.wishlists for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Orders: prices are recomputed here, never trusted from the browser --------
create or replace function public.place_order(p_lines jsonb, p_customer jsonb, p_payment text, p_coupon text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  warranty_paise constant int := 149900;
  v_order_id uuid;
  v_code text;
  v_token uuid;
  v_line jsonb;
  v_product public.products;
  v_variant public.product_variants;
  v_size public.product_sizes;
  v_qty int;
  v_unit int;
  v_mrp_unit int;
  v_warranty boolean;
  v_mrp int := 0;
  v_subtotal int := 0;
  v_units int := 0;
  v_bundle int := 0;
  v_coupon_off int := 0;
  v_coupon text := upper(nullif(trim(p_coupon), ''));
  v_name text := trim(p_customer->>'name');
  v_phone text := trim(p_customer->>'phone');
  v_email text := lower(trim(p_customer->>'email'));
  v_lines jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 or jsonb_array_length(p_lines) > 30 then
    raise exception 'Cart is empty or too large';
  end if;
  if coalesce(length(v_name), 0) < 2 then raise exception 'Name is required'; end if;
  if v_phone !~ '^[6-9][0-9]{9}$' then raise exception 'Invalid mobile number'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Invalid email'; end if;
  if coalesce(p_customer->>'pincode', '') !~ '^[1-9][0-9]{5}$' then raise exception 'Invalid pincode'; end if;
  if coalesce(length(trim(p_customer->>'address')), 0) < 6 or coalesce(trim(p_customer->>'city'), '') = '' then
    raise exception 'Address is required';
  end if;
  if p_payment not in ('upi', 'card', 'cod') then raise exception 'Invalid payment method'; end if;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    select * into v_product from public.products where slug = v_line->>'slug';
    if not found then raise exception 'Unknown product %', v_line->>'slug'; end if;
    select * into v_variant from public.product_variants where product_id = v_product.id and name = v_line->>'variant';
    if not found then raise exception 'Unknown option for %', v_product.name; end if;
    select * into v_size from public.product_sizes where product_id = v_product.id and name = v_line->>'size';
    if not found then raise exception 'Unknown size for %', v_product.name; end if;

    v_qty := (v_line->>'qty')::int;
    if v_qty is null or v_qty < 1 or v_qty > 10 then raise exception 'Invalid quantity'; end if;
    v_warranty := coalesce((v_line->>'warranty')::boolean, false);
    v_unit := v_product.price_paise + v_variant.delta_paise + v_size.delta_paise;
    v_mrp_unit := round(v_product.mrp_paise::numeric * v_unit / v_product.price_paise);

    v_mrp := v_mrp + v_mrp_unit * v_qty;
    v_subtotal := v_subtotal + (v_unit + case when v_warranty then warranty_paise else 0 end) * v_qty;
    v_units := v_units + v_qty;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id, 'product_name', v_product.name, 'image', v_product.images[1],
      'variant_name', v_variant.name, 'size_name', v_size.name, 'qty', v_qty,
      'unit_price_paise', v_unit, 'mrp_paise', v_mrp_unit, 'warranty', v_warranty);
  end loop;

  if v_units >= 2 then v_bundle := round(v_subtotal * 0.10); end if;
  if v_coupon = 'HOME3K' and v_subtotal - v_bundle >= 4000000 then v_coupon_off := 300000;
  else v_coupon := null;
  end if;

  v_code := 'AW' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.orders (code, user_id, name, phone, email, address, payment_method, coupon,
                             mrp_paise, subtotal_paise, bundle_paise, coupon_paise, total_paise)
  values (v_code, auth.uid(), v_name, v_phone, v_email,
          jsonb_build_object('address', trim(p_customer->>'address'), 'city', trim(p_customer->>'city'), 'pincode', p_customer->>'pincode'),
          p_payment, v_coupon, v_mrp, v_subtotal, v_bundle, v_coupon_off, v_subtotal - v_bundle - v_coupon_off)
  returning id, guest_token into v_order_id, v_token;

  insert into public.order_lines (order_id, product_id, product_name, image, variant_name, size_name, qty, unit_price_paise, mrp_paise, warranty)
  select v_order_id, (l->>'product_id')::uuid, l->>'product_name', l->>'image', l->>'variant_name', l->>'size_name',
         (l->>'qty')::int, (l->>'unit_price_paise')::int, (l->>'mrp_paise')::int, (l->>'warranty')::boolean
  from jsonb_array_elements(v_lines) l;

  return jsonb_build_object('code', v_code, 'token', v_token, 'total_paise', v_subtotal - v_bundle - v_coupon_off);
end;
$$;

create or replace function public.get_order(p_code text, p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'code', o.code, 'status', o.status, 'name', o.name, 'city', o.address->>'city',
    'payment', o.payment_method, 'total_paise', o.total_paise, 'created_at', o.created_at,
    'lines', coalesce((select jsonb_agg(jsonb_build_object(
        'name', l.product_name, 'image', l.image, 'variant', l.variant_name, 'size', l.size_name,
        'qty', l.qty, 'unit_price_paise', l.unit_price_paise) order by l.id)
      from public.order_lines l where l.order_id = o.id), '[]'::jsonb))
  from public.orders o
  where o.code = p_code and (o.guest_token = p_token or o.user_id = auth.uid());
$$;

revoke all on function public.place_order(jsonb, jsonb, text, text) from public;
revoke all on function public.get_order(text, uuid) from public;
grant execute on function public.place_order(jsonb, jsonb, text, text) to anon, authenticated;
grant execute on function public.get_order(text, uuid) to anon, authenticated;
