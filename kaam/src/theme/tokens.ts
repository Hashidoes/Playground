// Kaam design tokens, ported from the Kaam design system (tokens.json).
// Scales are the exact values from the Figma "Final colour palette" frame.

export const blue = {
  50: '#F3F7FC', 100: '#E6EFF8', 200: '#C8DEEF', 300: '#97C2E2', 400: '#5FA3D1', 500: '#3B87BC',
  600: '#2A6B9F', 700: '#22537C', 800: '#214A6B', 900: '#203F5A', 950: '#15283C',
} as const;

export const amber = {
  50: '#FFFEEA', 100: '#FFF8C5', 200: '#FFF285', 300: '#FFE546', 400: '#FFD41B', 500: '#FFB402',
  600: '#E28900', 700: '#BB6002', 800: '#984A08', 900: '#7C3D0B', 950: '#481E00',
} as const;

export const green = {
  50: '#F5FAF3', 100: '#E9F4E5', 200: '#D2E7CB', 300: '#ADD4A1', 400: '#82B870', 500: '#5F9B4C',
  600: '#4B7E3B', 700: '#3D6431', 800: '#33512A', 900: '#2B4324', 950: '#142310',
} as const;

export type ColorTokens = {
  surface: string;
  surfaceRaised: string;
  surfaceSunken: string;
  /** Text field background (the pale amber inputs in the Figma sign-up screens). */
  field: string;
  ink: string;
  inkMuted: string;
  highlight: string;
  onHighlight: string;
  accent: string;
  onAccent: string;
  accentStrong: string;
  onAccentStrong: string;
  callout: string;
  onCallout: string;
  calloutLabel: string;
  track: string;
  success: string;
  onSuccess: string;
  danger: string;
  line: string;
  focus: string;
  scrim: string;
};

/** Sunlit: cream ground, navy ink, cobalt highlight. */
export const sunlit: ColorTokens = {
  surface: amber[50],
  surfaceRaised: '#CDDEE5',
  surfaceSunken: green[100],
  field: amber[100],
  ink: blue[800],
  inkMuted: '#3F5B75',
  highlight: '#045DD0',
  onHighlight: amber[50],
  accent: amber[500],
  onAccent: amber[950],
  accentStrong: amber[950],
  onAccentStrong: amber[50],
  callout: '#045DD0',
  onCallout: amber[50],
  calloutLabel: amber[300],
  track: blue[100],
  success: green[600],
  onSuccess: green[50],
  danger: '#B42318',
  line: 'rgba(33, 74, 107, 0.16)',
  focus: '#045DD0',
  scrim: 'rgba(21, 40, 60, 0.45)',
};

/** Evening: deep navy ground, cream ink, amber highlight. */
export const evening: ColorTokens = {
  surface: '#0C305F',
  surfaceRaised: blue[800],
  surfaceSunken: '#3D597B',
  field: blue[800],
  ink: amber[50],
  inkMuted: blue[200],
  highlight: amber[500],
  onHighlight: amber[950],
  accent: amber[500],
  onAccent: amber[950],
  accentStrong: amber[950],
  onAccentStrong: amber[500],
  callout: '#3D597B',
  onCallout: amber[50],
  calloutLabel: amber[400],
  track: '#2F5076',
  success: green[300],
  onSuccess: green[950],
  danger: '#FF9C94',
  line: 'rgba(255, 254, 234, 0.16)',
  focus: amber[300],
  scrim: 'rgba(0, 0, 0, 0.5)',
};

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40 } as const;

export const radius = { sm: 8, md: 24, lg: 36, xl: 48, pill: 999 } as const;

/**
 * Colours given to household members, in the order people join. Each keeps cream
 * initials above 4.5:1 and stays visible on both the Sunlit and Evening cards.
 */
export const memberColors = [amber[900], green[600], amber[700], '#045DD0', green[800], '#8E3B74'] as const;

export const font = {
  light: 'Inter_300Light',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

/** Type styles from the design system. Sizes and line heights in points. */
export const type = {
  greeting: { fontFamily: font.extrabold, fontSize: 36, lineHeight: 44, letterSpacing: -0.5 },
  greetingLight: { fontFamily: font.light, fontSize: 36, lineHeight: 44, letterSpacing: -0.5 },
  stat: { fontFamily: font.regular, fontSize: 64, lineHeight: 72, letterSpacing: -1 },
  title: { fontFamily: font.bold, fontSize: 30, lineHeight: 36 },
  heading: { fontFamily: font.bold, fontSize: 20, lineHeight: 26 },
  bodyStrong: { fontFamily: font.bold, fontSize: 16, lineHeight: 22 },
  bodyLarge: { fontFamily: font.regular, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: font.regular, fontSize: 14, lineHeight: 20 },
  bodySemibold: { fontFamily: font.semibold, fontSize: 14, lineHeight: 20 },
  eyebrow: { fontFamily: font.light, fontSize: 14, lineHeight: 18 },
  label: { fontFamily: font.medium, fontSize: 12, lineHeight: 16 },
  caption: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16 },
} as const;

export type TypeVariant = keyof typeof type;
