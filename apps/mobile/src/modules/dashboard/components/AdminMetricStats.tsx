import React from 'react';
import { StyleSheet, View, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface MetricStatsProps {
  data?: {
    totalParents: number;
    totalClasses: number;
    totalRevenue: number;
    totalStaff: number;
  };
}

export function MetricStats({ data }: MetricStatsProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const router = useRouter();
  
  if (!data) return null;

  const isDark = activeTheme === 'dark';
  const isLargeScreen = width >= 600;
  const isSmallDevice = width <= 375;
  const availableWidth = Math.min(width, 800) - 32;
  const cardWidth = isLargeScreen 
    ? (availableWidth - 36) / 4 
    : (isSmallDevice ? 110 : 130);

  const cardPaddingV = isLargeScreen ? 18 : (isSmallDevice ? 12 : 18);
  const cardPaddingH = isLargeScreen ? 12 : (isSmallDevice ? 8 : 12);
  const iconSize = isLargeScreen ? 22 : (isSmallDevice ? 18 : 22);
  const iconContainerSize = isLargeScreen ? 44 : (isSmallDevice ? 36 : 44);

  const metrics = [
    { 
      label: 'Revenue', 
      value: `₹${data.totalRevenue.toLocaleString()}`, 
      icon: 'cash', 
      color: '#34C759',
      route: '/(admin)/(tabs)/fees',
      gradient: isDark ? ['#182B20', '#101F16'] : ['#F2FBF5', '#FFFFFF']
    },
    { 
      label: 'Parents', 
      value: data.totalParents.toLocaleString(), 
      icon: 'people', 
      color: '#5856D6',
      route: '/(admin)/(tabs)/parents',
      gradient: isDark ? ['#1A1B2E', '#141424'] : ['#F4F2FF', '#FFFFFF']
    },
    { 
      label: 'Classes', 
      value: data.totalClasses.toLocaleString(), 
      icon: 'business', 
      color: '#FF9500',
      route: '/(admin)/(tabs)/classes',
      gradient: isDark ? ['#2D2318', '#1F1810'] : ['#FFF9F0', '#FFFFFF']
    },
    { 
      label: 'Staff', 
      value: data.totalStaff.toLocaleString(), 
      icon: 'person-circle', 
      color: '#AF52DE',
      route: '/(admin)/(tabs)/staff',
      gradient: isDark ? ['#281B34', '#1E1328'] : ['#FAF2FF', '#FFFFFF']
    },
  ];

  if (isLargeScreen) {
    return (
      <View style={styles.largeRowContainer}>
        {metrics.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            style={{ flex: 1 }}
            onPress={() => router.push(item.route as any)}
          >
            <LinearGradient 
              colors={item.gradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.statCard, 
                { 
                  flex: 1,
                  borderColor: isDark ? `${item.color}30` : `${item.color}25`,
                  shadowColor: isDark ? '#000000' : item.color,
                }
              ]}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.label}
              </ThemedText>
              <ThemedText 
                style={[styles.statNumber, { color: colors.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {item.value}
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
      style={styles.scrollView}
    >
      {metrics.map((item, index) => (
        <TouchableOpacity
          key={index}
          activeOpacity={0.7}
          onPress={() => router.push(item.route as any)}
        >
          <LinearGradient 
            colors={item.gradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.statCard, 
              { 
                width: cardWidth,
                paddingVertical: cardPaddingV,
                paddingHorizontal: cardPaddingH,
                borderColor: isDark ? `${item.color}30` : `${item.color}25`,
                shadowColor: isDark ? '#000000' : item.color,
              }
            ]}
          >
            <View style={[styles.iconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2, backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon as any} size={iconSize} color={item.color} />
            </View>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary, fontSize: isSmallDevice ? 11 : 12 }]} numberOfLines={1}>
              {item.label}
            </ThemedText>
            <ThemedText 
              style={[styles.statNumber, { color: colors.text, fontSize: isSmallDevice ? 15 : 18 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {item.value}
            </ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    marginBottom: 20,
    marginHorizontal: -16,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
    paddingVertical: 4, // Padding for card shadow overflow
  },
  largeRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
    paddingVertical: 4,
  },
  statCard: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1.5,
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
