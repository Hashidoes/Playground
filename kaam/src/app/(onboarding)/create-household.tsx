import { router } from 'expo-router';
import { useState } from 'react';
import { Field, StepScreen } from '../../components/onboarding';
import { onboarding, setup as copy } from '../../copy/strings';
import { useStore } from '../../data/store';

export default function CreateHousehold() {
  const store = useStore();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name.trim() || busy) return setError(name.trim() ? null : copy.emptyName);
    setBusy(true);
    const problem = await store.createHousehold(name.trim());
    setBusy(false);
    if (problem) return setError(problem);
    router.push('/invite');
  }

  return (
    <StepScreen title={copy.nameTitle} onBack={() => router.back()} backLabel={onboarding.back} primary={{ label: copy.create, onPress: create, busy }}>
      <Field
        label={copy.nameLabel}
        value={name}
        onChangeText={(v) => { setName(v); setError(null); }}
        placeholder={copy.namePlaceholder}
        autoCapitalize="words"
        autoFocus
        maxLength={40}
        returnKeyType="done"
        onSubmitEditing={create}
        error={error}
      />
    </StepScreen>
  );
}
