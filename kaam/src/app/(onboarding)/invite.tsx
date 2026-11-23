import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Share, View } from 'react-native';
import { StepScreen } from '../../components/onboarding';
import { Button, ChoiceRow, Text } from '../../components/primitives';
import { useToast } from '../../components/Toast';
import { household, setup as copy } from '../../copy/strings';
import { useStore } from '../../data/store';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, space } from '../../theme/tokens';

type InviteRole = 'member' | 'helper';

export default function Invite() {
  const store = useStore();
  const toast = useToast();
  const { colors } = useTheme();
  const [role, setRole] = useState<InviteRole>('member');
  const code = store.household.inviteCode;

  async function share() {
    try {
      await Share.share({ message: copy.shareMessage(store.household.name, code) });
    } catch {
      // Sharing isn't available everywhere (some browsers); copying still works.
      await copyCode();
    }
  }

  async function copyCode() {
    try {
      await Clipboard.setStringAsync(code);
      toast({ message: copy.copied });
    } catch {
      // Nothing to do: the code is on screen and selectable.
    }
  }

  // Leaving this screen finishes onboarding; the app then opens on Home.
  const finish = () => store.finishOnboarding();

  return (
    <StepScreen title={copy.inviteTitle} body={copy.inviteBody} secondary={{ label: copy.later, onPress: finish }} primary={{ label: copy.done, onPress: finish }}>
      <View style={{ gap: space[2] }}>
        <Text variant="bodySemibold">{copy.inviteAs}</Text>
        <ChoiceRow
          label={copy.inviteAs}
          value={role}
          onChange={setRole}
          options={[
            { value: 'member', label: household.roles.member },
            { value: 'helper', label: household.roles.helper },
          ]}
        />
        <Text variant="body" color="inkMuted">{role === 'member' ? copy.memberRole : copy.helperRole}</Text>
      </View>

      <View style={{ alignItems: 'center', gap: space[4], padding: space[6], borderRadius: radius.md, backgroundColor: colors.notice }}>
        <Text
          selectable
          style={{ fontFamily: 'Inter_700Bold', fontSize: 40, lineHeight: 48, letterSpacing: 4, color: colors.noticeLabel }}
          accessibilityLabel={`Invite code ${code.split('').join(' ')}`}
        >
          {code}
        </Text>
        <View style={{ gap: space[3], alignSelf: 'stretch' }}>
          <Button label={copy.share} onPress={share} />
          <Button label={copy.copy} icon="copy" variant="secondary" onPress={copyCode} />
        </View>
      </View>
    </StepScreen>
  );
}
