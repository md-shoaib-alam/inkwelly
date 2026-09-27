import React from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { Skeleton } from '@/components/Skeleton';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';

interface DashboardSkeletonProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function DashboardSkeleton({ isRefreshing, onRefresh }: DashboardSkeletonProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  return (
    <ScrollView 
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#007AFF']} />
      }
    >
      {/* Welcome Banner Skeleton */}
      <Skeleton width="100%" height={120} borderRadius={20} style={{ marginBottom: 20 }} />

      {/* Quick Stats Grid Skeleton */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 }}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={{ 
            width: '48%', 
            padding: 16, 
            borderRadius: 18, 
            marginBottom: 16, 
            backgroundColor: colors.backgroundElement,
            borderWidth: 1,
            borderColor: colors.backgroundSelected,
            gap: 12
          }}>
            <Skeleton width={36} height={36} borderRadius={10} />
            <Skeleton width={85} height={12} />
            <Skeleton width={50} height={18} />
          </View>
        ))}
      </View>

      {/* Title Skeleton */}
      <Skeleton width={120} height={14} style={{ marginBottom: 12 }} />

      {/* Quick Actions Row Skeleton */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 24 }}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={{ 
            flex: 1, 
            paddingVertical: 14, 
            borderRadius: 16, 
            backgroundColor: colors.backgroundElement,
            borderWidth: 1,
            borderColor: colors.backgroundSelected,
            alignItems: 'center',
            gap: 8
          }}>
            <Skeleton width={38} height={38} borderRadius={12} />
            <Skeleton width={60} height={12} />
          </View>
        ))}
      </View>

      {/* Charts Skeletons */}
      <Skeleton width={150} height={14} style={{ marginBottom: 12 }} />
      <View style={{ gap: 16, marginBottom: 24 }}>
        <View style={{ height: 180, borderRadius: 20, backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.backgroundSelected, padding: 16, gap: 12 }}>
          <Skeleton width="40%" height={16} />
          <Skeleton width="100%" height={120} borderRadius={8} />
        </View>
        <View style={{ height: 180, borderRadius: 20, backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.backgroundSelected, padding: 16, gap: 12 }}>
          <Skeleton width="50%" height={16} />
          <Skeleton width="100%" height={120} borderRadius={8} />
        </View>
      </View>

      {/* Recent Notices Skeleton */}
      <Skeleton width={140} height={14} style={{ marginBottom: 12 }} />
      <View style={{ gap: 12 }}>
        {[1, 2, 3].map(i => (
          <View key={i} style={{ 
            height: 80, 
            borderRadius: 16, 
            backgroundColor: colors.backgroundElement, 
            borderWidth: 1, 
            borderColor: colors.backgroundSelected, 
            padding: 14,
            justifyContent: 'center',
            gap: 8
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Skeleton width="60%" height={14} />
              <Skeleton width="20%" height={10} />
            </View>
            <Skeleton width="80%" height={10} />
            <Skeleton width="45%" height={8} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
