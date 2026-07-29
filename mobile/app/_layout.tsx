import { useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts as useSpectral,
  Spectral_600SemiBold,
  Spectral_600SemiBold_Italic,
} from '@expo-google-fonts/spectral';
import {
  useFonts as usePlexSans,
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  useFonts as usePlexMono,
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [spectralLoaded] = useSpectral({ Spectral_600SemiBold, Spectral_600SemiBold_Italic });
  const [plexSansLoaded] = usePlexSans({ IBMPlexSans_400Regular, IBMPlexSans_500Medium });
  const [plexMonoLoaded] = usePlexMono({ IBMPlexMono_400Regular, IBMPlexMono_500Medium });

  const fontsReady = spectralLoaded && plexSansLoaded && plexMonoLoaded;

  const onLayout = useCallback(async () => {
    if (fontsReady) await SplashScreen.hideAsync();
  }, [fontsReady]);

  useEffect(() => {
    onLayout();
  }, [onLayout]);

  if (!fontsReady) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: colors.ciniDeep }, headerTintColor: colors.paper, headerTitleStyle: { fontFamily: 'IBMPlexSans_500Medium' } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="listing/[id]" options={{ title: 'İlan' }} />
        <Stack.Screen name="login" options={{ title: 'Giriş Yap' }} />
        <Stack.Screen name="register" options={{ title: 'Kayıt Ol' }} />
        <Stack.Screen name="host/create" options={{ title: 'Yeni İlan' }} />
        <Stack.Screen name="host/payments" options={{ title: 'Ödeme Alma' }} />
      </Stack>
    </>
  );
}
