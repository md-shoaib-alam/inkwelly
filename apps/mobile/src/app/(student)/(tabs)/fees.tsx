import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { FeeSummary } from '@/components/parent/fees/FeeSummary';
import { Skeleton } from '@/components/Skeleton';

const formatFeeDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  try {
    return format(new Date(dateStr), 'dd-MM-yyyy');
  } catch (e) {
    return 'N/A';
  }
};

const TypedFlashList = FlashList as any;

export default function StudentFeesScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fees, setFees] = useState<any[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchData = useCallback(async (pageNum: number, isRefresh = false) => {
    try {
      if (pageNum === 1 && !isRefresh) {
        setLoading(true);
      }
      setError(null);
      const studentMe = await api.get('/students/me');
      if (studentMe && studentMe.id) {
        const params: Record<string, any> = { 
          studentId: studentMe.id,
          page: pageNum,
          limit: 10
        };
        if (isRefresh) {
          params.refresh = 'true';
        }
        const feesData = await api.get('/fees', { params });
        const items = feesData && Array.isArray(feesData.items) ? feesData.items : [];
        const totalPagesNum = feesData && feesData.totalPages ? feesData.totalPages : 1;

        if (pageNum === 1) {
          setFees(items);
        } else {
          setFees(prev => [...prev, ...items]);
        }
        setTotalPages(totalPagesNum);
        setPage(pageNum);
      } else {
        setError('Student profile not found');
      }
    } catch (err: any) {
      console.warn('Failed to load student fees details:', err);
      setError(err?.message || 'Failed to load fees details');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(1, true);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore && !loading) {
      setLoadingMore(true);
      fetchData(page + 1);
    }
  };

  const summary = useMemo(() => {
    const total = fees.reduce((sum, f) => sum + f.amount, 0);
    const paid = fees
      .filter((f) => f.status === 'paid')
      .reduce((sum, f) => sum + f.paidAmount, 0);
    const pending = fees
      .filter((f) => f.status === 'pending')
      .reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
    const overdue = fees
      .filter((f) => f.status === 'overdue')
      .reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
    return { total, paid, pending, overdue };
  }, [fees]);

  const nextDueDate = useMemo(() => {
    const rawNextDate = fees.find((f) => f.status !== 'paid')?.dueDate;
    return rawNextDate ? formatFeeDate(rawNextDate) : 'None';
  }, [fees]);

  const handlePayFee = async (feeId: string, amount: number, concession: number = 0) => {
    setPayingId(feeId);
    try {
      const studentMe = await api.get('/students/me');
      if (studentMe && studentMe.id) {
        await api.post('/fee-receipts', {
          studentId: studentMe.id,
          feeIds: [feeId],
          totalAmount: amount,
          paidAmount: amount - concession,
          concessionTotal: concession,
          paymentMethod: 'online',
        });
        Alert.alert('Payment Successful', 'Your fee payment has been successfully processed.');
        fetchData(1, true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Payment processing failed.');
    } finally {
      setPayingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#34C759'; // green
      case 'overdue': return '#FF3B30'; // red
      default: return '#FF9500'; // pending/orange
    }
  };

  const getFeeTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'tuition': return 'book';
      case 'exam': return 'create';
      case 'library': return 'library';
      case 'transport': return 'bus';
      default: return 'cash';
    }
  };



  if (loading || refreshing) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#007AFF']} />}
        >
          {/* FeeSummary Skeleton */}
          <View style={{ height: 130, borderRadius: 24, padding: 16, backgroundColor: colors.backgroundElement, gap: 12, marginBottom: 16, justifyContent: 'center' }}>
            <Skeleton width="40%" height={16} />
            <Skeleton width="70%" height={28} />
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
              <Skeleton width="45%" height={12} />
              <Skeleton width="45%" height={12} />
            </View>
          </View>

          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Fee Invoices</ThemedText>

          {/* FeeList Skeletons */}
          <View style={{ gap: 12 }}>
            {[1, 2, 3].map(i => (
              <View key={i} style={{ padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: colors.backgroundSelected || '#E5E7EB', backgroundColor: colors.backgroundElement }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Skeleton width="50%" height={18} />
                  <Skeleton width="20%" height={18} />
                </View>
                <View style={{ flexDirection: 'row', gap: 14, marginBottom: 16 }}>
                  <Skeleton width="40%" height={12} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12 }}>
                  <Skeleton width="30%" height={24} borderRadius={10} />
                  <Skeleton width="25%" height={28} borderRadius={10} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.center, { padding: 24 }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" style={{ marginBottom: 12 }} />
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
          {error}
        </ThemedText>
        <TouchableOpacity 
          style={[styles.payBtn, { width: 120, paddingHorizontal: 16 }]} 
          onPress={handleRefresh}
        >
          <ThemedText style={styles.payBtnText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <TypedFlashList
        data={fees}
        keyExtractor={(item: any) => item.id}
        estimatedItemSize={150}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.scrollContent}
        renderItem={({ item }: { item: any }) => {
          const statusColor = getStatusColor(item.status);
          const isPaid = item.status === 'paid';
          const iconName = getFeeTypeIcon(item.type);

          return (
            <View style={[styles.invoiceCard, { backgroundColor: colors.backgroundElement }]}>
              <View style={styles.cardHeader}>
                <View style={styles.typeTitleRow}>
                  <View style={[styles.typeIconBox, { backgroundColor: colors.backgroundSelected }]}>
                    <Ionicons name={iconName as any} size={20} color="#007AFF" />
                  </View>
                  <ThemedText style={styles.feeType}>{item.type.toUpperCase()}</ThemedText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                  <ThemedText style={{ color: statusColor, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                    {item.status}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.amountGrid}>
                <View style={styles.amountCol}>
                  <ThemedText style={[styles.amountLabel, { color: colors.textSecondary }]}>Total Amount</ThemedText>
                  <ThemedText style={styles.amountVal}>₹{item.amount.toLocaleString()}</ThemedText>
                </View>
                <View style={styles.amountCol}>
                  <ThemedText style={[styles.amountLabel, { color: colors.textSecondary }]}>Paid Amount</ThemedText>
                  <ThemedText style={[styles.amountVal, { color: '#34C759' }]}>₹{item.paidAmount.toLocaleString()}</ThemedText>
                </View>
                <View style={styles.amountCol}>
                  <ThemedText style={[styles.amountLabel, { color: colors.textSecondary }]}>Due Date</ThemedText>
                  <ThemedText style={styles.amountVal}>{formatFeeDate(item.dueDate)}</ThemedText>
                </View>
              </View>

              {!isPaid && (
                <View style={[styles.payBtn, { backgroundColor: isDark ? '#222530' : '#EAECEF', borderStyle: 'dashed', borderWidth: 1, borderColor: isDark ? '#2E313D' : '#C7C9CC' }]}>
                  <Ionicons name="school-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <ThemedText style={[styles.payBtnText, { color: colors.textSecondary }]}>Pay at School</ThemedText>
                </View>
              )}
            </View>
          );
        }}
        ListHeaderComponent={
          <View>
            {/* Financial Overview stats */}
            <View style={{ marginBottom: 8 }}>
              <FeeSummary 
                totalDue={`₹${summary.total.toLocaleString()}`}
                paidAmount={`₹${summary.paid.toLocaleString()}`}
                pendingAmount={`₹${(summary.pending + summary.overdue).toLocaleString()}`}
                nextDueDate={nextDueDate}
              />
            </View>

            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Fee Invoices</ThemedText>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ padding: 16 }} color="#007AFF" />
          ) : (
            <View style={{ height: 40 }} />
          )
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
            <ThemedText style={{ marginTop: 12, color: colors.textSecondary }}>No fee records found.</ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
    marginTop: 8,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  feeType: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  amountGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  amountCol: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 10,
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  amountVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  payBtn: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  payBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
