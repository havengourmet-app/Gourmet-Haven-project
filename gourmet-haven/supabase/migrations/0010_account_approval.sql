-- Fixes C1: anyone could self-register as 'owner' or 'delivery' with zero vetting.
-- Adds an approval workflow: customers are auto-approved; owner/delivery accounts
-- start 'pending' until an admin approves them. Also closes the related hole where
-- someone could call Supabase's signUp API directly with role: 'admin' in metadata
-- and get an admin profile created.

alter table public.profiles
add column if not exists approval_status text not null default 'pending'
check (approval_status in ('pending', 'approved', 'rejected'));

-- Grandfather in every account that already existed before this migration ran —
-- otherwise the new column's default would lock out existing owners/delivery partners.
update public.profiles
set approval_status = 'approved'
where approval_status = 'pending';

-- Allow an 'admin' role so approvals can be done from inside the app.
-- Admin accounts can NEVER be created via self-signup (see trigger below) —
-- create the first one by hand once this migration is applied:
--   update public.profiles set role = 'admin', approval_status = 'approved' where id = '<uuid>';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
check (role in ('customer', 'owner', 'delivery', 'admin'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'customer');

  -- Whitelist: 'admin' (or anything else) can never be self-assigned at signup,
  -- regardless of what the client sends in auth metadata.
  if requested_role not in ('customer', 'owner', 'delivery') then
    requested_role := 'customer';
  end if;

  insert into public.profiles (id, role, full_name, approval_status)
  values (
    new.id,
    requested_role,
    new.raw_user_meta_data ->> 'full_name',
    case when requested_role = 'customer' then 'approved' else 'pending' end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Admins need to read/update every profile to review and decide applications.
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid() and admin_profile.role = 'admin'
  )
);

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles
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