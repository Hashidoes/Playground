import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { evening, sunlit, type ColorTokens } from './tokens';

export type Appearance = 'sunlit' | 'evening' | 'system';

type ThemeValue = {
  colors: ColorTokens;
  isEvening: boolean;
  appearance: Appearance;
  setAppearance: (a: Appearance) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

/**
 * `force` pins a subtree to one theme, for screens whose artwork only works on
 * one ground (the onboarding illustrations are drawn for cream).
 */
export function ThemeProvider({ children, force }: { children: ReactNode; force?: 'sunlit' | 'evening' }) {
  const scheme = useColorScheme();
  const parent = useContext(ThemeContext);
  const [ownAppearance, setOwnAppearance] = useState<Appearance>('system');
  // A nested provider shares the app's appearance setting instead of keeping its own.
  const appearance = parent ? parent.appearance : ownAppearance;
  const setAppearance = parent ? parent.setAppearance : setOwnAppearance;
  const isEvening = force ? force === 'evening' : appearance === 'evening' || (appearance === 'system' && scheme === 'dark');

  const value = useMemo(
    () => ({ colors: isEvening ? evening : sunlit, isEvening, appearance, setAppearance }),
    [isEvening, appearance, setAppearance],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
