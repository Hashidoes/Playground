import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { space } from '../theme/tokens';
import { Text } from './primitives';

/** Height the floating bottom nav needs: 56px bar plus its 24px float. */
export const NAV_SPACE = 104;

/** Where the floating nav's top edge sits above the bottom of the screen. */
export function navTop(bottomInset: number) {
  return Math.max(bottomInset, space[3]) + space[3] + 56;
}

/** Scrollable tab screen with the 16px grid, safe areas and room for the floating nav. */
export function Screen({
  children,
  title,
  subtitle,
  right,
  fab,
  contentStyle,
}: {
  children: ReactNode;
  title?: string;
  /** A short line under the title, such as today's date. */
  subtitle?: string;
  right?: ReactNode;
  /** A floating action button, placed bottom right above the nav. */
  fab?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        contentContainerStyle={[
          {
            paddingTop: insets.top + space[6],
            // Leave room for the nav, and for the floating button so it never hides the last row.
            paddingBottom: insets.bottom + NAV_SPACE + (fab ? 72 : 0),
            paddingHorizontal: space[4],
            gap: space[5],
            width: '100%',
            maxWidth: 520,
            alignSelf: 'center',
          },
          contentStyle,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {title ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3] }}>
            <View style={{ flex: 1 }}>
              <Text variant="title" accessibilityRole="header">{title}</Text>
              {subtitle ? <Text variant="bodySemibold" color="inkMuted">{subtitle}</Text> : null}
            </View>
            {right}
          </View>
        ) : null}
        {children}
      </ScrollView>
      {fab ? (
        <View pointerEvents="box-none" style={{ position: 'absolute', right: space[4], bottom: navTop(insets.bottom) + space[4] }}>
          {fab}
        </View>
      ) : null}
    </View>
  );
}
