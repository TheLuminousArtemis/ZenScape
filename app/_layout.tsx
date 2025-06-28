import { useEffect } from 'react';
import { Slot, useRouter, useSegments, Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { supabase } from '../src/services/supabase';
import { useColorScheme, StatusBar, Platform } from 'react-native';
import { MenuProvider } from 'react-native-popup-menu';
import * as SystemUI from 'expo-system-ui';

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Set navigation bar color for Android
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync('#000000');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const inAuthGroup = segments[0] === '(auth)';

      if (!session && !inAuthGroup) {
        // Redirect to login if not authenticated
        router.replace('/(auth)/login');
      } else if (session && inAuthGroup) {
        // Redirect to home if authenticated
        router.replace('/(tabs)');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const inAuthGroup = segments[0] === '(auth)';

      if (!session && !inAuthGroup) {
        router.replace('/(auth)/login');
      } else if (session && inAuthGroup) {
        router.replace('/(tabs)');
      }
    });

    return () => subscription.unsubscribe();
  }, [segments]);

  const theme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return (
    <MenuProvider>
      <PaperProvider theme={theme}>
        <StatusBar backgroundColor="#000000" barStyle="light-content" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#000000',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(auth)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="journal"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </PaperProvider>
    </MenuProvider>
  );
}
