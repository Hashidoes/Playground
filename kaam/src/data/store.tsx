import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { nextOccurrence, startOfWeek, today, toISODate } from '../lib/dates';
import { supabase } from '../lib/supabase';
import { memberColors } from '../theme/tokens';
import * as remote from './remote';
import { ME, buildSampleTasks, sampleHousehold, sampleMembers, sampleSuggestions } from './sample';
import type { Household, HouseholdKind, ISODate, Language, Member, Task } from './types';

/**
 * One store for the whole app. With a Supabase project configured it reads and
 * writes the real database (changes show instantly, then save in the background,
 * and other phones' changes arrive live). Without one, it runs on sample data.
 * Screens use the same interface either way.
 */

type State = {
  /** False until the saved session (if any) has been checked at launch. */
  ready: boolean;
  /** The signed-in account, when connected to Supabase. */
  userId: string | null;
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
  | { type: 'ready'; userId: string | null }
  | { type: 'loaded'; snapshot: remote.Snapshot; onboarded?: boolean }
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
  | { type: 'leftHousehold' }
  | { type: 'reset' };

/** Invite code of the example household while the app runs on sample data. */
export const SAMPLE_INVITE_CODE = sampleHousehold.inviteCode;

const emptyHousehold: Household = { id: '', name: '', kind: 'family', inviteCode: '' };

function initialState(): State {
  if (supabase) {
    return {
      ready: false,
      userId: null,
      household: emptyHousehold,
      members: [],
      meId: '',
      tasks: [],
      suggestions: sampleSuggestions,
      onboarded: false,
      draft: { email: '', name: '', language: 'en' },
    };
  }
  return {
    ready: true,
    userId: null,
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

/** Ids are real UUIDs, so tasks made on the phone can be saved to the database as they are. */
export function newId(_prefix?: string): string {
  return Crypto.randomUUID();
}

/** Someone leaving: their private tasks go, their open shared tasks are left for anyone. */
function withoutMember(state: State, id: string): Pick<State, 'members' | 'tasks'> {
  let members = state.members.filter((m) => m.id !== id);
  // Like WhatsApp: if the last admin goes, the longest-standing member who uses the app becomes admin.
  if (members.length && !members.some((m) => m.role === 'admin')) {
    const next = members.find((m) => m.usesApp !== false) ?? members[0];
    members = members.map((m) => (m === next ? { ...m, role: 'admin' } : m));
  }
  const tasks = state.tasks
    .filter((t) => !(t.private && t.createdById === id))
    .map((t) => (t.assigneeId === id && !t.doneAt ? { ...t, assigneeId: null } : t));
  return { members, tasks };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ready':
      return { ...state, ready: true, userId: action.userId };
    case 'loaded':
      return {
        ...state,
        household: action.snapshot.household,
        members: action.snapshot.members,
        meId: action.snapshot.meId,
        tasks: action.snapshot.tasks,
        onboarded: action.onboarded ?? state.onboarded,
      };
    case 'complete': {
      const task = state.tasks.find((t) => t.id === action.id);
      if (!task || task.doneAt) return state;
      // An unassigned task becomes the finisher's own.
      const done = { ...task, assigneeId: task.assigneeId ?? action.creditId, doneAt: action.at, doneById: action.creditId };
      let tasks = state.tasks.map((t) => (t.id === task.id ? done : t));
      // A repeating task gets its next occurrence once this one is done (the database does the same).
      const next = nextOccurrence(task.dueDate, task.repeat);
      const seriesOpen = tasks.some((t) => t.seriesId === task.seriesId && !t.doneAt);
      if (next && !seriesOpen) {
        tasks = [...tasks, { ...task, id: newId(), dueDate: next < today() ? today() : next, doneAt: null, doneById: null }];
      }
      return { ...state, tasks };
    }
    case 'uncomplete': {
      const task = state.tasks.find((t) => t.id === action.id);
      if (!task || !task.doneAt) return state;
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
    case 'leftHousehold':
      // Still signed in; back to choosing or creating a household.
      return { ...state, household: emptyHousehold, members: [], meId: '', tasks: [], onboarded: false };
    case 'reset':
      return { ...initialState(), ready: true };
  }
}

type NewTask = Omit<Task, 'id' | 'seriesId' | 'doneAt' | 'doneById' | 'createdById'>;
/** Where sign-in leads: the profile step for someone new, or straight Home for a returning member. */
export type SignInResult = { ok: true; next: 'profile' | 'household' | 'home' } | { ok: false; error: string };

type StoreValue = Omit<State, 'tasks'> & {
  /** Only the tasks this person may see (other people's private tasks are never included). */
  tasks: Task[];
  me: Member;
  isAdmin: boolean;
  /** True when connected to Supabase; false on sample data. */
  isConnected: boolean;
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
  // Sign-in and setup
  sendCode: (email: string) => Promise<string | null>;
  verifyCode: (code: string) => Promise<SignInResult>;
  signInWithGoogle: () => Promise<SignInResult>;
  setEmail: (email: string) => void;
  setProfile: (name: string, language: Language) => Promise<string | null>;
  createHousehold: (name: string) => Promise<string | null>;
  /** Returns an error message, or null when it worked. */
  joinHousehold: (code: string) => Promise<string | null>;
  finishOnboarding: () => void;
  // People
  addMember: (name: string) => Promise<string | null>;
  setRole: (id: string, role: Member['role']) => Promise<string | null>;
  removeMember: (id: string) => Promise<string | null>;
  leaveHousehold: () => Promise<void>;
  signOut: () => Promise<void>;
  /** A component inside the toast provider registers here to show background save errors. */
  onError: (listener: ((message: string) => void) | null) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const errorListener = useRef<((message: string) => void) | null>(null);

  const memberById = useCallback((id: string | null) => state.members.find((m) => m.id === id), [state.members]);

  /** Reloads the household from the database: the source of truth after any change. */
  const refresh = useCallback(async (userId: string, language: Language, onboarded?: boolean) => {
    if (!supabase) return null;
    const snapshot = await remote.loadHousehold(supabase, userId, language);
    if (snapshot) dispatch({ type: 'loaded', snapshot, onboarded });
    return snapshot;
  }, []);

  // At launch: pick up a saved session and, for a returning member, go straight Home.
  useEffect(() => {
    if (!supabase) return;
    const db = supabase;
    let active = true;
    (async () => {
      try {
        const { data } = await db.auth.getSession();
        const userId = data.session?.user.id ?? null;
        if (userId) {
          const profile = await remote.loadProfile(db, userId);
          dispatch({ type: 'setProfile', name: profile.name, language: profile.language });
          if (data.session?.user.email) dispatch({ type: 'setEmail', email: data.session.user.email });
          await refresh(userId, profile.language, true);
        }
        if (active) dispatch({ type: 'ready', userId });
      } catch {
        // Offline at launch: start signed out of the household view; sign-in will retry.
        if (active) dispatch({ type: 'ready', userId: null });
      }
    })();
    const { data: sub } = db.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') dispatch({ type: 'reset' });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [refresh]);

  // Live updates from other phones while you're in a household.
  const { userId } = state;
  const householdId = state.household.id;
  const language = state.draft.language;
  useEffect(() => {
    if (!supabase || !userId || !householdId) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const stop = remote.watchHousehold(supabase, householdId, () => {
      // Several changes often arrive together (a tick and its next occurrence): reload once.
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        refresh(userId, language).catch(() => {});
      }, 300);
    });
    return () => {
      if (timer) clearTimeout(timer);
      stop();
    };
  }, [userId, householdId, language, refresh]);

  const value = useMemo<StoreValue>(() => {
    const db = supabase;
    const me = state.members.find((m) => m.id === state.meId)!;
    const isAdmin = me?.role === 'admin';
    const newSampleMe = (role: Member['role'], colorIndex: number): Member => ({
      id: newId(),
      name: state.draft.name.trim() || 'You',
      role,
      color: memberColors[colorIndex % memberColors.length],
      language: state.draft.language,
    });

    // Privacy and permissions are checked here for instant feedback; the database enforces them again.
    const visibleTasks = state.tasks.filter((t) => !t.private || t.createdById === state.meId);
    const ownIfPrivate = <T extends Pick<Task, 'private' | 'assigneeId'>>(t: T): T => (t.private ? { ...t, assigneeId: state.meId } : t);
    const find = (id: string) => visibleTasks.find((t) => t.id === id);
    const canTick = (t: Task) => isAdmin || t.assigneeId === state.meId || t.assigneeId === null;
    const canEdit = (t: Task) => (t.private ? t.createdById === state.meId : isAdmin || t.createdById === state.meId);

    /**
     * Runs a database write after the screen has already changed. If it fails, the
     * household is reloaded from the database (undoing the change) and the person is told.
     */
    const save = (write: (d: NonNullable<typeof db>) => Promise<unknown>) => {
      if (!db || !state.userId) return;
      const uid = state.userId;
      write(db)
        .then(() => refresh(uid, state.draft.language))
        .catch((e) => {
          errorListener.current?.(remote.friendlyError(e));
          refresh(uid, state.draft.language).catch(() => {});
        });
    };

    /** After sign-in: load the profile and household to decide where to go next. */
    const afterSignIn = async (uid: string): Promise<SignInResult> => {
      if (!db) return { ok: true, next: 'profile' };
      dispatch({ type: 'ready', userId: uid });
      const profile = await remote.loadProfile(db, uid);
      dispatch({ type: 'setProfile', name: profile.name, language: profile.language });
      const snapshot = await refresh(uid, profile.language, true);
      if (snapshot) return { ok: true, next: 'home' };
      return { ok: true, next: profile.name ? 'household' : 'profile' };
    };

    return {
      ...state,
      tasks: visibleTasks,
      me,
      isAdmin,
      isConnected: !!db,
      memberById,
      canTick,
      canEdit,

      complete: (id) => {
        const t = find(id);
        if (!t || !canTick(t)) return;
        // Credit goes to the person the task belongs to, even when an admin ticks it for them.
        dispatch({ type: 'complete', id, creditId: t.assigneeId ?? state.meId, at: new Date().toISOString() });
        save((d) => remote.completeTask(d, id));
      },
      uncomplete: (id) => {
        const t = find(id);
        if (!t || !canTick(t)) return;
        dispatch({ type: 'uncomplete', id });
        save((d) => remote.uncompleteTask(d, id));
      },
      addTask: (input) => {
        const id = newId();
        const task: Task = ownIfPrivate({ ...input, id, seriesId: id, createdById: state.meId, doneAt: null, doneById: null });
        dispatch({ type: 'add', task });
        save((d) => remote.insertTask(d, state.household.id, task));
        return task;
      },
      updateTask: (task) => {
        const current = find(task.id);
        if (!current || !canEdit(current)) return;
        const next = ownIfPrivate(task);
        dispatch({ type: 'update', task: next });
        save((d) => remote.updateTask(d, next));
      },
      deleteTask: (id, series) => {
        const task = find(id);
        if (!task || !canEdit(task)) return [];
        const removed = series ? state.tasks.filter((t) => t.seriesId === task.seriesId && !t.doneAt) : [task];
        dispatch({ type: 'delete', id, series });
        save((d) => remote.deleteTasks(d, removed.map((t) => t.id)));
        return removed;
      },
      restoreTasks: (tasks) => {
        dispatch({ type: 'restore', tasks });
        save(async (d) => {
          for (const t of tasks) await remote.insertTask(d, state.household.id, t);
        });
      },

      // ----- Sign-in and setup -----
      sendCode: async (email) => {
        dispatch({ type: 'setEmail', email });
        if (!db) return null;
        const { error } = await db.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
        if (!error) return null;
        if (/rate limit|too many/i.test(error.message)) return 'Too many codes sent. Wait a few minutes, then try again.';
        return "Couldn't send the code. Check the email address and your connection, then try again.";
      },
      verifyCode: async (code) => {
        if (!db) {
          // Sample mode: any 6 digits work, except 000000.
          return code === '000000' ? { ok: false, error: "That code doesn't match. Check the email and try again." } : { ok: true, next: 'profile' };
        }
        const { data, error } = await db.auth.verifyOtp({ email: state.draft.email, token: code, type: 'email' });
        if (error || !data.user) {
          return { ok: false, error: /expired/i.test(error?.message ?? '') ? "That code has expired. We've sent you a new one." : "That code doesn't match. Check the email and try again." };
        }
        try {
          return await afterSignIn(data.user.id);
        } catch (e) {
          return { ok: false, error: remote.friendlyError(e as { message?: string }) };
        }
      },
      signInWithGoogle: async () => {
        if (!db) return { ok: true, next: 'profile' };
        const redirectTo = Linking.createURL('auth');
        const { data, error } = await db.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } });
        if (error || !data.url) return { ok: false, error: "Couldn't open Google sign-in. Try again, or use your email." };
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type !== 'success') return { ok: false, error: 'Google sign-in was cancelled.' };
        // Google hands back the session in the address: after # (tokens) or as ?code=.
        const url = result.url;
        const params = new URLSearchParams(url.includes('#') ? url.split('#')[1] : url.split('?')[1] ?? '');
        const code = params.get('code');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const session = code
          ? await db.auth.exchangeCodeForSession(code)
          : accessToken && refreshToken
            ? await db.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
            : null;
        const uid = session?.data.session?.user.id;
        if (!uid) return { ok: false, error: "Couldn't finish Google sign-in. Try again, or use your email." };
        try {
          return await afterSignIn(uid);
        } catch (e) {
          return { ok: false, error: remote.friendlyError(e as { message?: string }) };
        }
      },
      setEmail: (email) => dispatch({ type: 'setEmail', email }),
      setProfile: async (name, lang) => {
        dispatch({ type: 'setProfile', name, language: lang });
        if (!db || !state.userId) return null;
        try {
          await remote.saveProfile(db, state.userId, name, lang);
          return null;
        } catch (e) {
          return remote.friendlyError(e as { message?: string });
        }
      },
      createHousehold: async (name) => {
        const kind: HouseholdKind = 'family';
        if (!db || !state.userId) {
          dispatch({ type: 'createHousehold', household: { id: newId(), name, kind, inviteCode: makeInviteCode() }, me: newSampleMe('admin', 0) });
          return null;
        }
        try {
          await remote.createHousehold(db, name, kind);
          await refresh(state.userId, state.draft.language);
          return null;
        } catch (e) {
          return remote.friendlyError(e as { message?: string });
        }
      },
      joinHousehold: async (code) => {
        if (!db || !state.userId) {
          if (code.trim().toUpperCase() !== SAMPLE_INVITE_CODE) {
            return "We couldn't find that code. Check it with the person who sent it, or ask for a new one.";
          }
          dispatch({ type: 'joinSample', me: newSampleMe('member', 5) });
          return null;
        }
        try {
          await remote.joinHousehold(db, code);
          await refresh(state.userId, state.draft.language);
          return null;
        } catch (e) {
          return remote.friendlyError(e as { message?: string; hint?: string });
        }
      },
      finishOnboarding: () => dispatch({ type: 'finishOnboarding' }),

      // ----- People -----
      addMember: async (name) => {
        if (!isAdmin) return 'Only admins can add people.';
        if (!db || !state.userId) {
          // The first unused colour, so new people never share one with someone already here.
          const used = new Set(state.members.map((m) => m.color));
          const color = memberColors.find((c) => !used.has(c)) ?? memberColors[state.members.length % memberColors.length];
          dispatch({ type: 'addMember', member: { id: newId(), name, role: 'member', color, language: 'en', usesApp: false } });
          return null;
        }
        try {
          await remote.addMemberWithoutApp(db, state.household.id, name);
          await refresh(state.userId, state.draft.language);
          return null;
        } catch (e) {
          return remote.friendlyError(e as { message?: string });
        }
      },
      setRole: async (id, role) => {
        if (!isAdmin) return 'Only admins can change roles.';
        const admins = state.members.filter((m) => m.role === 'admin');
        if (role === 'member' && admins.length === 1 && admins[0].id === id) return 'Make someone else an admin first. A household always needs one.';
        dispatch({ type: 'setRole', id, role });
        if (!db || !state.userId) return null;
        try {
          await remote.setRole(db, id, role);
          await refresh(state.userId, state.draft.language);
          return null;
        } catch (e) {
          await refresh(state.userId, state.draft.language).catch(() => {});
          return remote.friendlyError(e as { message?: string; hint?: string });
        }
      },
      removeMember: async (id) => {
        if (!isAdmin || id === state.meId) return 'Only admins can remove people.';
        dispatch({ type: 'removeMember', id });
        if (!db || !state.userId) return null;
        try {
          await remote.removeMember(db, id);
          await refresh(state.userId, state.draft.language);
          return null;
        } catch (e) {
          await refresh(state.userId, state.draft.language).catch(() => {});
          return remote.friendlyError(e as { message?: string });
        }
      },
      leaveHousehold: async () => {
        if (!db || !state.userId) {
          // In sample mode, leaving simply returns to the start.
          dispatch({ type: 'reset' });
          return;
        }
        try {
          await remote.leaveHousehold(db, state.household.id);
        } finally {
          dispatch({ type: 'leftHousehold' });
        }
      },
      signOut: async () => {
        if (db) await db.auth.signOut().catch(() => {});
        dispatch({ type: 'reset' });
      },
      onError: (listener) => {
        errorListener.current = listener;
      },
    };
  }, [state, memberById, refresh]);

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
