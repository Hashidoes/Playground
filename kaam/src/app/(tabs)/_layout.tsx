import { Tabs } from 'expo-router/js-tabs';
import { BottomNav, type NavItem } from '../../components/home';
import { nav } from '../../copy/strings';
import { useTheme } from '../../theme/ThemeProvider';

const ITEMS: Record<string, Omit<NavItem, 'key'>> = {
  index: { label: nav.home, icon: 'house' },
  tasks: { label: nav.tasks, icon: 'tasks' },
  calendar: { label: nav.calendar, icon: 'calendar' },
  scores: { label: nav.scores, icon: 'trophy' },
  household: { label: nav.household, icon: 'users' },
};

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.surface } }}
      tabBar={({ state, navigateToTab, insets }) => (
        <BottomNav
          items={state.routes.map((r) => ({ key: r.key, ...ITEMS[r.name] }))}
          activeKey={state.routes[state.index].key}
          onSelect={navigateToTab}
          bottomInset={insets.bottom}
        />
      )}
    >
      <Tabs.Screen name="index" options={{ title: nav.home }} />
      <Tabs.Screen name="tasks" options={{ title: nav.tasks }} />
      <Tabs.Screen name="calendar" options={{ title: nav.calendar }} />
      <Tabs.Screen name="scores" options={{ title: nav.scores }} />
      <Tabs.Screen name="household" options={{ title: nav.household }} />
    </Tabs>
  );
}
