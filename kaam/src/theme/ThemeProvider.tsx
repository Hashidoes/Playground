import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { sunState, type SunState } from '../lib/sun';
import { evening, sunlit, type ColorTokens } from './tokens';

export type ThemeName = 'sunlit' | 'evening';

/** A manual choice that lasts until the next sunrise or sunset. */
type Override = { theme: ThemeName; until: number } | null;

type ThemeValue = {
  colors: ColorTokens;
  isEvening: boolean;
  /** Sunrise and sunset in IST, which drive the automatic switch. */
  sun: SunState;
  override: Override;
  /** Pick a theme; it holds until the next sunrise or sunset, then the sun takes over again. */
  choose: (theme: ThemeName) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

/** Re-reads the sun at each sunrise and sunset (and every minute, in case the phone slept). */
function useSun(): SunState {
  const [sun, setSun] = useState(() => sunState());
  useEffect(() => {
    const refresh = () => setSun(sunState());
    const untilChange = setTimeout(refresh, Math.max(1000, sun.nextChange - Date.now() + 1000));
    const everyMinute = setInterval(() => {
      if (Date.now() >= sun.nextChange) refresh();
    }, 60_000);
    return () => {
      clearTimeout(untilChange);
      clearInterval(everyMinute);
    };
  }, [sun.nextChange]);
  return sun;
}

/**
 * Sunlit from sunrise to sunset, Evening from sunset to sunrise (IST).
 * `force` pins a subtree to one theme, for screens whose artwork only works on
 * one ground (the onboarding illustrations are drawn for cream).
 */
export function ThemeProvider({ children, force }: { children: ReactNode; force?: ThemeName }) {
  const parent = useContext(ThemeContext);
  const ownSun = useSun();
  const [ownOverride, setOwnOverride] = useState<Override>(null);

  // A nested provider shares the app's sun and choice instead of keeping its own.
  const sun = parent ? parent.sun : ownSun;
  // A choice belongs to one sunrise-to-sunset period: once the sun moves on, it lapses.
  const activeOverride = parent ? parent.override : ownOverride && ownOverride.until === sun.nextChange ? ownOverride : null;

  const ownChoose = useCallback(
    (theme: ThemeName) => {
      const automatic: ThemeName = sun.isDay ? 'sunlit' : 'evening';
      // Choosing what the sun already says simply goes back to automatic.
      setOwnOverride(theme === automatic ? null : { theme, until: sun.nextChange });
    },
    [sun.isDay, sun.nextChange],
  );
  const choose = parent ? parent.choose : ownChoose;

  const isEvening = force ? force === 'evening' : activeOverride ? activeOverride.theme === 'evening' : !sun.isDay;

  const value = useMemo(
    () => ({ colors: isEvening ? evening : sunlit, isEvening, sun, override: activeOverride, choose }),
    [isEvening, sun, activeOverride, choose],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
