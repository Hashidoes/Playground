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
  gaugeCaption: 'done today',
  gaugeLabel: (pct: number) => `${pct} percent of today's tasks done`,
  upNext: 'Up next',
  seeAll: 'See all',
  caughtUp: "You're all caught up.",
  firstTaskBody: 'Nothing on the list yet. Add the first thing that needs doing at home.',
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

export const gaugeZero = {
  title: 'Nothing planned today',
  body: 'Enjoy the quiet, or add something for today.',
  count: '0 tasks',
};

export const tasks = {
  title: 'Tasks',
  everyone: 'Everyone',
  everyoneHint: 'Shared tasks',
  mine: 'Mine',
  mineHint: 'Private ones too',
  all: 'All',
  whose: 'Whose tasks',
  comingUp: 'Coming up',
  privateLabel: 'Only you can see this',
  overdue: 'Overdue',
  later: 'Later',
  addTask: 'Add task',
  anyone: 'Anyone can pick this up',
  emptyToday: 'Nothing due today. Add a task, or enjoy the quiet.',
  emptyMine: 'Nothing on your list today. Add a task, or enjoy the quiet.',
  emptyFor: (name: string) => `Nothing for ${name} today.`,
  doneToast: (title: string) => `'${title}' is done.`,
  allDoneToast: "That's everything for today!",
  undoneToast: 'Moved back to the list.',
  deletedToast: 'Task deleted',
  undo: 'Undo',
  markDone: (title: string) => `Mark '${title}' done`,
  markNotDone: (title: string) => `Mark '${title}' not done`,
  /** Shown when someone taps a task that isn't theirs to tick. */
  notYours: (name: string) => `Only ${name} or an admin can tick this off.`,
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
  privateToggle: 'Private for you',
  privateOff: 'Everyone in the household can see this task.',
  privateOn: "Only you can see this task. It's yours, and it doesn't count on the score board.",
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
  empty: 'Nothing on this day.',
  addForDay: 'Add a task for this day',
};

export const household = {
  members: 'Members',
  roles: { admin: 'Admin', member: 'Member' },
  rowMeta: (count: number, done: number) => (count === 0 ? 'No tasks today' : `${count} ${count === 1 ? 'task' : 'tasks'} today · ${done} done`),
  noApp: "Doesn't use the app",
  you: 'You',
  // Admin actions on someone, like a WhatsApp group admin
  manage: (name: string) => `Manage ${name}`,
  makeAdmin: 'Make admin',
  dismissAdmin: 'Dismiss as admin',
  remove: 'Remove',
  removeConfirm: (name: string) => `Remove ${name} from the household? Their open tasks will be left for anyone to pick up.`,
  removed: (name: string) => `${name} removed`,
  nowAdmin: (name: string) => `${name} is now an admin`,
  noLongerAdmin: (name: string) => `${name} is no longer an admin`,
  lastAdmin: 'Make someone else an admin first. A household always needs one.',
  cancel: 'Cancel',
};

export const scores = {
  title: 'Score board',
  thisWeek: 'This week',
  youLead: "You're leading this week!",
  someoneLeads: (name: string) => `${name} is leading this week`,
  tie: "It's a tie at the top",
  nothingYet: 'No tasks done yet this week.',
  rowLabel: (name: string, n: number) => `${name}, ${n} ${n === 1 ? 'task' : 'tasks'} done`,
  total: (n: number) => `Together you finished ${n} ${n === 1 ? 'task' : 'tasks'} this week.`,
  footnote: "Scores start fresh every Monday. Private tasks don't count.",
};

export const system = {
  offline: "You're offline. Changes will sync when you're back.",
  couldntSave: "Couldn't save that. Check your connection and try again.",
  retry: 'Try again',
};

export const onboarding = {
  title: 'Welcome to Kaam',
  body: "The shared to-do list for your home. Plan the chores, hand them out and see what's done, together.",
  letsGo: "Let's go!",
  artLabel: 'A stamp-style picture of someone loading a washing machine with a basket of laundry.',
  back: 'Back',
  continue: 'Continue',
};

export const signIn = {
  title: "Let's get you in",
  body: "Enter your email. We'll send you a 6-digit code.",
  emailLabel: 'Email',
  emailPlaceholder: 'name@example.com',
  sendCode: 'Send code',
  invalidEmail: 'Enter an email address like name@example.com.',
  or: 'or',
  google: 'Continue with Google',
  codeTitle: 'Check your email',
  codeBody: (email: string) => `We sent a 6-digit code to ${email}.`,
  changeEmail: 'Change email',
  resendIn: (s: number) => `Resend code in 0:${String(s).padStart(2, '0')}`,
  resend: 'Resend code',
  resent: 'New code sent',
  wrongCode: "That code doesn't match. Check the email and try again.",
  codeLabel: '6-digit code',
  verify: 'Continue',
  /** Shown only while the app runs on sample data, before Supabase is connected. */
  sampleHint: 'Sample mode: any 6 digits work, except 000000.',
  sampleGoogleHint: 'Sample mode: Google sign-in is simulated until Supabase is connected.',
};

export const profile = {
  title: 'What should we call you?',
  nameLabel: 'Your name',
  namePlaceholder: 'e.g. Meera',
  emptyName: 'Add your name so others know who you are.',
  continue: 'Continue',
};

export const setup = {
  title: 'Set up your household',
  startTitle: 'Start a new household',
  startBody: "Make a shared list and invite the people you live with. You'll be its admin.",
  joinTitle: 'Join a household',
  joinBody: 'Got an invite code? Enter it here.',
  nameTitle: 'Name your household',
  nameLabel: 'Household name',
  namePlaceholder: 'e.g. The Nair home, Flat 4B',
  emptyName: 'Give your household a name.',
  create: 'Create household',
  inviteTitle: 'Invite your household',
  inviteBody: 'Share this code with the people you live with. It works for 7 days.',
  share: 'Share invite',
  copy: 'Copy code',
  copied: 'Code copied',
  shareMessage: (household: string, code: string) => `Join ${household} on Kaam so we can share the housework. Use code ${code} when you sign up.`,
  later: 'Do this later',
  done: 'Done',
  joinTitleScreen: 'Enter your invite code',
  joinPlaceholder: 'ABC-123',
  joinButton: 'Join household',
  codeNotFound: "We couldn't find that code. Check it with the person who sent it, or ask for a new one.",
  joined: (household: string) => `You've joined ${household}`,
  joinedBody: 'Your tasks and the score board are ready.',
  goHome: 'Go to Home',
  sampleJoinHint: 'Sample mode: use code NAI-428 to join the example household.',
};

export const account = {
  signOut: 'Sign out',
  signOutConfirm: 'Sign out of Kaam?',
  leave: 'Leave household',
  leaveConfirm: (household: string) => `Leave ${household}? Your private tasks will be deleted and your open tasks left for anyone.`,
  cancel: 'Cancel',
};

export const appearance = {
  label: 'Appearance',
  sunlit: 'Sunlit',
  evening: 'Evening',
};

export const addMember = {
  open: 'Add someone',
  title: 'Add someone',
  inviteHeading: 'Invite with a code',
  inviteBody: 'They join from their own phone and see the tasks you give them. The code works for 7 days.',
  offlineHeading: 'Add without the app',
  offlineBody: "For someone who won't use Kaam on a phone, like a grandparent. Give them tasks, and an admin ticks them off.",
  nameLabel: 'Their name',
  namePlaceholder: 'e.g. Ammamma',
  emptyName: 'Add their name.',
  add: (name: string) => (name ? `Add ${name}` : 'Add to household'),
  added: (name: string) => `${name} added to the household`,
  or: 'or',
  close: 'Close',
};
