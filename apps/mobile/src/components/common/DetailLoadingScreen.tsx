import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';

interface DetailLoadingScreenProps {
  title?: string;
  subtitle?: string;
}

export function DetailLoadingScreen({
  title = 'Loading Profile...',
  subtitle = 'Fetching the latest details from server',
}: DetailLoadingScreenProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  // Subtle floating & pulsing animations for the illustration
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Gentle floating loop
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // Subtle scale breathing
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    floatLoop.start();
    pulseLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
    };
  }, [floatAnim, pulseAnim]);

  return (
    <ThemedView style={styles.container} safeAreaTop>
      <View style={styles.content}>
        {/* Animated Illustration Container */}
        <Animated.View
          style={[
            styles.imageWrapper,
            {
              transform: [{ translateY: floatAnim }, { scale: pulseAnim }],
            },
          ]}
        >
          <Image
            source={require('@/assets/images/admin/table.avif')}
            style={styles.image}
            contentFit="contain"
            transition={200}
          />
        </Animated.View>

        {/* Loading Spinner & Progress Indicators */}
        <View style={styles.indicatorRow}>
          <ActivityIndicator size="small" color="#059669" />
          <ThemedText style={[styles.title, { color: colors.text }]}>{title}</ThemedText>
        </View>

        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </ThemedText>

        {/* Minimalist skeleton bar */}
        <View
          style={[
            styles.skeletonBar,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0' },
          ]}
        >
          <Animated.View
            style={[
              styles.skeletonBarFill,
              {
                backgroundColor: '#059669',
                transform: [{ scaleX: pulseAnim }],
              },
            ]}
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    maxWidth: 380,
    width: '100%',
  },
  imageWrapper: {
    width: 200,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  image: {
    width: 180,
    height: 140,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  skeletonBar: {
    width: 140,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  skeletonBarFill: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
});
