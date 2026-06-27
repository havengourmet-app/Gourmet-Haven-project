-- Hardens KYC storage after the first pass: Aadhaar and PAN numbers were
-- being stored in full (only masked in API responses). Private entities
-- aren't generally permitted to store full Aadhaar numbers unless they're a
-- licensed AUA/KUA, so this drops the full-value columns entirely and keeps
-- only the last 4 characters — enough for an admin to cross-check against
-- the uploaded document photo, without persisting the full number anywhere.

alter table public.kyc_submissions
  add column if not exists aadhaar_last4 text,
  add column if not exists pan_last4 text;

-- Backfill from the old full-value columns for rows submitted before this
-- migration, then drop those columns for good.
update public.kyc_submissions
set aadhaar_last4 = right(aadhaar_number, 4)
where aadhaar_last4 is null and aadhaar_number is not null;

update public.kyc_submissions
set pan_last4 = right(pan_number, 4)
where pan_last4 is null and pan_number is not null;

alter table public.kyc_submissions
  alter column aadhaar_last4 set not null,
  alter column pan_last4 set not null;

alter table public.kyc_submissions
  add constraint kyc_aadhaar_last4_length check (char_length(aadhaar_last4) = 4),
  add constraint kyc_pan_last4_length check (char_length(pan_last4) = 4);

alter table public.kyc_submissions drop column if exists aadhaar_number;
alter table public.kyc_submissions drop column if exists pan_number;

-- Note: existing rows in kyc_reveal_log with field_name = 'aadhaar_number' or
-- 'pan_number' from before this migration are left untouched — it's an
-- append-only audit table and those entries are still valid history of what
-- was revealed under the old scheme. New reveals of those two field names
-- are rejected going forward (see kycMasking.js / adminController.js).