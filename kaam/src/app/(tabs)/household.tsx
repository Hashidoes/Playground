import { View } from 'react-native';
import { Avatar, Card, ChoiceRow, Text } from '../../components/primitives';
import { Screen } from '../../components/Screen';
import { household as copy } from '../../copy/strings';
import { todaysTasks, useStore } from '../../data/store';
import type { Member } from '../../data/types';
import { today } from '../../lib/dates';
import { useTheme, type Appearance } from '../../theme/ThemeProvider';
import { radius, space } from '../../theme/tokens';

const APPEARANCE: { value: Appearance; label: string }[] = [
  { value: 'sunlit', label: 'Sunlit' },
  { value: 'evening', label: 'Evening' },
  { value: 'system', label: 'Match my phone' },
];

export default function Household() {
  const store = useStore();
  const { colors, appearance, setAppearance } = useTheme();
  const now = today();
  const todays = todaysTasks(store.tasks);

  const onLeaveToday = store.leave.filter((l) => l.from <= now && l.to >= now);

  const row = (m: Member) => {
    const mine = todays.filter((t) => t.assigneeId === m.id);
    const done = mine.filter((t) => t.doneAt).length;
    return (
      <View key={m.id} accessible style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[2] }}>
        <Avatar name={m.name} color={m.color} size={42} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{m.id === store.meId ? `${m.name} (${copy.you.toLowerCase()})` : m.name}</Text>
          <Text variant="label" color="inkMuted">{copy.rowMeta(mine.length, done)}</Text>
        </View>
        <View style={{ paddingHorizontal: space[3], paddingVertical: space[1], borderRadius: radius.pill, backgroundColor: colors.surfaceSunken }}>
          <Text variant="label">{copy.roles[m.role]}</Text>
        </View>
      </View>
    );
  };

  const members = store.members.filter((m) => m.role !== 'helper');
  const helpers = store.members.filter((m) => m.role === 'helper');

  return (
    <Screen title={store.household.name}>
      {onLeaveToday.map((l) => {
        const who = store.memberById(l.memberId);
        const count = todays.filter((t) => t.assigneeId === l.memberId && !t.doneAt).length;
        return who ? (
          <Card key={l.id} style={{ borderWidth: 2, borderColor: colors.accent }}>
            <Text variant="bodySemibold">{copy.onLeaveBanner(who.name, count)}</Text>
          </Card>
        ) : null;
      })}

      <View style={{ gap: space[2] }}>
        <Text variant="caption" color="inkMuted" accessibilityRole="header">{copy.members.toUpperCase()}</Text>
        {members.map(row)}
      </View>

      {helpers.length ? (
        <View style={{ gap: space[2] }}>
          <Text variant="caption" color="inkMuted" accessibilityRole="header">{copy.helpers.toUpperCase()}</Text>
          {helpers.map(row)}
        </View>
      ) : null}

      <View style={{ padding: space[5], borderRadius: radius.md, backgroundColor: colors.notice, gap: space[3] }}>
        <Text variant="bodyStrong" color="onNotice">{copy.invite}</Text>
        <Text variant="body" color="onNotice">{copy.inviteBody}</Text>
        <Text selectable variant="title" color="noticeLabel" style={{ letterSpacing: 2 }} accessibilityLabel={`Invite code ${store.household.inviteCode.split('').join(' ')}`}>
          {store.household.inviteCode}
        </Text>
      </View>

      <View style={{ gap: space[3] }}>
        <Text variant="caption" color="inkMuted" accessibilityRole="header">APPEARANCE</Text>
        <ChoiceRow label="Appearance" value={appearance} onChange={setAppearance} options={APPEARANCE} />
      </View>
    </Screen>
  );
}
