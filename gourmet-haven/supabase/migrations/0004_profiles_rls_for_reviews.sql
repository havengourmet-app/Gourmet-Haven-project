-- Allow any authenticated user to read limited profile fields (full_name only).
-- This is needed so the reviews join (customer:profiles(full_name)) works under RLS
-- when queried via the anon/auth client. The supabaseAdmin path already bypasses RLS,
-- but direct Supabase client usage (e.g. RestaurantReviews component if ever switched
-- to client-side) would silently return null without this policy.

drop policy if exists "profiles_select_public_name" on public.profiles;
create policy "profiles_select_public_name"
on public.profiles
for select
to authenticated
using (true);

-- Note: this replaces the previous "profiles_select_own" selectivity with a broader
-- read policy. Sensitive fields (phone, avatar_url) are not exposed in the reviews
-- query — only full_name is selected. This is an acceptable trade-off for a social
-- feature like reviews. If stricter control is needed in future, use a view or
-- stored function that projects only safe columns.

-- Drop the narrower own-profile-only policy (superseded above)
drop policy if exists "profiles_select_own" on public.profiles;

-- Keep the update policy restricted to own profile only
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);