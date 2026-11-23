import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Avatar, Button, Card, ChoiceRow, Icon, IconButton, Text } from '../../components/primitives';
import { Screen } from '../../components/Screen';
import { account, addMember, appearance as appearanceCopy, household as copy, memberRow } from '../../copy/strings';
import { todaysTasks, useStore } from '../../data/store';
import type { Member } from '../../data/types';
import { today } from '../../lib/dates';
import { formatMinutes } from '../../lib/sun';
import { useTheme, type ThemeName } from '../../theme/ThemeProvider';
import { radius, space } from '../../theme/tokens';

export default function Household() {
  const store = useStore();
  const { colors, isEvening, sun, override, choose } = useTheme();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const now = today();
  const todays = todaysTasks(store.tasks);
  const onLeaveToday = store.leave.filter((l) => l.from <= now && l.to >= now);

  const row = (m: Member) => {
    const mine = todays.filter((t) => t.assigneeId === m.id);
    const done = mine.filter((t) => t.doneAt).length;
    const meta = copy.rowMeta(mine.length, done) + (m.usesApp === false ? ` · ${memberRow.noApp}` : '');
    return (
      <Pressable
        key={m.id}
        onPress={() => router.navigate({ pathname: '/tasks', params: { who: m.id } })}
        accessibilityRole="button"
        accessibilityLabel={`${m.name}, ${copy.roles[m.role]}, ${meta}`}
        accessibilityHint={memberRow.open(m.name)}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[2], opacity: pressed ? 0.7 : 1 })}
      >
        <Avatar name={m.name} color={m.color} size={42} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{m.id === store.meId ? `${m.name} (${copy.you.toLowerCase()})` : m.name}</Text>
          <Text variant="label" color="inkMuted">{meta}</Text>
        </View>
        <View style={{ paddingHorizontal: space[3], paddingVertical: space[1], borderRadius: radius.pill, backgroundColor: colors.surfaceSunken }}>
          <Text variant="label">{copy.roles[m.role]}</Text>
        </View>
        <Icon name="caretRight" size={16} color={colors.inkMuted} />
      </Pressable>
    );
  };

  const members = store.members.filter((m) => m.role !== 'helper');
  const helpers = store.members.filter((m) => m.role === 'helper');

  const current: ThemeName = isEvening ? 'evening' : 'sunlit';
  const sunrise = formatMinutes(sun.sunrise);
  const sunset = formatMinutes(sun.sunset);
  const caption = override
    ? appearanceCopy.heldUntil(
        override.theme === 'evening' ? appearanceCopy.evening : appearanceCopy.sunlit,
        sun.isDay ? 'sunset' : 'sunrise',
        sun.isDay ? sunset : sunrise,
      )
    : appearanceCopy.auto(sunrise, sunset);

  return (
    <Screen title={store.household.name} right={<IconButton label={addMember.open} size="lg" onPress={() => router.push('/member/new')} />}>
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
        <Text variant="label" color="inkMuted" accessibilityLiveRegion="polite">{caption}</Text>
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
