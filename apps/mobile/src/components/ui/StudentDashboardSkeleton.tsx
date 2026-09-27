import React from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { Skeleton } from '@/components/Skeleton';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { LinearGradient } from 'expo-linear-gradient';

interface StudentDashboardSkeletonProps {
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export function StudentDashboardSkeleton({ isRefreshing = false, onRefresh }: StudentDashboardSkeletonProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#007AFF']} />
          ) : undefined
        }
      >
        {/* Greeting Skeleton */}
        <View style={{ paddingHorizontal: 16, marginTop: 24, marginBottom: 12 }}>
          <Skeleton width={180} height={24} borderRadius={6} />
          <Skeleton width={120} height={14} borderRadius={4} style={{ marginTop: 8 }} />
        </View>

        {/* Student Card Skeleton */}
        <View
          style={{ 
            borderRadius: 20,
            backgroundColor: isDark ? '#1E212C' : '#007AFF',
            borderWidth: 1.5,
            borderColor: isDark ? '#2E313D' : '#0066D6',
            marginHorizontal: 16,
            marginTop: 16,
            paddingVertical: 22,
            paddingHorizontal: 20,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {!isDark && (
            <LinearGradient
              colors={['#007AFF', '#0056B3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width={120} height={12} borderRadius={4} />
              <Skeleton width={180} height={20} borderRadius={6} />
            </View>
            <Skeleton width={48} height={48} borderRadius={24} />
          </View>
          <View style={{ height: 1, backgroundColor: isDark ? '#2E313D' : 'rgba(255, 255, 255, 0.15)', marginVertical: 14 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ gap: 6 }}>
              <Skeleton width={90} height={10} borderRadius={4} />
              <Skeleton width={110} height={14} borderRadius={4} />
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Skeleton width={80} height={10} borderRadius={4} />
              <Skeleton width={70} height={14} borderRadius={4} />
            </View>
          </View>
        </View>

        {/* Stat Cards Grid Skeleton */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 20 }}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={{
                width: '48%',
                padding: 16,
                borderRadius: 18,
                marginBottom: 16,
                borderWidth: 1.5,
                borderColor: isDark ? '#2E313D' : '#E5E7EB',
                backgroundColor: colors.backgroundElement,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton width={36} height={36} borderRadius={10} />
                <Ionicons name="chevron-forward-outline" size={13} color={colors.textSecondary} />
              </View>
              <Skeleton width="60%" height={12} borderRadius={4} />
              <Skeleton width="45%" height={18} borderRadius={6} />
            </View>
          ))}
        </View>

        {/* Quick Access Skeleton */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <Skeleton width={110} height={18} borderRadius={4} />
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <View 
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 50,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                  gap: 8,
                  width: 110,
                }}
              >
                <Skeleton width={20} height={20} borderRadius={10} />
                <Skeleton width={50} height={10} borderRadius={3} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Today's Schedule Skeleton */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Skeleton width={130} height={18} borderRadius={4} />
          <View
            style={{
              borderRadius: 20,
              padding: 16,
              marginTop: 12,
              borderWidth: 1.5,
              borderColor: isDark ? '#252A3D' : '#E8F0FE',
              backgroundColor: isDark ? '#1A1E2E' : '#FFFFFF',
              gap: 16,
            }}
          >
            {[1, 2].map((i) => (
              <View key={i} style={styles.slotRow}>
                <View style={styles.timelineCol}>
                  <Skeleton width={10} height={10} borderRadius={5} />
                  {i === 1 && <View style={[styles.timelineLine, { backgroundColor: isDark ? '#252A3D' : '#E8F0FE' }]} />}
                </View>
                <View style={styles.timeCol}>
                  <Skeleton width={45} height={12} borderRadius={3} />
                  <Skeleton width={35} height={10} borderRadius={3} style={{ marginTop: 4 }} />
                </View>
                <View 
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    padding: 10,
                    backgroundColor: isDark ? '#21263A' : 'rgba(0,122,255,0.04)',
                    gap: 8,
                  }}
                >
                  <Skeleton width="70%" height={14} borderRadius={4} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Skeleton width="45%" height={10} borderRadius={3} />
                    <Skeleton width={50} height={14} borderRadius={6} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Notices Card Skeleton */}
        <View style={{ paddingHorizontal: 16, marginTop: 24, marginBottom: 24 }}>
          <Skeleton width={100} height={18} borderRadius={4} />
          <View
            style={{
              borderRadius: 20,
              padding: 16,
              marginTop: 12,
              borderWidth: 1.5,
              borderColor: isDark ? '#252A3D' : '#E8F0FE',
              backgroundColor: isDark ? '#1A1E2E' : '#FFFFFF',
              gap: 14,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Skeleton width={32} height={32} borderRadius={8} />
                <View style={{ gap: 4 }}>
                  <Skeleton width={110} height={14} borderRadius={3} />
                  <Skeleton width={140} height={10} borderRadius={3} />
                </View>
              </View>
              <Skeleton width={80} height={20} borderRadius={8} />
            </View>

            <View style={{ gap: 12 }}>
              {[1, 2].map((i) => (
                <View 
                  key={i}
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isDark ? '#2A304D' : '#E0ECFF',
                    backgroundColor: isDark ? '#21263A' : '#F4F8FF',
                    padding: 12,
                    gap: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Skeleton width="50%" height={12} borderRadius={3} />
                    <Skeleton width={60} height={14} borderRadius={6} />
                  </View>
                  <Skeleton width="90%" height={10} borderRadius={3} />
                  <Skeleton width="40%" height={10} borderRadius={3} />
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 20,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  timelineCol: {
    width: 20,
    alignItems: 'center',
    paddingTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    minHeight: 30,
  },
  timeCol: {
    width: 52,
    paddingTop: 2,
    marginRight: 10,
  },
});
