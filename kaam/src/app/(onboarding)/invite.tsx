import { InviteCode } from '../../components/InviteCode';
import { StepScreen } from '../../components/onboarding';
import { setup as copy } from '../../copy/strings';
import { useStore } from '../../data/store';

export default function Invite() {
  const store = useStore();
  // Leaving this screen finishes onboarding; the app then opens on Home.
  const finish = () => store.finishOnboarding();

  return (
    <StepScreen title={copy.inviteTitle} body={copy.inviteBody} secondary={{ label: copy.later, onPress: finish }} primary={{ label: copy.done, onPress: finish }}>
      <InviteCode />
    </StepScreen>
  );
}
