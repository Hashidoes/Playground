import { router } from 'expo-router';
import { View } from 'react-native';
import { GreetingHeader, ProgressGauge } from '../../components/home';
import { EmptyState, IconButton, SectionHeader } from '../../components/primitives';
import { Screen } from '../../components/Screen';
import { TaskItem } from '../../components/TaskItem';
import { gaugeMessage, greetings, home as copy, tasks as taskCopy } from '../../copy/strings';
import { myProgress, todaysTasks, useStore } from '../../data/store';
import { useTaskActions } from '../../data/useTaskActions';
import { dayOfMonth, dayPart, formatLongDate, today, weekdayShort } from '../../lib/dates';

export default function Home() {
  const store = useStore();
  const { toggle } = useTaskActions();
  const { me, tasks } = store;

  const part = dayPart();
  const progress = myProgress(tasks, me.id);
  const now = today();

  const upNext = todaysTasks(tasks)
    .filter((t) => !t.doneAt && (t.assigneeId === me.id || t.assigneeId === null))
    .slice(0, 3);

  return (
    <Screen
      fab={
        <IconButton
          label={taskCopy.addTask}
          size="lg"
          onPress={() => router.push('/task/new')}
          style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}
        />
      }
    >
      <GreetingHeader me={me} language={me.language} greeting={greetings[me.language][part]} english={greetings.en[part]} />

      <ProgressGauge
        percent={progress.percent}
        hasTasks={progress.total > 0}
        message={gaugeMessage(progress.done, progress.total)}
        day={dayOfMonth(now)}
        weekday={weekdayShort(now)}
        dateLabel={`Today, ${formatLongDate(now)}`}
      />

      <View style={{ gap: 12 }}>
        <SectionHeader title={copy.upNext} action={copy.seeAll} onAction={() => router.navigate('/tasks')} />
        {tasks.length === 0 ? (
          // A brand-new household: point to the first step (the + below adds it).
          <EmptyState message={copy.firstTaskBody} />
        ) : upNext.length === 0 ? (
          <EmptyState message={copy.caughtUp} />
        ) : (
          <View style={{ gap: 8 }}>
            {upNext.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                assignee={store.memberById(t.assigneeId)}
                showAssignee={t.assigneeId !== me.id}
                onToggle={() => toggle(t)}
                canToggle={store.canTick(t)}
                onPress={store.canEdit(t) ? () => router.push({ pathname: '/task/new', params: { id: t.id } }) : undefined}
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
