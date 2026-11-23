import { router } from 'expo-router';
import { OptionCard, StepScreen } from '../../components/onboarding';
import { onboarding, setup as copy } from '../../copy/strings';

export default function HouseholdChoice() {
  return (
    <StepScreen title={copy.title} onBack={() => router.back()} backLabel={onboarding.back}>
      <OptionCard icon="house" title={copy.startTitle} body={copy.startBody} onPress={() => router.push('/create-household')} />
      <OptionCard icon="users" title={copy.joinTitle} body={copy.joinBody} onPress={() => router.push('/join')} />
    </StepScreen>
  );
}
