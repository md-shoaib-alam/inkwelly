import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Animated, Platform, StatusBar, Easing } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';

export function NetworkStatusBar() {
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isSlow, setIsSlow] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerType, setBannerType] = useState<'offline' | 'slow' | 'online'>('online');
  const pathname = usePathname();
  
  const insets = useSafeAreaInsets();
  const animatedValue = useRef(new Animated.Value(-150)).current;
  
  const showBannerRef = useRef(showBanner);
  const bannerTypeRef = useRef(bannerType);

  useEffect(() => {
    showBannerRef.current = showBanner;
    bannerTypeRef.current = bannerType;
  }, [showBanner, bannerType]);

  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isInternetReachable ?? state.isConnected;
      const cellularGen = state.details && 'cellularGeneration' in state.details 
        ? (state.details as any).cellularGeneration 
        : null;
      
      const isConnectionSlow = state.type === 'cellular' && (cellularGen === '2g' || cellularGen === '3g');
      
      setIsConnected(connected);
      setConnectionType(state.type);
      setIsSlow(!!isConnectionSlow);

      if (connected === false) {
        setBannerType('offline');
        setShowBanner(true);
      } else if (isConnectionSlow) {
        setBannerType('slow');
        setShowBanner(true);
      } else {
        // Was offline or slow, now online
        if (showBannerRef.current && (bannerTypeRef.current === 'offline' || bannerTypeRef.current === 'slow')) {
          setBannerType('online');
          // Hide banner after 3 seconds
          if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = setTimeout(() => {
            setShowBanner(false);
          }, 3000);
        } else {
          setShowBanner(false);
        }
      }
    });

    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: showBanner ? 0 : -150,
      duration: 380,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
      useNativeDriver: true,
    }).start();
  }, [showBanner]);

  const isPublicRoute = pathname === '/' || pathname === '/login' || pathname === '(auth)/login';

  // Hide the redundant top banner if the fullscreen offline retry screen is already visible
  if (isConnected === false && !isPublicRoute) {
    return null;
  }

  let backgroundColor = '#FF3B30'; // red for offline
  let iconName: any = 'cloud-offline-outline';
  let message = 'No Internet Connection';

  if (bannerType === 'slow') {
    backgroundColor = '#FF9500'; // amber for slow
    iconName = 'speedometer-outline';
    message = 'Slow Network Connection';
  } else if (bannerType === 'online') {
    backgroundColor = '#34C759'; // green for back online
    iconName = 'checkmark-circle-outline';
    message = 'Back Online!';
  }

  // Adjust top offset depending on Platform and notch
  const topOffset = Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0;

  return (
    <Animated.View
      pointerEvents={showBanner ? 'auto' : 'none'}
      style={[
        styles.banner,
        {
          backgroundColor,
          transform: [{ translateY: animatedValue }],
          paddingTop: topOffset > 0 ? topOffset + 8 : 12,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={iconName} size={20} color="#FFFFFF" style={styles.icon} />
        <ThemedText style={styles.text}>{message}</ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
