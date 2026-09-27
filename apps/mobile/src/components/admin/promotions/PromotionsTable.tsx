import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Skeleton } from '@/components/Skeleton';
import { PromotionRecord } from './types';
import { statusConfig } from './utils';

interface PromotionsTableProps {
  promotions: PromotionRecord[];
  loading: boolean;
  approvingId: string | null;
  colors: any;
  onApprove: (promotion: PromotionRecord) => void;
  onReject: (promotion: PromotionRecord) => void;
  onNewPromotion: () => void;
}

export const PromotionsTable: React.FC<PromotionsTableProps> = ({
  promotions,
  loading,
  approvingId,
  colors,
  onApprove,
  onReject,
  onNewPromotion,
}) => {
  const renderHeader = () => (
    <View style={styles.topHeaderBar}>
      <ThemedText type="defaultSemiBold" style={{ fontSize: 15 }}>Individual Promotions</ThemedText>
    </View>
  );

  if (loading) {
    return (
      <View style={{ gap: 10, paddingVertical: 4 }}>
        {renderHeader()}
        {Array.from({ length: 4 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.card,
              { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected },
            ]}
          >
            <Skeleton width="50%" height={16} />
            <Skeleton width="80%" height={12} style={{ marginTop: 8 }} />
            <Skeleton width="30%" height={12} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>
    );
  }

  if (promotions.length === 0) {
    return (
      <View style={{ gap: 12 }}>
        {renderHeader()}
        <View style={[styles.emptyContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          <Ionicons name="swap-horizontal-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.4, marginBottom: 8 }} />
          <ThemedText style={{ color: colors.textSecondary, fontWeight: '600' }}>No promotion records found</ThemedText>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
            Tap &quot;+&quot; button to create individual promotion request.
          </ThemedText>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: { item: PromotionRecord }) => {
    const config = statusConfig[item.status] || statusConfig.pending;
    const isApproving = approvingId === item.id;

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected },
        ]}
      >
        {/* Header Row: Student Name & Status Badge */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.backgroundSelected }]}>
              <ThemedText style={{ fontWeight: 'bold', fontSize: 12, color: colors.text }}>
                {item.studentName ? item.studentName.charAt(0).toUpperCase() : 'S'}
              </ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }} numberOfLines={1}>
                {item.studentName}
              </ThemedText>
              {!!item.rollNumber && (
                <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>
                  Roll No: {item.rollNumber}
                </ThemedText>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
            <ThemedText style={{ fontSize: 11, fontWeight: '700', color: config.color }}>
              {config.label}
            </ThemedText>
          </View>
        </View>

        {/* Transfer Detail Row */}
        <View style={[styles.transferBox, { backgroundColor: colors.background }]}>
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' }}>From</ThemedText>
            <ThemedText style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{item.fromClassName}</ThemedText>
          </View>
          <Ionicons name="arrow-forward" size={16} color="#007AFF" style={{ marginHorizontal: 8 }} />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <ThemedText style={{ fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' }}>To</ThemedText>
            <ThemedText style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{item.toClassName}</ThemedText>
          </View>
        </View>

        {/* Academic Year & Remarks */}
        <View style={styles.footerRow}>
          <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>
            Year: <ThemedText style={{ fontWeight: '600', color: colors.text }}>{item.academicYear}</ThemedText>
          </ThemedText>
          {!!item.remarks && (
            <ThemedText numberOfLines={1} style={{ fontSize: 11, color: colors.textSecondary, flex: 1, textAlign: 'right', marginLeft: 8 }}>
              {item.remarks}
            </ThemedText>
          )}
        </View>

        {/* Action Buttons for Pending Status */}
        {item.status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#34C759' }]}
              onPress={() => onApprove(item)}
              disabled={isApproving}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
              <ThemedText style={styles.actionBtnText}>{isApproving ? 'Approving...' : 'Approve'}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#FF3B30' }]}
              onPress={() => onReject(item)}
              disabled={isApproving}
            >
              <Ionicons name="close-circle-outline" size={16} color="#FFF" />
              <ThemedText style={styles.actionBtnText}>Reject</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <FlashList
      data={promotions}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={{ paddingVertical: 4 }}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  transferBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  addSquareBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
