-- Kaam: tidy up when people leave.
--
-- 1. When the last person who uses the app leaves a household, the household
--    is deleted with its tasks and anyone added without the app. Before, it
--    stayed behind with no admin and a working invite code, so someone joining
--    later would land in an abandoned household.
-- 2. When the last admin leaves, the longest-standing member who uses the app
--    becomes admin. Someone added without the app can't manage anything.
-- 3. Removes households already left empty this way.

create or replace function public.leave_household(p_household uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.members where household_id = p_household and user_id = auth.uid();
  -- Only someone who actually left can trigger the clean-up.
  if not found then return; end if;
  if not exists (select 1 from public.members m where m.household_id = p_household and m.user_id is not null) then
    delete from public.households where id = p_household;
  end if;
end $$;

create or replace function public.members_keep_an_admin() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  h uuid := coalesce(new.household_id, old.household_id);
begin
  if exists (select 1 from public.members m where m.household_id = h)
     and not exists (select 1 from public.members m where m.household_id = h and m.role = 'admin') then
    if tg_op = 'DELETE' then
      update public.members set role = 'admin'
      where id = (
        select m.id from public.members m where m.household_id = h
        order by (m.user_id is null), m.joined_at, m.id
        limit 1
      );
    else
      raise exception 'A household always needs an admin. Make someone else an admin first.'
        using errcode = 'P0001', hint = 'last_admin';
    end if;
  end if;
  return null;
end $$;

delete from public.households h
where not exists (select 1 from public.members m where m.household_id = h.id and m.user_id is not null);
