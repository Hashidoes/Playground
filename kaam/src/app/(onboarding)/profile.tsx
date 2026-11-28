import { router } from 'expo-router';
import { useState } from 'react';
import { Field, StepScreen } from '../../components/onboarding';
import { onboarding, profile as copy } from '../../copy/strings';
import { useStore } from '../../data/store';

export default function Profile() {
  const store = useStore();
  const [name, setName] = useState(store.draft.name);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function next() {
    if (!name.trim()) return;
    setBusy(true);
    const problem = await store.setProfile(name.trim(), store.draft.language);
    setBusy(false);
    if (problem) return setError(problem);
    router.push('/household');
  }

  return (
    <StepScreen title={copy.title} onBack={() => router.back()} backLabel={onboarding.back} primary={{ label: copy.continue, onPress: next, busy, disabled: !name.trim() }}>
      <Field
        label={copy.nameLabel}
        value={name}
        onChangeText={(v) => { setName(v); setError(null); }}
        placeholder={copy.namePlaceholder}
        textContentType="givenName"
        autoComplete="given-name"
        autoCapitalize="words"
        autoFocus
        returnKeyType="done"
        onSubmitEditing={next}
        maxLength={30}
        error={error}
        hint={copy.emptyName}
      />
    </StepScreen>
  );
}
