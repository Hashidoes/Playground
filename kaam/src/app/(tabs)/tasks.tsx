import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Chip, EmptyState, Icon, IconButton, PillTabs, Text } from '../../components/primitives';
import { Screen } from '../../components/Screen';
import { TaskItem } from '../../components/TaskItem';
import { tasks as copy } from '../../copy/strings';
import { doneTasks, todaysTasks, upcomingTasks, useStore } from '../../data/store';
import type { Task } from '../../data/types';
import { useTaskActions } from '../../data/useTaskActions';
import { formatLongDate, today } from '../../lib/dates';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, space } from '../../theme/tokens';

type Tab = (typeof copy.tabs)[number];
type Scope = 'everyone' | 'mine';
type Group = { title: string; tasks: Task[] };

/** Overdue, then today (open first), then what's coming up. */
function groupToday(todays: Task[], upcoming: Task[]): Group[] {
  const now = today();
  const overdue = todays.filter((t) => !t.doneAt && t.dueDate < now);
  const rest = todays.filter((t) => !(!t.doneAt && t.dueDate < now)).sort((a, b) => Number(!!a.doneAt) - Number(!!b.doneAt));
  return [
    { title: copy.overdue, tasks: overdue },
    { title: 'Today', tasks: rest },
    { title: copy.comingUp, tasks: upcoming },
  ].filter((g) => g.tasks.length);
}

/** One of the two large Everyone / Mine choices, with its icon on the right. */
function ScopeButton({ label, hint, icon, selected, onPress }: { label: string; hint: string; icon: 'users' | 'user'; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const fg = selected ? colors.onHighlight : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      aria-checked={selected}
      accessibilityLabel={`${label}. ${hint}`}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[2],
        paddingLeft: space[4],
        paddingRight: space[3],
        borderRadius: radius.md,
        backgroundColor: selected ? colors.highlight : colors.surfaceSunken,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" style={{ color: fg }}>{label}</Text>
        <Text variant="label" style={{ color: fg, opacity: 0.85 }} numberOfLines={2}>{hint}</Text>
      </View>
      <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.accent : colors.surface }}>
        <Icon name={icon} size={20} color={selected ? colors.onAccent : colors.ink} />
      </View>
    </Pressable>
  );
}

export default function Tasks() {
  const store = useStore();
  const { toggle } = useTaskActions();
  const [tab, setTab] = useState<Tab>('Today');
  const [scope, setScope] = useState<Scope>('everyone');
  const [person, setPerson] = useState<string>('all');

  // Opened from a person on the Household screen: show their tasks for today.
  const params = useLocalSearchParams<{ who?: string }>();
  const [appliedWho, setAppliedWho] = useState<string | undefined>(undefined);
  if (params.who !== appliedWho) {
    setAppliedWho(params.who);
    if (params.who) {
      if (params.who === store.meId) setScope('mine');
      else {
        setScope('everyone');
        setPerson(params.who);
      }
      setTab('Today');
    }
  }

  // Everyone: what the household sees (never private). Mine: all of yours, private included.
  const inScope = (t: Task) =>
    scope === 'mine' ? t.assigneeId === store.meId : !t.private && (person === 'all' || t.assigneeId === person);

  let groups: Group[];
  let empty: string;
  if (tab === 'Today') {
    groups = groupToday(todaysTasks(store.tasks).filter(inScope), upcomingTasks(store.tasks).filter(inScope));
    const who = scope === 'everyone' ? store.memberById(person) : undefined;
    empty = scope === 'mine' ? copy.emptyMine : who ? copy.emptyFor(who.name) : copy.emptyToday;
  } else {
    const list = doneTasks(store.tasks).filter(inScope).slice(0, 40);
    groups = list.length ? [{ title: '', tasks: list }] : [];
    empty = copy.emptyDone;
  }

  return (
    <Screen
      title={copy.title}
      subtitle={formatLongDate(today())}
      fab={<IconButton label={copy.addTask} size="lg" onPress={() => router.push('/task/new')} style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 }} />}
    >
      <View accessibilityRole="radiogroup" accessibilityLabel={copy.whose} style={{ flexDirection: 'row', gap: space[3] }}>
        <ScopeButton label={copy.everyone} hint={copy.everyoneHint} icon="users" selected={scope === 'everyone'} onPress={() => setScope('everyone')} />
        <ScopeButton label={copy.mine} hint={copy.mineHint} icon="user" selected={scope === 'mine'} onPress={() => setScope('mine')} />
      </View>

      {scope === 'everyone' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: space[2], paddingHorizontal: space[4] }}
          style={{ marginHorizontal: -space[4] }}
          accessibilityRole="radiogroup"
          accessibilityLabel="Show tasks for"
        >
          <Chip label={copy.all} selected={person === 'all'} onPress={() => setPerson('all')} />
          {store.members.map((m) => (
            <Chip key={m.id} label={m.id === store.meId ? `${m.name} (you)` : m.name} selected={person === m.id} onPress={() => setPerson(m.id)} />
          ))}
        </ScrollView>
      ) : null}

      <PillTabs items={copy.tabs} value={tab} onChange={setTab} label="Show tasks" />

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
                showAssignee={scope === 'everyone'}
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
