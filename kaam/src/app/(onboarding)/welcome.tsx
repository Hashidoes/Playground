import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View, type LayoutChangeEvent, type ScrollViewInstance, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KaamMark } from '../../components/KaamMark';
import { Button, Text } from '../../components/primitives';
import { onboarding as copy } from '../../copy/strings';
import { ThemeProvider, useTheme } from '../../theme/ThemeProvider';
import { radius, space } from '../../theme/tokens';

// One wide illustration from the Figma onboarding frames; each slide shows a third of it.
const PANORAMA = require('../../../assets/onboarding/panorama.png');
const PANORAMA_RATIO = 844 / 390; // height of one slide's third, relative to its width

function Slides() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scroller = useRef<ScrollViewInstance>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const count = copy.slides.length;
  const last = index === count - 1;

  // Measure the screen ourselves: on web the window can be wider than the app.
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(Math.max(0, Math.min(count - 1, i)));
  };
  const goTo = (i: number) => {
    scroller.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };
  const start = () => router.push('/sign-in');

  return (
    <View onLayout={onLayout} style={{ flex: 1, backgroundColor: colors.surface }}>
      {width > 0 ? (
        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          <View style={{ width: width * count, flex: 1 }}>
            <Image
              source={PANORAMA}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
              style={{ position: 'absolute', top: insets.top, left: 0, width: width * count, height: width * PANORAMA_RATIO }}
            />
            <View style={{ flexDirection: 'row', flex: 1 }}>
              {copy.slides.map((s, i) => (
                <View key={s.title} style={{ width, justifyContent: 'flex-end', paddingHorizontal: space[4], paddingBottom: space[4] }} accessibilityLabel={copy.slideLabel(i + 1, count)}>
                  <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: space[4], paddingHorizontal: space[4], gap: space[2], opacity: 0.96 }}>
                    <Text variant="title" color="highlight" style={{ textAlign: 'center' }} accessibilityRole="header">{s.title}</Text>
                    <Text variant="bodyLarge" style={{ textAlign: 'center' }}>{s.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + space[4], left: space[4], flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
        <KaamMark width={44} />
        <Text variant="bodySemibold" color="inkMuted">{copy.tagline}</Text>
      </View>

      <View style={{ paddingHorizontal: space[4], paddingTop: space[2], paddingBottom: insets.bottom + space[4], gap: space[4] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space[2] }} aria-hidden>
          {copy.slides.map((s, i) => (
            <View key={s.title} style={{ width: i === index ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === index ? colors.highlight : colors.track }} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 }}>
          {last ? <View /> : (
            <Pressable onPress={start} accessibilityRole="button" hitSlop={12} style={{ paddingVertical: space[3] }}>
              <Text variant="bodySemibold" color="inkMuted">{copy.skip}</Text>
            </Pressable>
          )}
          <Button
            label={last ? copy.getStarted : copy.next}
            onPress={last ? start : () => goTo(index + 1)}
            style={last ? { flex: 1 } : { minWidth: 120 }}
          />
        </View>
      </View>
    </View>
  );
}

export default function Welcome() {
  return (
    <ThemeProvider force="sunlit">
      <StatusBar style="dark" />
      <Slides />
    </ThemeProvider>
  );
}
