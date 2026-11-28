import { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import type { Time } from '../data/types';
import { useTheme } from '../theme/ThemeProvider';
import { font, radius, space } from '../theme/tokens';
import { Text } from './primitives';

const ROW = 40; // height of one row
const SHOWN = 5; // rows visible: the chosen one, two above, two below
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1)); // 1 … 12
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')); // 00, 05 … 55
const HALVES = ['AM', 'PM'];

/** 'HH:mm' (24-hour) to the three wheels. Minutes round down to the nearest 5. */
function split(t: Time) {
  const [h, m] = t.split(':').map(Number);
  return { hour: (h % 12 || 12) - 1, minute: Math.floor(m / 5), half: h < 12 ? 0 : 1 };
}
function join(hour: number, minute: number, half: number): Time {
  const h = ((hour + 1) % 12) + half * 12;
  return `${String(h).padStart(2, '0')}:${MINUTES[minute]}`;
}

/** One scrolling column. Settles on a row when you let go; tap a row to jump to it. */
function Wheel({ items, index, onChange, label, width }: { items: string[]; index: number; onChange: (i: number) => void; label: string; width: number }) {
  const scroller = useRef<ScrollViewInstance>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [offset, setOffset] = useState(index * ROW);

  const goTo = (i: number, animated = true) => {
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    scroller.current?.scrollTo({ y: clamped * ROW, animated });
    if (clamped !== index) onChange(clamped);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    setOffset(y);
    // When scrolling stops, snap to the nearest row and choose it.
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => goTo(Math.round(y / ROW)), 120);
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: items[index] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => goTo(index + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}
      style={{ width, height: ROW * SHOWN }}
    >
      <ScrollView
        ref={scroller}
        onLayout={() => scroller.current?.scrollTo({ y: index * ROW, animated: false })}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={Platform.OS === 'web' ? undefined : ROW}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: ROW * Math.floor(SHOWN / 2) }}
      >
        {items.map((item, i) => {
          // Rows shrink and fade the further they are from the middle, like a drum.
          const distance = Math.min(Math.abs(i * ROW - offset) / ROW, 2.5);
          return (
            <Pressable key={item} onPress={() => goTo(i)} aria-hidden style={{ height: ROW, alignItems: 'center', justifyContent: 'center' }}>
              <Text
                variant="heading"
                style={{
                  fontFamily: distance < 0.5 ? font.semibold : font.regular,
                  fontSize: 26 - distance * 4,
                  lineHeight: ROW,
                  opacity: 1 - distance * 0.3,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Hour, minute and AM/PM wheels, with a highlight band across the chosen time. */
export function TimeWheel({ value, onChange, labels }: { value: Time; onChange: (t: Time) => void; labels: { hour: string; minute: string; half: string } }) {
  const { colors } = useTheme();
  const { hour, minute, half } = split(value);
  return (
    <View style={{ height: ROW * SHOWN, justifyContent: 'center', alignItems: 'center' }}>
      {/* The band sits behind the middle row. */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: ROW * Math.floor(SHOWN / 2), height: ROW, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
        <Wheel items={HOURS} index={hour} onChange={(i) => onChange(join(i, minute, half))} label={labels.hour} width={56} />
        <Text variant="heading" aria-hidden style={{ marginTop: -2 }}>:</Text>
        <Wheel items={MINUTES} index={minute} onChange={(i) => onChange(join(hour, i, half))} label={labels.minute} width={56} />
        <Wheel items={HALVES} index={half} onChange={(i) => onChange(join(hour, minute, i))} label={labels.half} width={64} />
      </View>
    </View>
  );
}
