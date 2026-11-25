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

  function send() {
    const value = email.trim();
    if (!isValidEmail(value)) return setError(copy.invalidEmail);
    store.setEmail(value);
    router.push('/verify');
  }

  // Sample mode: Google sign-in is simulated. With Supabase it opens Google's own sign-in screen.
  const google = () => router.push('/profile');

  return (
    <StepScreen title={copy.title} body={copy.body} onBack={() => router.back()} backLabel={onboarding.back} primary={{ label: copy.sendCode, onPress: send }}>
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
        <Button label={copy.google} variant="ghost" onPress={google} />
        <Text variant="label" color="inkMuted">{copy.sampleGoogleHint}</Text>
      </View>
    </StepScreen>
  );
}
