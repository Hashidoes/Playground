import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space, type } from '../theme/tokens';
import { Button, Icon, Text } from './primitives';

/**
 * One onboarding step, laid out like the Figma "Profile set up" frames:
 * a large title, the step's content, and a bottom bar with a text link
 * on the left and the main action on the right.
 */
export function StepScreen({
  title,
  body,
  children,
  onBack,
  backLabel = 'Back',
  secondary,
  primary,
}: {
  title: string;
  body?: string;
  children?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  secondary?: { label: string; onPress: () => void };
  primary?: { label: string; onPress: () => void; disabled?: boolean; busy?: boolean };
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + space[4], paddingHorizontal: space[4], paddingBottom: space[6], gap: space[6], width: '100%', maxWidth: 520, alignSelf: 'center' }}
      >
        <View style={{ height: 40, justifyContent: 'center' }}>
          {onBack ? (
            <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={backLabel} hitSlop={12} style={{ alignSelf: 'flex-start', padding: space[1], marginLeft: -space[1] }}>
              <Icon name="caretLeft" size={24} color={colors.ink} />
            </Pressable>
          ) : null}
        </View>
        <View style={{ gap: space[3], marginTop: space[6] }}>
          <Text variant="title" color="highlight" accessibilityRole="header">{title}</Text>
          {body ? <Text variant="bodyLarge" color="inkMuted">{body}</Text> : null}
        </View>
        <View style={{ gap: space[5] }}>{children}</View>
      </ScrollView>
      {primary || secondary ? (
        // One large main button across the screen; with a second choice, the two share it 50/50.
        <View
          style={{
            flexDirection: 'row',
            gap: space[3],
            paddingHorizontal: space[4],
            paddingTop: space[3],
            paddingBottom: insets.bottom + space[4],
            width: '100%',
            maxWidth: 520,
            alignSelf: 'center',
          }}
        >
          {secondary ? <Button label={secondary.label} variant="secondary" onPress={secondary.onPress} style={{ flex: 1 }} /> : null}
          {primary ? (
            <Button
              label={primary.busy ? 'One moment…' : primary.label}
              onPress={primary.onPress}
              disabled={primary.disabled || primary.busy}
              style={{ flex: 1 }}
            />
          ) : null}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

/** Labelled text field in the Figma sign-up style: pale amber, fully rounded. */
export function Field({ label, error, hint, prefix, ...input }: TextInputProps & { label: string; error?: string | null; hint?: string; prefix?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: space[2] }}>
      <Text variant="bodySemibold">{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 52,
          borderRadius: radius.pill,
          backgroundColor: colors.field,
          paddingHorizontal: space[5],
          gap: space[2],
          borderWidth: error ? 2 : 0,
          borderColor: colors.danger,
        }}
      >
        {prefix ? <Text variant="bodyLarge" color="inkMuted">{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={colors.inkMuted}
          accessibilityLabel={label}
          {...input}
          style={[type.bodyLarge, { flex: 1, color: colors.ink, height: '100%' }, input.style]}
        />
      </View>
      {error ? (
        <Text variant="label" color="danger" accessibilityLiveRegion="assertive">{error}</Text>
      ) : hint ? (
        <Text variant="label" color="inkMuted">{hint}</Text>
      ) : null}
    </View>
  );
}

/** Large tappable choice used for "Start a new household" / "Join a household". */
export function OptionCard({ title, body, icon, onPress }: { title: string; body: string; icon: 'house' | 'users'; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[4],
        padding: space[5],
        borderRadius: radius.md,
        backgroundColor: colors.surfaceRaised,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={24} color={colors.onAccent} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="body" color="inkMuted">{body}</Text>
      </View>
      <Icon name="caretRight" size={20} color={colors.inkMuted} />
    </Pressable>
  );
}
