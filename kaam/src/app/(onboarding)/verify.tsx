import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View, type TextInputInstance } from 'react-native';
import { StepScreen } from '../../components/onboarding';
import { Text } from '../../components/primitives';
import { useToast } from '../../components/Toast';
import { onboarding, signIn as copy } from '../../copy/strings';
import { useStore } from '../../data/store';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, space, type } from '../../theme/tokens';

const LENGTH = 6;
const RESEND_SECONDS = 30;

export default function Verify() {
  const store = useStore();
  const toast = useToast();
  const { colors } = useTheme();
  const input = useRef<TextInputInstance>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  function check(value: string) {
    if (value.length < LENGTH) return;
    // Sample mode: until Supabase sends real texts, any code but 000000 is accepted.
    if (value === '000000') {
      setError(copy.wrongCode);
      return;
    }
    router.push('/profile');
  }

  function onChange(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, LENGTH);
    setCode(digits);
    setError(null);
    if (digits.length === LENGTH) check(digits);
  }

  return (
    <StepScreen
      title={copy.codeTitle}
      body={copy.codeBody(store.draft.email)}
      onBack={() => router.back()}
      backLabel={onboarding.back}
      secondary={{ label: copy.changeEmail, onPress: () => router.back() }}
      primary={{ label: copy.verify, onPress: () => check(code), disabled: code.length < LENGTH }}
    >
      <Pressable onPress={() => input.current?.focus()} accessible={false}>
        <View style={{ flexDirection: 'row', gap: space[2] }}>
          {Array.from({ length: LENGTH }, (_, i) => {
            const active = i === Math.min(code.length, LENGTH - 1);
            return (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 60,
                  maxWidth: 56,
                  borderRadius: radius.md,
                  backgroundColor: colors.field,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: error ? colors.danger : active ? colors.highlight : 'transparent',
                }}
              >
                <Text variant="heading">{code[i] ?? ''}</Text>
              </View>
            );
          })}
        </View>
        {/* One real input sits over the boxes, so paste and SMS autofill work. */}
        <TextInput
          ref={input}
          value={code}
          onChangeText={onChange}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          autoFocus
          maxLength={LENGTH}
          accessibilityLabel={copy.codeLabel}
          caretHidden
          style={[type.heading, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.011, color: 'transparent' }]}
        />
      </Pressable>

      {error ? <Text variant="label" color="danger" accessibilityLiveRegion="assertive">{error}</Text> : null}

      {wait > 0 ? (
        <Text variant="body" color="inkMuted">{copy.resendIn(wait)}</Text>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => { setWait(RESEND_SECONDS); toast({ message: copy.resent }); }}
          hitSlop={8}
          style={{ alignSelf: 'flex-start' }}
        >
          <Text variant="bodySemibold" color="highlight">{copy.resend}</Text>
        </Pressable>
      )}

      <Text variant="label" color="inkMuted">{copy.sampleHint}</Text>
    </StepScreen>
  );
}
