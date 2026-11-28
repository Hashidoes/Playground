import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KaamMark } from '../../components/KaamMark';
import { WELCOME_ART_RATIO, WelcomeAnimation } from '../../components/WelcomeAnimation';
import { Button, Text } from '../../components/primitives';
import { onboarding as copy } from '../../copy/strings';
import { useStore } from '../../data/store';
import { ThemeProvider, useTheme } from '../../theme/ThemeProvider';
import { space } from '../../theme/tokens';

// The stamp sits inset from the text, so it reads as a picture rather than a banner.
const ART_SHARE = 0.8; // of the content width
const ART_MAX_WIDTH = 320;

function Welcome() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const store = useStore();
  const [artWidth, setArtWidth] = useState(0);

  // The illustration takes whatever room is left, without stretching.
  const onArtLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArtWidth(Math.min(width * ART_SHARE, height * WELCOME_ART_RATIO, ART_MAX_WIDTH));
  };

  // Someone already signed in (but not in a household yet) skips sign-in.
  const start = () => router.push(store.userId ? (store.draft.name ? '/household' : '/profile') : '/sign-in');

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + space[4], paddingBottom: insets.bottom + space[4] }}>
      <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', flex: 1, paddingHorizontal: space[6], gap: space[5] }}>
        <KaamMark width={44} />
        <View onLayout={onArtLayout} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {artWidth > 0 ? (
            <View style={{ width: artWidth }}>
              <WelcomeAnimation accessibilityLabel={copy.artLabel} />
            </View>
          ) : null}
        </View>
        <View style={{ gap: space[2] }}>
          <Text variant="title" color="highlight" accessibilityRole="header">{copy.title}</Text>
          <Text variant="bodyLarge">{copy.body}</Text>
        </View>
        <Button label={copy.letsGo} onPress={start} />
      </View>
    </View>
  );
}

export default function WelcomeScreen() {
  return (
    <ThemeProvider force="sunlit">
      <StatusBar style="dark" />
      <Welcome />
    </ThemeProvider>
  );
}
