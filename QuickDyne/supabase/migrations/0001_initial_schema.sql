create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer', 'owner', 'delivery')),
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text unique,
  city text not null default 'Hyderabad',
  cuisine_summary text not null default '',
  description text not null default '',
  logo_url text,
  cover_image_url text,
  subscription_status text not null default 'inactive' check (subscription_status in ('inactive', 'trialing', 'active', 'past_due', 'cancelled')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text not null default '',
  category text not null default 'General',
  price_paise integer not null check (price_paise >= 0),
  image_url text,
  is_veg boolean not null default false,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Home',
  recipient_name text not null,
  phone text not null,
  line_1 text not null,
  line_2 text not null default '',
  locality text not null,
  city text not null default 'Hyderabad',
  pincode text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  plan_name text not null,
  amount_paise integer not null check (amount_paise >= 0),
  currency text not null default 'INR',
  billing_interval text not null default 'monthly' check (billing_interval in ('monthly', 'quarterly', 'yearly')),
  status text not null default 'inactive' check (status in ('inactive', 'trialing', 'active', 'past_due', 'cancelled')),
  razorpay_subscription_id text unique,
  razorpay_plan_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  assigned_delivery_id uuid references public.profiles(id) on delete set null,
  delivery_address_id uuid references public.addresses(id) on delete set null,
  items jsonb not null default '[]'::jsonb,
  subtotal_paise integer not null check (subtotal_paise >= 0),
  delivery_fee_paise integer not null check (delivery_fee_paise >= 0),
  platform_fee_paise integer not null check (platform_fee_paise >= 0),
  total_paise integer not null check (total_paise >= 0),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'preparing', 'picked_up', 'on_the_way', 'delivered', 'cancelled')),
  notes text not null default '',
  city text not null default 'Hyderabad',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_restaurants_owner_id on public.restaurants(owner_id);
create index if not exists idx_menu_items_restaurant_id on public.menu_items(restaurant_id);
create index if not exists idx_addresses_profile_id on public.addresses(profile_id);
create index if not exists idx_subscriptions_owner_id on public.subscriptions(owner_id);
create index if not exists idx_subscriptions_restaurant_id on public.subscriptions(restaurant_id);
create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_orders_restaurant_id on public.orders(restaurant_id);
create index if not exists idx_orders_delivery_id on public.orders(assigned_delivery_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_restaurants_updated_at on public.restaurants;
create trigger set_restaurants_updated_at
before update on public.restaurants
for each row
execute function public.set_updated_at();

drop trigger if exists set_menu_items_updated_at on public.menu_items;
create trigger set_menu_items_updated_at
before update on public.menu_items
for each row
execute function public.set_updated_at();

drop trigger if exists set_addresses_updated_at on public.addresses;
create trigger set_addresses_updated_at
before update on public.addresses
for each row
execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'customer'),
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.menu_items enable row level security;
alter table public.addresses enable row level security;
alter table public.subscriptions enable row level security;
alter table public.orders enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "restaurants_select_active" on public.restaurants;
create policy "restaurants_select_active"
on public.restaurants
for select
to authenticated
using (is_active = true or owner_id = auth.uid());

drop policy if exists "restaurants_insert_owner" on public.restaurants;
create policy "restaurants_insert_owner"
on public.restaurants
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "restaurants_update_owner" on public.restaurants;
create policy "restaurants_update_owner"
on public.restaurants
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "menu_items_select_available" on public.menu_items;
create policy "menu_items_select_available"
on public.menu_items
for select
to authenticated
using (
  exists (
    select 1
    from public.restaurants
    where public.restaurants.id = menu_items.restaurant_id
      and (public.restaurants.is_active = true or public.restaurants.owner_id = auth.uid())
  )
);

drop policy if exists "menu_items_insert_owner" on public.menu_items;
create policy "menu_items_insert_owner"
on public.menu_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.restaurants
    where public.restaurants.id = menu_items.restaurant_id
      and public.restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "menu_items_update_owner" on public.menu_items;
create policy "menu_items_update_owner"
on public.menu_items
for update
to authenticated
using (
  exists (
    select 1
    from public.restaurants
    where public.restaurants.id = menu_items.restaurant_id
      and public.restaurants.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.restaurants
    where public.restaurants.id = menu_items.restaurant_id
      and public.restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "addresses_manage_own" on public.addresses;
create policy "addresses_manage_own"
on public.addresses
for all
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists "subscriptions_select_owner" on public.subscriptions;
create policy "subscriptions_select_owner"
on public.subscriptions
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "subscriptions_insert_owner" on public.subscriptions;
create policy "subscriptions_insert_owner"
on public.subscriptions
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "subscriptions_update_owner" on public.subscriptions;
create policy "subscriptions_update_owner"
on public.subscriptions
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "orders_select_customer" on public.orders;
create policy "orders_select_customer"
on public.orders
for select
to authenticated
using (customer_id = auth.uid());

drop policy if exists "orders_insert_customer" on public.orders;
create policy "orders_insert_customer"
on public.orders
for insert
to authenticated
with check (customer_id = auth.uid());

drop policy if exists "orders_select_owner" on public.orders;
create policy "orders_select_owner"
on public.orders
for select
to authenticated
using (
  exists (
    select 1
    from public.restaurants
    where public.restaurants.id = orders.restaurant_id
      and public.restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "orders_update_owner" on public.orders;
create policy "orders_update_owner"
on public.orders
for update
to authenticated
using (
  exists (
    select 1
    from public.restaurants
    where public.restaurants.id = orders.restaurant_id
      and public.restaurants.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.restaurants
    where public.restaurants.id = orders.restaurant_id
      and public.restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "orders_select_delivery" on public.orders;
create policy "orders_select_delivery"
on public.orders
for select
to authenticated
using (assigned_delivery_id = auth.uid());

drop policy if exists "orders_select_delivery_queue" on public.orders;
create policy "orders_select_delivery_queue"
on public.orders
for select
to authenticated
using (
  assigned_delivery_id is null
  and status in ('accepted', 'preparing')
  and exists (
    select 1
    from public.profiles
    where public.profiles.id = auth.uid()
      and public.profiles.role = 'delivery'
  )
);

drop policy if exists "orders_update_delivery" on public.orders;
create policy "orders_update_delivery"
on public.orders
for update
to authenticated
using (assigned_delivery_id = auth.uid())
with check (assigned_delivery_id = auth.uid());

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end
$$;
