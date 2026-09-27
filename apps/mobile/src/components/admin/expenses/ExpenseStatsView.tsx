import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { ExpenseStats } from './types';
import { useSettings } from '@/store/settings-context';

interface ExpenseStatsViewProps {
  stats: ExpenseStats | null;
  colors: any;
}

const getCategoryConfig = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('bill') || lower.includes('utility') || lower.includes('electricity') || lower.includes('water')) {
    return { icon: 'bulb-outline', color: '#FF9500' };
  }
  if (lower.includes('salary') || lower.includes('salaries') || lower.includes('staff')) {
    return { icon: 'people-outline', color: '#34C759' };
  }
  if (lower.includes('rent') || lower.includes('building') || lower.includes('lease')) {
    return { icon: 'home-outline', color: '#007AFF' };
  }
  if (lower.includes('supply') || lower.includes('supplies') || lower.includes('stationery') || lower.includes('book')) {
    return { icon: 'book-outline', color: '#5856D6' };
  }
  if (lower.includes('transport') || lower.includes('bus') || lower.includes('fuel')) {
    return { icon: 'bus-outline', color: '#AF52DE' };
  }
  if (lower.includes('food') || lower.includes('canteen') || lower.includes('meal')) {
    return { icon: 'fast-food-outline', color: '#FF2D55' };
  }
  if (lower.includes('maintenance') || lower.includes('repair')) {
    return { icon: 'construct-outline', color: '#FF3B30' };
  }
  return { icon: 'cash-outline', color: '#007AFF' };
};

export function ExpenseStatsView({ stats, colors }: ExpenseStatsViewProps) {
  const { activeTheme } = useSettings();
  const isDark = activeTheme === 'dark';

  return (
    <View style={styles.headerContainer}>
      {/* Stats Cards Section with Linear Gradients */}
      <View style={styles.statsRow}>
        <LinearGradient 
          colors={['#FF5E62', '#FF9966']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={styles.statCardGradient}
        >
          <View style={styles.statIconBadge}>
            <Ionicons name="time-outline" size={18} color="#FF5E62" />
          </View>
          <ThemedText style={styles.statLabelLight}>Previous Month</ThemedText>
          <ThemedText style={styles.statValueLight}>
            {stats?.prevMonthExpenses == null
              ? '—'
              : `₹${stats.prevMonthExpenses.toLocaleString()}`}
          </ThemedText>
        </LinearGradient>

        <LinearGradient 
          colors={['#11998e', '#38ef7d']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={styles.statCardGradient}
        >
          <View style={styles.statIconBadge}>
            <Ionicons name="calendar-outline" size={18} color="#11998e" />
          </View>
          <ThemedText style={styles.statLabelLight}>This Month</ThemedText>
          <ThemedText style={styles.statValueLight}>
            ₹{(stats?.thisMonthExpenses || 0).toLocaleString()}
          </ThemedText>
        </LinearGradient>
      </View>

      {/* Category wise horizontal breakdown */}
      {stats?.categoryWiseExpenses && stats.categoryWiseExpenses.length > 0 && (
        <View style={styles.breakdownContainer}>
          <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>Category Breakdown</ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.breakdownScroll}
          >
            {stats.categoryWiseExpenses.map((c) => {
              const cfg = getCategoryConfig(c.categoryName);
              const percentage = (stats?.totalExpenses || 0) > 0 
                ? Math.round((c.amount / stats.totalExpenses) * 100) 
                : 0;

              return (
                <View 
                  key={c.categoryId} 
                  style={[
                    styles.breakdownCard, 
                    { 
                      backgroundColor: colors.backgroundElement, 
                      borderColor: colors.backgroundSelected,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0.3 : 0.06,
                      shadowRadius: 4,
                      elevation: 2,
                    }
                  ]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.categoryIconCircle, { backgroundColor: cfg.color + '18' }]}>
                      <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
                    </View>
                    <ThemedText style={[styles.breakdownName, { color: colors.textSecondary }]} numberOfLines={1}>
                      {c.categoryName}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.breakdownVal, { color: colors.text }]}>
                    ₹{c.amount.toLocaleString()}
                  </ThemedText>
                  <View style={[styles.percentageBadge, { backgroundColor: cfg.color + '15', borderColor: cfg.color + '30' }]}>
                    <ThemedText style={[styles.percentageLabel, { color: cfg.color }]}>
                      {percentage}% of total
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCardGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 110,
    justifyContent: 'center',
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabelLight: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statValueLight: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  breakdownContainer: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  breakdownScroll: {
    gap: 12,
    paddingRight: 16,
  },
  breakdownCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    minWidth: 145,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoryIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakdownName: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    flex: 1,
    letterSpacing: 0.3,
  },
  breakdownVal: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  percentageBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  percentageLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
});
