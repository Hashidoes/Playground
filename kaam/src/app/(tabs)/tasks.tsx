import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, EmptyState, IconButton, PillTabs, Text } from '../../components/primitives';
import { Screen } from '../../components/Screen';
import { TaskItem } from '../../components/TaskItem';
import { tasks as copy } from '../../copy/strings';
import { doneTasks, todaysTasks, upcomingTasks, useStore } from '../../data/store';
import type { Task } from '../../data/types';
import { useTaskActions } from '../../data/useTaskActions';
import { daysBetween, relativeDay, today } from '../../lib/dates';
import { space } from '../../theme/tokens';

type Tab = (typeof copy.tabs)[number];
type Group = { title: string; tasks: Task[] };

function groupToday(list: Task[]): Group[] {
  const now = today();
  const overdue = list.filter((t) => !t.doneAt && t.dueDate < now);
  const rest = list.filter((t) => !(!t.doneAt && t.dueDate < now));
  // Open tasks first, finished ones sink to the bottom of Today.
  rest.sort((a, b) => Number(!!a.doneAt) - Number(!!b.doneAt));
  return [
    { title: copy.overdue, tasks: overdue },
    { title: 'Today', tasks: rest },
  ].filter((g) => g.tasks.length);
}

function groupUpcoming(list: Task[]): Group[] {
  const now = today();
  const groups = new Map<string, Task[]>();
  for (const t of list) {
    const key = daysBetween(now, t.dueDate) < 7 ? relativeDay(t.dueDate) : copy.later;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  return [...groups].map(([title, tasks]) => ({ title, tasks }));
}

export default function Tasks() {
  const store = useStore();
  const { toggle } = useTaskActions();
  const [tab, setTab] = useState<Tab>('Today');
  const [who, setWho] = useState<string>('everyone');

  const filter = (t: Task) => (who === 'everyone' ? true : who === 'mine' ? t.assigneeId === store.meId : t.assigneeId === who);
  const others = store.members.filter((m) => m.id !== store.meId);

  let groups: Group[];
  let empty: string;
  if (tab === 'Today') {
    groups = groupToday(todaysTasks(store.tasks).filter(filter));
    const person = store.memberById(who);
    empty = person ? copy.emptyFor(person.name) : copy.emptyToday;
  } else if (tab === 'Upcoming') {
    groups = groupUpcoming(upcomingTasks(store.tasks).filter(filter));
    empty = copy.emptyUpcoming;
  } else {
    const list = doneTasks(store.tasks).filter(filter).slice(0, 40);
    groups = list.length ? [{ title: '', tasks: list }] : [];
    empty = copy.emptyDone;
  }

  return (
    <Screen
      title={copy.title}
      right={<IconButton label={copy.addTask} size="lg" onPress={() => router.push('/task/new')} />}
    >
      <PillTabs items={copy.tabs} value={tab} onChange={setTab} label="Show tasks" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[2] }} style={{ marginHorizontal: -space[4] }}>
        <View style={{ width: space[2] }} />
        <Chip label={copy.everyone} selected={who === 'everyone'} onPress={() => setWho('everyone')} />
        <Chip label={copy.mine} selected={who === 'mine'} onPress={() => setWho('mine')} />
        {others.map((m) => (
          <Chip key={m.id} label={m.name} selected={who === m.id} onPress={() => setWho(m.id)} />
        ))}
        <View style={{ width: space[2] }} />
      </ScrollView>

      {groups.length === 0 ? (
        <EmptyState message={empty} />
      ) : (
        groups.map((g) => (
          <View key={g.title || 'all'} style={{ gap: space[2] }}>
            {g.title ? (
              <Text variant="caption" color={g.title === copy.overdue ? 'danger' : 'inkMuted'} accessibilityRole="header" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
                {g.title}
              </Text>
            ) : null}
            {g.tasks.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                assignee={store.memberById(t.assigneeId)}
                doneBy={store.memberById(t.doneById)}
                onToggle={() => toggle(t)}
                onPress={t.doneAt ? undefined : () => router.push({ pathname: '/task/new', params: { id: t.id } })}
              />
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}
