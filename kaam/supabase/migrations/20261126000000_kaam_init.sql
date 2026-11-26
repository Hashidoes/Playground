-- =====================================================================
-- Kaam: database setup
--
-- Run this once on a new Supabase project:
--   Dashboard → SQL Editor → New query → paste this whole file → Run.
--
-- What it sets up:
--   • profiles, households, members and tasks
--   • Row Level Security on every table: people only ever see their own
--     household, and nobody sees anyone else's private tasks
--   • Roles like a WhatsApp group: admins manage people and can tick
--     anyone's task; members tick only their own (or an unassigned one)
--   • Functions the app calls for anything that needs a rule checked:
--     creating and joining households, adding and removing people,
--     changing roles, ticking tasks off
--   • Repeating tasks that schedule their next occurrence in the database
--   • A weekly score board (Monday to Sunday, IST; private tasks never count)
--
-- Every table is granted to signed-in users explicitly, because the
-- project has "Grant API access to new tables automatically" turned off.
-- Nothing is granted to signed-out (anon) users.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- One row per person who signs in. Created automatically on sign-up.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default '' check (char_length(name) <= 30),
  language    text not null default 'en' check (language in ('en', 'ml', 'hi')),
  created_at  timestamptz not null default now()
);

create table public.households (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null check (char_length(btrim(name)) between 1 and 40),
  kind               text not null default 'family' check (kind in ('family', 'roommates')),
  invite_code        text not null unique,
  invite_expires_at  timestamptz not null default now() + interval '7 days',
  created_at         timestamptz not null default now()
);

-- Everyone in a household. user_id is null for someone added without the app.
create table public.members (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households (id) on delete cascade,
  user_id       uuid references auth.users (id) on delete cascade,
  name          text not null check (char_length(btrim(name)) between 1 and 30),
  role          text not null default 'member' check (role in ('admin', 'member')),
  color         text not null,
  joined_at     timestamptz not null default now(),
  unique (household_id, user_id),
  -- Lets tasks point at (household, member) pairs, so a task can only ever
  -- be given to someone in its own household.
  unique (household_id, id)
);

create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households (id) on delete cascade,
  -- Shared by every occurrence of a repeating task. Defaults to the task's own id.
  series_id     uuid not null,
  title         text not null check (char_length(btrim(title)) between 1 and 200),
  assignee_id   uuid,                 -- null: anyone can pick it up
  created_by    uuid,
  due_date      date not null,
  due_time      time,                 -- null: any time
  repeat        text not null default 'none'
                check (repeat in ('none', 'daily', 'alternate', 'weekly', 'fortnightly', 'monthly')),
  reminder      text not null default 'off' check (reminder in ('off', 'at_time', '15_min', '1_hour')),
  is_private    boolean not null default false,
  note          text check (char_length(note) <= 1000),
  done_at       timestamptz,
  done_by       uuid,                 -- who gets the point: the person the task belongs to
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  foreign key (household_id, assignee_id) references public.members (household_id, id) on delete set null (assignee_id),
  foreign key (household_id, created_by)  references public.members (household_id, id) on delete set null (created_by),
  foreign key (household_id, done_by)     references public.members (household_id, id) on delete set null (done_by),

  -- A private task is always its creator's own.
  constraint private_is_own check (not is_private or (created_by is not null and assignee_id = created_by)),
  -- A point can only exist on a finished task.
  constraint done_by_needs_done_at check (done_by is null or done_at is not null)
);

create index tasks_household_due_idx on public.tasks (household_id, due_date);
create index tasks_series_idx on public.tasks (series_id);
create index members_user_idx on public.members (user_id);


-- ---------------------------------------------------------------------
-- Helpers used by the access rules
-- (security definer so the rules can look at members without recursion)
-- ---------------------------------------------------------------------

-- The signed-in person's member id in a household, or null.
create function public.my_member_id(h uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select m.id from public.members m where m.household_id = h and m.user_id = auth.uid()
$$;

create function public.is_member(h uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.members m where m.household_id = h and m.user_id = auth.uid())
$$;

create function public.is_admin(h uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.members m where m.household_id = h and m.user_id = auth.uid() and m.role = 'admin')
$$;

-- Today in India, whatever the server's time zone.
create function public.today_ist() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'Asia/Kolkata')::date
$$;

-- ABC-123 style codes, avoiding letters that are easy to misread (I, O).
create function public.new_invite_code() returns text
language plpgsql volatile set search_path = '' as $$
declare
  letters constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  code text;
begin
  loop
    code := substr(letters, 1 + floor(random() * 24)::int, 1)
         || substr(letters, 1 + floor(random() * 24)::int, 1)
         || substr(letters, 1 + floor(random() * 24)::int, 1)
         || '-' || (100 + floor(random() * 900)::int)::text;
    exit when not exists (select 1 from public.households where invite_code = code);
  end loop;
  return code;
end $$;

-- The first member colour not yet used in the household (same palette as the app).
create function public.pick_member_color(h uuid) returns text
language sql stable set search_path = '' as $$
  with palette(color, n) as (
    select * from unnest(array['#7C3D0B', '#4B7E3B', '#BB6002', '#045DD0', '#33512A', '#8E3B74']) with ordinality
  )
  select coalesce(
    (select p.color from palette p
      where p.color not in (select m.color from public.members m where m.household_id = h)
      order by p.n limit 1),
    (select p.color from palette p
      where p.n = 1 + (select count(*) from public.members m where m.household_id = h) % 6)
  )
$$;


-- ---------------------------------------------------------------------
-- Automatic behaviour (triggers)
-- ---------------------------------------------------------------------

-- A profile for every new sign-in. Google provides a name; email sign-in fills it in later.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 30))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Changing your name updates it in every household you're in.
create function public.sync_member_name() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.name <> '' and new.name is distinct from old.name then
    update public.members set name = new.name where user_id = new.id;
  end if;
  return new;
end $$;

create trigger on_profile_name_change
  after update of name on public.profiles
  for each row execute function public.sync_member_name();

-- New tasks start their own series; every change stamps updated_at.
create function public.tasks_before_write() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' and new.series_id is null then
    new.series_id := new.id;
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger tasks_before_write
  before insert or update on public.tasks
  for each row execute function public.tasks_before_write();

-- Repeating tasks: finishing one schedules the next; unfinishing removes it again.
create function public.tasks_repeat() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  next_date date;
begin
  if old.done_at is null and new.done_at is not null and new.repeat <> 'none' then
    -- Only if the series has no other open occurrence.
    if not exists (select 1 from public.tasks t where t.series_id = new.series_id and t.done_at is null) then
      next_date := case new.repeat
        when 'daily'       then new.due_date + 1
        when 'alternate'   then new.due_date + 2
        when 'weekly'      then new.due_date + 7
        when 'fortnightly' then new.due_date + 14
        when 'monthly'     then (new.due_date + interval '1 month')::date
      end;
      insert into public.tasks (household_id, series_id, title, assignee_id, created_by, due_date, due_time,
                                repeat, reminder, is_private, note)
      values (new.household_id, new.series_id, new.title, new.assignee_id, new.created_by,
              greatest(next_date, public.today_ist()), new.due_time,
              new.repeat, new.reminder, new.is_private, new.note);
    end if;
  elsif old.done_at is not null and new.done_at is null and new.repeat <> 'none' then
    delete from public.tasks t
    where t.series_id = new.series_id and t.done_at is null and t.due_date > new.due_date and t.id <> new.id;
  end if;
  return null;
end $$;

create trigger tasks_repeat
  after update of done_at on public.tasks
  for each row execute function public.tasks_repeat();

-- Someone leaving or removed: their private tasks go. (Their open shared tasks
-- become unassigned through the foreign keys.)
create function public.members_before_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.tasks t where t.created_by = old.id and t.is_private;
  return old;
end $$;

create trigger members_before_delete
  before delete on public.members
  for each row execute function public.members_before_delete();

-- A household always has an admin. If the last one leaves, the
-- longest-standing member takes over, like a WhatsApp group.
create function public.members_keep_an_admin() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  h uuid := coalesce(new.household_id, old.household_id);
begin
  if exists (select 1 from public.members m where m.household_id = h)
     and not exists (select 1 from public.members m where m.household_id = h and m.role = 'admin') then
    if tg_op = 'DELETE' then
      update public.members set role = 'admin'
      where id = (select m.id from public.members m where m.household_id = h order by m.joined_at, m.id limit 1);
    else
      raise exception 'A household always needs an admin. Make someone else an admin first.'
        using errcode = 'P0001', hint = 'last_admin';
    end if;
  end if;
  return null;
end $$;

create trigger members_keep_an_admin
  after update of role or delete on public.members
  for each row execute function public.members_keep_an_admin();


-- ---------------------------------------------------------------------
-- Functions the app calls
-- ---------------------------------------------------------------------

-- Start a household. The creator becomes its first admin.
create function public.create_household(p_name text, p_kind text default 'family')
returns public.households
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  h public.households;
  my_name text;
begin
  if uid is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  select nullif(btrim(p.name), '') into my_name from public.profiles p where p.id = uid;
  insert into public.households (name, kind, invite_code)
  values (btrim(p_name), p_kind, public.new_invite_code())
  returning * into h;
  insert into public.members (household_id, user_id, name, role, color)
  values (h.id, uid, coalesce(my_name, 'Me'), 'admin', public.pick_member_color(h.id));
  return h;
end $$;

-- Join with an invite code ("nai428", "NAI 428" and "NAI-428" all work).
create function public.join_household(p_code text)
returns public.households
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  clean text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  code text;
  h public.households;
  my_name text;
begin
  if uid is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  code := substr(clean, 1, 3) || '-' || substr(clean, 4);
  select * into h from public.households where invite_code = code and invite_expires_at > now();
  if not found then
    raise exception 'We couldn''t find that code.' using errcode = 'P0002', hint = 'invite_not_found';
  end if;
  if not exists (select 1 from public.members m where m.household_id = h.id and m.user_id = uid) then
    select nullif(btrim(p.name), '') into my_name from public.profiles p where p.id = uid;
    insert into public.members (household_id, user_id, name, role, color)
    values (h.id, uid, coalesce(my_name, 'Me'), 'member', public.pick_member_color(h.id));
  end if;
  return h;
end $$;

-- Admins: a fresh invite code, valid for another 7 days.
create function public.reset_invite_code(p_household uuid)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  code text;
begin
  if not public.is_admin(p_household) then raise exception 'Only admins can do this.' using errcode = '42501'; end if;
  code := public.new_invite_code();
  update public.households set invite_code = code, invite_expires_at = now() + interval '7 days' where id = p_household;
  return code;
end $$;

-- Admins: add someone who won't use the app.
create function public.add_member_without_app(p_household uuid, p_name text)
returns public.members
language plpgsql security definer set search_path = '' as $$
declare
  m public.members;
begin
  if not public.is_admin(p_household) then raise exception 'Only admins can add people.' using errcode = '42501'; end if;
  insert into public.members (household_id, user_id, name, role, color)
  values (p_household, null, btrim(p_name), 'member', public.pick_member_color(p_household))
  returning * into m;
  return m;
end $$;

-- Admins: make someone an admin, or dismiss them as admin.
create function public.set_member_role(p_member uuid, p_role text)
returns public.members
language plpgsql security definer set search_path = '' as $$
declare
  m public.members;
begin
  select * into m from public.members where id = p_member;
  if not found or not public.is_admin(m.household_id) then
    raise exception 'Only admins can change roles.' using errcode = '42501';
  end if;
  update public.members set role = p_role where id = p_member returning * into m;
  return m;
end $$;

-- Admins: remove someone else. (To remove yourself, leave the household.)
create function public.remove_member(p_member uuid)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members;
begin
  select * into m from public.members where id = p_member;
  if not found or not public.is_admin(m.household_id) then
    raise exception 'Only admins can remove people.' using errcode = '42501';
  end if;
  if m.user_id = auth.uid() then
    raise exception 'To remove yourself, leave the household.' using errcode = '42501';
  end if;
  delete from public.members where id = p_member;
end $$;

-- Leave a household. If you were the last admin, someone else takes over.
create function public.leave_household(p_household uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.members where household_id = p_household and user_id = auth.uid();
end $$;

-- Tick a task off. Admins can tick anyone's; members only their own or an
-- unassigned one, which becomes theirs. The point goes to the task's owner.
create function public.complete_task(p_task uuid)
returns public.tasks
language plpgsql security definer set search_path = '' as $$
declare
  t public.tasks;
  me uuid;
begin
  select * into t from public.tasks where id = p_task;
  if not found then raise exception 'Task not found.' using errcode = 'P0002'; end if;
  me := public.my_member_id(t.household_id);
  if me is null or (t.is_private and t.created_by <> me) then
    raise exception 'Task not found.' using errcode = 'P0002';
  end if;
  if not (public.is_admin(t.household_id) or t.assignee_id = me or t.assignee_id is null) then
    raise exception 'Only the person it belongs to or an admin can tick this off.' using errcode = '42501', hint = 'not_yours';
  end if;
  if t.done_at is not null then return t; end if;
  update public.tasks
  set done_at = now(), assignee_id = coalesce(t.assignee_id, me), done_by = coalesce(t.assignee_id, me)
  where id = p_task
  returning * into t;
  return t;
end $$;

-- Undo a tick, with the same permission rule.
create function public.uncomplete_task(p_task uuid)
returns public.tasks
language plpgsql security definer set search_path = '' as $$
declare
  t public.tasks;
  me uuid;
begin
  select * into t from public.tasks where id = p_task;
  if not found then raise exception 'Task not found.' using errcode = 'P0002'; end if;
  me := public.my_member_id(t.household_id);
  if me is null or (t.is_private and t.created_by <> me) then
    raise exception 'Task not found.' using errcode = 'P0002';
  end if;
  if not (public.is_admin(t.household_id) or t.assignee_id = me) then
    raise exception 'Only the person it belongs to or an admin can change this.' using errcode = '42501', hint = 'not_yours';
  end if;
  update public.tasks set done_at = null, done_by = null where id = p_task returning * into t;
  return t;
end $$;


-- ---------------------------------------------------------------------
-- Score board: this week (Monday to Sunday, India time). Private tasks never count.
-- ---------------------------------------------------------------------

create view public.weekly_scores with (security_invoker = true) as
select
  m.household_id,
  m.id as member_id,
  count(t.id) as score
from public.members m
left join public.tasks t
  on t.done_by = m.id
 and not t.is_private
 and t.done_at >= (date_trunc('week', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata')
group by m.household_id, m.id;


-- ---------------------------------------------------------------------
-- Access rules (Row Level Security)
-- ---------------------------------------------------------------------

alter table public.profiles   enable row level security;
alter table public.households enable row level security;
alter table public.members    enable row level security;
alter table public.tasks      enable row level security;

-- Profiles: your own only. (Names of others come from members.)
create policy "Read your own profile"   on public.profiles for select to authenticated using (id = auth.uid());
create policy "Update your own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Households: visible to their members; admins can rename them.
create policy "Members see their household" on public.households for select to authenticated using (public.is_member(id));
create policy "Admins edit their household" on public.households for update to authenticated
  using (public.is_admin(id)) with check (public.is_admin(id));

-- Members: visible to everyone in the same household. Changes go through the functions above.
create policy "Members see each other" on public.members for select to authenticated using (public.is_member(household_id));

-- Tasks: everyone in the household sees shared tasks; private tasks only their creator.
create policy "See shared tasks and your own private ones" on public.tasks for select to authenticated
  using (public.is_member(household_id) and (not is_private or created_by = public.my_member_id(household_id)));

-- Anyone in the household can add a task, as themselves.
create policy "Add tasks as yourself" on public.tasks for insert to authenticated
  with check (public.is_member(household_id) and created_by = public.my_member_id(household_id) and done_at is null);

-- Admins can edit or delete any shared task; members only the ones they created.
-- Private tasks only by their creator.
create policy "Edit tasks you may edit" on public.tasks for update to authenticated
  using (
    public.is_member(household_id) and case when is_private
      then created_by = public.my_member_id(household_id)
      else public.is_admin(household_id) or created_by = public.my_member_id(household_id) end)
  with check (
    public.is_member(household_id) and case when is_private
      then created_by = public.my_member_id(household_id)
      else public.is_admin(household_id) or created_by = public.my_member_id(household_id) end);

create policy "Delete tasks you may edit" on public.tasks for delete to authenticated
  using (
    public.is_member(household_id) and case when is_private
      then created_by = public.my_member_id(household_id)
      else public.is_admin(household_id) or created_by = public.my_member_id(household_id) end);


-- ---------------------------------------------------------------------
-- Grants: signed-in users only, and only the columns they may change.
-- Ticking off (done_at, done_by) only happens through complete_task / uncomplete_task.
-- ---------------------------------------------------------------------

revoke all on public.profiles, public.households, public.members, public.tasks, public.weekly_scores from anon, authenticated;
grant usage on schema public to authenticated;

grant select on public.profiles to authenticated;
grant update (name, language) on public.profiles to authenticated;

grant select on public.households to authenticated;
grant update (name, kind) on public.households to authenticated;

grant select on public.members to authenticated;

grant select, delete on public.tasks to authenticated;
grant insert (id, household_id, series_id, title, assignee_id, created_by, due_date, due_time, repeat, reminder, is_private, note)
  on public.tasks to authenticated;
grant update (title, assignee_id, due_date, due_time, repeat, reminder, is_private, note)
  on public.tasks to authenticated;

grant select on public.weekly_scores to authenticated;

-- Functions: nothing is callable by default; then the app's own functions for signed-in users.
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.my_member_id(uuid), public.is_member(uuid), public.is_admin(uuid), public.today_ist(),
  public.create_household(text, text), public.join_household(text), public.reset_invite_code(uuid),
  public.add_member_without_app(uuid, text), public.set_member_role(uuid, text), public.remove_member(uuid),
  public.leave_household(uuid), public.complete_task(uuid), public.uncomplete_task(uuid)
to authenticated;


-- ---------------------------------------------------------------------
-- Live updates: phones see each other's changes as they happen.
-- ---------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.tasks, public.members, public.households;
  end if;
end $$;
