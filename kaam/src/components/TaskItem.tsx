import { Pressable, View } from 'react-native';
import { repeatLabels, tasks as copy } from '../copy/strings';
import type { Member, Task } from '../data/types';
import { daysBetween, formatShortDate, formatTime, relativeDay, timeFromDate, today } from '../lib/dates';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space } from '../theme/tokens';
import { Avatar, Icon, Text } from './primitives';

/** Meta line under a task title, following the patterns in the Copy section. */
export function taskMeta(task: Task, doneBy?: Member): { text: string; overdue: boolean } {
  const now = today();
  if (task.doneAt) {
    const name = doneBy?.name ?? 'someone';
    return { text: copy.doneBy(name, formatTime(timeFromDate(new Date(task.doneAt)))), overdue: false };
  }
  const late = daysBetween(task.dueDate, now);
  if (late > 0) {
    return { text: late === 1 ? copy.overdueYesterday : copy.overdueOn(formatShortDate(task.dueDate)), overdue: true };
  }
  if (task.repeat !== 'none') {
    const when = task.dueTime ? formatTime(task.dueTime) : relativeDay(task.dueDate);
    return { text: `${repeatLabels[task.repeat]} · ${when}`, overdue: false };
  }
  if (task.dueDate === now) {
    return { text: task.dueTime ? `Today · ${formatTime(task.dueTime)}` : task.assigneeId ? 'Today' : copy.anyone, overdue: false };
  }
  const day = relativeDay(task.dueDate);
  const date = day.startsWith('This') || day === 'Tomorrow' ? day : copy.dueOn(formatShortDate(task.dueDate));
  return { text: task.dueTime ? `${date} · ${formatTime(task.dueTime)}` : date, overdue: false };
}

export function TaskItem({
  task,
  assignee,
  doneBy,
  onToggle,
  onPress,
  showAssignee = true,
}: {
  task: Task;
  assignee?: Member;
  doneBy?: Member;
  onToggle: () => void;
  onPress?: () => void;
  showAssignee?: boolean;
}) {
  const { colors } = useTheme();
  const done = !!task.doneAt;
  const meta = taskMeta(task, doneBy);
  const unassignedNote = !assignee && !done && !meta.overdue && task.dueDate !== today() ? ` · ${copy.anyone}` : '';

  // A disabled Pressable would also disable the check inside it (on web and for
  // screen readers), so rows that don't open anything are a plain View.
  const Row = onPress ? Pressable : View;
  const rowProps = onPress ? { onPress, accessibilityRole: 'button' as const, accessibilityHint: 'Opens the task' } : {};

  return (
    <Row
      {...rowProps}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[3],
        minHeight: 62,
        paddingVertical: space[3],
        paddingHorizontal: space[4],
        borderRadius: radius.md,
        backgroundColor: colors.surfaceRaised,
        borderWidth: meta.overdue ? 2 : 0,
        borderColor: colors.danger,
      }}
    >
      <Pressable
        onPress={onToggle}
        hitSlop={10}
        accessibilityRole="checkbox"
        aria-checked={done}
        accessibilityLabel={done ? copy.markNotDone(task.title) : copy.markDone(task.title)}
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? colors.success : colors.surface,
          borderWidth: done ? 0 : 1.5,
          borderColor: colors.inkMuted,
        }}
      >
        {done ? <Icon name="check" size={16} color={colors.onSuccess} /> : null}
      </Pressable>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="bodyLarge" color={done ? 'inkMuted' : 'ink'} style={done ? { textDecorationLine: 'line-through' } : undefined}>
          {task.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[1], marginTop: 2 }}>
          {task.repeat !== 'none' && !done ? <Icon name="repeat" size={12} color={meta.overdue ? colors.danger : colors.inkMuted} /> : null}
          <Text variant="label" color={meta.overdue ? 'danger' : 'inkMuted'} style={{ flexShrink: 1 }}>
            {meta.text + unassignedNote}
          </Text>
        </View>
      </View>

      {showAssignee && assignee ? <Avatar name={assignee.name} color={assignee.color} size={28} /> : null}
    </Row>
  );
}
