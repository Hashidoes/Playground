import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Chip, EmptyState, Icon, IconButton, Text } from '../../components/primitives';
import { Screen } from '../../components/Screen';
import { TaskItem } from '../../components/TaskItem';
import { tasks as copy } from '../../copy/strings';
import { todaysTasks, upcomingTasks, useStore } from '../../data/store';
import type { Task } from '../../data/types';
import { useTaskActions } from '../../data/useTaskActions';
import { formatLongDate, today } from '../../lib/dates';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, space } from '../../theme/tokens';

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

/** One of the two large Everyone / Mine choices, with its icon on the left. */
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
        gap: space[3],
        paddingHorizontal: space[4],
        borderRadius: radius.md,
        backgroundColor: selected ? colors.highlight : colors.surfaceSunken,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <Icon name={icon} size={26} color={fg} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" style={{ color: fg }}>{label}</Text>
        <Text variant="label" style={{ color: fg, opacity: 0.85 }} numberOfLines={2}>{hint}</Text>
      </View>
    </Pressable>
  );
}

export default function Tasks() {
  const store = useStore();
  const { toggle } = useTaskActions();
  const [scope, setScope] = useState<Scope>('everyone');
  const [person, setPerson] = useState<string>('all');


  // Everyone: what the household sees (never private). Mine: all of yours, private included.
  const inScope = (t: Task) =>
    scope === 'mine' ? t.assigneeId === store.meId : !t.private && (person === 'all' || t.assigneeId === person);

  // One list: overdue, today (finished ones sink to the bottom), then coming up.
  const groups = groupToday(todaysTasks(store.tasks).filter(inScope), upcomingTasks(store.tasks).filter(inScope));
  const who = scope === 'everyone' ? store.memberById(person) : undefined;
  const empty = scope === 'mine' ? copy.emptyMine : who ? copy.emptyFor(who.name) : copy.emptyToday;

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
                canToggle={store.canTick(t)}
                onPress={t.doneAt || !store.canEdit(t) ? undefined : () => router.push({ pathname: '/task/new', params: { id: t.id } })}
              />
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}
