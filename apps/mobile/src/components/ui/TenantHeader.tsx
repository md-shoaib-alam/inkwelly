import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TenantHeaderProps {
  user: {
    tenantLogo?: string;
    tenantName?: string;
    role?: string;
  } | null;
}

export function TenantHeader({ user }: TenantHeaderProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';
  const [logoUri, setLogoUri] = useState<string | null>(null);

  // Sync state during render when logo prop changes to avoid synchronous setState inside useEffect
  const [prevTenantLogo, setPrevTenantLogo] = useState(user?.tenantLogo);
  if (user?.tenantLogo !== prevTenantLogo) {
    setPrevTenantLogo(user?.tenantLogo);
    if (!user?.tenantLogo || user.tenantLogo === '/test.webp') {
      setLogoUri(null);
    }
  }

  useEffect(() => {
    async function loadLogoPath() {
      try {
        const path = await AsyncStorage.getItem('@tenant_logo_path');
        if (path) {
          setLogoUri(path);
        } else if (user?.tenantLogo && user.tenantLogo !== '/test.webp') {
          setLogoUri(user.tenantLogo);
        } else {
          setLogoUri(null);
        }
      } catch (e) {
        if (user?.tenantLogo && user.tenantLogo !== '/test.webp') {
          setLogoUri(user.tenantLogo);
        }
      }
    }
    loadLogoPath();
  }, [user?.tenantLogo]);

  if (!user) return null;

  return (
    <View style={[
      styles.headerContainer,
      {
        backgroundColor: colors.background,
        borderBottomColor: isDark ? '#1F222B' : '#E5E7EB',
      }
    ]}>
      <View style={styles.contentRow}>
        {logoUri ? (
          <Image 
            source={{ uri: logoUri }} 
            style={[
              styles.logo,
              { borderColor: isDark ? '#2E313D' : '#E5E7EB' }
            ]} 
          />
        ) : (
          <Image 
            source={require('../../../assets/images/icon.png')} 
            style={[
              styles.logo,
              { borderColor: isDark ? '#2E313D' : '#E5E7EB' }
            ]} 
          />
        )}
        <View style={styles.textContainer}>
          <ThemedText 
            numberOfLines={1} 
            ellipsizeMode="tail" 
            style={[styles.title, { color: colors.text }]}
          >
            {user.tenantName || 'Greenwood High School'}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF',
    borderWidth: 1,
  },
  fallbackContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  textContainer: {
    marginLeft: 12,
    justifyContent: 'center',
    flex: 1,
    flexShrink: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
});
