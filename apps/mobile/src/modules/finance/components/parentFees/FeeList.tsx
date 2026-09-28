import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

import { shareReceiptAsPDF, printReceiptAsPDF } from '@/lib/pdf-export';
import { useAuth } from '@/store/auth-context';
import { SubscriptionLockModal } from '../../../tenancy/components/ParentSubscriptionLockModal';

const TypedFlashList = FlashList as any;

interface FeeItem {
  id: string;
  type: string;
  amount: string;
  paidAmount?: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  paidDate?: string;
  studentName?: string;
  studentId?: string;
  className?: string;
}

// Pure helpers — defined at module scope so they are never recreated on render
function getStatusColor(status: FeeItem['status']): string {
  switch (status) {
    case 'paid': return '#34C759';
    case 'pending': return '#FF9500';
    case 'overdue': return '#FF3B30';
    default: return '#8E8E93';
  }
}

function getStatusBadgeStyles(status: FeeItem['status'], isDark: boolean) {
  if (isDark) {
    switch (status) {
      case 'paid':
        return { bg: 'rgba(52, 199, 89, 0.15)', border: 'transparent', text: '#30D158' };
      case 'pending':
        return { bg: 'rgba(255, 149, 0, 0.15)', border: 'transparent', text: '#FF9F0A' };
      case 'overdue':
        return { bg: 'rgba(255, 59, 48, 0.15)', border: 'transparent', text: '#FF453A' };
      default:
        return { bg: 'rgba(142, 142, 147, 0.15)', border: 'transparent', text: '#8E8E93' };
    }
  } else {
    switch (status) {
      case 'paid':
        return { bg: '#E8F5E9', border: '#C8E6C9', text: '#2E7D32' };
      case 'pending':
        return { bg: '#FFF3E0', border: '#FFE0B2', text: '#E65100' };
      case 'overdue':
        return { bg: '#FFEBEE', border: '#FFCDD2', text: '#C62828' };
      default:
        return { bg: '#F2F2F7', border: '#E5E5EA', text: '#8E8E93' };
    }
  }
}

interface FeeListProps {
  fees: FeeItem[];
  onPay: (fee: FeeItem) => void;
}

export function FeeList({ fees, onPay }: FeeListProps) {
  const { activeTheme } = useSettings();
  const { user } = useAuth();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';


  const router = useRouter();
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [lockModalVisible, setLockModalVisible] = useState(false);

  useEffect(() => {
    async function checkSubscription() {
      try {
        const response = await api.get('/subscriptions') as any;
        if (response && response.activeSubscription) {
          setHasSubscription(true);
        } else {
          setHasSubscription(false);
        }
      } catch (err) {
        setHasSubscription(false);
      }
    }
    checkSubscription();
  }, []);

  // Stable renderItem reference — only recreates if colors/isDark/onPay changes
  const renderItem = useCallback(({ item: fee }: { item: FeeItem }) => {
    const badgeStyles = getStatusBadgeStyles(fee.status, isDark);
    
    const checkSubscriptionAndExecute = (action: () => void) => {
      if (!hasSubscription) {
        setLockModalVisible(true);
        return;
      }
      action();
    };

    const handleDownloadReceipt = async () => {
      checkSubscriptionAndExecute(async () => {
        try {
          const cleanAmount = parseFloat(fee.amount.replace('₹', '').replace(/,/g, ''));
          const cleanPaidAmount = fee.paidAmount || cleanAmount;
          
          await shareReceiptAsPDF({
            receiptNumber: `REC-${fee.id.substring(0, 8).toUpperCase()}`,
            paidDate: fee.paidDate || fee.dueDate,
            studentName: fee.studentName || 'Student',
            studentId: fee.studentId || 'N/A',
            parentName: user?.name || 'Guardian',
            className: fee.className || 'Grade Class',
            paymentMethod: 'online',
            paidAmount: cleanPaidAmount,
            schoolName: user?.tenantName || undefined,
            schoolLogo: user?.tenantLogo || undefined,
            feeItems: [
              {
                feeCategoryName: fee.type + ' Fee',
                paidAmount: cleanPaidAmount,
              }
            ]
          });
        } catch (err) {
          console.error('Failed to generate PDF:', err);
        }
      });
    };

    return (
            <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected, marginBottom: 12 }]}>
              {/* Top Row */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <ThemedText style={styles.feeType}>{fee.type}</ThemedText>
                    {fee.studentName && (
                      <View style={styles.studentTag}>
                        <ThemedText style={styles.studentTagText}>
                          {fee.studentName}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
                <ThemedText style={styles.amount}>{fee.amount}</ThemedText>
              </View>
              
              {/* Info Row (Due/Paid Dates) */}
              <View style={styles.infoRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="calendar-outline" size={13} color={colors.text} style={{ opacity: 0.8 }} />
                  <ThemedText style={{ fontSize: 12, color: colors.text, opacity: 0.8 }}>
                    Due: <ThemedText style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>{fee.dueDate}</ThemedText>
                  </ThemedText>
                </View>
 
                {fee.status === 'paid' && fee.paidDate && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="checkmark-done-circle-outline" size={13} color="#34C759" />
                    <ThemedText style={{ fontSize: 12, color: '#34C759' }}>
                      Paid: <ThemedText style={{ color: '#34C759', fontWeight: '700', fontSize: 12 }}>{fee.paidDate}</ThemedText>
                    </ThemedText>
                  </View>
                )}
              </View>
 
              {/* Footer Row */}
              <View style={styles.cardFooter}>
                <View style={[styles.statusBadge, { backgroundColor: badgeStyles.bg, borderColor: badgeStyles.border, borderWidth: isDark ? 0 : 1 }]}>
                  <View style={[styles.statusDot, { backgroundColor: badgeStyles.text }]} />
                  <ThemedText style={[styles.statusText, { color: badgeStyles.text }]}>
                    {fee.status.toUpperCase()}
                  </ThemedText>
                </View>
                
                {fee.status !== 'paid' && (
                  <View style={styles.payAtSchoolBadge}>
                    <Ionicons name="school-outline" size={13} color="#8E8E93" />
                    <ThemedText style={styles.payAtSchoolText}>Pay at School</ThemedText>
                  </View>
                )}
                
                {fee.status === 'paid' && (
                  <TouchableOpacity 
                    style={[
                      styles.receiptButton, 
                      { 
                        backgroundColor: hasSubscription ? 'rgba(0,122,255,0.08)' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(11,30,64,0.04)'), 
                        borderColor: hasSubscription ? 'rgba(0,122,255,0.2)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(11,30,64,0.08)') 
                      }
                    ]} 
                    activeOpacity={0.8}
                    onPress={() => {
                      checkSubscriptionAndExecute(async () => {
                        try {
                          const cleanAmount = parseFloat(fee.amount.replace('₹', '').replace(/,/g, ''));
                          const cleanPaidAmount = fee.paidAmount || cleanAmount;
                          
                          await printReceiptAsPDF({
                            receiptNumber: `REC-${fee.id.substring(0, 8).toUpperCase()}`,
                            paidDate: fee.paidDate || fee.dueDate,
                            studentName: fee.studentName || 'Student',
                            studentId: fee.studentId || 'N/A',
                            parentName: user?.name || 'Guardian',
                            className: fee.className || 'Grade Class',
                            paymentMethod: 'online',
                            paidAmount: cleanPaidAmount,
                            schoolName: user?.tenantName || undefined,
                            schoolLogo: user?.tenantLogo || undefined,
                            feeItems: [
                              {
                                feeCategoryName: fee.type + ' Fee',
                                paidAmount: cleanPaidAmount,
                              }
                            ]
                          });
                        } catch (err) {
                          console.error('Failed to trigger direct receipt print:', err);
                        }
                      });
                    }}
                  >
                    <Ionicons 
                      name={hasSubscription ? "print-outline" : "lock-closed"} 
                      size={14} 
                      color={hasSubscription ? "#007AFF" : (isDark ? "rgba(255,255,255,0.4)" : "rgba(11, 30, 64, 0.4)")} 
                    />
                    <ThemedText style={[
                      styles.receiptButtonText, 
                      { color: hasSubscription ? "#007AFF" : (isDark ? "rgba(255,255,255,0.4)" : "rgba(11, 30, 64, 0.4)") }
                    ]}>
                      Receipt
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
  }, [colors, isDark, onPay, user, hasSubscription, router]);


  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>Recent Invoices</ThemedText>
      <TypedFlashList
        data={fees}
        keyExtractor={(item: FeeItem) => item.id}
        estimatedItemSize={120}
        scrollEnabled={false}
        renderItem={renderItem}
      />
      
      <SubscriptionLockModal 
        visible={lockModalVisible} 
        onClose={() => setLockModalVisible(false)} 
        onSubscribe={() => {
          setLockModalVisible(false);
          router.push('/(parent)/subscription');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  feeType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 16,
  },
  dueDate: {
    fontSize: 12,
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  payAtSchoolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(142,142,147,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(142,142,147,0.2)',
  },
  payAtSchoolText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  receiptButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  studentTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(0,122,255,0.2)',
    backgroundColor: 'rgba(0,122,255,0.06)',
  },
  studentTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
