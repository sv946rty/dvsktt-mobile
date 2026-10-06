import { BeVietnamPro_400Regular, BeVietnamPro_500Medium, BeVietnamPro_600SemiBold } from '@expo-google-fonts/be-vietnam-pro';
import { Newsreader_400Regular, Newsreader_400Regular_Italic, Newsreader_500Medium, Newsreader_600SemiBold } from '@expo-google-fonts/newsreader';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from '@/lib/store';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { initialRouteName: '(tabs)' };

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BeVietnamPro_400Regular, BeVietnamPro_500Medium, BeVietnamPro_600SemiBold,
    Newsreader_400Regular, Newsreader_400Regular_Italic, Newsreader_500Medium, Newsreader_600SemiBold,
  });
  useEffect(() => { if (error) throw error; }, [error]);
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <StoreProvider><Nav /></StoreProvider>
    </SafeAreaProvider>
  );
}

function Nav() {
  const { c, ready } = useStore();
  useEffect(() => { if (ready) SplashScreen.hideAsync(); }, [ready]);
  const base = c.dark ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, background: c.paper, card: c.leaf, text: c.ink, border: c.rule, primary: c.jade } };
  if (!ready) return null;
  return (
    <ThemeProvider value={theme}>
      <StatusBar style={c.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.paper } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="reader/[chapter]" />
      </Stack>
    </ThemeProvider>
  );
}
