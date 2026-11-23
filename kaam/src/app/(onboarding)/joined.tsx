import { View } from 'react-native';
import { StepScreen } from '../../components/onboarding';
import { Avatar } from '../../components/primitives';
import { setup as copy } from '../../copy/strings';
import { useStore } from '../../data/store';
import { space } from '../../theme/tokens';

export default function Joined() {
  const store = useStore();
  return (
    <StepScreen title={copy.joined(store.household.name)} body={copy.joinedBody} primary={{ label: copy.goHome, onPress: store.finishOnboarding }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
        {store.members.map((m) => (
          <Avatar key={m.id} name={m.name} color={m.color} size={48} />
        ))}
      </View>
    </StepScreen>
  );
}
