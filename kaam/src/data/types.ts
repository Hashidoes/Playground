// Shapes mirror the planned Supabase tables, so the local store can be swapped
// for the real backend without touching screens.

export type ISODate = string; // 'YYYY-MM-DD' in the household's local time
export type Time = string; // 'HH:mm', 24-hour

/** Like a WhatsApp group: admins manage people and can tick anyone's tasks. */
export type Role = 'admin' | 'member';
export type Language = 'en' | 'ml' | 'hi';
export type HouseholdKind = 'family' | 'roommates';

export type Repeat = 'none' | 'daily' | 'alternate' | 'weekly' | 'fortnightly' | 'monthly';
export type Reminder = 'off' | 'at_time' | '15_min' | '1_hour';

export type Household = {
  id: string;
  name: string;
  kind: HouseholdKind;
  inviteCode: string;
};

export type Member = {
  id: string;
  name: string;
  role: Role;
  color: string;
  language: Language;
  avatarUrl?: string;
  /** False for someone added without the app (an admin ticks off their tasks). */
  usesApp?: boolean;
};

/** One occurrence of a task. A repeating task creates its next occurrence when this one is done. */
export type Task = {
  id: string;
  /** Shared by every occurrence of a repeating task. */
  seriesId: string;
  title: string;
  assigneeId: string | null; // null: anyone can pick it up
  createdById: string;
  dueDate: ISODate;
  dueTime: Time | null; // null: any time
  repeat: Repeat;
  reminder: Reminder;
  /**
   * Private tasks are seen only by the person who made them (always their own task),
   * and don't count on the score board.
   */
  private?: boolean;
  note?: string;
  doneAt: string | null; // ISO timestamp
  doneById: string | null;
};


