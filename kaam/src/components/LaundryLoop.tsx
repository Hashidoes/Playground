import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, View, type LayoutChangeEvent } from 'react-native';

/**
 * The welcome illustration, animated: someone takes a piece of laundry from the
 * basket and drops it into the washing machine, on a loop.
 *
 * It's built from five layers cut from one illustration (all in the same
 * coordinate space): the scene, the arm, the cloth in hand, the machine's front
 * (so a dropped cloth disappears into the drum) and the basket's front (so the
 * hand reaches into the basket). People who turn on Reduce Motion see a still.
 */

// Size of the scene, and where each layer sits in it (from the exported art).
const SCENE = { w: 589, h: 647 };
const LAYERS = {
  base: { src: require('../../assets/onboarding/laundry/base.webp'), x: 0, y: 0, w: 589, h: 647 },
  front: { src: require('../../assets/onboarding/laundry/front.webp'), x: 108, y: 265, w: 199, h: 382 },
  cloth: { src: require('../../assets/onboarding/laundry/cloth.webp'), x: 152, y: 162, w: 110, h: 124 },
  arm: { src: require('../../assets/onboarding/laundry/arm.webp'), x: 181, y: 91, w: 190, h: 117 },
  basket: { src: require('../../assets/onboarding/laundry/basket.webp'), x: 314, y: 232, w: 263, h: 168 },
};
const SHOULDER = { x: 338.5, y: 155 }; // the arm turns around this point
const GRIP = { x: 223.75, y: 171.5 }; // where the hand holds the cloth
const DROP = 128; // how far the released cloth falls into the drum

const LOOP_MS = 4200;
const SAMPLES = 169; // one point every 25 ms

// ---------- The timeline, in seconds ----------

type Key = [time: number, value: number];
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
const easeIn = (p: number) => p * p;

/** Value at time t from keyframes, easing between each pair. */
function at(keys: Key[], t: number, ease = easeInOut): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      return v0 + (v1 - v0) * ease((t - t0) / (t1 - t0 || 1));
    }
  }
  return keys[keys.length - 1][1];
}

// The arm, in degrees (negative turns towards the basket).
const ARM: Key[] = [[0, 0], [0.55, 0], [1.35, -130], [1.5, -135], [1.7, -130], [2.7, 4], [2.95, -2], [3.15, 0], [4.2, 0]];
// The cloth swings a little as it's carried, then settles.
const SWING: Key[] = [[0, 0], [1.7, 0], [2.2, -14], [2.6, -16], [2.85, 10], [3.05, -5], [3.3, 2], [3.5, 0], [4.2, 0]];
// It's let go at 0.4 s and picked up again from the basket at 1.5 s.
const HELD: Key[] = [[0, 1], [0.399, 1], [0.4, 0], [1.499, 0], [1.5, 1], [4.2, 1]];
// Bunched up as it comes out of the basket.
const LENGTH: Key[] = [[0, 1], [1.0, 1], [1.01, 0.45], [1.5, 0.45], [2.3, 1], [4.2, 1]];
const FALL: Key[] = [[0, 0], [0.4, 0], [0.95, DROP], [4.2, DROP]];
const FALLING: Key[] = [[0, 0], [0.399, 0], [0.4, 1], [0.95, 1], [0.951, 0], [4.2, 0]];

function sample(keys: Key[], ease: (p: number) => number) {
  const inputRange: number[] = [];
  const values: number[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    inputRange.push(i / (SAMPLES - 1));
    values.push(at(keys, (i / (SAMPLES - 1)) * (LOOP_MS / 1000), ease));
  }
  return { inputRange, values };
}
const linear = (p: number) => p;
/** An animated number following the keyframes. */
const numbers = (clock: Animated.Value, keys: Key[], ease = linear) => {
  const { inputRange, values } = sample(keys, ease);
  return clock.interpolate({ inputRange, outputRange: values });
};
/** An animated angle following the keyframes. */
const degrees = (clock: Animated.Value, keys: Key[], ease = easeInOut) => {
  const { inputRange, values } = sample(keys, ease);
  return clock.interpolate({ inputRange, outputRange: values.map((v) => `${v.toFixed(2)}deg`) });
};

/** Inside the turning arm, the cloth turns back the other way so it keeps hanging down. */
const CLOTH_TURN: Key[] = Array.from({ length: 85 }, (_, i) => {
  const t = (i / 84) * (LOOP_MS / 1000);
  return [t, -at(ARM, t) + at(SWING, t)] as Key;
});

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((r) => alive && setReduce(r)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

const pct = (v: number, of: number) => `${(v / of) * 100}%` as const;
const origin = (p: { x: number; y: number }) => `${pct(p.x, SCENE.w)} ${pct(p.y, SCENE.h)}`;

export function LaundryLoop({ accessibilityLabel }: { accessibilityLabel: string }) {
  const [scale, setScale] = useState(0);
  const reduceMotion = useReduceMotion();
  const [clock] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion || !scale) {
      clock.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(clock, { toValue: 1, duration: LOOP_MS, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }),
    );
    loop.start();
    return () => loop.stop();
  }, [clock, reduceMotion, scale]);

  const anim = useMemo(
    () => ({
      arm: degrees(clock, ARM),
      clothTurn: degrees(clock, CLOTH_TURN, linear),
      held: numbers(clock, HELD),
      length: numbers(clock, LENGTH),
      fall: numbers(clock, FALL.map(([t, v]) => [t, v * scale] as Key), easeIn),
      falling: numbers(clock, FALLING),
    }),
    [clock, scale],
  );

  const onLayout = (e: LayoutChangeEvent) => setScale(e.nativeEvent.layout.width / SCENE.w);
  const layer = (l: (typeof LAYERS)[keyof typeof LAYERS]) => (
    <Image
      source={l.src}
      resizeMode="stretch"
      style={{ position: 'absolute', left: l.x * scale, top: l.y * scale, width: l.w * scale, height: l.h * scale }}
    />
  );
  const fill = { position: 'absolute', left: 0, top: 0, width: SCENE.w * scale, height: SCENE.h * scale } as const;

  return (
    <View
      onLayout={onLayout}
      style={{ width: '100%', aspectRatio: SCENE.w / SCENE.h }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {scale > 0 ? (
        <>
          {layer(LAYERS.base)}
          {/* The cloth after it's let go, falling into the drum. */}
          <Animated.View pointerEvents="none" style={[fill, { opacity: anim.falling, transform: [{ translateY: anim.fall }] }]}>
            {layer(LAYERS.cloth)}
          </Animated.View>
          {layer(LAYERS.front)}
          {/* The arm, carrying the cloth. */}
          <Animated.View pointerEvents="none" style={[fill, { transformOrigin: origin(SHOULDER), transform: [{ rotate: anim.arm }] }]}>
            <Animated.View
              style={[fill, { opacity: anim.held, transformOrigin: origin(GRIP), transform: [{ rotate: anim.clothTurn }, { scaleY: anim.length }] }]}
            >
              {layer(LAYERS.cloth)}
            </Animated.View>
            {layer(LAYERS.arm)}
          </Animated.View>
          {layer(LAYERS.basket)}
        </>
      ) : null}
    </View>
  );
}
