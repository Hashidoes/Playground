// Example household used until the app is connected to Supabase.
// Dates are relative to today so the app always opens in a realistic state.

import { addDays, today } from '../lib/dates';
import { green, amber } from '../theme/tokens';
import type { Household, Leave, Member, Notice, Task } from './types';

export const ME = 'm-meera';

export const sampleHousehold: Household = {
  id: 'h-1',
  name: 'The Nair home',
  kind: 'family',
  inviteCode: 'NAI-428',
};

export const sampleMembers: Member[] = [
  { id: 'm-meera', name: 'Meera', role: 'admin', color: amber[900], language: 'ml' },
  { id: 'm-sachin', name: 'Sachin', role: 'member', color: green[600], language: 'en' },
  { id: 'm-tanya', name: 'Tanya', role: 'member', color: amber[700], language: 'en' },
  { id: 'm-rekha', name: 'Rekha', role: 'helper', color: '#045DD0', language: 'ml' },
];

function at(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function buildSampleTasks(): Task[] {
  const t = today();
  const y = addDays(t, -1);
  let n = 0;
  const task = (p: Partial<Task> & Pick<Task, 'title' | 'dueDate'>): Task => {
    n += 1;
    const id = `t-${n}`;
    return {
      id,
      seriesId: id,
      assigneeId: null,
      createdById: ME,
      dueTime: null,
      repeat: 'none',
      reminder: 'off',
      doneAt: null,
      doneById: null,
      ...p,
    };
  };

  const tasks: Task[] = [
    // Today, mine
    task({ title: 'Water the plants', assigneeId: ME, dueDate: t, dueTime: '07:00', repeat: 'daily', reminder: 'at_time', doneAt: at(t, '07:10'), doneById: ME }),
    task({ title: 'Call the plumber about the kitchen tap', assigneeId: ME, dueDate: t, dueTime: '10:00', doneAt: at(t, '10:20'), doneById: ME }),
    task({ title: 'Pay the electricity bill', assigneeId: ME, dueDate: y }),
    task({ title: 'Pick up Tanya from tuition', assigneeId: ME, dueDate: t, dueTime: '18:30', reminder: '15_min' }),
    task({ title: 'Plan the week’s dinners', assigneeId: ME, dueDate: t, dueTime: '20:00', repeat: 'weekly' }),
    // Private: only Meera sees these
    task({ title: 'Call Amma', assigneeId: ME, dueDate: t, dueTime: '20:30', private: true }),
    task({ title: 'Book an eye check-up', assigneeId: ME, dueDate: addDays(t, 2), private: true }),
    // Today, others
    task({ title: 'Make evening tea', assigneeId: 'm-tanya', dueDate: t, dueTime: '17:30', repeat: 'daily' }),
    task({ title: 'Take out the recycling', assigneeId: 'm-sachin', dueDate: t, repeat: 'weekly', doneAt: at(t, '08:05'), doneById: 'm-sachin' }),
    task({ title: 'Laundry', assigneeId: 'm-sachin', dueDate: t, dueTime: '19:00', repeat: 'alternate' }),
    task({ title: 'Sweep the floors', assigneeId: 'm-rekha', dueDate: t, repeat: 'daily', doneAt: at(t, '09:30'), doneById: 'm-rekha' }),
    task({ title: 'Do the dishes', assigneeId: 'm-rekha', dueDate: t, dueTime: '14:00', repeat: 'daily' }),
    task({ title: 'Order groceries', assigneeId: null, dueDate: t }),
    // Upcoming
    task({ title: 'Clean the pooja room', assigneeId: 'm-rekha', dueDate: addDays(t, 1), repeat: 'weekly' }),
    task({ title: 'Book the car service', assigneeId: 'm-sachin', dueDate: addDays(t, 2), dueTime: '11:00' }),
    task({ title: 'Buy a birthday gift for Ammu', assigneeId: ME, dueDate: addDays(t, 3) }),
    task({ title: 'Return library books', assigneeId: 'm-tanya', dueDate: addDays(t, 4) }),
    task({ title: 'Change the water filter', assigneeId: null, dueDate: addDays(t, 9), repeat: 'monthly' }),
  ];

  // Finished earlier, so the score board has a realistic week.
  const history: [string, string, number, string][] = [
    ['Fold the laundry', ME, 1, '18:00'], ['Wipe the kitchen counters', ME, 1, '21:00'], ['Water the plants', ME, 1, '07:05'],
    ['Make evening tea', 'm-tanya', 1, '17:40'], ['Feed the fish', 'm-tanya', 2, '08:00'],
    ['Laundry', 'm-sachin', 2, '19:20'], ['Fix the wobbly chair', 'm-sachin', 1, '16:00'], ['Get the gas cylinder refilled', 'm-sachin', 3, '12:00'],
    ['Do the dishes', 'm-rekha', 1, '14:10'], ['Sweep the floors', 'm-rekha', 1, '09:15'], ['Mop the floors', 'm-rekha', 2, '10:00'],
    ['Water the plants', ME, 2, '07:00'], ['Pay the school fees', ME, 3, '11:00'], ['Make evening tea', 'm-tanya', 3, '17:35'],
  ];
  for (const [title, who, daysAgo, time] of history) {
    const d = addDays(t, -daysAgo);
    tasks.push(task({ title, assigneeId: who, dueDate: d, doneAt: at(d, time), doneById: who }));
  }
  return tasks;
}

export function buildSampleNotices(): Notice[] {
  return [
    {
      id: 'n-1',
      message: 'Tanya has PTI tomorrow at 11:30 am',
      authorId: ME,
      createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
      showUntil: addDays(today(), 1),
    },
  ];
}

export function buildSampleLeave(): Leave[] {
  return [{ id: 'l-1', memberId: 'm-rekha', from: addDays(today(), 3), to: addDays(today(), 4), note: 'Family wedding' }];
}

/** Titles offered under "Add again" in the New task sheet. */
export const sampleSuggestions = ['Laundry', 'Polish shoes', 'Take out the recycling', 'Water the plants', 'Order groceries'];
