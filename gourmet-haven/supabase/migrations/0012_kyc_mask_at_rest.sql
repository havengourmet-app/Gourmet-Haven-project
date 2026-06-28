-- Hardens KYC storage after the first pass: Aadhaar and PAN numbers were
-- being stored in full (only masked in API responses). Private entities
-- aren't generally permitted to store full Aadhaar numbers unless they're a
-- licensed AUA/KUA, so this drops the full-value columns entirely and keeps
-- only the last 4 characters — enough for an admin to cross-check against
-- the uploaded document photo, without persisting the full number anywhere.
--
-- Written to be safely re-runnable: every step checks existence first, so
-- running it twice (or against a DB that's already partway through this
-- migration) won't error out.

alter table public.kyc_submissions
  add column if not exists aadhaar_last4 text,
  add column if not exists pan_last4 text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'kyc_submissions' and column_name = 'aadhaar_number'
  ) then
    update public.kyc_submissions
    set aadhaar_last4 = right(aadhaar_number, 4)
    where aadhaar_last4 is null and aadhaar_number is not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'kyc_submissions' and column_name = 'pan_number'
  ) then
    update public.kyc_submissions
    set pan_last4 = right(pan_number, 4)
    where pan_last4 is null and pan_number is not null;
  end if;
end $$;

alter table public.kyc_submissions
  alter column aadhaar_last4 set not null,
  alter column pan_last4 set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'kyc_aadhaar_last4_length') then
    alter table public.kyc_submissions
      add constraint kyc_aadhaar_last4_length check (char_length(aadhaar_last4) = 4);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'kyc_pan_last4_length') then
    alter table public.kyc_submissions
      add constraint kyc_pan_last4_length check (char_length(pan_last4) = 4);
  end if;
end $$;

alter table public.kyc_submissions drop column if exists aadhaar_number;
alter table public.kyc_submissions drop column if exists pan_number;