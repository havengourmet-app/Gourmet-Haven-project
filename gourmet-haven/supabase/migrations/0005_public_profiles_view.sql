-- Tighten profile reads after the reviews integration.
-- Reviews and other social surfaces should read public-safe fields through this
-- view instead of granting authenticated users access to full profile rows.

create or replace view public.public_profiles as
select
  id,
  full_name,
  avatar_url
from public.profiles;

grant select on public.public_profiles to authenticated;

drop policy if exists "profiles_select_public_name" on public.profiles;

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
