import { useRef } from 'react';
import { Pressable, ScrollView, View, type ScrollViewInstance } from 'react-native';
import type { ISODate } from '../data/types';
import { dayOfMonth, formatLongDate, fromISODate, monthShort } from '../lib/dates';
import { useTheme } from '../theme/ThemeProvider';
import { space } from '../theme/tokens';
import { Text } from './primitives';

const CARD_W = 64;
const GAP = space[2];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * A row of day cards to scroll through: weekday on top, date below.
 * The chosen day is filled; the first card reads "Today".
 */
export function DayStrip({
  days,
  value,
  onChange,
  label,
  todayLabel,
}: {
  days: ISODate[];
  value: ISODate;
  onChange: (d: ISODate) => void;
  label: string;
  todayLabel: string;
}) {
  const { colors } = useTheme();
  const scroller = useRef<ScrollViewInstance>(null);
  const index = Math.max(0, days.indexOf(value));

  // Start with the chosen day in view (it can be weeks ahead when editing).
  const onLayout = () => {
    if (index > 2) scroller.current?.scrollTo({ x: (index - 1) * (CARD_W + GAP), animated: false });
  };

  return (
    <ScrollView
      ref={scroller}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={onLayout}
      // Bleed to the screen edges so cards scroll out of view rather than being clipped by the margin.
      style={{ marginHorizontal: -space[4] }}
      contentContainerStyle={{ gap: GAP, paddingHorizontal: space[4] }}
    >
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', gap: GAP }}>
        {days.map((d, i) => {
          const selected = d === value;
          const date = fromISODate(d);
          const firstOfMonth = date.getDate() === 1;
          return (
            <Pressable
              key={d}
              onPress={() => onChange(d)}
              accessibilityRole="radio"
              aria-checked={selected}
              accessibilityLabel={i === 0 ? `${todayLabel}, ${formatLongDate(d)}` : formatLongDate(d)}
              style={({ pressed }) => ({
                width: CARD_W,
                height: 76,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                gap: space[1],
                backgroundColor: selected ? colors.highlight : colors.surface,
                borderWidth: 1.5,
                borderColor: selected ? colors.highlight : colors.line,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <Text variant="label" color={selected ? 'onHighlight' : 'inkMuted'}>
                {i === 0 ? todayLabel : firstOfMonth ? monthShort(d) : WEEKDAYS[date.getDay()]}
              </Text>
              <Text variant="heading" color={selected ? 'onHighlight' : 'ink'} style={{ fontVariant: ['tabular-nums'] }}>{dayOfMonth(d)}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
