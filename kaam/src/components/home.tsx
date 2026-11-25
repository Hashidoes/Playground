import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { gaugeZero, home as copy } from '../copy/strings';
import type { Language, Member } from '../data/types';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space } from '../theme/tokens';
import { Avatar, Icon, Text } from './primitives';

// ---------- GreetingHeader ----------

export function GreetingHeader({
  me,
  greeting,
  english,
  language,
}: {
  me: Member;
  greeting: string;
  english: string;
  language: Language;
}) {
  const lines = greeting.split('\n');
  return (
    <View style={{ gap: space[5] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
        <Avatar name={me.name} color={me.color} />
        <Text variant="bodyStrong" style={{ flex: 1 }}>{copy.hi(me.name)}</Text>
      </View>
      <View accessibilityRole="header" accessibilityLanguage={language} accessibilityLabel={language === 'en' ? greeting : `${greeting.replace('\n', ' ')}. ${english}`}>
        {lines.map((l, i) => (
          <Text
            key={i}
            variant={lines.length > 1 && i === 0 ? 'greetingLight' : 'greeting'}
            color="highlight"
            // Malayalam and Devanagari glyphs sit taller than Latin, so give them more leading.
            style={language === 'en' ? undefined : { lineHeight: 54 }}
          >
            {l}
          </Text>
        ))}
        {language !== 'en' ? (
          <Text variant="caption" color="inkMuted" style={{ marginTop: space[2] }}>{english}</Text>
        ) : null}
      </View>
    </View>
  );
}

// ---------- ProgressGauge ----------

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const pt = (a: number) => {
    const t = ((a - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  };
  const [sx, sy] = pt(a0);
  const [ex, ey] = pt(a1);
  return `M${sx.toFixed(2)} ${sy.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

export function ProgressGauge({
  percent,
  hasTasks,
  message,
  day,
  weekday,
  dateLabel,
}: {
  percent: number;
  hasTasks: boolean;
  message: string;
  day: string;
  weekday: string;
  /** Spoken date, e.g. "Monday, 23 November". */
  dateLabel: string;
}) {
  const { colors } = useTheme();
  const v = Math.max(0, Math.min(100, percent));
  const start = -120;
  const sweep = 240;
  return (
    <View style={{ backgroundColor: colors.surfaceRaised, borderRadius: radius.xl, paddingTop: space[5], paddingHorizontal: space[6], paddingBottom: space[4] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space[4] }}>
        {hasTasks ? (
          <Text variant="caption" style={{ flex: 1, maxWidth: 170 }} accessibilityLiveRegion="polite">{message}</Text>
        ) : (
          // Zero state: the headline sits top left, with the empty dial below.
          <View style={{ flex: 1, gap: space[1] }}>
            <Text variant="bodyStrong" accessibilityRole="header">{gaugeZero.title}</Text>
            <Text variant="label" color="inkMuted">{gaugeZero.body}</Text>
          </View>
        )}
        <DateBadge day={day} weekday={weekday} label={dateLabel} />
      </View>
      <View
        accessible={hasTasks}
        accessibilityRole={hasTasks ? 'progressbar' : undefined}
        accessibilityLabel={hasTasks ? copy.gaugeLabel(v) : undefined}
        aria-valuemin={hasTasks ? 0 : undefined}
        aria-valuemax={hasTasks ? 100 : undefined}
        aria-valuenow={hasTasks ? v : undefined}
        style={{ alignSelf: 'center', width: '100%', maxWidth: 260, aspectRatio: 240 / 200, marginTop: hasTasks ? space[2] : space[8] }}
      >
        <Svg width="100%" height="100%" viewBox="0 0 240 200">
          <Path
            d={arc(120, 120, 96, start, start + sweep)}
            stroke={colors.track}
            strokeWidth={hasTasks ? 20 : 10}
            strokeLinecap="round"
            // Zero state: a dotted outline of the dial, so it reads as "nothing yet", not "0% done".
            strokeDasharray={hasTasks ? undefined : '0.1 18'}
            fill="none"
          />
          {hasTasks && v > 0 ? (
            <Path d={arc(120, 120, 96, start, start + (sweep * Math.min(v, 99.9)) / 100)} stroke={colors.accent} strokeWidth={20} strokeLinecap="round" fill="none" />
          ) : null}
        </Svg>
        {hasTasks ? (
          <View style={{ position: 'absolute', left: 0, right: 0, top: '38%', alignItems: 'center' }}>
            <Text variant="stat" style={{ fontVariant: ['tabular-nums'] }}>{`${v}%`}</Text>
            <Text variant="label" color="inkMuted">{copy.gaugeCaption}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ---------- DateBadge ----------

/** Today's date as a small badge. Display only. */
export function DateBadge({ day, weekday, label }: { day: string; weekday: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{ width: 54, height: 54, borderRadius: radius.md, backgroundColor: colors.highlight, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text variant="bodyStrong" color="onHighlight" style={{ lineHeight: 20 }}>{day}</Text>
      <Text variant="label" color="onHighlight">{weekday}</Text>
    </View>
  );
}


// ---------- BottomNav ----------

export type NavItem = { key: string; label: string; icon: 'house' | 'tasks' | 'calendar' | 'trophy' | 'users' };

export function BottomNav({ items, activeKey, onSelect, bottomInset }: { items: NavItem[]; activeKey: string; onSelect: (key: string) => void; bottomInset: number }) {
  const { colors } = useTheme();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space[4], paddingBottom: Math.max(bottomInset, space[3]) + space[3] }}>
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
          paddingHorizontal: space[4],
          borderRadius: radius.lg,
          backgroundColor: colors.accent,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        {items.map((it) => {
          const on = it.key === activeKey;
          return (
            <Pressable
              key={it.key}
              onPress={() => onSelect(it.key)}
              accessibilityRole="tab"
              aria-selected={on}
              accessibilityLabel={it.label}
              hitSlop={{ top: 12, bottom: 12 }}
              style={{
                flexDirection: 'row',
                gap: space[2],
                minWidth: 44,
                height: 36,
                paddingHorizontal: on ? space[3] : 0,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? colors.accentStrong : 'transparent',
              }}
            >
              <Icon name={it.icon} size={22} color={on ? colors.onAccentStrong : colors.onAccent} />
              {/* The active tab names itself, so the icons are easy to learn. */}
              {on ? <Text variant="caption" color="onAccentStrong">{it.label}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

