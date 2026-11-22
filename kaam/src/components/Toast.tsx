import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space } from '../theme/tokens';
import { Text } from './primitives';

type ToastInput = { message: string; action?: { label: string; onPress: () => void } };
type ToastState = ToastInput & { id: number };

const ToastContext = createContext<(t: ToastInput) => void>(() => {});

/** Space reserved for the floating nav, so toasts sit just above it. */
const NAV_CLEARANCE = 92;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const show = useCallback((t: ToastInput) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ ...t, id: Date.now() });
    AccessibilityInfo.announceForAccessibility(t.message);
    timer.current = setTimeout(() => setToast(null), t.action ? 5000 : 3000);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={{ position: 'absolute', left: space[4], right: space[4], bottom: insets.bottom + NAV_CLEARANCE }}>
          <View
            accessibilityLiveRegion="polite"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space[3],
              minHeight: 48,
              paddingLeft: space[5],
              paddingRight: toast.action ? space[2] : space[5],
              paddingVertical: space[2],
              borderRadius: radius.md,
              backgroundColor: colors.ink,
            }}
          >
            <Text variant="bodySemibold" color="surface" style={{ flex: 1 }}>{toast.message}</Text>
            {toast.action ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  toast.action!.onPress();
                  setToast(null);
                }}
                style={{ paddingHorizontal: space[4], height: 36, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.accent }}
              >
                <Text variant="bodySemibold" color="onAccent">{toast.action.label}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
