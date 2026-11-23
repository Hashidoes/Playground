import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InviteCode } from '../../components/InviteCode';
import { Field } from '../../components/onboarding';
import { Button, ChoiceRow, IconButton, Text } from '../../components/primitives';
import { useToast } from '../../components/Toast';
import { addMember as copy, household } from '../../copy/strings';
import { useStore } from '../../data/store';
import type { Role } from '../../data/types';
import { useTheme } from '../../theme/ThemeProvider';
import { space } from '../../theme/tokens';

/** Add someone to the household: invite them with a code, or add them without the app. */
export default function AddMember() {
  const store = useStore();
  const toast = useToast();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [role, setRole] = useState<Exclude<Role, 'admin'>>('helper');
  const [error, setError] = useState<string | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/household'));

  function addOffline() {
    const n = name.trim();
    if (!n) return setError(copy.emptyName);
    store.addMember(n, role);
    toast({ message: copy.added(n) });
    close();
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[4], paddingTop: Platform.OS === 'ios' ? space[5] : insets.top + space[4], paddingBottom: space[3] }}>
        <Text variant="heading" accessibilityRole="header">{copy.title}</Text>
        <IconButton icon="x" label={copy.close} variant="raised" onPress={close} />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: space[4], paddingBottom: insets.bottom + space[10], gap: space[6], width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        <View style={{ gap: space[2] }}>
          <Text variant="bodyStrong" accessibilityRole="header">{copy.inviteHeading}</Text>
          <Text variant="body" color="inkMuted">{copy.inviteBody}</Text>
        </View>
        <InviteCode />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }} aria-hidden>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
          <Text variant="label" color="inkMuted">{copy.or}</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
        </View>

        <View style={{ gap: space[4] }}>
          <View style={{ gap: space[2] }}>
            <Text variant="bodyStrong" accessibilityRole="header">{copy.offlineHeading}</Text>
            <Text variant="body" color="inkMuted">{copy.offlineBody}</Text>
          </View>
          <Field
            label={copy.nameLabel}
            value={name}
            onChangeText={(v) => { setName(v); setError(null); }}
            placeholder={copy.namePlaceholder}
            autoCapitalize="words"
            maxLength={30}
            returnKeyType="done"
            onSubmitEditing={addOffline}
            error={error}
          />
          <View style={{ gap: space[2] }}>
            <Text variant="bodySemibold">{copy.roleLabel}</Text>
            <ChoiceRow
              label={copy.roleLabel}
              value={role}
              onChange={setRole}
              options={[
                { value: 'helper', label: household.roles.helper },
                { value: 'member', label: household.roles.member },
              ]}
            />
          </View>
          <Button label={copy.add(name.trim())} variant="secondary" icon="plus" onPress={addOffline} />
        </View>
      </ScrollView>
    </View>
  );
}
