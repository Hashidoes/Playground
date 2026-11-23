import { useState } from 'react';
import { router } from 'expo-router';
import { Field, StepScreen } from '../../components/onboarding';
import { onboarding, setup as copy } from '../../copy/strings';
import { useStore } from '../../data/store';

/** Turns "nai428" or "NAI 428" into "NAI-428" as people type. */
function formatCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return clean.length > 3 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean;
}

export default function Join() {
  const store = useStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  function join() {
    if (!store.joinHousehold(code)) return setError(copy.codeNotFound);
    router.push('/joined');
  }

  return (
    <StepScreen
      title={copy.joinTitleScreen}
      onBack={() => router.back()}
      backLabel={onboarding.back}
      primary={{ label: copy.joinButton, onPress: join, disabled: code.length < 7 }}
    >
      <Field
        label={copy.joinTitleScreen}
        value={code}
        onChangeText={(v) => { setCode(formatCode(v)); setError(null); }}
        placeholder={copy.joinPlaceholder}
        autoCapitalize="characters"
        autoCorrect={false}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={join}
        error={error}
        hint={copy.sampleJoinHint}
        style={{ letterSpacing: 2 }}
      />
    </StepScreen>
  );
}
