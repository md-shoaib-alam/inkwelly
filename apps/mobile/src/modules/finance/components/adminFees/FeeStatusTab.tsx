import React, { useState, useMemo } from 'react';
import { StyleSheet, View, RefreshControl, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { FeeItem } from './types';
import { FlashList } from '@shopify/flash-list';

interface FeeStatusTabProps {
  colors: any;
  totalCollected: number;
  pendingAmount: number;
  totalInvoiced: number;
  collectionPercentage: number;
  feeItems: FeeItem[];
  onEndReached?: () => void;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

const TypedFlashList = FlashList as any;

interface ListHeaderProps {
  colors: any;
  totalCollected: number;
  pendingAmount: number;
  totalInvoiced: number;
  collectionPercentage: number;
  timeFilter: 'month' | '3months' | '6months';
  setTimeFilter: (val: 'month' | '3months' | '6months') => void;
}

const ListHeader = React.memo(({
  colors,
  totalCollected,
  pendingAmount,
  totalInvoiced,
  collectionPercentage,
  timeFilter,
  setTimeFilter
}: ListHeaderProps) => (
  <View style={{ gap: 16, marginBottom: 12 }}>
    <View style={[styles.mainCard, { backgroundColor: colors.backgroundElement }]}>
      <ThemedText type="defaultSemiBold" style={styles.cardHeader}>Overall Collection Progress</ThemedText>
      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <ThemedText style={styles.statLabel} numberOfLines={1}>Collected</ThemedText>
          <ThemedText style={[styles.statValue, { color: '#34C759' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>₹{totalCollected.toLocaleString()}</ThemedText>
        </View>
        <View style={[styles.dividerLine, { backgroundColor: colors.backgroundSelected }]} />
        <View style={styles.statCol}>
          <ThemedText style={styles.statLabel} numberOfLines={1}>Pending</ThemedText>
          <ThemedText style={[styles.statValue, { color: '#FF9500' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>₹{pendingAmount.toLocaleString()}</ThemedText>
        </View>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${collectionPercentage}%` }]} />
      </View>
      <ThemedText style={styles.progressText}>
        {collectionPercentage}% of total dues collected (₹{totalInvoiced.toLocaleString()})
      </ThemedText>
    </View>

    <View style={styles.sectionHeaderRow}>
      <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Fee Categories & Progress</ThemedText>
      
      {/* Time filter selector in the corner */}
      <View style={[styles.filterContainer, { backgroundColor: colors.backgroundSelected }]}>
        <TouchableOpacity
          onPress={() => setTimeFilter('month')}
          style={[styles.filterChip, timeFilter === 'month' && { backgroundColor: '#007AFF' }]}
        >
          <ThemedText style={[styles.filterChipText, { color: timeFilter === 'month' ? '#FFF' : colors.textSecondary }]}>1M</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTimeFilter('3months')}
          style={[styles.filterChip, timeFilter === '3months' && { backgroundColor: '#007AFF' }]}
        >
          <ThemedText style={[styles.filterChipText, { color: timeFilter === '3months' ? '#FFF' : colors.textSecondary }]}>3M</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTimeFilter('6months')}
          style={[styles.filterChip, timeFilter === '6months' && { backgroundColor: '#007AFF' }]}
        >
          <ThemedText style={[styles.filterChipText, { color: timeFilter === '6months' ? '#FFF' : colors.textSecondary }]}>6M</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  </View>
));

export function FeeStatusTab({
  colors,
  totalCollected,
  pendingAmount,
  totalInvoiced,
  collectionPercentage,
  feeItems,
  onEndReached,
  isRefreshing = false,
  onRefresh
}: FeeStatusTabProps) {
  const [timeFilter, setTimeFilter] = useState<'month' | '3months' | '6months'>('month');

  const filteredFeeItems = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYearMonth = `${currentYear}-${currentMonth}`;

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    return feeItems.filter((item) => {
      if (!item.deadline || item.deadline === 'No Due Date') return false;

      if (timeFilter === 'month') {
        return item.deadline.startsWith(currentYearMonth);
      }

      const itemDate = new Date(item.deadline);
      if (isNaN(itemDate.getTime())) return false;

      if (timeFilter === '3months') {
        return itemDate >= threeMonthsAgo && itemDate <= now;
      }

      if (timeFilter === '6months') {
        return itemDate >= sixMonthsAgo && itemDate <= now;
      }

      return true;
    });
  }, [feeItems, timeFilter]);

  const listHeaderProps: ListHeaderProps = React.useMemo(() => ({
    colors,
    totalCollected,
    pendingAmount,
    totalInvoiced,
    collectionPercentage,
    timeFilter,
    setTimeFilter
  }), [colors, totalCollected, pendingAmount, totalInvoiced, collectionPercentage, timeFilter]);

  const renderHeader = React.useCallback(() => (
    <ListHeader {...listHeaderProps} />
  ), [listHeaderProps]);

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <TypedFlashList
        data={filteredFeeItems}
        estimatedItemSize={110}
        scrollEnabled={true}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#007AFF']} /> : undefined
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={{ color: colors.textSecondary }}>No fees recorded for the selected range.</ThemedText>
          </View>
        }
        keyExtractor={(item: FeeItem, index: number) => `${item.deadline}-${item.name}-${index}`}
        renderItem={({ item }: { item: FeeItem }) => {
          const progress = item.amount > 0 ? (item.collected / item.amount) * 100 : 0;
          const isPaid = progress >= 100;
          return (
            <View style={[styles.feeCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
                <View style={styles.feeHeader}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <ThemedText type="defaultSemiBold" style={styles.feeTitle}>{item.name}</ThemedText>
                    <ThemedText style={[styles.feeSubtitle, { color: colors.textSecondary }]}>Due: {item.deadline}</ThemedText>
                  </View>
                  <View style={styles.amountContainer}>
                    <ThemedText style={styles.feeAmount}>₹{item.amount.toLocaleString()}</ThemedText>
                  </View>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: isPaid ? '#34C759' : '#007AFF' }]} />
                </View>
                <View style={styles.feeFooter}>
                  <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>Collected: ₹{item.collected.toLocaleString()}</ThemedText>
                  <ThemedText style={{ fontSize: 12, fontWeight: '600', color: isPaid ? '#34C759' : '#007AFF' }}>
                    {isPaid ? 'Paid' : `${Math.round(progress)}% Collected`}
                  </ThemedText>
                </View>
              </View>
            );
          }}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 8,
  },
  cardHeader: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  statCol: {
    flex: 1,
    minWidth: 120,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: '#8e8e93',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dividerLine: {
    width: '100%',
    height: 1,
    marginVertical: 2,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#34C759',
  },
  progressText: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  feeCard: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 4,
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feeTitle: {
    fontSize: 15,
  },
  feeSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  feeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});
