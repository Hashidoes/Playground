// Everything the app reads from and writes to Supabase. Screens never call this
// directly: the store does, so screens work the same on sample data and for real.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import type { Household, HouseholdKind, Language, Member, Reminder, Repeat, Role, Task } from './types';

type Db = SupabaseClient<Database>;
type TaskRow = Database['public']['Tables']['tasks']['Row'];
type MemberRow = Database['public']['Tables']['members']['Row'];
type HouseholdRow = Database['public']['Tables']['households']['Row'];

// ---------- Rows to app types ----------

export function toHousehold(r: HouseholdRow): Household {
  return { id: r.id, name: r.name, kind: r.kind as HouseholdKind, inviteCode: r.invite_code };
}

export function toMember(r: MemberRow, myLanguage: Language, myUserId: string | null): Member {
  return {
    id: r.id,
    name: r.name,
    role: r.role as Role,
    color: r.color,
    // Only your own greeting language is known; it isn't shown for anyone else.
    language: r.user_id && r.user_id === myUserId ? myLanguage : 'en',
    usesApp: r.user_id !== null,
  };
}

export function toTask(r: TaskRow): Task {
  return {
    id: r.id,
    seriesId: r.series_id,
    title: r.title,
    assigneeId: r.assignee_id,
    createdById: r.created_by ?? '',
    dueDate: r.due_date,
    dueTime: r.due_time ? r.due_time.slice(0, 5) : null,
    repeat: r.repeat as Repeat,
    reminder: r.reminder as Reminder,
    private: r.is_private,
    note: r.note ?? undefined,
    doneAt: r.done_at,
    doneById: r.done_by,
  };
}

/** Turns database errors into the sentences people see. */
export function friendlyError(e: { message?: string; hint?: string | null; code?: string } | null | undefined): string {
  if (!e) return 'Something went wrong on our side. Try again in a minute.';
  if (e.hint === 'invite_not_found') return "We couldn't find that code. Check it with the person who sent it, or ask for a new one.";
  if (e.hint === 'last_admin') return 'Make someone else an admin first. A household always needs one.';
  if (e.message && /fetch|network/i.test(e.message)) return "Couldn't reach Kaam. Check your connection and try again.";
  // Messages raised by the database's own functions are already written for people.
  if (e.code === 'P0001' || e.code === 'P0002' || e.code === '42501') return e.message ?? 'That isn\'t allowed.';
  return "Couldn't save that. Check your connection and try again.";
}

// ---------- Reads ----------

export type Snapshot = { household: Household; members: Member[]; meId: string; tasks: Task[] };

/** Your household (the first one you belong to), its people and the tasks you may see. */
export async function loadHousehold(db: Db, userId: string, language: Language): Promise<Snapshot | null> {
  const { data: mine, error: e1 } = await db.from('members').select('household_id, id').eq('user_id', userId).order('joined_at').limit(1);
  if (e1) throw e1;
  if (!mine || mine.length === 0) return null;
  const householdId = mine[0].household_id;

  const [h, m, t] = await Promise.all([
    db.from('households').select('*').eq('id', householdId).single(),
    db.from('members').select('*').eq('household_id', householdId).order('joined_at'),
    // Recent history plus everything open is enough for every screen (scores cover this week).
    db.from('tasks').select('*').eq('household_id', householdId).or(`done_at.is.null,done_at.gte."${new Date(Date.now() - 35 * 86_400_000).toISOString()}"`),
  ]);
  if (h.error) throw h.error;
  if (m.error) throw m.error;
  if (t.error) throw t.error;
  return {
    household: toHousehold(h.data),
    members: m.data.map((r) => toMember(r, language, userId)),
    meId: mine[0].id,
    tasks: t.data.map(toTask),
  };
}

export async function loadProfile(db: Db, userId: string) {
  const { data, error } = await db.from('profiles').select('name, language').eq('id', userId).maybeSingle();
  if (error) throw error;
  return { name: data?.name ?? '', language: (data?.language ?? 'en') as Language };
}

// ---------- Writes ----------

export async function saveProfile(db: Db, userId: string, name: string, language: Language) {
  const { error } = await db.from('profiles').update({ name, language }).eq('id', userId);
  if (error) throw error;
}

export async function createHousehold(db: Db, name: string, kind: HouseholdKind) {
  const { error } = await db.rpc('create_household', { p_name: name, p_kind: kind });
  if (error) throw error;
}

export async function joinHousehold(db: Db, code: string) {
  const { error } = await db.rpc('join_household', { p_code: code });
  if (error) throw error;
}

export async function insertTask(db: Db, householdId: string, t: Task) {
  const { error } = await db.from('tasks').insert({
    id: t.id,
    household_id: householdId,
    series_id: t.seriesId,
    title: t.title,
    assignee_id: t.assigneeId,
    created_by: t.createdById,
    due_date: t.dueDate,
    due_time: t.dueTime,
    repeat: t.repeat,
    reminder: t.reminder,
    is_private: !!t.private,
    note: t.note ?? null,
  });
  if (error) throw error;
}

export async function updateTask(db: Db, t: Task) {
  const { error } = await db
    .from('tasks')
    .update({
      title: t.title,
      assignee_id: t.assigneeId,
      due_date: t.dueDate,
      due_time: t.dueTime,
      repeat: t.repeat,
      reminder: t.reminder,
      is_private: !!t.private,
      note: t.note ?? null,
    })
    .eq('id', t.id);
  if (error) throw error;
}

export async function deleteTasks(db: Db, ids: string[]) {
  const { error } = await db.from('tasks').delete().in('id', ids);
  if (error) throw error;
}

export async function completeTask(db: Db, id: string) {
  const { error } = await db.rpc('complete_task', { p_task: id });
  if (error) throw error;
}

export async function uncompleteTask(db: Db, id: string) {
  const { error } = await db.rpc('uncomplete_task', { p_task: id });
  if (error) throw error;
}

export async function addMemberWithoutApp(db: Db, householdId: string, name: string) {
  const { error } = await db.rpc('add_member_without_app', { p_household: householdId, p_name: name });
  if (error) throw error;
}

export async function setRole(db: Db, memberId: string, role: Role) {
  const { error } = await db.rpc('set_member_role', { p_member: memberId, p_role: role });
  if (error) throw error;
}

export async function removeMember(db: Db, memberId: string) {
  const { error } = await db.rpc('remove_member', { p_member: memberId });
  if (error) throw error;
}

export async function leaveHousehold(db: Db, householdId: string) {
  const { error } = await db.rpc('leave_household', { p_household: householdId });
  if (error) throw error;
}

/** Calls `onChange` whenever tasks, people or the household change on any phone. */
export function watchHousehold(db: Db, householdId: string, onChange: () => void) {
  const channel = db
    .channel(`household:${householdId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `household_id=eq.${householdId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'members', filter: `household_id=eq.${householdId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'households', filter: `id=eq.${householdId}` }, onChange)
    .subscribe();
  return () => {
    db.removeChannel(channel);
  };
}
