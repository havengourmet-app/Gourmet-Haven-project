-- KYC onboarding for owner/delivery accounts.
-- Adds a kyc_submissions table (one row per profile, role-conditional fields,
-- Cloudinary document URLs, manual verification status for now) and a
-- kyc_reveal_log table so every time an admin reveals a masked sensitive
-- field, there is an audit trail of who looked and when.

create table if not exists public.kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  full_legal_name text not null,
  date_of_birth date not null,
  mobile_number text not null,
  home_address text not null,

  aadhaar_number text not null,
  pan_number text not null,
  driving_license_number text,
  restaurant_license_number text,
  gig_act_uid text,

  aadhaar_doc_url text,
  pan_doc_url text,
  license_doc_url text,

  -- 'manual' today; later populated by a real verification provider (e.g. 'surepass').
  verification_provider text not null default 'manual',
  verification_status text not null default 'pending_review'
    check (verification_status in ('pending_review', 'verified', 'rejected')),

  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_kyc_submissions_profile_id on public.kyc_submissions(profile_id);
create index if not exists idx_kyc_submissions_status on public.kyc_submissions(verification_status);

drop trigger if exists set_kyc_submissions_updated_at on public.kyc_submissions;
create trigger set_kyc_submissions_updated_at
before update on public.kyc_submissions
for each row
execute function public.set_updated_at();

-- Audit log: every reveal of a masked field by an admin is recorded here.
-- This table is intentionally append-only from the app's perspective —
-- there is no update/delete policy, only insert + select for admins.
create table if not exists public.kyc_reveal_log (
  id uuid primary key default gen_random_uuid(),
  kyc_submission_id uuid not null references public.kyc_submissions(id) on delete cascade,
  admin_id uuid not null references public.profiles(id) on delete set null,
  field_name text not null,
  revealed_at timestamptz not null default now()
);

create index if not exists idx_kyc_reveal_log_submission_id on public.kyc_reveal_log(kyc_submission_id);

alter table public.kyc_submissions enable row level security;
alter table public.kyc_reveal_log enable row level security;

-- Applicants can insert and read their own submission (e.g. to see their own
-- status/resubmit after rejection), but cannot read other people's.
drop policy if exists "kyc_select_own" on public.kyc_submissions;
create policy "kyc_select_own"
on public.kyc_submissions
for select
to authenticated
using (profile_id = auth.uid());

drop policy if exists "kyc_insert_own" on public.kyc_submissions;
create policy "kyc_insert_own"
on public.kyc_submissions
for insert
to authenticated
with check (profile_id = auth.uid());

-- Applicants can update their own submission only while it's pending or
-- after rejection (resubmission flow) — not after it's been verified.
drop policy if exists "kyc_update_own_unverified" on public.kyc_submissions;
create policy "kyc_update_own_unverified"
on public.kyc_submissions
for update
to authenticated
using (profile_id = auth.uid() and verification_status <> 'verified')
with check (profile_id = auth.uid());

-- Admins can read and update every submission (to review and decide).
drop policy if exists "kyc_select_admin" on public.kyc_submissions;
create policy "kyc_select_admin"
on public.kyc_submissions
for select
to authenticated
using (
  exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid() and admin_profile.role = 'admin'
  )
);

drop policy if exists "kyc_update_admin" on public.kyc_submissions;
create policy "kyc_update_admin"
on public.kyc_submissions
for update
to authenticated
using (
  exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid() and admin_profile.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid() and admin_profile.role = 'admin'
  )
);

-- Reveal log: admins only, insert + select. No update/delete policy at all,
-- so even an admin cannot edit or erase the audit trail through the API.
drop policy if exists "kyc_reveal_log_select_admin" on public.kyc_reveal_log;
create policy "kyc_reveal_log_select_admin"
on public.kyc_reveal_log
for select
to authenticated
using (
  exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid() and admin_profile.role = 'admin'
  )
);

drop policy if exists "kyc_reveal_log_insert_admin" on public.kyc_reveal_log;
create policy "kyc_reveal_log_insert_admin"
on public.kyc_reveal_log
for insert
to authenticated
with check (
  admin_id = auth.uid()
  and exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid() and admin_profile.role = 'admin'
  )
);