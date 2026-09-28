import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity, Modal, Animated, Text, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';

import { ChildSelector } from '@/modules/people/components/ParentChildSelector';
import { FeeSummary } from '@/modules/finance/components/parentFees/FeeSummary';
import { FeeList } from '@/modules/finance/components/parentFees/FeeList';
import { Skeleton } from '@/components/Skeleton';
import { shareReceiptAsPDF, printReceiptAsPDF } from '@/lib/pdf-export';
import { SubscriptionLockModal } from '@/modules/tenancy/components/ParentSubscriptionLockModal';

export default function ParentFeesScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
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

  const checkSubscriptionAndExecute = (action: () => void) => {
    if (!hasSubscription) {
      setLockModalVisible(true);
      return;
    }
    action();
  };

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [allFees, setAllFees] = useState<any[]>([]);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');

  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchFeesData = async (silent = false) => {
    if (!user?.name) return;
    if (!silent) setIsLoading(true);
    try {
      const parentQuery = `
        query ParentDashboard($parentName: String!) {
          parentDashboard(parentName: $parentName) {
            children { 
              id userId name className classId
            }
            fees { id studentName type amount status dueDate paidDate paidAmount }
          }
        }
      `;
      const gqlRes = await api.post('/graphql', { query: parentQuery, variables: { parentName: user.name } }) as any;
      if (gqlRes.errors && gqlRes.errors.length > 0) {
        throw new Error(gqlRes.errors[0].message);
      }
      const data = gqlRes.data?.parentDashboard || {};
      const childList = data.children || [];
      setChildren(childList);
      setAllFees(data.fees || []);

      if (childList.length === 1) {
        setSelectedStudentId(childList[0].id);
      } else if (childList.length > 1 && selectedStudentId === '') {
        setSelectedStudentId('all');
      }
    } catch (error) {
      console.error('Failed to fetch fees dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchFeesData();
    }
  }, [user?.id]);



  const handleRefresh = async () => {
    setIsRefreshing(true);
    setIsLoading(true);
    await fetchFeesData(true);
    setIsRefreshing(false);
  };

  // Find active child if not set to 'all'
  const activeChild = selectedStudentId === 'all' ? null : children.find(c => c.id === selectedStudentId);

  // Filter fees based on active selection ('all' or specific student name)
  const filteredFees = activeChild 
    ? allFees.filter(f => f.studentName === activeChild.name)
    : allFees;

  // Compute stats for filtered fees
  const total = filteredFees.reduce((sum, f) => sum + f.amount, 0);
  const paid = filteredFees
    .filter((f) => f.status === 'paid')
    .reduce((sum, f) => sum + (f.paidAmount || f.amount), 0);
  const pending = filteredFees
    .filter((f) => f.status === 'pending')
    .reduce((sum, f) => sum + (f.amount - (f.paidAmount || 0)), 0);
  const overdue = filteredFees
    .filter((f) => f.status === 'overdue')
    .reduce((sum, f) => sum + (f.amount - (f.paidAmount || 0)), 0);

  const formatDateDMY = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'dd-MM-yyyy');
    } catch (e) {
      return 'N/A';
    }
  };

  // Format fee items to match FeeItem interface, adding studentName if viewing 'all'
  const formattedFees = filteredFees.map((fee: any) => {
    // Find matching child details from loaded list to get class and student ID
    const matchingChild = children.find(c => c.name === fee.studentName) || activeChild;
    return {
      id: fee.id,
      type: fee.type,
      amount: `₹${fee.amount}`,
      rawAmount: fee.amount,
      paidAmount: fee.paidAmount || 0,
      remainingAmount: fee.amount - (fee.paidAmount || 0),
      status: fee.status,
      dueDate: formatDateDMY(fee.dueDate),
      paidDate: fee.paidDate ? formatDateDMY(fee.paidDate) : undefined,
      studentName: fee.studentName || matchingChild?.name,
      studentId: matchingChild?.userId || matchingChild?.id || 'N/A',
      className: matchingChild?.className || 'N/A'
    };
  });

  const openPaymentModal = (fee: any) => {
    setSelectedFee(fee);
    setPayModalVisible(true);
    
    fadeAnim.setValue(0);
    slideAnim.setValue(600);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 10,
        useNativeDriver: true,
      })
    ]).start();
  };

  const closePaymentModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 220,
        useNativeDriver: true,
      })
    ]).start(() => {
      setPayModalVisible(false);
    });
  };

  const handlePay = (fee: any) => {
    openPaymentModal(fee);
  };

  const rawNextDate = filteredFees.find(f => f.status !== 'paid')?.dueDate;
  const formattedNextDate = rawNextDate ? formatDateDMY(rawNextDate) : 'None';

  const isInitialLoading = isLoading && children.length === 0;

  if (isInitialLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />}
        >
          {/* ChildSelector Skeleton */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <Skeleton width={80} height={32} borderRadius={16} />
            <Skeleton width={100} height={32} borderRadius={16} />
            <Skeleton width={90} height={32} borderRadius={16} />
          </View>
          
          {/* FeeSummary Skeleton */}
          <View style={{ height: 130, borderRadius: 24, padding: 16, backgroundColor: colors.backgroundElement, gap: 12, marginBottom: 16, justifyContent: 'center' }}>
            <Skeleton width="40%" height={16} />
            <Skeleton width="70%" height={28} />
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
              <Skeleton width="45%" height={12} />
              <Skeleton width="45%" height={12} />
            </View>
          </View>

          {/* FeeList Skeletons (Matching real card style and spacing) */}
          <View style={{ gap: 12 }}>
            {[1, 2, 3].map(i => (
              <View key={i} style={{ padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: colors.backgroundSelected, backgroundColor: colors.backgroundElement }}>
                {/* Header Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Skeleton width="50%" height={18} />
                  <Skeleton width="20%" height={18} />
                </View>
                {/* Info Row */}
                <View style={{ flexDirection: 'row', gap: 14, marginBottom: 16 }}>
                  <Skeleton width="40%" height={12} />
                </View>
                {/* Footer Row */}
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

  if (!isLoading && children.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />}
        >
          <View style={{ alignItems: 'center', padding: 24, gap: 16 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.backgroundSelected, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="people-outline" size={40} color={colors.textSecondary} />
            </View>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: colors.text }}>No Wards Linked</ThemedText>
            <ThemedText style={{ fontSize: 14, textAlign: 'center', color: colors.textSecondary, lineHeight: 20 }}>
              There are no student profiles currently linked to this parent account. Please contact the school administration to link your children.
            </ThemedText>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />}
      >
        {children.length > 0 && (
          <ChildSelector 
            students={children} 
            selectedStudentId={selectedStudentId} 
            onSelect={setSelectedStudentId} 
            showAllOption={true}
          />
        )}

        {isLoading ? (
          <>
            {/* FeeSummary Skeleton */}
            <View style={{ height: 130, borderRadius: 24, padding: 16, backgroundColor: colors.backgroundElement, gap: 12, marginBottom: 16, justifyContent: 'center' }}>
              <Skeleton width="40%" height={16} />
              <Skeleton width="70%" height={28} />
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
                <Skeleton width="45%" height={12} />
                <Skeleton width="45%" height={12} />
              </View>
            </View>

            {/* FeeList Skeletons (Matching real card style and spacing) */}
            <View style={{ gap: 12 }}>
              {[1, 2, 3].map(i => (
                <View key={i} style={{ padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: colors.backgroundSelected, backgroundColor: colors.backgroundElement }}>
                  {/* Header Row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Skeleton width="50%" height={18} />
                    <Skeleton width="20%" height={18} />
                  </View>
                  {/* Info Row */}
                  <View style={{ flexDirection: 'row', gap: 14, marginBottom: 16 }}>
                    <Skeleton width="40%" height={12} />
                  </View>
                  {/* Footer Row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12 }}>
                    <Skeleton width="30%" height={24} borderRadius={10} />
                    <Skeleton width="25%" height={28} borderRadius={10} />
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <FeeSummary 
              totalDue={`₹${total}`}
              paidAmount={`₹${paid}`}
              pendingAmount={`₹${pending + overdue}`}
              nextDueDate={formattedNextDate}
            />

            <FeeList 
              fees={formattedFees}
              onPay={handlePay}
            />

            <View style={[styles.helpCard, { backgroundColor: colors.backgroundElement }]}>
              <ThemedText style={styles.helpTitle}>Need Help?</ThemedText>
              <ThemedText style={[styles.helpText, { color: colors.textSecondary }]}>
                If you have any questions regarding fees or payment issues, please contact the accounts department.
              </ThemedText>
              <TouchableOpacity style={styles.contactButton}>
                <ThemedText style={styles.contactButtonText}>Contact Accounts</ThemedText>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Fee Detail Modal — Pay at School notice */}
      <Modal visible={payModalVisible} animationType="none" transparent>
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={closePaymentModal} 
          />
          <Animated.View style={[
            styles.modalContent, 
            { 
              backgroundColor: colors.background,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Fee Details</ThemedText>
              <TouchableOpacity onPress={closePaymentModal}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedFee && (
              <View style={{ flex: 1 }}>
                <ScrollView 
                  style={{ flex: 1 }} 
                  contentContainerStyle={{ padding: 20, gap: 16 }}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Billing Card */}
                  <View style={[styles.billingCard, { backgroundColor: colors.backgroundSelected }]}>
                    <View style={styles.billingRow}>
                      <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>STUDENT NAME</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedFee.studentName || activeChild?.name || 'Student'}</ThemedText>
                    </View>
                    
                    <View style={styles.billingRow}>
                      <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>FEE TYPE</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedFee.type}</ThemedText>
                    </View>

                    <View style={[styles.billingDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

                    {selectedFee.paidAmount > 0 ? (
                      <>
                        <View style={styles.billingRow}>
                          <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>TOTAL FEE</ThemedText>
                          <ThemedText style={[styles.detailValue, { opacity: 0.8 }]}>₹{selectedFee.rawAmount}</ThemedText>
                        </View>
                        <View style={styles.billingRow}>
                          <ThemedText style={[styles.detailLabel, { color: '#34C759' }]}>ALREADY PAID</ThemedText>
                          <ThemedText style={[styles.detailValue, { color: '#34C759' }]}>- ₹{selectedFee.paidAmount}</ThemedText>
                        </View>
                        <View style={[styles.billingDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
                      </>
                    ) : null}

                    <View style={styles.billingRow}>
                      <ThemedText style={[styles.amountLabel, { color: colors.text }]}>
                        {selectedFee.paidAmount > 0 ? 'REMAINING BALANCE' : 'TOTAL AMOUNT'}
                      </ThemedText>
                      <ThemedText style={[styles.amountValue, { color: '#007AFF' }]}>
                        ₹{selectedFee.remainingAmount}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Pay at School Notice */}
                  <View style={[styles.payAtSchoolNotice, { backgroundColor: isDark ? 'rgba(142,142,147,0.12)' : '#F2F2F7', borderColor: isDark ? 'rgba(142,142,147,0.25)' : '#E5E5EA' }]}>
                    <View style={styles.payAtSchoolIconRow}>
                      <View style={[styles.payAtSchoolIconWrap, { backgroundColor: isDark ? 'rgba(142,142,147,0.2)' : '#E5E5EA' }]}>
                        <Ionicons name="school-outline" size={24} color="#8E8E93" />
                      </View>
                      <ThemedText style={styles.payAtSchoolTitle}>Online Payment Not Available</ThemedText>
                    </View>
                    <ThemedText style={[styles.payAtSchoolDesc, { color: colors.textSecondary }]}>
                      Online payment is currently unavailable. Please visit the school accounts department to complete your payment.
                    </ThemedText>
                  </View>
                </ScrollView>

                <View style={{ padding: 20, paddingTop: 0, gap: 10 }}>
                  {selectedFee.status === 'paid' && (
                    <>
                      <TouchableOpacity 
                        style={[
                          styles.confirmBtn, 
                          { 
                            backgroundColor: hasSubscription ? '#007AFF' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,30,64,0.06)'),
                            borderWidth: hasSubscription ? 0 : 1,
                            borderColor: hasSubscription ? 'transparent' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(11,30,64,0.1)'),
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }
                        ]} 
                        onPress={() => {
                          checkSubscriptionAndExecute(async () => {
                            try {
                              await printReceiptAsPDF({
                                receiptNumber: `REC-${selectedFee.id.substring(0, 8).toUpperCase()}`,
                                paidDate: selectedFee.paidDate || selectedFee.dueDate,
                                studentName: selectedFee.studentName || 'Student',
                                studentId: selectedFee.studentId || 'N/A',
                                parentName: user?.name || 'Guardian',
                                className: selectedFee.className || 'Grade Class',
                                paymentMethod: 'online',
                                paidAmount: selectedFee.paidAmount || selectedFee.rawAmount,
                                schoolName: user?.tenantName || undefined,
                                schoolLogo: user?.tenantLogo || undefined,
                                feeItems: [
                                  {
                                    feeCategoryName: selectedFee.type + ' Fee',
                                    paidAmount: selectedFee.paidAmount || selectedFee.rawAmount,
                                  }
                                ]
                              });
                            } catch (err) {
                              console.error('Failed to view/print receipt:', err);
                            }
                          });
                        }}
                      >
                        <Text style={[
                          styles.confirmBtnText,
                          { color: hasSubscription ? '#FFF' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(11, 30, 64, 0.4)') }
                        ]}>
                          View & Print {!hasSubscription && ' 🔒'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[
                          styles.confirmBtn, 
                          { 
                            backgroundColor: hasSubscription ? '#34C759' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,30,64,0.06)'),
                            borderWidth: hasSubscription ? 0 : 1,
                            borderColor: hasSubscription ? 'transparent' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(11,30,64,0.1)'),
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }
                        ]} 
                        onPress={() => {
                          checkSubscriptionAndExecute(async () => {
                            try {
                              await shareReceiptAsPDF({
                                receiptNumber: `REC-${selectedFee.id.substring(0, 8).toUpperCase()}`,
                                paidDate: selectedFee.paidDate || selectedFee.dueDate,
                                studentName: selectedFee.studentName || 'Student',
                                studentId: selectedFee.studentId || 'N/A',
                                parentName: user?.name || 'Guardian',
                                className: selectedFee.className || 'Grade Class',
                                paymentMethod: 'online',
                                paidAmount: selectedFee.paidAmount || selectedFee.rawAmount,
                                schoolName: user?.tenantName || undefined,
                                schoolLogo: user?.tenantLogo || undefined,
                                feeItems: [
                                  {
                                    feeCategoryName: selectedFee.type + ' Fee',
                                    paidAmount: selectedFee.paidAmount || selectedFee.rawAmount,
                                  }
                                ]
                              });
                            } catch (err) {
                              console.error('Failed to download PDF receipt:', err);
                            }
                          });
                        }}
                      >
                        <Text style={[
                          styles.confirmBtnText,
                          { color: hasSubscription ? '#FFF' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(11, 30, 64, 0.4)') }
                        ]}>
                          Share PDF {!hasSubscription && ' 🔒'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity 
                    style={[styles.confirmBtn, { backgroundColor: colors.backgroundSelected }]} 
                    onPress={closePaymentModal}
                  >
                    <Text style={[styles.confirmBtnText, { color: colors.text }]}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>
      
      <SubscriptionLockModal 
        visible={lockModalVisible} 
        onClose={() => setLockModalVisible(false)} 
        onSubscribe={() => {
          setLockModalVisible(false);
          router.push('/(parent)/subscription');
        }}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 16,
  },
  helpCard: {
    padding: 20,
    borderRadius: 20,
    marginTop: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  contactButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    maxHeight: '90%',
    width: '100%',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailCard: {
    padding: 16,
    borderRadius: 16,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  amountCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  successIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  billingCard: {
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billingDivider: {
    height: 1,
    width: '100%',
  },
  gatewayCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  receiptCard: {
    padding: 16,
    borderRadius: 16,
    gap: 10,
    marginVertical: 10,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 12,
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  payAtSchoolNotice: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  payAtSchoolIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  payAtSchoolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payAtSchoolTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  payAtSchoolDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
});
