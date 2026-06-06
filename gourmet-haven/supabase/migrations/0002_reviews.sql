create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, customer_id)
);

create index if not exists idx_reviews_restaurant_id on public.reviews(restaurant_id);
create index if not exists idx_reviews_customer_id on public.reviews(customer_id);
create index if not exists idx_reviews_order_id on public.reviews(order_id);

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at
before update on public.reviews
for each row
execute function public.set_updated_at();

create or replace function public.refresh_restaurant_avg_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_restaurant_id uuid;
begin
  if TG_OP = 'DELETE' then
    target_restaurant_id := OLD.restaurant_id;
  else
    target_restaurant_id := NEW.restaurant_id;
  end if;

  update public.restaurants
  set avg_rating = (
    select coalesce(round(avg(rating)::numeric, 1), 0)
    from public.reviews
    where restaurant_id = target_restaurant_id
  )
  where id = target_restaurant_id;

  return null;
end;
$$;

drop trigger if exists on_review_change on public.reviews;
create trigger on_review_change
after insert or update or delete on public.reviews
for each row
execute function public.refresh_restaurant_avg_rating();

alter table public.reviews enable row level security;

drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all"
on public.reviews
for select
to authenticated
using (true);

drop policy if exists "reviews_insert_customer" on public.reviews;
create policy "reviews_insert_customer"
on public.reviews
for insert
to authenticated
with check (
  customer_id = auth.uid()
  and exists (
    select 1 from public.orders
    where id = reviews.order_id
      and customer_id = auth.uid()
      and status = 'delivered'
  )
);

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own"
on public.reviews
for update
to authenticated
using (customer_id = auth.uid())
with check (customer_id = auth.uid());