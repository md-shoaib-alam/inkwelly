import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { ThemedText } from '@/components/themed-text';

interface CustomSplashScreenProps {
  tenantLogo?: string;
  tenantName?: string;
  onFinish?: () => void;
  isPrefetchDone?: boolean;
}

export default function CustomSplashScreen({ tenantLogo, tenantName, onFinish, isPrefetchDone = true }: CustomSplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [cachedLogo, setCachedLogo] = useState<string | null>(null);

  // Keep refs to always have the latest values, avoiding stale closures inside the interval
  const onFinishRef = useRef(onFinish);
  const isPrefetchDoneRef = useRef(isPrefetchDone);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    isPrefetchDoneRef.current = isPrefetchDone;
  }, [isPrefetchDone]);

  useEffect(() => {
    async function loadCachedLogo() {
      try {
        const localLogo = await AsyncStorage.getItem('@tenant_logo_path');
        if (localLogo) {
          setCachedLogo(localLogo);
        }
      } catch (e) {
        // Log the error so failures to read cached logo are visible in diagnostics
        console.warn('Failed to read cached logo from AsyncStorage', e);
      }
    }
    loadCachedLogo();

    const startTime = Date.now();
    const interval = setInterval(() => {
      setProgress((prev) => {
        const elapsedTime = Date.now() - startTime;
        // Never stall at 95% for more than 1.5 seconds even if prefetch is still running
        if (prev >= 95 && !isPrefetchDoneRef.current && elapsedTime < 1500) {
          return 95;
        }

        const next = prev + 1;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onFinishRef.current?.();
          }, 0);
          return 100;
        }
        return next;
      });
    }, 12); // ~1.2 seconds smooth progression

    return () => clearInterval(interval);
  }, []); // Run once on mount — updates are handled via refs


  // Determine logo source
  const hasCustomLogo = tenantLogo && tenantLogo !== '/test.webp' && tenantLogo.startsWith('http');
  const logoSource = cachedLogo 
    ? { uri: cachedLogo } 
    : (hasCustomLogo ? { uri: tenantLogo } : require('@/assets/images/icon.png'));

  // Premium pink/rose gradient matching the screenshot
  const gradientColors = ['#FF4E7A', '#FF1E56'] as const;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        style={styles.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      <View style={styles.centerContent}>
        {/* Layered circular progress bar and logo */}
        <View style={styles.progressContainer}>
          {/* Circular Progress SVG (Wraps the logo circle) */}
          <Svg width={156} height={156} viewBox="0 0 156 156">
            {/* Background track circle */}
            <Circle
              cx="78"
              cy="78"
              r="74"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="4"
              fill="none"
            />
            {/* Active progress circle */}
            <Circle
              cx="78"
              cy="78"
              r="74"
              stroke="#FFFFFF"
              strokeWidth="4"
              fill="none"
              strokeDasharray={464.95} // 2 * pi * 74 = 464.95
              strokeDashoffset={464.95 - (progress / 100) * 464.95}
              strokeLinecap="round"
              transform="rotate(-90 78 78)"
            />
          </Svg>

          {/* Logo Circle (Centered inside the progress circle) */}
          <View style={styles.logoCircle}>
            <Image
              source={logoSource}
              style={styles.logoImage}
              contentFit="cover"
            />
          </View>
        </View>

        {/* Live Percentage Indicator below the logo */}
        <ThemedText style={styles.percentageText}>{progress}%</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  progressContainer: {
    width: 156,
    height: 156,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  percentageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    letterSpacing: 0.5,
  },
});
