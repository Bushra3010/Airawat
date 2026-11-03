-- Coupons managed from the admin panel, shipment details for Shiprocket, state in delivery addresses.

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^[A-Z0-9-]{3,24}$'),
  description text not null default '',
  kind text not null check (kind in ('percent', 'flat')),
  value int not null check (value > 0),             -- percent: 1-90; flat: paise
  min_order_paise int not null default 0 check (min_order_paise >= 0),
  max_discount_paise int check (max_discount_paise > 0), -- cap for percent coupons
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit int check (usage_limit > 0),
  used_count int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint percent_range check (kind <> 'percent' or value <= 90)
);
alter table public.coupons enable row level security;
-- No public read: shoppers can only check one code at a time through check_coupon().
create policy "admins manage coupons" on public.coupons for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

insert into public.coupons (code, description, kind, value, min_order_paise)
values ('HOME3K', '₹3,000 off orders above ₹40,000', 'flat', 300000, 4000000)
on conflict (code) do nothing;

-- Works out a coupon's discount on an amount (after the buy-2 bonus). Internal helper.
create or replace function public.coupon_discount(p_code text, p_amount_paise int)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c public.coupons;
  v_off int;
begin
  select * into c from public.coupons where code = upper(trim(p_code));
  if not found or not c.active then
    return jsonb_build_object('valid', false, 'message', 'That code isn''t valid.');
  end if;
  if c.starts_at is not null and now() < c.starts_at then
    return jsonb_build_object('valid', false, 'message', 'That code isn''t active yet.');
  end if;
  if c.ends_at is not null and now() > c.ends_at then
    return jsonb_build_object('valid', false, 'message', 'That code has expired.');
  end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then
    return jsonb_build_object('valid', false, 'message', 'That code has been fully used.');
  end if;
  if p_amount_paise < c.min_order_paise then
    return jsonb_build_object('valid', false, 'message',
      format('Add ₹%s more to use this code.', to_char((c.min_order_paise - p_amount_paise) / 100.0, 'FM99,99,99,990')),
      'min_order_paise', c.min_order_paise);
  end if;
  v_off := case when c.kind = 'percent' then round(p_amount_paise * c.value / 100.0)::int else c.value end;
  if c.max_discount_paise is not null then v_off := least(v_off, c.max_discount_paise); end if;
  v_off := least(v_off, p_amount_paise);
  return jsonb_build_object('valid', true, 'code', c.code, 'discount_paise', v_off,
    'message', coalesce(nullif(c.description, ''), 'Coupon applied.'));
end;
$$;
revoke all on function public.coupon_discount(text, int) from public, anon, authenticated;

-- Public: check a code against a cart amount (paise, after the buy-2 bonus).
create or replace function public.check_coupon(p_code text, p_amount_paise int)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.coupon_discount(left(coalesce(p_code, ''), 24), greatest(coalesce(p_amount_paise, 0), 0));
$$;
revoke all on function public.check_coupon(text, int) from public;
grant execute on function public.check_coupon(text, int) to anon, authenticated;

-- Shipments (filled in when an admin ships with Shiprocket).
alter table public.orders
  add column shiprocket_order_id bigint,
  add column shipment_id bigint,
  add column awb text,
  add column courier text,
  add column shipped_at timestamptz;

create or replace function public.admin_record_shipment(p_order uuid, p jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  update public.orders set
    shiprocket_order_id = (p->>'shiprocket_order_id')::bigint,
    shipment_id = (p->>'shipment_id')::bigint,
    awb = nullif(p->>'awb', ''),
    courier = nullif(p->>'courier', ''),
    shipped_at = case when nullif(p->>'awb', '') is not null then now() else shipped_at end,
    status = case when nullif(p->>'awb', '') is not null and status in ('pending', 'paid') then 'shipped' else status end,
    address = case when nullif(p->>'state', '') is not null then address || jsonb_build_object('state', p->>'state') else address end
  where id = p_order;
  if not found then raise exception 'Order not found'; end if;
end;
$$;
revoke all on function public.admin_record_shipment(uuid, jsonb) from public, anon;
grant execute on function public.admin_record_shipment(uuid, jsonb) to authenticated;

-- place_order: coupons from the table (with usage counting) and the delivery state.
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
  v_check jsonb;
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
    select * into v_product from public.products where slug = v_line->>'slug' and active;
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

  if v_coupon is not null then
    v_check := public.coupon_discount(v_coupon, v_subtotal - v_bundle);
    if (v_check->>'valid')::boolean then
      -- Count the use; the condition stops two orders racing past the usage limit.
      update public.coupons set used_count = used_count + 1
      where code = v_coupon and (usage_limit is null or used_count < usage_limit);
      if found then v_coupon_off := (v_check->>'discount_paise')::int; else v_coupon := null; end if;
    else
      v_coupon := null;
    end if;
  end if;

  v_code := 'AW' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.orders (code, user_id, name, phone, email, address, payment_method, coupon,
                             mrp_paise, subtotal_paise, bundle_paise, coupon_paise, total_paise)
  values (v_code, auth.uid(), v_name, v_phone, v_email,
          jsonb_build_object('address', trim(p_customer->>'address'), 'city', trim(p_customer->>'city'),
                             'state', coalesce(trim(p_customer->>'state'), ''), 'pincode', p_customer->>'pincode'),
          p_payment, v_coupon, v_mrp, v_subtotal, v_bundle, v_coupon_off, v_subtotal - v_bundle - v_coupon_off)
  returning id, guest_token into v_order_id, v_token;

  insert into public.order_lines (order_id, product_id, product_name, image, variant_name, size_name, qty, unit_price_paise, mrp_paise, warranty)
  select v_order_id, (l->>'product_id')::uuid, l->>'product_name', l->>'image', l->>'variant_name', l->>'size_name',
         (l->>'qty')::int, (l->>'unit_price_paise')::int, (l->>'mrp_paise')::int, (l->>'warranty')::boolean
  from jsonb_array_elements(v_lines) l;

  return jsonb_build_object('code', v_code, 'token', v_token, 'total_paise', v_subtotal - v_bundle - v_coupon_off);
end;
$$;

-- get_order: also return tracking details.
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
    'awb', o.awb, 'courier', o.courier,
    'lines', coalesce((select jsonb_agg(jsonb_build_object(
        'name', l.product_name, 'image', l.image, 'variant', l.variant_name, 'size', l.size_name,
        'qty', l.qty, 'unit_price_paise', l.unit_price_paise) order by l.id)
      from public.order_lines l where l.order_id = o.id), '[]'::jsonb))
  from public.orders o
  where o.code = p_code and (o.guest_token = p_token or o.user_id = auth.uid());
$$;
