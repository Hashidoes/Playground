import * as Clipboard from 'expo-clipboard';
import { Share, View } from 'react-native';
import { setup as copy } from '../copy/strings';
import { useStore } from '../data/store';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space } from '../theme/tokens';
import { Button, Text } from './primitives';
import { useToast } from './Toast';

/** The household's invite code, with Share and Copy. Everyone who joins is a member. */
export function InviteCode() {
  const store = useStore();
  const toast = useToast();
  const { colors } = useTheme();
  const code = store.household.inviteCode;

  async function copyCode() {
    try {
      await Clipboard.setStringAsync(code);
      toast({ message: copy.copied });
    } catch {
      // Nothing to do: the code is on screen and selectable.
    }
  }

  async function share() {
    try {
      await Share.share({ message: copy.shareMessage(store.household.name, code) });
    } catch {
      // Sharing isn't available everywhere (some browsers); copying still works.
      await copyCode();
    }
  }

  return (
    <View style={{ alignItems: 'center', gap: space[4], padding: space[6], borderRadius: radius.md, backgroundColor: colors.callout }}>
      <Text
        selectable
        style={{ fontFamily: 'Inter_700Bold', fontSize: 40, lineHeight: 48, letterSpacing: 4, color: colors.calloutLabel }}
        accessibilityLabel={`Invite code ${code.split('').join(' ')}`}
      >
        {code}
      </Text>
      <View style={{ gap: space[3], alignSelf: 'stretch' }}>
        <Button label={copy.share} onPress={share} />
        <Button label={copy.copy} icon="copy" variant="secondary" onPress={copyCode} />
      </View>
    </View>
  );
}
