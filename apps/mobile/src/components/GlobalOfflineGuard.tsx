import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { usePathname } from 'expo-router';
import { OfflineState } from '@/components/OfflineState';

interface GlobalOfflineGuardProps {
  children: React.ReactNode;
}

export function GlobalOfflineGuard({ children }: GlobalOfflineGuardProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isChecking, setIsChecking] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Subscribe to network connection state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isInternetReachable ?? state.isConnected;
      setIsConnected(online);
    });

    return () => unsubscribe();
  }, []);

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      const state = await NetInfo.refresh();
      // Match the listener above: a network can be connected but have no internet
      // (captive portal / router up, WAN down). Using isConnected alone would
      // wrongly dismiss this screen on "Try Again" until the next NetInfo event.
      setIsConnected(state.isInternetReachable ?? state.isConnected);
    } catch (e) {
      console.warn('Network status refresh failed:', e);
    } finally {
      setIsChecking(false);
    }
  };

  // Skip the offline guard for Onboarding/Welcome (index) and Login screens
  // so users can still read onboarding slides offline if they want.
  const isPublicRoute = pathname === '/' || pathname === '/login' || pathname === '(auth)/login';

  return (
    <>
      {children}
      {isConnected === false && !isPublicRoute && (
        <View style={StyleSheet.absoluteFill}>
          <OfflineState 
            onRetry={handleRetry} 
            isRetrying={isChecking} 
            message="No internet connection. Please verify your settings and try again."
          />
        </View>
      )}
    </>
  );
}
