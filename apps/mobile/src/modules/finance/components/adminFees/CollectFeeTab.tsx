import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { StudentOption, ClassOption } from './types';
import { Skeleton } from '@/components/Skeleton';

// ... (props interfaces, export default header)

interface CollectFeeTabProps {
  colors: any;
  selectedStudentId: string;
  selectedStudent: StudentOption | null;
  students: StudentOption[];
  studentFees: any[];
  selectedFeeIds: Record<string, boolean>;
  setSelectedFeeIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  paymentMethod: string;
  setPaymentMethod: (m: string) => void;
  payAmount: string;
  setPayAmount: (a: string) => void;
  submittingPayment: boolean;
  setStudentPickerVisible: (v: boolean) => void;
  calculatePayableTotal: () => number;
  handleMakePayment: () => void;
  collectClassId: string;
  setCollectClassId: (id: string) => void;
  classes: ClassOption[];
  setClassPickerVisible: (v: boolean) => void;

  // New features
  monthlyStats: any;
  loadingStats: boolean;
  siblings: any[];
  concessions: any[];
  loadingStudentDetails: boolean;
  onSelectSibling: (siblingId: string) => void;
  onChangeStudent: () => void;
  onOpenManualFee: () => void;
}

// Computed once per session — month name never changes within a screen lifecycle
const CURRENT_MONTH_NAME = new Date().toLocaleString('default', { month: 'long' });

export function CollectFeeTab({
  colors,
  selectedStudentId,
  selectedStudent,
  students,
  studentFees,
  selectedFeeIds,
  setSelectedFeeIds,
  paymentMethod,
  setPaymentMethod,
  payAmount,
  setPayAmount,
  submittingPayment,
  setStudentPickerVisible,
  calculatePayableTotal,
  handleMakePayment,
  collectClassId,
  setCollectClassId,
  classes,
  setClassPickerVisible,
  
  monthlyStats,
  loadingStats,
  siblings,
  concessions,
  loadingStudentDetails,
  onSelectSibling,
  onChangeStudent,
  onOpenManualFee
}: CollectFeeTabProps) {
  const currentMonthName = CURRENT_MONTH_NAME;
  const student = useMemo(
    () => selectedStudent || students.find(s => s.id === selectedStudentId),
    [selectedStudent, students, selectedStudentId]
  );
  const payableTotal = calculatePayableTotal();

  return (
    <View style={{ gap: 16 }}>
      {/* Monthly Stats Cards */}
      <View>
        <ThemedText style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Monthly Stats Breakdowns</ThemedText>
        {loadingStats ? (
          <View style={{ height: 90, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        ) : (
          <ScrollView 
            horizontal 
            nestedScrollEnabled={true}
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ flexDirection: 'row', gap: 12, paddingBottom: 4 }}
          >
            {/* Total Collected */}
            <View style={[styles.statCard, { backgroundColor: colors.backgroundElement, borderColor: '#34C759' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                <ThemedText style={styles.statLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>Total Collected ({currentMonthName})</ThemedText>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                  <Ionicons name="receipt-outline" size={14} color="#34C759" />
                </View>
              </View>
              <ThemedText style={[styles.statValue, { color: '#34C759' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>₹{(monthlyStats?.totalAmount || 0).toLocaleString()}</ThemedText>
              <ThemedText style={[styles.statSubText, { color: colors.textSecondary }]}>{monthlyStats?.totalCount || 0} receipts</ThemedText>
            </View>

            {/* Cash */}
            <View style={[styles.statCard, { backgroundColor: colors.backgroundElement, borderColor: '#FF9500' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                <ThemedText style={styles.statLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>Cash Payments</ThemedText>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
                  <Ionicons name="wallet-outline" size={14} color="#FF9500" />
                </View>
              </View>
              <ThemedText style={[styles.statValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>₹{(monthlyStats?.methods?.cash?.amount || 0).toLocaleString()}</ThemedText>
              <ThemedText style={[styles.statSubText, { color: colors.textSecondary }]}>{monthlyStats?.methods?.cash?.count || 0} txns</ThemedText>
            </View>

            {/* Online */}
            <View style={[styles.statCard, { backgroundColor: colors.backgroundElement, borderColor: '#007AFF' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                <ThemedText style={styles.statLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>Online Payments</ThemedText>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
                  <Ionicons name="card-outline" size={14} color="#007AFF" />
                </View>
              </View>
              <ThemedText style={[styles.statValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>₹{(monthlyStats?.methods?.online?.amount || 0).toLocaleString()}</ThemedText>
              <ThemedText style={[styles.statSubText, { color: colors.textSecondary }]}>{monthlyStats?.methods?.online?.count || 0} txns</ThemedText>
            </View>

            {/* Cheque */}
            <View style={[styles.statCard, { backgroundColor: colors.backgroundElement, borderColor: '#FF3B30' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                <ThemedText style={styles.statLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>Cheque Payments</ThemedText>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                  <Ionicons name="cash-outline" size={14} color="#FF3B30" />
                </View>
              </View>
              <ThemedText style={[styles.statValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>₹{(monthlyStats?.methods?.cheque?.amount || 0).toLocaleString()}</ThemedText>
              <ThemedText style={[styles.statSubText, { color: colors.textSecondary }]}>{monthlyStats?.methods?.cheque?.count || 0} txns</ThemedText>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Student Selector controls */}
      {!selectedStudentId ? (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.inputLabel}>Filter by Class</ThemedText>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TouchableOpacity 
                style={[styles.pickerTrigger, { flex: 1, backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}
                onPress={() => setClassPickerVisible(true)}
              >
                <ThemedText style={{ color: collectClassId ? colors.text : colors.textSecondary, fontSize: 14 }} numberOfLines={1} ellipsizeMode="tail">
                  {collectClassId ? (classes.find(c => c.id === collectClassId)?.name || 'Select Class') : 'All Classes'}
                </ThemedText>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              {!!collectClassId && (
                <TouchableOpacity 
                  style={[styles.pickerTrigger, { width: 40, paddingHorizontal: 0, justifyContent: 'center', backgroundColor: colors.backgroundElement, borderColor: '#FF3B30' }]}
                  onPress={() => setCollectClassId('')}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <ThemedText style={styles.inputLabel}>Student</ThemedText>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TouchableOpacity 
                style={[styles.pickerTrigger, { flex: 1, backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}
                onPress={() => setStudentPickerVisible(true)}
              >
                <ThemedText style={{ color: colors.textSecondary, fontSize: 14 }} numberOfLines={1} ellipsizeMode="tail">
                  Select Student
                </ThemedText>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.studentDetailsCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          {/* Student Profile Card with Siblings */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
                {student?.name || 'Unknown Student'}
              </ThemedText>
              <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                {student?.className || 'Unassigned Class'} • Roll: {student?.rollNumber || 'N/A'}
              </ThemedText>
            </View>
            <TouchableOpacity 
              style={[styles.changeStudentBtn, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
              onPress={onChangeStudent}
            >
              <ThemedText style={{ fontSize: 12, color: '#007AFF', fontWeight: 'bold' }}>Change</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Sibling Switching */}
          {siblings.length > 0 && (
            <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: colors.backgroundSelected, paddingTop: 10 }}>
              <ThemedText style={{ fontSize: 11, color: colors.textSecondary, fontWeight: 'bold', marginBottom: 6 }}>
                SIBLINGS AVAILABLE (TAP TO SWITCH):
              </ThemedText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {siblings.map((sib) => (
                  <TouchableOpacity
                    key={sib.id}
                    onPress={() => onSelectSibling(sib.id)}
                    style={[styles.siblingPill, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                  >
                    <Ionicons name="people-outline" size={12} color="#007AFF" style={{ marginRight: 4 }} />
                    <ThemedText style={{ fontSize: 11, color: '#007AFF' }}>
                      {sib.name} ({sib.className})
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Active Concessions Banner */}
      {selectedStudentId && concessions.length > 0 && (
        <View style={[styles.concessionsBanner, { backgroundColor: colors.backgroundElement, borderColor: '#FF9500' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="gift-outline" size={16} color="#FF9500" style={{ marginRight: 6 }} />
            <ThemedText style={{ color: '#FF9500', fontWeight: 'bold', fontSize: 13 }}>
              Active Concessions
            </ThemedText>
          </View>
          {concessions.map((con, idx) => {
            const displayValue = con.concessionType === 'percentage' 
              ? `${con.amount}%` 
              : con.concessionType === 'fixed' 
                ? `₹${con.amount}` 
                : 'Full Waiver';
            return (
              <ThemedText key={con.id || idx} style={{ fontSize: 12, color: colors.text, marginLeft: 22, marginTop: 2 }}>
                • {displayValue} ({con.reason})
              </ThemedText>
            );
          })}
        </View>
      )}

      {selectedStudentId ? (
        loadingStudentDetails ? (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton width="40%" height={16} />
              <Skeleton width="22%" height={26} borderRadius={8} />
            </View>
            
            {/* Outstanding dues list skeletons */}
            {Array.from({ length: 10 }).map((_, i) => (
              <View key={i} style={[styles.feeSelectItem, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected, gap: 12 }]}>
                <Skeleton width={20} height={20} borderRadius={4} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="60%" height={14} />
                  <Skeleton width="30%" height={10} />
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Skeleton width={40} height={14} />
                  <Skeleton width={30} height={10} />
                </View>
              </View>
            ))}

            {/* Payment form card skeleton */}
            <View style={[styles.mainCard, { backgroundColor: colors.backgroundElement, gap: 12 }]}>
              <View style={styles.summaryRow}>
                <Skeleton width="40%" height={14} />
                <Skeleton width="30%" height={18} />
              </View>
              <Skeleton width="35%" height={12} style={{ marginTop: 8 }} />
              <View style={styles.radioGroup}>
                <Skeleton width={60} height={24} borderRadius={12} />
                <Skeleton width={60} height={24} borderRadius={12} />
                <Skeleton width={60} height={24} borderRadius={12} />
              </View>
              <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
              <Skeleton width="100%" height={44} borderRadius={8} />
              <Skeleton width="100%" height={46} borderRadius={10} style={{ marginTop: 12 }} />
            </View>
          </View>
        ) : (studentFees.length === 0 ? (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>Outstanding Dues</ThemedText>
              <TouchableOpacity 
                style={[styles.addFeeBtn, { backgroundColor: '#34C759' }]}
                onPress={onOpenManualFee}
              >
                <Ionicons name="add" size={16} color="#FFF" style={{ marginRight: 4 }} />
                <ThemedText style={{ fontSize: 12, color: '#FFF', fontWeight: 'bold' }}>Add Fee</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#34C759" style={{ marginBottom: 8 }} />
              <ThemedText style={{ color: colors.textSecondary, fontWeight: 'bold' }}>All fees are fully paid for this student!</ThemedText>
            </View>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>Outstanding Dues</ThemedText>
              <TouchableOpacity 
                style={[styles.addFeeBtn, { backgroundColor: '#34C759' }]}
                onPress={onOpenManualFee}
              >
                <Ionicons name="add" size={16} color="#FFF" style={{ marginRight: 4 }} />
                <ThemedText style={{ fontSize: 12, color: '#FFF', fontWeight: 'bold' }}>Add Fee</ThemedText>
              </TouchableOpacity>
            </View>

            {studentFees.map((fee) => {
              const isSelected = !!selectedFeeIds[fee.id];
              const netAmt = fee.amount - (fee.concession || 0);
              const remaining = netAmt - (fee.paidAmount || 0);
              return (
                <TouchableOpacity
                  key={fee.id}
                  onPress={() => setSelectedFeeIds(prev => ({ ...prev, [fee.id]: !prev[fee.id] }))}
                  style={[styles.feeSelectItem, { backgroundColor: colors.backgroundElement, borderColor: isSelected ? '#007AFF' : colors.backgroundSelected }]}
                >
                  <Ionicons 
                    name={isSelected ? "checkbox" : "square-outline"} 
                    size={20} 
                    color={isSelected ? "#007AFF" : colors.textSecondary} 
                    style={{ marginRight: 12 }} 
                  />
                  <View style={{ flex: 1 }}>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>{fee.type}</ThemedText>
                    <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>Due: {fee.dueDate}</ThemedText>
                    {fee.concession > 0 && (
                      <ThemedText style={{ fontSize: 11, color: '#FF9500' }}>Concession: ₹{fee.concession}</ThemedText>
                    )}
                    {fee.paidAmount > 0 && (
                      <ThemedText style={{ fontSize: 11, color: '#007AFF', marginTop: 2 }}>
                        -₹{fee.paidAmount} previously paid
                      </ThemedText>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <ThemedText style={{ fontWeight: 'bold', fontSize: 14, color: fee.paidAmount > 0 ? '#34C759' : colors.text }}>
                      {fee.paidAmount > 0 ? `Bal: ₹${remaining}` : `₹${remaining}`}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 10, color: colors.textSecondary }}>Total: ₹{fee.amount}</ThemedText>
                  </View>
                </TouchableOpacity>
              );
            })}

            <View style={[styles.mainCard, { backgroundColor: colors.backgroundElement, marginTop: 12 }]}>
              <View style={styles.summaryRow}>
                <ThemedText style={{ color: colors.textSecondary }}>Total Payable Selected:</ThemedText>
                <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: '#007AFF' }}>₹{payableTotal}</ThemedText>
              </View>

              <ThemedText style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Payment Method</ThemedText>
              <View style={styles.radioGroup}>
                {['cash', 'online', 'upi', 'cheque'].map((method) => (
                  <TouchableOpacity key={method} style={styles.radioOption} onPress={() => setPaymentMethod(method)}>
                    <RadioButton
                      value={method}
                      status={paymentMethod === method ? 'checked' : 'unchecked'}
                      onPress={() => setPaymentMethod(method)}
                      color="#007AFF"
                      uncheckedColor={colors.textSecondary}
                    />
                    <ThemedText style={{ textTransform: 'capitalize' }}>{method}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <ThemedText style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Amount Received (₹)</ThemedText>
              <TextInput
                placeholder={`Enter up to ₹${payableTotal}`}
                placeholderTextColor={colors.textSecondary}
                value={payAmount}
                onChangeText={setPayAmount}
                keyboardType="numeric"
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
              />

              <TouchableOpacity 
                style={[styles.submitBtn, { backgroundColor: '#007AFF' }]} 
                onPress={handleMakePayment}
                disabled={submittingPayment}
              >
                <ThemedText style={styles.submitBtnText} numberOfLines={1} adjustsFontSizeToFit>
                  {submittingPayment ? 'Recording...' : 'Record Payment & Print'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="card-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 12, opacity: 0.5 }} />
          <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Please select a student above to inspect pending dues.
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pickerTrigger: {
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  feeSelectItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8e8e93',
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  submitBtn: {
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  statCard: {
    width: 220,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
    minWidth: 0,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  statSubText: {
    fontSize: 9,
  },
  iconBg: {
    padding: 4,
    borderRadius: 6,
  },
  studentDetailsCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  changeStudentBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  siblingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  concessionsBanner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  addFeeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
});
