import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { home as copy } from '../copy/strings';
import type { Language, Member } from '../data/types';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space } from '../theme/tokens';
import { Avatar, Icon, IconButton, Text } from './primitives';

// ---------- GreetingHeader ----------

export function GreetingHeader({
  me,
  greeting,
  english,
  language,
  onMenu,
}: {
  me: Member;
  greeting: string;
  english: string;
  language: Language;
  onMenu?: () => void;
}) {
  const lines = greeting.split('\n');
  return (
    <View style={{ gap: space[5] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
        <Avatar name={me.name} color={me.color} />
        <Text variant="bodyStrong" style={{ flex: 1 }}>{copy.hi(me.name)}</Text>
        <IconButton icon="menu" label={copy.openMenu} variant="ghost" onPress={onMenu} />
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
  onViewDay,
}: {
  percent: number;
  hasTasks: boolean;
  message: string;
  day: string;
  weekday: string;
  onViewDay?: () => void;
}) {
  const { colors } = useTheme();
  const v = Math.max(0, Math.min(100, percent));
  const start = -120;
  const sweep = 240;
  return (
    <View style={{ backgroundColor: colors.surfaceRaised, borderRadius: radius.xl, paddingTop: space[5], paddingHorizontal: space[6], paddingBottom: space[4] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space[4] }}>
        <Text variant="caption" style={{ flex: 1, maxWidth: 170 }} accessibilityLiveRegion="polite">{message}</Text>
        <DateBadge day={day} weekday={weekday} onPress={onViewDay} />
      </View>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={copy.gaugeLabel(v)}
        accessibilityValue={{ min: 0, max: 100, now: v }}
        style={{ alignSelf: 'center', width: '100%', maxWidth: 260, aspectRatio: 240 / 200, marginTop: space[2] }}
      >
        <Svg width="100%" height="100%" viewBox="0 0 240 200">
          <Path d={arc(120, 120, 96, start, start + sweep)} stroke={colors.track} strokeWidth={20} strokeLinecap="round" fill="none" />
          {hasTasks && v > 0 ? (
            <Path d={arc(120, 120, 96, start, start + (sweep * Math.min(v, 99.9)) / 100)} stroke={colors.accent} strokeWidth={20} strokeLinecap="round" fill="none" />
          ) : null}
        </Svg>
        <View style={{ position: 'absolute', left: 0, right: 0, top: '38%', alignItems: 'center' }}>
          {hasTasks ? (
            <>
              <Text variant="stat" style={{ fontVariant: ['tabular-nums'] }}>{`${v}%`}</Text>
              <Text variant="label" color="inkMuted">{copy.gaugeCaption}</Text>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

// ---------- DateBadge ----------

export function DateBadge({ day, weekday, onPress }: { day: string; weekday: string; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${copy.viewDay}, ${weekday} ${day}`}
      style={{ flexDirection: 'row', height: 54, borderRadius: radius.md, overflow: 'hidden' }}
    >
      <View style={{ width: 54, backgroundColor: colors.highlight, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="label" color="onHighlight">{day}</Text>
        <Text variant="label" color="onHighlight">{weekday}</Text>
      </View>
      <View style={{ width: 78, paddingHorizontal: space[4], backgroundColor: colors.surface, justifyContent: 'center' }}>
        <Text variant="label">{copy.viewDay.replace(' ', '\n')}</Text>
      </View>
    </Pressable>
  );
}

// ---------- NoticeBoard ----------

export function NoticeBoard({ message, meta, onAdd }: { message?: string; meta?: string; onAdd?: () => void }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityLabel={copy.noticeLabel}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space[4], minHeight: 102, padding: space[4], borderRadius: radius.md, backgroundColor: colors.notice }}
    >
      <View style={{ flex: 1, gap: space[3] }}>
        <View style={{ paddingBottom: space[1], borderBottomWidth: 1, borderBottomColor: colors.line }}>
          <Text variant="eyebrow" color="noticeLabel">{copy.noticeLabel}</Text>
        </View>
        {message ? (
          <View style={{ gap: 2 }}>
            <Text variant="bodySemibold" color="onNotice">{message}</Text>
            {meta ? <Text variant="label" color="onNotice" style={{ opacity: 0.85 }}>{meta}</Text> : null}
          </View>
        ) : (
          <Text variant="body" color="onNotice">{copy.noticeEmpty}</Text>
        )}
      </View>
      <IconButton label={copy.addNotice} onPress={onAdd} />
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
              accessibilityState={{ selected: on }}
              accessibilityLabel={it.label}
              style={{ width: on ? 58 : 44, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.accentStrong : 'transparent' }}
            >
              <Icon name={it.icon} size={24} color={on ? colors.onAccentStrong : colors.onAccent} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

