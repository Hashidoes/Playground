import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { nextOccurrence, startOfMonth, startOfWeek, today, toISODate } from '../lib/dates';
import { ME, buildSampleLeave, buildSampleNotices, buildSampleTasks, sampleHousehold, sampleMembers, sampleSuggestions } from './sample';
import { memberColors } from '../theme/tokens';
import type { Household, HouseholdKind, ISODate, Language, Leave, Member, Notice, Task } from './types';

type State = {
  household: Household;
  members: Member[];
  meId: string;
  tasks: Task[];
  notices: Notice[];
  leave: Leave[];
  suggestions: string[];
  /** False until the person has signed in and joined or created a household. */
  onboarded: boolean;
  /** What onboarding has collected so far. */
  draft: { phone: string; name: string; language: Language };
};

type Action =
  | { type: 'complete'; id: string; byId: string; at: string }
  | { type: 'uncomplete'; id: string }
  | { type: 'add'; task: Task }
  | { type: 'update'; task: Task }
  | { type: 'delete'; id: string; series: boolean }
  | { type: 'restore'; tasks: Task[] }
  | { type: 'pickUp'; id: string; byId: string }
  | { type: 'addNotice'; notice: Notice }
  | { type: 'setPhone'; phone: string }
  | { type: 'setProfile'; name: string; language: Language }
  | { type: 'createHousehold'; household: Household; me: Member }
  | { type: 'joinSample'; me: Member }
  | { type: 'finishOnboarding' }
  | { type: 'addMember'; member: Member }
  | { type: 'reset' };

/** Invite code of the example household while the app runs on sample data. */
export const SAMPLE_INVITE_CODE = sampleHousehold.inviteCode;

function initialState(): State {
  return {
    household: sampleHousehold,
    members: sampleMembers,
    meId: ME,
    tasks: buildSampleTasks(),
    notices: buildSampleNotices(),
    leave: buildSampleLeave(),
    suggestions: sampleSuggestions,
    onboarded: false,
    draft: { phone: '', name: '', language: 'en' },
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

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'complete': {
      const task = state.tasks.find((t) => t.id === action.id);
      if (!task || task.doneAt) return state;
      const done = { ...task, doneAt: action.at, doneById: action.byId };
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
        tasks: state.tasks
          .filter((t) => t !== spawned)
          .map((t) => (t.id === task.id ? { ...t, doneAt: null, doneById: null } : t)),
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
      return {
        ...state,
        tasks: state.tasks.filter((t) => (action.series ? !(t.seriesId === task.seriesId && !t.doneAt) : t.id !== task.id)),
      };
    }
    case 'restore':
      return { ...state, tasks: [...state.tasks, ...action.tasks.filter((r) => !state.tasks.some((t) => t.id === r.id))] };
    case 'pickUp':
      return { ...state, tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, assigneeId: action.byId } : t)) };
    case 'addNotice':
      return { ...state, notices: [action.notice, ...state.notices] };
    case 'setPhone':
      return { ...state, draft: { ...state.draft, phone: action.phone } };
    case 'setProfile':
      return { ...state, draft: { ...state.draft, name: action.name, language: action.language } };
    case 'createHousehold':
      // A brand-new household starts empty, with only you in it.
      return { ...state, household: action.household, members: [action.me], meId: action.me.id, tasks: [], notices: [], leave: [] };
    case 'joinSample': {
      const fresh = initialState();
      return { ...state, household: fresh.household, members: [...fresh.members, action.me], meId: action.me.id, tasks: fresh.tasks, notices: fresh.notices, leave: fresh.leave };
    }
    case 'finishOnboarding':
      return { ...state, onboarded: true };
    case 'addMember':
      return { ...state, members: [...state.members, action.member] };
    case 'reset':
      return initialState();
  }
}

type StoreValue = State & {
  me: Member;
  memberById: (id: string | null) => Member | undefined;
  complete: (id: string) => void;
  uncomplete: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'seriesId' | 'doneAt' | 'doneById' | 'createdById'>) => Task;
  updateTask: (task: Task) => void;
  deleteTask: (id: string, series: boolean) => Task[];
  restoreTasks: (tasks: Task[]) => void;
  pickUp: (id: string) => void;
  addNotice: (message: string, showUntil: ISODate | null) => void;
  setPhone: (phone: string) => void;
  setProfile: (name: string, language: Language) => void;
  createHousehold: (name: string, kind: HouseholdKind) => void;
  /** Returns false when the code doesn't match a household. */
  joinHousehold: (code: string) => boolean;
  finishOnboarding: () => void;
  /** Adds someone who won't use the app; tasks can still be given to them. */
  addMember: (name: string, role: Member['role']) => Member;
  signOut: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const memberById = useCallback((id: string | null) => state.members.find((m) => m.id === id), [state.members]);

  const value = useMemo<StoreValue>(() => {
    const me = state.members.find((m) => m.id === state.meId)!;
    const newMe = (role: Member['role'], colorIndex: number): Member => ({
      id: newId('m'),
      name: state.draft.name.trim() || 'You',
      role,
      color: memberColors[colorIndex % memberColors.length],
      language: state.draft.language,
    });
    return {
      ...state,
      me,
      memberById,
      complete: (id) => dispatch({ type: 'complete', id, byId: state.meId, at: new Date().toISOString() }),
      uncomplete: (id) => dispatch({ type: 'uncomplete', id }),
      addTask: (input) => {
        const id = newId('t');
        const task: Task = { ...input, id, seriesId: id, createdById: state.meId, doneAt: null, doneById: null };
        dispatch({ type: 'add', task });
        return task;
      },
      updateTask: (task) => dispatch({ type: 'update', task }),
      deleteTask: (id, series) => {
        const task = state.tasks.find((t) => t.id === id);
        if (!task) return [];
        const removed = series ? state.tasks.filter((t) => t.seriesId === task.seriesId && !t.doneAt) : [task];
        dispatch({ type: 'delete', id, series });
        return removed;
      },
      restoreTasks: (tasks) => dispatch({ type: 'restore', tasks }),
      pickUp: (id) => dispatch({ type: 'pickUp', id, byId: state.meId }),
      addNotice: (message, showUntil) =>
        dispatch({ type: 'addNotice', notice: { id: newId('n'), message, authorId: state.meId, createdAt: new Date().toISOString(), showUntil } }),
      setPhone: (phone) => dispatch({ type: 'setPhone', phone }),
      setProfile: (name, language) => dispatch({ type: 'setProfile', name, language }),
      createHousehold: (name, kind) =>
        dispatch({ type: 'createHousehold', household: { id: newId('h'), name, kind, inviteCode: makeInviteCode() }, me: newMe('admin', 0) }),
      joinHousehold: (code) => {
        if (code.trim().toUpperCase() !== SAMPLE_INVITE_CODE) return false;
        dispatch({ type: 'joinSample', me: newMe('member', 5) });
        return true;
      },
      finishOnboarding: () => dispatch({ type: 'finishOnboarding' }),
      addMember: (name, role) => {
        // The first unused colour, so new people never share one with someone already here.
        const used = new Set(state.members.map((m) => m.color));
        const color = memberColors.find((c) => !used.has(c)) ?? memberColors[state.members.length % memberColors.length];
        const member: Member = { id: newId('m'), name, role, color, language: 'en', usesApp: false };
        dispatch({ type: 'addMember', member });
        return member;
      },
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

export function openTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.doneAt).sort(byTime);
}

export function upcomingTasks(tasks: Task[], day: ISODate = today()): Task[] {
  return tasks.filter((t) => !t.doneAt && t.dueDate > day).sort(byTime);
}

export function doneTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.doneAt).sort((a, b) => b.doneAt!.localeCompare(a.doneAt!));
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

export type Period = 'week' | 'month' | 'all';

export function scoresFor(tasks: Task[], members: Member[], period: Period) {
  const from = period === 'week' ? startOfWeek(today()) : period === 'month' ? startOfMonth(today()) : '0000-00-00';
  const counts = new Map(members.map((m) => [m.id, 0]));
  for (const t of tasks) {
    if (!t.doneAt || !t.doneById) continue;
    if (toISODate(new Date(t.doneAt)) < from) continue;
    counts.set(t.doneById, (counts.get(t.doneById) ?? 0) + 1);
  }
  return members
    .map((m) => ({ member: m, score: counts.get(m.id) ?? 0 }))
    .sort((a, b) => b.score - a.score || a.member.name.localeCompare(b.member.name));
}
