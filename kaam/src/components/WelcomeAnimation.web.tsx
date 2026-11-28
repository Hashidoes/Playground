import { useEffect, useRef } from 'react';
import { View, type ViewInstance } from 'react-native';
import { useReduceMotion } from '../lib/useReduceMotion';

/** Width / height of the welcome animation (a 900 × 1125 stamp). */
export const WELCOME_ART_RATIO = 900 / 1125;
const SOURCE = require('../../assets/onboarding/laundry-float.json');

/** Web version of the welcome animation, played with lottie-web. */
export function WelcomeAnimation({ accessibilityLabel }: { accessibilityLabel: string }) {
  const box = useRef<ViewInstance>(null);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    const el = box.current as unknown as HTMLElement | null;
    if (!el) return;
    let stopped = false;
    let anim: { destroy: () => void } | null = null;
    // Loaded on demand so the player stays out of the main bundle.
    import('lottie-web/build/player/lottie_light').then(({ default: lottie }) => {
      if (stopped) return;
      anim = lottie.loadAnimation({ container: el, renderer: 'svg', loop: !reduceMotion, autoplay: !reduceMotion, animationData: SOURCE });
    });
    return () => {
      stopped = true;
      anim?.destroy();
    };
  }, [reduceMotion]);

  return <View ref={box} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ width: '100%', aspectRatio: WELCOME_ART_RATIO }} />;
}
