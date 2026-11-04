-- Sign-up offer popup: one coupon can be the sign-up offer; visitors swap a mobile number for its code.

alter table public.coupons add column signup_offer boolean not null default false;
create unique index coupons_one_signup_offer on public.coupons (signup_offer) where signup_offer;

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null check (phone ~ '^[6-9][0-9]{9}$'),
  source text not null default 'signup_popup',
  coupon_code text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
alter table public.leads enable row level security;
create policy "admins read leads" on public.leads for select to authenticated using ((select public.is_admin()));
create policy "admins delete leads" on public.leads for delete to authenticated using ((select public.is_admin()));

-- The offer as shown in the popup (no code). Null when no live sign-up offer exists.
create or replace function public.signup_offer()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('kind', kind, 'value', value, 'max_discount_paise', max_discount_paise,
                            'min_order_paise', min_order_paise, 'description', description)
  from public.coupons
  where signup_offer and active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
    and (usage_limit is null or used_count < usage_limit)
  limit 1;
$$;
revoke all on function public.signup_offer() from public;
grant execute on function public.signup_offer() to anon, authenticated;

-- Save the number and reveal the code.
create or replace function public.claim_signup_offer(p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  c public.coupons;
begin
  if v_phone !~ '^[6-9][0-9]{9}$' then raise exception 'Enter a valid 10-digit mobile number'; end if;
  select * into c from public.coupons
  where signup_offer and active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
    and (usage_limit is null or used_count < usage_limit)
  limit 1;
  if not found then raise exception 'This offer has ended'; end if;
  insert into public.leads (phone, coupon_code) values (v_phone, c.code)
  on conflict (phone) do update set last_seen_at = now(), coupon_code = excluded.coupon_code;
  return jsonb_build_object('code', c.code, 'description', c.description);
end;
$$;
revoke all on function public.claim_signup_offer(text) from public;
grant execute on function public.claim_signup_offer(text) to anon, authenticated;
