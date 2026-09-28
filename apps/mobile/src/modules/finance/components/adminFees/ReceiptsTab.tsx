import React from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { Receipt } from './types';
import { FlashList } from '@shopify/flash-list';

interface ReceiptsTabProps {
  colors: any;
  receiptSearch: string;
  setReceiptSearch: (s: string) => void;
  filteredReceipts: Receipt[];
  setSelectedReceipt: (r: Receipt) => void;
  setReceiptDetailVisible: (v: boolean) => void;
  onEndReached?: () => void;
  isLoadingMore?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

const TypedFlashList = FlashList as any;

export function ReceiptsTab({
  colors,
  receiptSearch,
  setReceiptSearch,
  filteredReceipts,
  setSelectedReceipt,
  setReceiptDetailVisible,
  onEndReached,
  isLoadingMore = false,
  isRefreshing = false,
  onRefresh
}: ReceiptsTabProps) {
  const renderFooter = React.useCallback(() => (
    isLoadingMore ? (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    ) : <View style={{ height: 20 }} />
  ), [isLoadingMore]);

  return (
    <View style={{ flex: 1, width: '100%', gap: 16 }}>
      <View style={[styles.searchBar, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
        <Ionicons name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search receipts by student or receipt number..."
          placeholderTextColor={colors.textSecondary}
          value={receiptSearch}
          onChangeText={setReceiptSearch}
          style={[styles.searchInputText, { color: colors.text }]}
        />
      </View>

      {filteredReceipts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={{ color: colors.textSecondary }}>No receipts found.</ThemedText>
        </View>
      ) : (
        <TypedFlashList
          data={filteredReceipts}
          estimatedItemSize={85}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#007AFF']} />
            ) : undefined
          }
          ListFooterComponent={renderFooter}
          keyExtractor={(item: Receipt) => item.id}
          renderItem={({ item: r }: { item: Receipt }) => (
            <TouchableOpacity
              style={[styles.receiptCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}
              onPress={() => {
                setSelectedReceipt(r);
                setReceiptDetailVisible(true);
              }}
            >
              <View style={styles.receiptHeader}>
                <View>
                  <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>{r.receiptNumber}</ThemedText>
                  <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>{r.studentName}</ThemedText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText style={{ fontWeight: 'bold', color: '#34C759', fontSize: 15 }}>₹{r.paidAmount}</ThemedText>
                  <ThemedText style={{ fontSize: 10, color: colors.textSecondary }}>{r.paymentMethod.toUpperCase()}</ThemedText>
                </View>
              </View>
              <View style={styles.receiptFooter}>
                <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>Date: {r.paidDate.slice(0, 10)}</ThemedText>
                <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInputText: {
    flex: 1,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  receiptCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  receiptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
