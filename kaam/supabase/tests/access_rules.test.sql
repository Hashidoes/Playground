-- Access-rule tests for the Kaam database. LOCAL TESTING ONLY.
--
-- Runs against plain Postgres after local_supabase_shim.sql and the migration:
--   psql -v ON_ERROR_STOP=1 -f local_supabase_shim.sql -f ../migrations/*.sql -f access_rules.test.sql
--
-- Each check runs as a specific person (Asha the admin, Kiran a member,
-- Ravi from another household) by setting the JWT claims Supabase would set.
-- Every check prints "PASS …"; the first failure stops the run.

\set ON_ERROR_STOP on
\set QUIET on
\pset tuples_only on
\pset format unaligned

-- ---------- Test helpers (created as the superuser) ----------
create schema test;
grant usage on schema test to anon, authenticated;

create function test.ok(cond boolean, label text) returns void language plpgsql as $$
begin
  if cond is not true then raise exception 'FAIL: %', label; end if;
  raise notice 'PASS %', label;
end $$;

-- Runs a statement that must be refused; optionally checks the message.
create function test.refused(q text, expect text, label text) returns void language plpgsql as $$
begin
  begin
    execute q;
  exception when others then
    if expect is not null and position(lower(expect) in lower(sqlerrm)) = 0 then
      raise exception 'FAIL: % (expected error containing "%", got "%")', label, expect, sqlerrm;
    end if;
    raise notice 'PASS %', label;
    return;
  end;
  raise exception 'FAIL: % (it was allowed)', label;
end $$;
grant execute on all functions in schema test to anon, authenticated;

\set asha '00000000-0000-4000-8000-0000000000a1'
\set kiran '00000000-0000-4000-8000-0000000000b2'
\set ravi '00000000-0000-4000-8000-0000000000c3'

-- ---------- Sign-up creates profiles ----------
insert into auth.users (id, email, raw_user_meta_data) values
  (:'asha', 'asha@example.com', '{}'),
  (:'kiran', 'kiran@example.com', '{"full_name": "Kiran Menon"}'),
  (:'ravi', 'ravi@example.com', '{}');
select test.ok((select count(*) = 3 from public.profiles), 'a profile is created for every sign-up');
select test.ok((select name = 'Kiran Menon' from public.profiles where id = :'kiran'), 'Google sign-up brings the name along');

-- ---------- Signed out: nothing ----------
reset role; set role anon;
select test.refused('select * from public.tasks', 'permission denied', 'signed-out users cannot read tasks');
select test.refused('select public.create_household(''X'', ''family'')', 'permission denied', 'signed-out users cannot create households');

-- ---------- Asha signs in and starts a household ----------
reset role; select set_config('request.jwt.claims', json_build_object('sub', :'asha')::text, false) \g /dev/null
set role authenticated;
update public.profiles set name = 'Asha', language = 'ml' where id = auth.uid();
-- Row Level Security filters out rows you may not touch, so this changes nothing.
update public.profiles set name = 'Hacked' where id = :'kiran';
reset role; select test.ok((select name = 'Kiran Menon' from public.profiles where id = :'kiran'), 'cannot edit someone else''s profile'); set role authenticated;
select (public.create_household('Flat 4B', 'roommates')).id as h1 \gset
select test.ok((select role = 'admin' and name = 'Asha' from public.members where user_id = auth.uid()), 'the creator is the first admin, named from their profile');
select invite_code as code from public.households where id = :'h1' \gset
select test.ok(:'code' ~ '^[A-HJ-NP-Z]{3}-[0-9]{3}$', 'invite code looks like ABC-123 without I or O');
select (public.add_member_without_app(:'h1', 'Dadi')).id as dadi \gset
select test.ok((select user_id is null and role = 'member' from public.members where id = :'dadi'), 'admin adds someone without the app');
select test.ok((select count(distinct color) = 2 from public.members where household_id = :'h1'), 'each member gets their own colour');

-- ---------- Kiran joins with the code ----------
reset role; select set_config('request.jwt.claims', json_build_object('sub', :'kiran')::text, false) \g /dev/null
set role authenticated;
select test.refused('select public.join_household(''ZZZ-999'')', 'couldn''t find that code', 'a wrong code is refused');
select (public.join_household(lower(replace(:'code', '-', ' ')))).id = :'h1' as joined \gset
select test.ok(:'joined', 'joining works with a lowercase, spaced code');
select test.ok((select role = 'member' from public.members where user_id = auth.uid()), 'people who join are members');
select public.join_household(:'code') \g /dev/null
select test.ok((select count(*) = 1 from public.members where user_id = auth.uid()), 'joining twice does not duplicate');
select id as kiran_m from public.members where user_id = auth.uid() \gset
select id as asha_m from public.members where name = 'Asha' \gset
select test.refused(format('select public.add_member_without_app(%L, %L)', :'h1', 'Someone'), 'only admins', 'members cannot add people');
select test.refused(format('select public.set_member_role(%L, %L)', :'kiran_m', 'admin'), 'only admins', 'members cannot make themselves admin');
select test.refused(format('select public.remove_member(%L)', :'dadi'), 'only admins', 'members cannot remove people');
select test.refused(format('select public.reset_invite_code(%L)', :'h1'), 'only admins', 'members cannot reset the invite code');
update public.households set name = 'Mine now' where id = :'h1';
reset role; select test.ok((select name = 'Flat 4B' from public.households where id = :'h1'), 'members cannot rename the household'); set role authenticated;

-- Tasks as Kiran
insert into public.tasks (household_id, title, assignee_id, created_by, due_date)
values (:'h1', 'Laundry', :'kiran_m', :'kiran_m', public.today_ist()) returning id as laundry \gset
insert into public.tasks (household_id, title, assignee_id, created_by, due_date, is_private)
values (:'h1', 'Call the bank', :'kiran_m', :'kiran_m', public.today_ist(), true) returning id as bank \gset
insert into public.tasks (household_id, title, assignee_id, created_by, due_date)
values (:'h1', 'Order groceries', null, :'kiran_m', public.today_ist()) returning id as groceries \gset
select test.refused(format('insert into public.tasks (household_id, title, assignee_id, created_by, due_date) values (%L, %L, null, %L, current_date)', :'h1', 'Spoofed', :'asha_m'),
  'row-level security', 'cannot add a task pretending to be someone else');
select test.refused(format('insert into public.tasks (household_id, title, assignee_id, created_by, due_date, is_private) values (%L, %L, %L, %L, current_date, true)', :'h1', 'Private for Asha', :'asha_m', :'kiran_m'),
  'private_is_own', 'a private task cannot be given to someone else');
select test.refused(format('update public.tasks set done_at = now() where id = %L', :'laundry'), 'permission denied', 'ticking off only happens through complete_task');

-- ---------- Asha: privacy and admin powers over tasks ----------
reset role; select set_config('request.jwt.claims', json_build_object('sub', :'asha')::text, false) \g /dev/null
set role authenticated;
select test.ok((select count(*) = 0 from public.tasks where id = :'bank'), 'nobody else sees a private task, not even an admin');
select test.refused(format('select public.complete_task(%L)', :'bank'), 'not found', 'an admin cannot tick someone''s private task');
update public.tasks set title = 'Hacked' where id = :'bank';
reset role; select test.ok((select title = 'Call the bank' from public.tasks where id = :'bank'), 'an admin cannot edit a private task'); set role authenticated;
update public.tasks set due_time = '19:00' where id = :'laundry';
select test.ok((select due_time = '19:00' from public.tasks where id = :'laundry'), 'an admin can edit anyone''s shared task');
insert into public.tasks (household_id, title, assignee_id, created_by, due_date, repeat)
values (:'h1', 'Water the tulsi plant', :'dadi', :'asha_m', public.today_ist(), 'daily') returning id as tulsi \gset
select public.complete_task(:'tulsi') \g /dev/null
select test.ok((select done_by = :'dadi' from public.tasks where id = :'tulsi'), 'an admin ticks Dadi''s task and the point goes to Dadi');
select test.ok((select count(*) = 1 from public.tasks where series_id = :'tulsi' and done_at is null and due_date = public.today_ist() + 1),
  'finishing a daily task schedules tomorrow''s');
select public.uncomplete_task(:'tulsi') \g /dev/null
select test.ok((select count(*) = 1 from public.tasks where series_id = :'tulsi'), 'unticking removes the occurrence it scheduled');
select public.complete_task(:'tulsi') \g /dev/null

-- ---------- Kiran: members tick only their own ----------
reset role; select set_config('request.jwt.claims', json_build_object('sub', :'kiran')::text, false) \g /dev/null
set role authenticated;
select test.ok((select count(*) = 1 from public.tasks where id = :'bank'), 'you see your own private task');
select test.refused(format('select public.uncomplete_task(%L)', :'tulsi'), 'only the person', 'a member cannot untick Dadi''s task');
insert into public.tasks (household_id, title, assignee_id, created_by, due_date)
values (:'h1', 'Asha''s shopping', :'asha_m', :'kiran_m', public.today_ist()) returning id as shopping \gset
select test.refused(format('select public.complete_task(%L)', :'shopping'), 'only the person', 'a member cannot tick someone else''s task');
reset role; select set_config('request.jwt.claims', json_build_object('sub', :'asha')::text, false) \g /dev/null
set role authenticated;
insert into public.tasks (household_id, title, assignee_id, created_by, due_date)
values (:'h1', 'Pay the bill', :'asha_m', :'asha_m', public.today_ist()) returning id as bill \gset
reset role; select set_config('request.jwt.claims', json_build_object('sub', :'kiran')::text, false) \g /dev/null
set role authenticated;
update public.tasks set title = 'Edited by Kiran' where id = :'bill';
delete from public.tasks where id = :'bill';
reset role; select test.ok((select title = 'Pay the bill' from public.tasks where id = :'bill'), 'a member cannot edit or delete someone else''s task'); set role authenticated;
select public.complete_task(:'laundry') \g /dev/null
select public.complete_task(:'groceries') \g /dev/null
select test.ok((select assignee_id = :'kiran_m' and done_by = :'kiran_m' from public.tasks where id = :'groceries'), 'an unassigned task becomes yours when you tick it');
select public.complete_task(:'bank') \g /dev/null
select test.ok((select score = 2 from public.weekly_scores where member_id = :'kiran_m'), 'the score counts shared tasks only, not private ones');
select test.ok((select score = 1 from public.weekly_scores where member_id = :'dadi'), 'Dadi''s point is on the score board');

-- ---------- Ravi: another household entirely ----------
reset role; select set_config('request.jwt.claims', json_build_object('sub', :'ravi')::text, false) \g /dev/null
set role authenticated;
select test.ok((select count(*) = 0 from public.households), 'an outsider sees no households');
select test.ok((select count(*) = 0 from public.members), 'an outsider sees no members');
select test.ok((select count(*) = 0 from public.tasks), 'an outsider sees no tasks');
select test.ok((select count(*) = 0 from public.weekly_scores), 'an outsider sees no scores');
select test.refused(format('select public.complete_task(%L)', :'laundry'), 'not found', 'an outsider cannot tick another household''s task');
select test.refused(format('insert into public.tasks (household_id, title, created_by, due_date) values (%L, %L, null, current_date)', :'h1', 'Sneaky'), null, 'an outsider cannot add tasks to another household');
select (public.create_household('Ravi''s flat', 'roommates')).id as h2 \gset
select id as ravi_m from public.members where user_id = auth.uid() \gset
select test.refused(format('insert into public.tasks (household_id, title, assignee_id, created_by, due_date) values (%L, %L, %L, %L, current_date)', :'h2', 'Cross', :'kiran_m', :'ravi_m'),
  'foreign key', 'a task cannot be given to someone in another household');

-- ---------- Roles: there is always an admin ----------
reset role; select set_config('request.jwt.claims', json_build_object('sub', :'asha')::text, false) \g /dev/null
set role authenticated;
select test.refused(format('select public.set_member_role(%L, %L)', :'asha_m', 'member'), 'always needs an admin', 'the last admin cannot step down');
select public.set_member_role(:'kiran_m', 'admin') \g /dev/null
select test.ok((select role = 'admin' from public.members where id = :'kiran_m'), 'an admin can make someone admin');
select public.set_member_role(:'asha_m', 'member') \g /dev/null
select test.ok((select role = 'member' from public.members where id = :'asha_m'), 'an admin can step down when another admin exists');
select test.refused(format('select public.remove_member(%L)', :'dadi'), 'only admins', 'after stepping down, Asha can no longer remove people');

-- Kiran (now the only admin) removes Dadi, then leaves
reset role; select set_config('request.jwt.claims', json_build_object('sub', :'kiran')::text, false) \g /dev/null
set role authenticated;
select test.refused(format('select public.remove_member(%L)', :'kiran_m'), 'leave the household', 'admins leave rather than remove themselves');
select public.remove_member(:'dadi') \g /dev/null
select test.ok((select count(*) = 0 from public.members where id = :'dadi'), 'an admin can remove someone');
select test.ok((select bool_and(assignee_id is null) from public.tasks where series_id = :'tulsi' and done_at is null), 'their open tasks are left for anyone');
select public.leave_household(:'h1') \g /dev/null
reset role;
select test.ok((select role = 'admin' from public.members where id = :'asha_m'), 'when the last admin leaves, the longest-standing member becomes admin');
select test.ok((select count(*) = 0 from public.tasks where id = :'bank'), 'leaving deletes your private tasks');
select test.ok((select count(*) = 1 from public.tasks where id = :'laundry'), 'your shared tasks stay with the household');

-- ---------- Profile names follow you ----------
select set_config('request.jwt.claims', json_build_object('sub', :'asha')::text, false) \g /dev/null
set role authenticated;
update public.profiles set name = 'Asha N' where id = auth.uid();
select test.ok((select name = 'Asha N' from public.members where id = :'asha_m'), 'renaming yourself updates your name in the household');

-- ---------- Live updates ----------
reset role;
select test.ok((select count(*) = 3 from pg_publication_tables where pubname = 'supabase_realtime'), 'tasks, members and households send live updates');

\echo 'All access-rule tests passed.'
