import { router } from 'expo-router';
import { View } from 'react-native';
import { GreetingHeader, NoticeBoard, ProgressGauge } from '../../components/home';
import { EmptyState, SectionHeader } from '../../components/primitives';
import { Screen } from '../../components/Screen';
import { TaskItem } from '../../components/TaskItem';
import { gaugeMessage, greetings, home as copy } from '../../copy/strings';
import { myProgress, todaysTasks, useStore } from '../../data/store';
import { useTaskActions } from '../../data/useTaskActions';
import { dayOfMonth, dayPart, formatLongDate, today, weekdayShort } from '../../lib/dates';
import { timeAgo } from '../../lib/timeAgo';

export default function Home() {
  const store = useStore();
  const { toggle } = useTaskActions();
  const { me, tasks, notices } = store;

  const part = dayPart();
  const progress = myProgress(tasks, me.id);
  const now = today();

  const notice = notices.find((n) => !n.showUntil || n.showUntil >= now);
  const author = notice ? store.memberById(notice.authorId) : undefined;

  const upNext = todaysTasks(tasks)
    .filter((t) => !t.doneAt && (t.assigneeId === me.id || t.assigneeId === null))
    .slice(0, 3);

  return (
    <Screen>
      <GreetingHeader me={me} language={me.language} greeting={greetings[me.language][part]} english={greetings.en[part]} />

      <ProgressGauge
        percent={progress.percent}
        hasTasks={progress.total > 0}
        message={gaugeMessage(progress.done, progress.total)}
        day={dayOfMonth(now)}
        weekday={weekdayShort(now)}
        dateLabel={`Today, ${formatLongDate(now)}`}
      />

      <NoticeBoard
        message={notice?.message}
        meta={notice && author ? `${author.id === me.id ? 'You' : author.name} · ${timeAgo(notice.createdAt)}` : undefined}
        onAdd={() => router.push('/notice/new')}
      />

      <View style={{ gap: 12 }}>
        <SectionHeader title={copy.upNext} action={copy.seeAll} onAction={() => router.navigate('/tasks')} />
        {tasks.length === 0 ? (
          // A brand-new household: point to the first step (the button is in the gauge above).
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
                onPress={() => router.push({ pathname: '/task/new', params: { id: t.id } })}
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
