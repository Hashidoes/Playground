import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Field, StepScreen } from '../../components/onboarding';
import { ChoiceRow, Text } from '../../components/primitives';
import { onboarding, setup as copy } from '../../copy/strings';
import { useStore } from '../../data/store';
import type { HouseholdKind } from '../../data/types';
import { space } from '../../theme/tokens';

export default function CreateHousehold() {
  const store = useStore();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<HouseholdKind>('family');
  const [error, setError] = useState<string | null>(null);

  function create() {
    if (!name.trim()) return setError(copy.emptyName);
    store.createHousehold(name.trim(), kind);
    router.push('/invite');
  }

  return (
    <StepScreen title={copy.nameTitle} onBack={() => router.back()} backLabel={onboarding.back} primary={{ label: copy.create, onPress: create }}>
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
      <View style={{ gap: space[2] }}>
        <Text variant="bodySemibold">{copy.kindLabel}</Text>
        <ChoiceRow
          label={copy.kindLabel}
          value={kind}
          onChange={setKind}
          options={[
            { value: 'family', label: copy.kinds.family },
            { value: 'roommates', label: copy.kinds.roommates },
          ]}
        />
      </View>
    </StepScreen>
  );
}
