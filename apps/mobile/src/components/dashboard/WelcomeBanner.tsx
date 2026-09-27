import React from 'react';
import { StyleSheet, View, useWindowDimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface WelcomeBannerProps {
  userName: string;
  tenantName?: string;
  tenantLogo?: string;
  subText?: string;
  isLoading?: boolean;
  summaryData?: {
    totalStudents: number;
    totalTeachers: number;
    attendanceRate: number;
    upcomingEvents: number;
  };
}

export function WelcomeBanner({ userName, tenantName, tenantLogo, subText, isLoading, summaryData }: WelcomeBannerProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 640;

  const schoolTitle = tenantName || userName || 'Demo Academy';

  // Resolve logo: if empty or '/test.webp', use local bundled asset
  const logoSource = (!tenantLogo || tenantLogo === '/test.webp')
    ? require('../../../assets/images/icon.png')
    : (typeof tenantLogo === 'string' && tenantLogo.startsWith('http')
        ? { uri: tenantLogo }
        : require('../../../assets/images/icon.png'));

  return (
    <View style={styles.outerContainer}>
      <LinearGradient
        colors={['#0D9488', '#0891B2', '#0F766E']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradientContainer}
      >
        {/* Background decorative circles exact to web */}
        {/* Web: absolute top-0 right-0 size-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 */}
        <View style={styles.circleTopRight} pointerEvents="none" />
        {/* Web: absolute bottom-0 left-1/3 size-48 bg-white/5 rounded-full translate-y-1/2 */}
        <View style={styles.circleBottomCenter} pointerEvents="none" />

        {/* Content container */}
        <View style={styles.content}>
          {/* Header Row: Logo & School Name */}
          <View style={styles.headerRow}>
            {/* Logo container: size-14 (56px), rounded-2xl (16px), bg-white/20 */}
            <View style={styles.logoContainer}>
              <Image
                source={logoSource}
                style={styles.logoImage}
                contentFit="cover"
                transition={200}
              />
            </View>

            {/* School Name */}
            <View style={styles.titleContainer}>
              <ThemedText
                style={styles.schoolName}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {schoolTitle}
              </ThemedText>
              {subText && (
                <ThemedText style={styles.subText} numberOfLines={1}>
                  {subText}
                </ThemedText>
              )}
            </View>
          </View>

          {/* Metric Cards Grid */}
          {summaryData && (
            <View style={[styles.statsGrid, isTablet && styles.statsGridTablet]}>
              {/* Total Students */}
              <View style={[styles.statCard, isTablet && styles.statCardTablet]}>
                <ThemedText style={styles.statLabel}>Total Students</ThemedText>
                <View style={styles.statValueRow}>
                  <Ionicons name="school" size={20} color="#99F6E4" style={styles.statIcon} />
                  <ThemedText style={styles.statValue}>
                    {summaryData.totalStudents ?? 0}
                  </ThemedText>
                </View>
              </View>

              {/* Total Teachers */}
              <View style={[styles.statCard, isTablet && styles.statCardTablet]}>
                <ThemedText style={styles.statLabel}>Total Teachers</ThemedText>
                <View style={styles.statValueRow}>
                  <Ionicons name="people" size={20} color="#99F6E4" style={styles.statIcon} />
                  <ThemedText style={styles.statValue}>
                    {summaryData.totalTeachers ?? 0}
                  </ThemedText>
                </View>
              </View>

              {/* Attendance Rate */}
              <View style={[styles.statCard, isTablet && styles.statCardTablet]}>
                <ThemedText style={styles.statLabel}>Attendance Rate</ThemedText>
                <View style={styles.statValueRow}>
                  <Ionicons name="pulse" size={20} color="#99F6E4" style={styles.statIcon} />
                  <ThemedText style={styles.statValue}>
                    {Number(summaryData.attendanceRate ?? 0).toFixed(2).replace(/\.00$/, '')}%
                  </ThemedText>
                </View>
              </View>

              {/* Upcoming Events */}
              <View style={[styles.statCard, isTablet && styles.statCardTablet]}>
                <ThemedText style={styles.statLabel}>Upcoming Events</ThemedText>
                <View style={styles.statValueRow}>
                  <Ionicons name="calendar-outline" size={20} color="#99F6E4" style={styles.statIcon} />
                  <ThemedText style={styles.statValue}>
                    {summaryData.upcomingEvents ?? 0}
                  </ThemedText>
                </View>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  gradientContainer: {
    borderRadius: 16, // rounded-2xl in Tailwind is 1rem (16px)
    padding: 24, // p-6 in Tailwind is 24px
    overflow: 'hidden',
    position: 'relative',
  },
  // absolute top-0 right-0 size-72 (288px) bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3
  circleTopRight: {
    position: 'absolute',
    top: -144,
    right: -96,
    width: 288,
    height: 288,
    borderRadius: 144,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  // absolute bottom-0 left-1/3 size-48 (192px) bg-white/5 rounded-full translate-y-1/2
  circleBottomCenter: {
    position: 'absolute',
    bottom: -96,
    left: '33%',
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  content: {
    position: 'relative',
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16, // gap-4 in Tailwind is 16px
    marginBottom: 12, // mb-3 in Tailwind is 12px
  },
  // size-14 (56px) rounded-2xl (16px) bg-white/20 overflow-hidden relative
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    flex: 1,
  },
  // text-2xl font-semibold tracking-tight (24px, font-weight: 600)
  schoolName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: undefined,
    }),
  },
  subText: {
    fontSize: 13,
    color: '#CCFBF1',
    marginTop: 2,
    fontWeight: '500',
  },
  // grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12, // gap-3 is 12px
    marginTop: 16, // mt-4 is 16px
  },
  statsGridTablet: {
    flexWrap: 'nowrap',
  },
  // bg-white/10 backdrop-blur-sm rounded-xl (12px) px-4 (16px) py-3 (12px)
  statCard: {
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statCardTablet: {
    width: 'auto',
    flex: 1,
  },
  // text-teal-100 text-xs font-medium
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#CCFBF1', // text-teal-100
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: undefined,
    }),
  },
  // text-2xl font-bold flex items-center gap-1
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    marginRight: 2,
  },
  statValue: {
    fontSize: 24, // text-2xl
    fontWeight: '700', // font-bold
    color: '#FFFFFF',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: undefined,
    }),
  },
});
