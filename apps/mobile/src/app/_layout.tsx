import React, { useEffect } from 'react';
import { Stack } from "expo-router";
import { AuthProvider } from "@/store/auth-context";
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { SettingsProvider, useSettings } from '@/store/settings-context';

import { NetworkStatusBar } from '@/components/NetworkStatusBar';
import { NotificationProvider } from '@/components/providers/notification-provider';
import { GlobalOfflineGuard } from '@/components/GlobalOfflineGuard';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';

import { StatusBar } from 'expo-status-bar';

function AppContent() {
  const { activeTheme } = useSettings();

  const paperTheme = activeTheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
      <NetworkStatusBar />
      <GlobalOfflineGuard>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
      </GlobalOfflineGuard>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <SettingsProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AuthProvider>
      </SettingsProvider>
    </GlobalErrorBoundary>
  );
}


