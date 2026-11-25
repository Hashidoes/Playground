import { Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ToastProvider } from '../components/Toast';
import { StoreProvider, useStore } from '../data/store';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { colors, isEvening } = useTheme();
  const { onboarded } = useStore();
  return (
    <>
      <StatusBar style={isEvening ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
        {/* Signed in and in a household: the app itself. */}
        <Stack.Protected guard={onboarded} redirectTo="/welcome">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="task/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="member/new" options={{ presentation: 'modal' }} />
        </Stack.Protected>
        {/* Everyone else: welcome, sign in, profile, household. */}
        <Stack.Protected guard={!onboarded} redirectTo="/">
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // If fonts fail, carry on with system fonts rather than hanging on the splash screen.
  if (!loaded && !error) return null;

  return (
    <ThemeProvider>
      <StoreProvider>
        <ToastProvider>
          <RootStack />
        </ToastProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
