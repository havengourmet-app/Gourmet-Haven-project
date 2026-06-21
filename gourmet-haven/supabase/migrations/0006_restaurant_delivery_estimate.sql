alter table public.restaurants
add column if not exists estimated_delivery_minutes integer not null default 35
check (estimated_delivery_minutes >= 10 and estimated_delivery_minutes <= 120);
