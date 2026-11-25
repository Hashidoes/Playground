import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { nextOccurrence, startOfWeek, today, toISODate } from '../lib/dates';
import { memberColors } from '../theme/tokens';
import { ME, buildSampleTasks, sampleHousehold, sampleMembers, sampleSuggestions } from './sample';
import type { Household, HouseholdKind, ISODate, Language, Member, Task } from './types';

type State = {
  household: Household;
  members: Member[];
  meId: string;
  tasks: Task[];
  suggestions: string[];
  /** False until the person has signed in and joined or created a household. */
  onboarded: boolean;
  /** What onboarding has collected so far. */
  draft: { email: string; name: string; language: Language };
};

type Action =
  | { type: 'complete'; id: string; creditId: string; at: string }
  | { type: 'uncomplete'; id: string }
  | { type: 'add'; task: Task }
  | { type: 'update'; task: Task }
  | { type: 'delete'; id: string; series: boolean }
  | { type: 'restore'; tasks: Task[] }
  | { type: 'setEmail'; email: string }
  | { type: 'setProfile'; name: string; language: Language }
  | { type: 'createHousehold'; household: Household; me: Member }
  | { type: 'joinSample'; me: Member }
  | { type: 'finishOnboarding' }
  | { type: 'addMember'; member: Member }
  | { type: 'setRole'; id: string; role: Member['role'] }
  | { type: 'removeMember'; id: string }
  | { type: 'reset' };

/** Invite code of the example household while the app runs on sample data. */
export const SAMPLE_INVITE_CODE = sampleHousehold.inviteCode;

function initialState(): State {
  return {
    household: sampleHousehold,
    members: sampleMembers,
    meId: ME,
    tasks: buildSampleTasks(),
    suggestions: sampleSuggestions,
    onboarded: false,
    draft: { email: '', name: '', language: 'en' },
  };
}

function makeInviteCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const pick = () => letters[Math.floor(Math.random() * letters.length)];
  return `${pick()}${pick()}${pick()}-${Math.floor(100 + Math.random() * 900)}`;
}

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

/** Someone leaving: their private tasks go, their open shared tasks are left for anyone. */
function withoutMember(state: State, id: string): Pick<State, 'members' | 'tasks'> {
  let members = state.members.filter((m) => m.id !== id);
  // Like WhatsApp: if the last admin goes, the longest-standing member becomes admin.
  if (members.length && !members.some((m) => m.role === 'admin')) {
    members = members.map((m, i) => (i === 0 ? { ...m, role: 'admin' } : m));
  }
  const tasks = state.tasks
    .filter((t) => !(t.private && t.createdById === id))
    .map((t) => (t.assigneeId === id && !t.doneAt ? { ...t, assigneeId: null } : t));
  return { members, tasks };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'complete': {
      const task = state.tasks.find((t) => t.id === action.id);
      if (!task || task.doneAt) return state;
      // An unassigned task becomes the finisher's own.
      const done = { ...task, assigneeId: task.assigneeId ?? action.creditId, doneAt: action.at, doneById: action.creditId };
      let tasks = state.tasks.map((t) => (t.id === task.id ? done : t));
      // A repeating task gets its next occurrence once this one is done,
      // unless the series already has an open occurrence.
      const next = nextOccurrence(task.dueDate, task.repeat);
      const seriesOpen = tasks.some((t) => t.seriesId === task.seriesId && !t.doneAt);
      if (next && !seriesOpen) {
        tasks = [...tasks, { ...task, id: newId('t'), dueDate: next < today() ? today() : next, doneAt: null, doneById: null }];
      }
      return { ...state, tasks };
    }
    case 'uncomplete': {
      const task = state.tasks.find((t) => t.id === action.id);
      if (!task || !task.doneAt) return state;
      // Remove the occurrence that finishing this one created.
      const spawned = state.tasks.find((t) => t.seriesId === task.seriesId && !t.doneAt && t.dueDate > task.dueDate);
      return {
        ...state,
        tasks: state.tasks.filter((t) => t !== spawned).map((t) => (t.id === task.id ? { ...t, doneAt: null, doneById: null } : t)),
      };
    }
    case 'add':
      return {
        ...state,
        tasks: [...state.tasks, action.task],
        suggestions: state.suggestions.includes(action.task.title) ? state.suggestions : [action.task.title, ...state.suggestions].slice(0, 8),
      };
    case 'update':
      return { ...state, tasks: state.tasks.map((t) => (t.id === action.task.id ? action.task : t)) };
    case 'delete': {
      const task = state.tasks.find((t) => t.id === action.id);
      if (!task) return state;
      return { ...state, tasks: state.tasks.filter((t) => (action.series ? !(t.seriesId === task.seriesId && !t.doneAt) : t.id !== task.id)) };
    }
    case 'restore':
      return { ...state, tasks: [...state.tasks, ...action.tasks.filter((r) => !state.tasks.some((t) => t.id === r.id))] };
    case 'setEmail':
      return { ...state, draft: { ...state.draft, email: action.email } };
    case 'setProfile':
      return { ...state, draft: { ...state.draft, name: action.name, language: action.language } };
    case 'createHousehold':
      // A brand-new household starts empty, with only you in it, as its admin.
      return { ...state, household: action.household, members: [action.me], meId: action.me.id, tasks: [] };
    case 'joinSample': {
      const fresh = initialState();
      return { ...state, household: fresh.household, members: [...fresh.members, action.me], meId: action.me.id, tasks: fresh.tasks };
    }
    case 'finishOnboarding':
      return { ...state, onboarded: true };
    case 'addMember':
      return { ...state, members: [...state.members, action.member] };
    case 'setRole':
      return { ...state, members: state.members.map((m) => (m.id === action.id ? { ...m, role: action.role } : m)) };
    case 'removeMember':
      return { ...state, ...withoutMember(state, action.id) };
    case 'reset':
      return initialState();
  }
}

type NewTask = Omit<Task, 'id' | 'seriesId' | 'doneAt' | 'doneById' | 'createdById'>;

type StoreValue = Omit<State, 'tasks'> & {
  /** Only the tasks this person may see (other people's private tasks are never included). */
  tasks: Task[];
  me: Member;
  isAdmin: boolean;
  memberById: (id: string | null) => Member | undefined;
  /** Admins can tick anyone's task; everyone else only their own (or an unassigned one). */
  canTick: (task: Task) => boolean;
  /** Admins can edit any task; everyone else only the ones they created. */
  canEdit: (task: Task) => boolean;
  complete: (id: string) => void;
  uncomplete: (id: string) => void;
  addTask: (task: NewTask) => Task;
  updateTask: (task: Task) => void;
  deleteTask: (id: string, series: boolean) => Task[];
  restoreTasks: (tasks: Task[]) => void;
  setEmail: (email: string) => void;
  setProfile: (name: string, language: Language) => void;
  createHousehold: (name: string, kind: HouseholdKind) => void;
  /** Returns false when the code doesn't match a household. */
  joinHousehold: (code: string) => boolean;
  finishOnboarding: () => void;
  /** Admin only: adds someone who won't use the app. An admin ticks off their tasks. */
  addMember: (name: string) => Member | null;
  /** Admin only. There is always at least one admin. */
  setRole: (id: string, role: Member['role']) => void;
  /** Admin only: removes someone else from the household. */
  removeMember: (id: string) => void;
  /** Leave the household and return to the start. */
  leaveHousehold: () => void;
  signOut: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const memberById = useCallback((id: string | null) => state.members.find((m) => m.id === id), [state.members]);

  const value = useMemo<StoreValue>(() => {
    const me = state.members.find((m) => m.id === state.meId)!;
    const isAdmin = me?.role === 'admin';
    const newMe = (role: Member['role'], colorIndex: number): Member => ({
      id: newId('m'),
      name: state.draft.name.trim() || 'You',
      role,
      color: memberColors[colorIndex % memberColors.length],
      language: state.draft.language,
    });

    // Privacy and permissions are enforced here, so no screen can get them wrong.
    const visibleTasks = state.tasks.filter((t) => !t.private || t.createdById === state.meId);
    const ownIfPrivate = <T extends Pick<Task, 'private' | 'assigneeId'>>(t: T): T => (t.private ? { ...t, assigneeId: state.meId } : t);
    const find = (id: string) => visibleTasks.find((t) => t.id === id);
    const canTick = (t: Task) => isAdmin || t.assigneeId === state.meId || t.assigneeId === null;
    const canEdit = (t: Task) => (t.private ? t.createdById === state.meId : isAdmin || t.createdById === state.meId);

    return {
      ...state,
      tasks: visibleTasks,
      me,
      isAdmin,
      memberById,
      canTick,
      canEdit,
      complete: (id) => {
        const t = find(id);
        if (!t || !canTick(t)) return;
        // Credit goes to the person the task belongs to, even when an admin ticks it for them.
        dispatch({ type: 'complete', id, creditId: t.assigneeId ?? state.meId, at: new Date().toISOString() });
      },
      uncomplete: (id) => {
        const t = find(id);
        if (!t || !canTick(t)) return;
        dispatch({ type: 'uncomplete', id });
      },
      addTask: (input) => {
        const id = newId('t');
        const task: Task = ownIfPrivate({ ...input, id, seriesId: id, createdById: state.meId, doneAt: null, doneById: null });
        dispatch({ type: 'add', task });
        return task;
      },
      updateTask: (task) => {
        const current = find(task.id);
        if (!current || !canEdit(current)) return;
        dispatch({ type: 'update', task: ownIfPrivate(task) });
      },
      deleteTask: (id, series) => {
        const task = find(id);
        if (!task || !canEdit(task)) return [];
        const removed = series ? state.tasks.filter((t) => t.seriesId === task.seriesId && !t.doneAt) : [task];
        dispatch({ type: 'delete', id, series });
        return removed;
      },
      restoreTasks: (tasks) => dispatch({ type: 'restore', tasks }),
      setEmail: (email) => dispatch({ type: 'setEmail', email }),
      setProfile: (name, language) => dispatch({ type: 'setProfile', name, language }),
      createHousehold: (name, kind) =>
        dispatch({ type: 'createHousehold', household: { id: newId('h'), name, kind, inviteCode: makeInviteCode() }, me: newMe('admin', 0) }),
      joinHousehold: (code) => {
        if (code.trim().toUpperCase() !== SAMPLE_INVITE_CODE) return false;
        dispatch({ type: 'joinSample', me: newMe('member', 5) });
        return true;
      },
      finishOnboarding: () => dispatch({ type: 'finishOnboarding' }),
      addMember: (name) => {
        if (!isAdmin) return null;
        // The first unused colour, so new people never share one with someone already here.
        const used = new Set(state.members.map((m) => m.color));
        const color = memberColors.find((c) => !used.has(c)) ?? memberColors[state.members.length % memberColors.length];
        const member: Member = { id: newId('m'), name, role: 'member', color, language: 'en', usesApp: false };
        dispatch({ type: 'addMember', member });
        return member;
      },
      setRole: (id, role) => {
        if (!isAdmin) return;
        const admins = state.members.filter((m) => m.role === 'admin');
        if (role === 'member' && admins.length === 1 && admins[0].id === id) return;
        dispatch({ type: 'setRole', id, role });
      },
      removeMember: (id) => {
        if (!isAdmin || id === state.meId) return;
        dispatch({ type: 'removeMember', id });
      },
      // In this sample-data version, leaving simply returns to the start.
      leaveHousehold: () => dispatch({ type: 'reset' }),
      signOut: () => dispatch({ type: 'reset' }),
    };
  }, [state, memberById]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

// ---------- Selectors ----------

const byTime = (a: Task, b: Task) =>
  a.dueDate.localeCompare(b.dueDate) || (a.dueTime ?? '99:99').localeCompare(b.dueTime ?? '99:99') || a.title.localeCompare(b.title);

/** Tasks that belong on "today": due today, plus anything overdue and still open. */
export function todaysTasks(tasks: Task[], day: ISODate = today()): Task[] {
  return tasks.filter((t) => (t.doneAt ? toISODate(new Date(t.doneAt)) === day && t.dueDate <= day : t.dueDate <= day)).sort(byTime);
}

export function upcomingTasks(tasks: Task[], day: ISODate = today()): Task[] {
  return tasks.filter((t) => !t.doneAt && t.dueDate > day).sort(byTime);
}

export function tasksOnDay(tasks: Task[], day: ISODate): Task[] {
  return tasks.filter((t) => t.dueDate === day).sort(byTime);
}

/** The viewer's own progress for today, used by the Home gauge. */
export function myProgress(tasks: Task[], meId: string) {
  const mine = todaysTasks(tasks).filter((t) => t.assigneeId === meId);
  const done = mine.filter((t) => t.doneAt).length;
  return { done, total: mine.length, percent: mine.length ? Math.round((done / mine.length) * 100) : 0 };
}

/** This week's score board. Scores start fresh every Monday; private tasks never count. */
export function weeklyScores(tasks: Task[], members: Member[]) {
  const from = startOfWeek(today());
  const counts = new Map(members.map((m) => [m.id, 0]));
  for (const t of tasks) {
    if (!t.doneAt || !t.doneById || t.private) continue;
    if (toISODate(new Date(t.doneAt)) < from) continue;
    counts.set(t.doneById, (counts.get(t.doneById) ?? 0) + 1);
  }
  return members
    .map((m) => ({ member: m, score: counts.get(m.id) ?? 0 }))
    .sort((a, b) => b.score - a.score || a.member.name.localeCompare(b.member.name));
}
