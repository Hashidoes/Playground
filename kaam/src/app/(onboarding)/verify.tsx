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
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function check(value: string) {
    if (value.length < LENGTH || busy) return;
    setBusy(true);
    const result = await store.verifyCode(value);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.next === 'profile') router.push('/profile');
    else if (result.next === 'household') router.push('/household');
    // 'home': a returning member; the app opens by itself.
  }

  async function resend() {
    setWait(RESEND_SECONDS);
    const problem = await store.sendCode(store.draft.email);
    toast({ message: problem ?? copy.resent });
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
      primary={{ label: copy.verify, onPress: () => check(code), disabled: code.length < LENGTH, busy }}
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
          onPress={resend}
          hitSlop={8}
          style={{ alignSelf: 'flex-start' }}
        >
          <Text variant="bodySemibold" color="highlight">{copy.resend}</Text>
        </Pressable>
      )}

      {store.isConnected ? null : <Text variant="label" color="inkMuted">{copy.sampleHint}</Text>}
    </StepScreen>
  );
}
