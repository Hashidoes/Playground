import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Avatar, Button, Card, ChoiceRow, IconButton, Text } from '../../components/primitives';
import { Screen } from '../../components/Screen';
import { account, addMember, appearance as appearanceCopy, household as copy, memberRow } from '../../copy/strings';
import { todaysTasks, useStore } from '../../data/store';
import type { Member } from '../../data/types';
import { today } from '../../lib/dates';
import { useTheme, type ThemeName } from '../../theme/ThemeProvider';
import { radius, space } from '../../theme/tokens';

export default function Household() {
  const store = useStore();
  const { colors, isEvening, choose } = useTheme();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const now = today();
  const todays = todaysTasks(store.tasks);
  const onLeaveToday = store.leave.filter((l) => l.from <= now && l.to >= now);

  const row = (m: Member) => {
    const mine = todays.filter((t) => t.assigneeId === m.id);
    const done = mine.filter((t) => t.doneAt).length;
    const meta = copy.rowMeta(mine.length, done) + (m.usesApp === false ? ` · ${memberRow.noApp}` : '');
    return (
      <View
        key={m.id}
        accessible
        accessibilityLabel={`${m.name}, ${copy.roles[m.role]}, ${meta}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[2] }}
      >
        <Avatar name={m.name} color={m.color} size={42} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{m.id === store.meId ? `${m.name} (${copy.you.toLowerCase()})` : m.name}</Text>
          <Text variant="label" color="inkMuted">{meta}</Text>
        </View>
        <View style={{ paddingHorizontal: space[3], paddingVertical: space[1], borderRadius: radius.pill, backgroundColor: colors.surfaceSunken }}>
          <Text variant="label">{copy.roles[m.role]}</Text>
        </View>
      </View>
    );
  };

  const members = store.members.filter((m) => m.role !== 'helper');
  const helpers = store.members.filter((m) => m.role === 'helper');

  const current: ThemeName = isEvening ? 'evening' : 'sunlit';

  return (
    <Screen
      title={store.household.name}
      fab={
        <IconButton
          label={addMember.open}
          size="lg"
          variant="raised"
          onPress={() => router.push('/member/new')}
          style={{ shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}
        />
      }
    >
      {onLeaveToday.map((l) => {
        const who = store.memberById(l.memberId);
        const count = todays.filter((t) => t.assigneeId === l.memberId && !t.doneAt).length;
        return who ? (
          <Card key={l.id} style={{ borderWidth: 2, borderColor: colors.accent }}>
            <Text variant="bodySemibold">{copy.onLeaveBanner(who.name, count)}</Text>
          </Card>
        ) : null;
      })}

      <View style={{ gap: space[1] }}>
        <Text variant="caption" color="inkMuted" accessibilityRole="header" style={{ letterSpacing: 0.6 }}>{copy.members.toUpperCase()}</Text>
        {members.map(row)}
      </View>

      {helpers.length ? (
        <View style={{ gap: space[1] }}>
          <Text variant="caption" color="inkMuted" accessibilityRole="header" style={{ letterSpacing: 0.6 }}>{copy.helpers.toUpperCase()}</Text>
          {helpers.map(row)}
        </View>
      ) : null}

      <View style={{ gap: space[3] }}>
        <Text variant="caption" color="inkMuted" accessibilityRole="header" style={{ letterSpacing: 0.6 }}>{appearanceCopy.label.toUpperCase()}</Text>
        <ChoiceRow
          label={appearanceCopy.label}
          value={current}
          onChange={choose}
          options={[
            { value: 'sunlit', label: appearanceCopy.sunlit },
            { value: 'evening', label: appearanceCopy.evening },
          ]}
        />
      </View>

      {confirmSignOut ? (
        <View style={{ gap: space[3], padding: space[4], borderRadius: radius.md, borderWidth: 2, borderColor: colors.line }}>
          <Text variant="bodyStrong">{account.signOutConfirm}</Text>
          <View style={{ flexDirection: 'row', gap: space[3] }}>
            <Button label={account.signOut} variant="highlight" onPress={store.signOut} style={{ flex: 1 }} />
            <Button label={account.cancel} variant="ghost" onPress={() => setConfirmSignOut(false)} style={{ flex: 1 }} />
          </View>
        </View>
      ) : (
        <Button label={account.signOut} variant="ghost" onPress={() => setConfirmSignOut(true)} />
      )}
    </Screen>
  );
}
