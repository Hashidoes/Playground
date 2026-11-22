// Every user-facing string in Kaam. Source of truth: the Copy section of the
// Kaam design system. Change wording there first, then here.

import type { DayPart } from '../lib/dates';
import type { Language, Repeat, Reminder } from '../data/types';

export const greetings: Record<Language, Record<DayPart, string>> = {
  en: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', night: 'Good night' },
  // Malayalam follows the Figma design: the English greeting written in Malayalam script.
  ml: { morning: 'ഗുഡ്\nമോർണിംഗ്', afternoon: 'ഗുഡ്\nആഫ്റ്റർനൂൺ', evening: 'ഗുഡ്\nഈവനിംഗ്', night: 'ഗുഡ്\nനൈറ്റ്' },
  hi: { morning: 'सुप्रभात', afternoon: 'शुभ दोपहर', evening: 'शुभ संध्या', night: 'शुभ रात्रि' },
};

export const languageNames: Record<Language, string> = { en: 'English', ml: 'മലയാളം', hi: 'हिन्दी' };

export const repeatLabels: Record<Repeat, string> = {
  none: "Doesn't repeat",
  daily: 'Daily',
  alternate: 'Alternate days',
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
};

export const reminderLabels: Record<Reminder, string> = {
  off: 'Off',
  at_time: 'At the time',
  '15_min': '15 min before',
  '1_hour': '1 hour before',
};

export const nav = { home: 'Home', tasks: 'Tasks', calendar: 'Calendar', scores: 'Scores', household: 'Household' };

export const home = {
  hi: (name: string) => `Hi, ${name}`,
  openMenu: 'Open menu',
  viewDay: 'View day',
  gaugeCaption: 'done today',
  gaugeLabel: (pct: number) => `${pct} percent of today's tasks done`,
  noticeLabel: 'Notice board',
  noticeEmpty: 'No notices yet. Tap + to share something with everyone.',
  addNotice: 'Add a notice',
  upNext: 'Up next',
  seeAll: 'See all',
  caughtUp: "You're all caught up.",
};

/** Gauge message for the viewer's own tasks today. */
export function gaugeMessage(done: number, total: number): string {
  if (total === 0) return 'Nothing planned today. Enjoy the quiet.';
  const left = total - done;
  const pct = (done / total) * 100;
  if (done === 0) return 'A fresh start. Pick one thing to begin.';
  if (left === 0) return 'All done for today!';
  if (pct >= 90) return `Almost there. Just ${left} left.`;
  if (pct >= 50) return 'Good going. Keep it up.';
  return 'Off to a good start.';
}

export const tasks = {
  title: 'Tasks',
  tabs: ['Today', 'Upcoming', 'Done'] as const,
  everyone: 'Everyone',
  mine: 'Mine',
  overdue: 'Overdue',
  later: 'Later',
  addTask: 'Add task',
  anyone: 'Anyone can pick this up',
  emptyToday: 'Nothing due today. Add a task, or enjoy the quiet.',
  emptyUpcoming: 'Nothing planned yet.',
  emptyDone: 'Finished tasks show up here.',
  emptyFor: (name: string) => `Nothing for ${name} today.`,
  doneToast: (title: string) => `'${title}' is done.`,
  allDoneToast: "That's everything for today!",
  undoneToast: 'Moved back to your list.',
  deletedToast: 'Task deleted',
  pickedUpToast: "It's yours now.",
  undo: 'Undo',
  markDone: (title: string) => `Mark '${title}' done`,
  markNotDone: (title: string) => `Mark '${title}' not done`,
  // Meta line patterns
  doneBy: (name: string, time: string) => `Done by ${name} · ${time}`,
  overdueYesterday: 'Overdue · was due yesterday',
  overdueOn: (date: string) => `Overdue · was due ${date}`,
  dueOn: (date: string) => `Due ${date}`,
};

export const newTask = {
  title: 'New task',
  editTitle: 'Edit task',
  placeholder: 'What needs doing?',
  suggestions: 'Add again',
  who: "Who's doing it?",
  me: 'Me',
  anyone: 'Anyone',
  when: 'When',
  today: 'Today',
  tomorrow: 'Tomorrow',
  pickDate: 'Pick a date',
  time: 'Time',
  anyTime: 'Any time',
  repeat: 'Repeat',
  remind: 'Remind',
  notePlaceholder: 'Add details (optional)',
  add: 'Add task',
  save: 'Save changes',
  delete: 'Delete task',
  close: 'Close',
  addedFor: (name: string) => `Task added for ${name}`,
  addedForAnyone: 'Task added for anyone to pick up',
  missingName: 'Give the task a name.',
  timePassed: 'That time has passed. Pick a later time or tomorrow.',
  deleteTitle: (title: string) => `Delete '${title}'?`,
  deleteRepeating: 'This also removes every future repeat.',
  deleteConfirm: 'Delete',
  keep: 'Keep it',
};

export const calendar = {
  title: 'Calendar',
  today: 'Today',
  summary: (count: number, done: number) => `${count} ${count === 1 ? 'task' : 'tasks'} · ${done} done`,
  onLeave: (name: string) => `${name} on leave`,
  empty: 'Nothing on this day.',
  addForDay: 'Add a task for this day',
};

export const household = {
  members: 'Members',
  helpers: 'Helpers',
  roles: { admin: 'Admin', member: 'Member', helper: 'Helper' },
  rowMeta: (count: number, done: number) => `${count} ${count === 1 ? 'task' : 'tasks'} today · ${done} done`,
  invite: 'Invite someone',
  inviteBody: 'Share this code with the people you live with. It works for 7 days.',
  copyCode: 'Copy code',
  codeCopied: 'Code copied',
  onLeaveBanner: (name: string, count: number) => `${name} is on leave today. ${count} ${count === 1 ? 'task needs' : 'tasks need'} someone else.`,
  you: 'You',
};

export const scores = {
  title: 'Score board',
  tabs: ['This week', 'This month', 'All time'] as const,
  youLead: "You're leading this week!",
  youLeadMonth: "You're leading this month!",
  youLeadAll: "You're in the lead!",
  someoneLeads: (name: string, period: string) => `${name} is leading ${period}`,
  tie: "It's a tie at the top",
  nothingYet: 'No tasks done yet this week.',
  nothingYetMonth: 'No tasks done yet this month.',
  rowLabel: (name: string, n: number) => `${name}, ${n} ${n === 1 ? 'task' : 'tasks'} done`,
  total: (n: number, period: string) => `Together you finished ${n} ${n === 1 ? 'task' : 'tasks'} ${period}.`,
  footnote: 'Scores start fresh every Monday.',
};

export const notices = {
  title: 'Notice board',
  sheetTitle: 'Share a notice',
  placeholder: 'e.g. Tanya has PTI tomorrow at 11:30 am',
  showUntil: 'Show until',
  missingMessage: 'Write the notice first.',
  post: 'Post notice',
  posted: 'Notice posted. Everyone will see it on Home.',
};

export const system = {
  offline: "You're offline. Changes will sync when you're back.",
  couldntSave: "Couldn't save that. Check your connection and try again.",
  retry: 'Try again',
};
