-- Allow delivery partners to claim unassigned orders (set assigned_delivery_id)
drop policy if exists "orders_claim_delivery" on public.orders;
create policy "orders_claim_delivery"
on public.orders
for update
to authenticated
using (
  assigned_delivery_id is null
  and status in ('accepted', 'preparing')
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'delivery'
  )
)
with check (
  assigned_delivery_id = auth.uid()
);