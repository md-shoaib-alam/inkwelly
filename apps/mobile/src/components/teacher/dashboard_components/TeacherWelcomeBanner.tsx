import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';

interface TeacherWelcomeBannerProps {
  userName: string;
  onOpenQRScan?: () => void;
}

export function TeacherWelcomeBanner({ userName, onOpenQRScan }: TeacherWelcomeBannerProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  const initials = (userName || 'TE')
    .trim()
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        styles.bannerCard,
        {
          backgroundColor: isDark ? '#0C1526' : '#F0F9FF',
          borderColor: isDark ? 'rgba(59,130,246,0.3)' : '#BAE6FD',
        },
      ]}
    >
      {/* Decorative ambient background accents */}
      <View
        style={[
          styles.glowCircle1,
          { backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(186,230,253,0.5)' },
        ]}
      />
      <View
        style={[
          styles.glowCircle2,
          { backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(209,250,229,0.4)' },
        ]}
      />

      <View style={styles.contentRow}>
        {/* Left greeting & action */}
        <View style={styles.textWrap}>
          <Text style={[styles.welcomeSub, { color: isDark ? '#60A5FA' : '#0369A1' }]}>
            Welcome back,
          </Text>
          <Text
            style={[styles.userNameText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}
            numberOfLines={1}
          >
            {userName}
          </Text>
          <Text
            style={[styles.descText, { color: isDark ? '#94A3B8' : '#64748B' }]}
            numberOfLines={2}
          >
            Here&apos;s what&apos;s happening with your classes today.
          </Text>

          {onOpenQRScan && (
            <TouchableOpacity
              onPress={onOpenQRScan}
              style={styles.scanBtn}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#2563EB', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scanBtnGradient}
              >
                <Ionicons name="qr-code" size={15} color="#FFFFFF" />
                <Text style={styles.scanBtnText}>Scan Attendance QR</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Right illustration / Avatar circle */}
        <View style={styles.avatarWrap}>
          <LinearGradient
            colors={['#2563EB', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={styles.sparkleBadge}>
            <Ionicons name="sparkles" size={13} color="#F59E0B" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  glowCircle1: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  glowCircle2: {
    position: 'absolute',
    bottom: -30,
    right: 40,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  welcomeSub: {
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  descText: {
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 2,
  },
  scanBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  scanBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 4,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  sparkleBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
