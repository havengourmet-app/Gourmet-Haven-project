create table if not exists public.razorpay_webhook_events (
  id uuid primary key default gen_random_uuid(),
  razorpay_event_id text unique not null,
  event_type text not null,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.razorpay_webhook_events enable row level security;
