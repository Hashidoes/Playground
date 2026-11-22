// Shapes mirror the planned Supabase tables, so the local store can be swapped
// for the real backend without touching screens.

export type ISODate = string; // 'YYYY-MM-DD' in the household's local time
export type Time = string; // 'HH:mm', 24-hour

export type Role = 'admin' | 'member' | 'helper';
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
  note?: string;
  doneAt: string | null; // ISO timestamp
  doneById: string | null;
};

export type Notice = {
  id: string;
  message: string;
  authorId: string;
  createdAt: string;
  showUntil: ISODate | null; // null: until someone removes it
};

export type Leave = {
  id: string;
  memberId: string;
  from: ISODate;
  to: ISODate;
  note?: string;
};
