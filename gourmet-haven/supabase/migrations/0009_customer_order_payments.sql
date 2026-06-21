alter table public.orders
add column if not exists payment_status text not null default 'unpaid'
check (payment_status in ('unpaid', 'paid', 'failed', 'refunded'));

alter table public.orders
add column if not exists payment_provider text;

alter table public.orders
add column if not exists razorpay_order_id text unique;

alter table public.orders
add column if not exists razorpay_payment_id text unique;

create table if not exists public.order_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  delivery_address_id uuid references public.addresses(id) on delete set null,
  items jsonb not null default '[]'::jsonb,
  subtotal_paise integer not null check (subtotal_paise >= 0),
  delivery_fee_paise integer not null check (delivery_fee_paise >= 0),
  platform_fee_paise integer not null check (platform_fee_paise >= 0),
  total_paise integer not null check (total_paise >= 0),
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'paid', 'failed', 'expired')),
  razorpay_order_id text unique not null,
  razorpay_payment_id text unique,
  notes text not null default '',
  city text not null default 'Hyderabad',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_order_payment_attempts_updated_at on public.order_payment_attempts;
create trigger set_order_payment_attempts_updated_at
before update on public.order_payment_attempts
for each row
execute function public.set_updated_at();

alter table public.order_payment_attempts enable row level security;
