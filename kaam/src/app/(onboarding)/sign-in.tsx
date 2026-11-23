import { router } from 'expo-router';
import { useState } from 'react';
import { Field, StepScreen } from '../../components/onboarding';
import { onboarding, signIn as copy } from '../../copy/strings';
import { useStore } from '../../data/store';
import { isValidMobile } from '../../lib/phone';

export default function SignIn() {
  const store = useStore();
  const [digits, setDigits] = useState(store.draft.phone);
  const [error, setError] = useState<string | null>(null);

  function send() {
    if (!isValidMobile(digits)) return setError(copy.invalidNumber);
    store.setPhone(digits);
    router.push('/verify');
  }

  return (
    <StepScreen
      title={copy.title}
      body={copy.body}
      onBack={() => router.back()}
      backLabel={onboarding.back}
      primary={{ label: copy.sendCode, onPress: send }}
    >
      <Field
        label={copy.phoneLabel}
        prefix={copy.countryCode}
        value={digits}
        onChangeText={(v) => { setDigits(v.replace(/\D/g, '').slice(0, 10)); setError(null); }}
        keyboardType="number-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        placeholder="98765 43210"
        autoFocus
        returnKeyType="done"
        onSubmitEditing={send}
        error={error}
      />
    </StepScreen>
  );
}
