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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const [appearance, setAppearance] = useState<Appearance>('system');
  const isEvening = appearance === 'evening' || (appearance === 'system' && scheme === 'dark');

  const value = useMemo(
    () => ({ colors: isEvening ? evening : sunlit, isEvening, appearance, setAppearance }),
    [isEvening, appearance],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
