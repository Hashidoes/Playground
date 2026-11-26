import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Avatar, Button, ChoiceRow, IconButton, Text } from '../../components/primitives';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/Toast';
import { account, addMember, appearance as appearanceCopy, household as copy } from '../../copy/strings';
import { todaysTasks, useStore } from '../../data/store';
import type { Member } from '../../data/types';
import { useTheme, type ThemeName } from '../../theme/ThemeProvider';
import { radius, space } from '../../theme/tokens';

type Confirm = 'signOut' | 'leave' | null;

export default function Household() {
  const store = useStore();
  const toast = useToast();
  const { colors, isEvening, choose } = useTheme();
  const [confirm, setConfirm] = useState<Confirm>(null);
  // Admin only: whose actions are open, and whether removal is being confirmed.
  const [managing, setManaging] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const todays = todaysTasks(store.tasks);
  const adminCount = store.members.filter((m) => m.role === 'admin').length;

  async function toggleAdmin(m: Member) {
    if (m.role === 'admin' && adminCount === 1) return toast({ message: copy.lastAdmin });
    setManaging(null);
    const makeAdmin = m.role !== 'admin';
    const problem = await store.setRole(m.id, makeAdmin ? 'admin' : 'member');
    toast({ message: problem ?? (makeAdmin ? copy.nowAdmin(m.name) : copy.noLongerAdmin(m.name)) });
  }

  async function remove(m: Member) {
    setManaging(null);
    setConfirmRemove(false);
    const problem = await store.removeMember(m.id);
    toast({ message: problem ?? copy.removed(m.name) });
  }

  const row = (m: Member) => {
    const mine = todays.filter((t) => t.assigneeId === m.id);
    const done = mine.filter((t) => t.doneAt).length;
    const meta = copy.rowMeta(mine.length, done) + (m.usesApp === false ? ` · ${copy.noApp}` : '');
    const canManage = store.isAdmin && m.id !== store.meId;
    const open = managing === m.id;
    return (
      <View key={m.id} style={{ gap: space[2] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[2] }}>
          <View accessible accessibilityLabel={`${m.name}, ${copy.roles[m.role]}, ${meta}`} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
            <Avatar name={m.name} color={m.color} size={42} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{m.id === store.meId ? `${m.name} (${copy.you.toLowerCase()})` : m.name}</Text>
              <Text variant="label" color="inkMuted">{meta}</Text>
            </View>
            <View style={{ paddingHorizontal: space[3], paddingVertical: space[1], borderRadius: radius.pill, backgroundColor: m.role === 'admin' ? colors.highlight : colors.surfaceSunken }}>
              <Text variant="label" color={m.role === 'admin' ? 'onHighlight' : 'ink'}>{copy.roles[m.role]}</Text>
            </View>
          </View>
          {canManage ? (
            <IconButton
              icon="more"
              label={copy.manage(m.name)}
              variant="ghost"
              onPress={() => {
                setManaging(open ? null : m.id);
                setConfirmRemove(false);
              }}
            />
          ) : null}
        </View>

        {canManage && open ? (
          <View style={{ gap: space[3], padding: space[4], borderRadius: radius.md, backgroundColor: colors.surfaceRaised }}>
            {confirmRemove ? (
              <>
                <Text variant="bodySemibold">{copy.removeConfirm(m.name)}</Text>
                <View style={{ flexDirection: 'row', gap: space[3] }}>
                  <Button label={copy.remove} variant="danger" onPress={() => remove(m)} style={{ flex: 1 }} />
                  <Button label={copy.cancel} variant="ghost" onPress={() => setConfirmRemove(false)} style={{ flex: 1 }} />
                </View>
              </>
            ) : (
              <View style={{ flexDirection: 'row', gap: space[3] }}>
                <Button label={m.role === 'admin' ? copy.dismissAdmin : copy.makeAdmin} variant="secondary" size="sm" onPress={() => toggleAdmin(m)} style={{ flex: 1, backgroundColor: colors.surface }} />
                <Button label={copy.remove} variant="ghost" size="sm" onPress={() => setConfirmRemove(true)} style={{ flex: 1 }} />
              </View>
            )}
          </View>
        ) : null}
      </View>
    );
  };

  const current: ThemeName = isEvening ? 'evening' : 'sunlit';

  const confirmBox = (question: string, label: string, onYes: () => void) => (
    <View style={{ gap: space[3], padding: space[4], borderRadius: radius.md, borderWidth: 2, borderColor: colors.line }}>
      <Text variant="bodyStrong">{question}</Text>
      <View style={{ flexDirection: 'row', gap: space[3] }}>
        <Button label={label} variant="highlight" onPress={onYes} style={{ flex: 1 }} />
        <Button label={account.cancel} variant="ghost" onPress={() => setConfirm(null)} style={{ flex: 1 }} />
      </View>
    </View>
  );

  return (
    <Screen
      title={store.household.name}
      // Like a WhatsApp group, only admins add people.
      fab={
        store.isAdmin ? (
          <IconButton
            label={addMember.open}
            size="lg"
            variant="raised"
            onPress={() => router.push('/member/new')}
            style={{ shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}
          />
        ) : undefined
      }
    >
      <View style={{ gap: space[1] }}>
        <Text variant="caption" color="inkMuted" accessibilityRole="header" style={{ letterSpacing: 0.6 }}>{copy.members.toUpperCase()}</Text>
        {store.members.map(row)}
      </View>

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

      {confirm === 'leave' ? (
        confirmBox(account.leaveConfirm(store.household.name), account.leave, store.leaveHousehold)
      ) : confirm === 'signOut' ? (
        confirmBox(account.signOutConfirm, account.signOut, store.signOut)
      ) : (
        <View style={{ gap: space[3] }}>
          <Button label={account.leave} variant="ghost" onPress={() => setConfirm('leave')} />
          <Button label={account.signOut} variant="ghost" onPress={() => setConfirm('signOut')} />
        </View>
      )}
    </Screen>
  );
}
