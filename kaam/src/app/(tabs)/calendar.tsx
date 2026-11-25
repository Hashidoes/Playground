import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button, EmptyState, IconButton, Text } from '../../components/primitives';
import { Screen } from '../../components/Screen';
import { TaskItem } from '../../components/TaskItem';
import { calendar as copy } from '../../copy/strings';
import { tasksOnDay, useStore } from '../../data/store';
import { useTaskActions } from '../../data/useTaskActions';
import { addDays, dayOfMonth, formatLongDate, fromISODate, startOfWeek, today, weekdayShort } from '../../lib/dates';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, space } from '../../theme/tokens';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Calendar() {
  const store = useStore();
  const { toggle } = useTaskActions();
  const { colors } = useTheme();
  const now = today();
  const [selected, setSelected] = useState(now);
  const weekStart = startOfWeek(selected);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const list = tasksOnDay(store.tasks, selected);
  const done = list.filter((t) => t.doneAt).length;
  const month = fromISODate(weekStart);

  return (
    <Screen
      title={copy.title}
      right={selected !== now ? <Button label={copy.today} size="sm" variant="secondary" onPress={() => setSelected(now)} /> : undefined}
    >
      <View style={{ gap: space[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton icon="caretLeft" label="Previous week" variant="ghost" onPress={() => setSelected(addDays(selected, -7))} />
          <Text variant="bodyStrong">{`${MONTHS[month.getMonth()]} ${month.getFullYear()}`}</Text>
          <IconButton icon="caretRight" label="Next week" variant="ghost" onPress={() => setSelected(addDays(selected, 7))} />
        </View>
        <View style={{ flexDirection: 'row', gap: space[1] }}>
          {days.map((d) => {
            const on = d === selected;
            const has = store.tasks.some((t) => t.dueDate === d && !t.doneAt);
            return (
              <Pressable
                key={d}
                onPress={() => setSelected(d)}
                accessibilityRole="button"
                aria-selected={on}
                accessibilityLabel={formatLongDate(d)}
                style={{ flex: 1, alignItems: 'center', paddingVertical: space[2], gap: 2, borderRadius: radius.md, backgroundColor: on ? colors.highlight : d === now ? colors.surfaceRaised : 'transparent' }}
              >
                <Text variant="label" color={on ? 'onHighlight' : 'inkMuted'}>{weekdayShort(d).slice(0, 1)}</Text>
                <Text variant="bodyStrong" color={on ? 'onHighlight' : 'ink'}>{dayOfMonth(d)}</Text>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: has ? (on ? colors.onHighlight : colors.accent) : 'transparent' }} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: space[1] }}>
        <Text variant="heading" accessibilityRole="header">{formatLongDate(selected)}</Text>
        {list.length ? <Text variant="label" color="inkMuted">{copy.summary(list.length, done)}</Text> : null}
      </View>

      {list.length === 0 ? (
        <EmptyState message={copy.empty} />
      ) : (
        <View style={{ gap: space[2] }}>
          {list.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              assignee={store.memberById(t.assigneeId)}
              doneBy={store.memberById(t.doneById)}
              onToggle={() => toggle(t)}
                canToggle={store.canTick(t)}
              onPress={t.doneAt || !store.canEdit(t) ? undefined : () => router.push({ pathname: '/task/new', params: { id: t.id } })}
            />
          ))}
        </View>
      )}

      {selected >= now ? (
        <Button label={copy.addForDay} icon="plus" variant="secondary" onPress={() => router.push({ pathname: '/task/new', params: { date: selected } })} />
      ) : null}
    </Screen>
  );
}
