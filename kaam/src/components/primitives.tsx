import { Pressable, Text as RNText, View, type PressableProps, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space, type, type ColorTokens, type TypeVariant } from '../theme/tokens';
import { iconPaths, type IconName } from './iconPaths';

// ---------- Icon ----------

export function Icon({ name, size = 24, color }: { name: IconName; size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" fill={color} aria-hidden>
      {iconPaths[name].map((d, i) => (
        <Path key={i} d={d} />
      ))}
    </Svg>
  );
}

// ---------- Text ----------

type KTextProps = TextProps & { variant?: TypeVariant; color?: keyof ColorTokens; style?: StyleProp<TextStyle> };

export function Text({ variant = 'body', color = 'ink', style, ...rest }: KTextProps) {
  const { colors } = useTheme();
  return <RNText {...rest} style={[type[variant], { color: colors[color] }, style]} />;
}

// ---------- Button ----------

type ButtonVariant = 'primary' | 'highlight' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const palette: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.accent, fg: colors.onAccent },
    highlight: { bg: colors.highlight, fg: colors.onHighlight },
    secondary: { bg: colors.surfaceRaised, fg: colors.ink },
    ghost: { bg: 'transparent', fg: colors.ink, border: colors.line },
    danger: { bg: colors.danger, fg: colors.surface },
  };
  const p = palette[variant];
  const h = size === 'md' ? 48 : 32;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      aria-disabled={disabled}
      style={({ pressed }) => [
        {
          height: h,
          paddingHorizontal: size === 'md' ? space[6] : space[4],
          borderRadius: radius.pill,
          backgroundColor: p.bg,
          borderWidth: p.border ? 1 : 0,
          borderColor: p.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space[2],
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={size === 'md' ? 20 : 16} color={p.fg} /> : null}
      <RNText style={[size === 'md' ? type.bodyStrong : type.caption, { color: p.fg }]}>{label}</RNText>
    </Pressable>
  );
}

// ---------- IconButton ----------

export function IconButton({
  icon = 'plus',
  label,
  onPress,
  variant = 'accent',
  size = 'md',
  style,
}: {
  icon?: IconName;
  label: string;
  onPress?: () => void;
  variant?: 'accent' | 'ghost' | 'highlight' | 'raised';
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const bg = { accent: colors.accent, ghost: 'transparent', highlight: colors.highlight, raised: colors.surfaceRaised }[variant];
  const fg = { accent: colors.onAccent, ghost: colors.ink, highlight: colors.onHighlight, raised: colors.ink }[variant];
  const d = size === 'lg' ? 56 : 32;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={size === 'md' ? 8 : 0}
      style={({ pressed }) => [
        { width: d, height: d, borderRadius: d / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.94 : 1 }] },
        style,
      ]}
    >
      <Icon name={icon} size={size === 'lg' ? 28 : 20} color={fg} />
    </Pressable>
  );
}

// ---------- Avatar ----------

export function Avatar({ name, color, size = 42 }: { name: string; color?: string; size?: number }) {
  const { colors } = useTheme();
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <View
      accessibilityLabel={name}
      style={{ width: size, height: size, borderRadius: radius.sm, backgroundColor: color ?? colors.highlight, alignItems: 'center', justifyContent: 'center' }}
    >
      <RNText style={{ fontFamily: type.bodyStrong.fontFamily, fontSize: Math.round(size * 0.38), color: color ? '#FFFEEA' : colors.onHighlight }}>{initials}</RNText>
    </View>
  );
}

// ---------- Pill tabs and chips ----------

export function PillTabs<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={{ flexDirection: 'row', gap: space[3], flexWrap: 'wrap' }}>
      {items.map((it) => {
        const on = it === value;
        return (
          <Pressable
            key={it}
            accessibilityRole="tab"
            aria-selected={on}
            onPress={() => onChange(it)}
            hitSlop={4}
            style={{ height: 40, minWidth: 88, paddingHorizontal: space[4], borderRadius: radius.pill, backgroundColor: on ? colors.highlight : colors.surfaceSunken, alignItems: 'center', justifyContent: 'center' }}
          >
            <RNText style={[type.bodySemibold, { fontFamily: type.bodyStrong.fontFamily, color: on ? colors.onHighlight : colors.ink }]}>{it}</RNText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      // A chip with a selected state is one choice in a group, so it is announced as a radio button.
      accessibilityRole={selected === undefined ? 'button' : 'radio'}
      aria-checked={selected}
      hitSlop={4}
      style={{
        height: 40,
        paddingHorizontal: space[4],
        borderRadius: radius.pill,
        backgroundColor: selected ? colors.highlight : colors.surfaceSunken,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[2],
      }}
    >
      {icon ? <Icon name={icon} size={14} color={selected ? colors.onHighlight : colors.ink} /> : null}
      <RNText style={[type.body, { color: selected ? colors.onHighlight : colors.ink }]}>{label}</RNText>
    </Pressable>
  );
}

/** Radio-style row used for Repeat, Remind and similar single choices. */
export function ChoiceRow<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
      {options.map((o) => (
        <Chip key={o.value} label={o.label} selected={o.value === value} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );
}

// ---------- Layout helpers ----------

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <Text variant="heading" accessibilityRole="header">{title}</Text>
      {action ? (
        <Pressable onPress={onAction} accessibilityRole="link" hitSlop={8}>
          <Text variant="bodySemibold" color="highlight">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingVertical: space[8], paddingHorizontal: space[6], borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line, alignItems: 'center' }}>
      <Text variant="bodyLarge" color="inkMuted" style={{ textAlign: 'center' }}>{message}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[{ backgroundColor: colors.surfaceRaised, borderRadius: radius.md, padding: space[4] }, style]}>{children}</View>;
}

export type { PressableProps };
