import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Field, StepScreen } from '../../components/onboarding';
import { ChoiceRow, Text } from '../../components/primitives';
import { greetings, languageNames, onboarding, profile as copy } from '../../copy/strings';
import { useStore } from '../../data/store';
import type { Language } from '../../data/types';
import { dayPart } from '../../lib/dates';
import { space } from '../../theme/tokens';

const LANGUAGES: Language[] = ['en', 'ml', 'hi'];

export default function Profile() {
  const store = useStore();
  const [name, setName] = useState(store.draft.name);
  const [language, setLanguage] = useState<Language>(store.draft.language);
  const [error, setError] = useState<string | null>(null);

  function next() {
    if (!name.trim()) return setError(copy.emptyName);
    store.setProfile(name.trim(), language);
    router.push('/household');
  }

  return (
    <StepScreen title={copy.title} onBack={() => router.back()} backLabel={onboarding.back} primary={{ label: copy.continue, onPress: next }}>
      <Field
        label={copy.nameLabel}
        value={name}
        onChangeText={(v) => { setName(v); setError(null); }}
        placeholder={copy.namePlaceholder}
        textContentType="givenName"
        autoComplete="given-name"
        autoCapitalize="words"
        autoFocus
        returnKeyType="next"
        maxLength={30}
        error={error}
      />
      <View style={{ gap: space[2] }}>
        <Text variant="bodySemibold">{copy.languageLabel}</Text>
        <ChoiceRow label={copy.languageLabel} value={language} onChange={setLanguage} options={LANGUAGES.map((l) => ({ value: l, label: languageNames[l] }))} />
        {/* Preview of the greeting this choice gives on Home. */}
        <Text variant="heading" color="highlight" style={{ marginTop: space[3] }} accessibilityLanguage={language}>
          {greetings[language][dayPart()].replace('\n', ' ')}
          {name.trim() ? `, ${name.trim()}` : ''}
        </Text>
      </View>
    </StepScreen>
  );
}
