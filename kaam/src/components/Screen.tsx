import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { space } from '../theme/tokens';
import { Text } from './primitives';

/** Height the floating bottom nav needs: 56px bar plus its 24px float. */
export const NAV_SPACE = 104;

/** Scrollable tab screen with the 16px grid, safe areas and room for the floating nav. */
export function Screen({ children, title, right, contentStyle }: { children: ReactNode; title?: string; right?: ReactNode; contentStyle?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        contentContainerStyle={[
          { paddingTop: insets.top + space[6], paddingBottom: insets.bottom + NAV_SPACE, paddingHorizontal: space[4], gap: space[5], width: '100%', maxWidth: 520, alignSelf: 'center' },
          contentStyle,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {title ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3] }}>
            <Text variant="title" accessibilityRole="header" style={{ flex: 1 }}>{title}</Text>
            {right}
          </View>
        ) : null}
        {children}
      </ScrollView>
    </View>
  );
}
