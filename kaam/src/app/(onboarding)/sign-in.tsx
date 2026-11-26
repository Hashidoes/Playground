import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Field, StepScreen } from '../../components/onboarding';
import { Button, Text } from '../../components/primitives';
import { onboarding, signIn as copy } from '../../copy/strings';
import { useStore } from '../../data/store';
import { isValidEmail } from '../../lib/email';
import { useTheme } from '../../theme/ThemeProvider';
import { space } from '../../theme/tokens';

export default function SignIn() {
  const store = useStore();
  const { colors } = useTheme();
  const [email, setEmail] = useState(store.draft.email);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    const value = email.trim();
    if (!isValidEmail(value)) return setError(copy.invalidEmail);
    setBusy(true);
    const problem = await store.sendCode(value);
    setBusy(false);
    if (problem) return setError(problem);
    router.push('/verify');
  }

  // Opens Google's own sign-in screen (simulated on sample data).
  async function google() {
    setBusy(true);
    const result = await store.signInWithGoogle();
    setBusy(false);
    if (!result.ok) return setError(result.error);
    if (result.next === 'profile') router.push('/profile');
    else if (result.next === 'household') router.push('/household');
    // 'home': the app opens by itself once the household has loaded.
  }

  return (
    <StepScreen title={copy.title} body={copy.body} onBack={() => router.back()} backLabel={onboarding.back} primary={{ label: copy.sendCode, onPress: send, busy }}>
      <Field
        label={copy.emailLabel}
        value={email}
        onChangeText={(v) => { setEmail(v); setError(null); }}
        placeholder={copy.emailPlaceholder}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
        returnKeyType="send"
        onSubmitEditing={send}
        error={error}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }} aria-hidden>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
        <Text variant="label" color="inkMuted">{copy.or}</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
      </View>

      <View style={{ gap: space[2] }}>
        <Button label={copy.google} variant="ghost" onPress={google} disabled={busy} />
        {store.isConnected ? null : <Text variant="label" color="inkMuted">{copy.sampleGoogleHint}</Text>}
      </View>
    </StepScreen>
  );
}
