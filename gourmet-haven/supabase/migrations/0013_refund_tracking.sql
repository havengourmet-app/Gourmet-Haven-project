-- Fixes C3: cancelling a Razorpay-paid order previously did nothing to
-- reconcile the payment — money was taken, the order flipped to 'cancelled',
-- and there was no record anywhere that a refund was owed. This does not
-- wire a real Razorpay refund call yet (that's separate payments work), but
-- it closes the *silent* part of the gap: the system now tracks that a
-- refund is required, surfaces it to the owner/admin, and gives a clean
-- column to call the real refund API against later.

alter table public.orders
add column if not exists refund_status text not null default 'not_applicable'
check (refund_status in ('not_applicable', 'refund_required', 'refund_initiated', 'refunded', 'refund_failed'));

alter table public.orders
add column if not exists refund_notes text;