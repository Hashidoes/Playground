import Svg, { Polygon } from 'react-native-svg';

const COBALT = '#045DD0';
const AMBER = '#FFB402';

// Four slanted tiles from the Figma splash: cobalt on the left, amber on the right.
export const MARK_TILES = [
  { points: '2,2 50,2 58,32 10,32', color: COBALT },
  { points: '56,2 104,2 112,32 64,32', color: AMBER },
  { points: '12,40 60,40 68,70 20,70', color: COBALT },
  { points: '66,40 114,40 122,70 74,70', color: AMBER },
] as const;

export function KaamMark({ width = 124 }: { width?: number }) {
  return (
    <Svg width={width} height={(width * 72) / 124} viewBox="0 0 124 72" accessibilityLabel="Kaam">
      {MARK_TILES.map((t) => (
        <Polygon key={t.points} points={t.points} fill={t.color} stroke={t.color} strokeWidth={4} strokeLinejoin="round" />
      ))}
    </Svg>
  );
}
