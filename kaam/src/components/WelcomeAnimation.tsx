import LottieView from 'lottie-react-native';
import { View } from 'react-native';
import { useReduceMotion } from '../lib/useReduceMotion';

/** Width / height of the welcome animation (a 900 × 1125 stamp). */
export const WELCOME_ART_RATIO = 900 / 1125;
const SOURCE = require('../../assets/onboarding/laundry-float.json');

/**
 * The welcome illustration: the stamp with someone doing the laundry, gently
 * floating on a loop. A still frame when the phone asks for less motion.
 */
export function WelcomeAnimation({ accessibilityLabel }: { accessibilityLabel: string }) {
  const reduceMotion = useReduceMotion();
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ width: '100%', aspectRatio: WELCOME_ART_RATIO }}>
      <LottieView key={reduceMotion ? 'still' : 'moving'} source={SOURCE} autoPlay={!reduceMotion} loop={!reduceMotion} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
    </View>
  );
}
