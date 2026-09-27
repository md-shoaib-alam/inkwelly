import React, { useState, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { StudentOption, ClassOption } from './types';
import { Skeleton } from '@/components/Skeleton';
import { FlashList } from '@shopify/flash-list';

interface StudentFeeStatusTabProps {
  colors: any;
  selectedStudentId: string;
  selectedStudent: StudentOption | null;
  students: StudentOption[];
  classes: ClassOption[];
  allFees: any[];
  studentReceipts: any[];
  siblings: any[];
  concessions: any[];
  loadingStudentDetails: boolean;
  onSelectStudent: (sid: string) => void;
  onSelectSibling: (siblingId: string) => void;
  onChangeStudent: () => void;
  setParentScrollEnabled?: (enabled: boolean) => void;
  classFilter: string;
  setClassFilter: (cid: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onLoadMoreStudents?: () => void;
  isLoadingStudents?: boolean;
}

const TypedFlashList = FlashList as any;

const getStatusColor = (status: string, defaultColor: string) => {
  switch (status) {
    case 'paid': return '#34C759';
    case 'overdue': return '#FF3B30';
    case 'partially_paid': return '#007AFF';
    case 'pending': return '#FF9500';
    default: return defaultColor;
  }
};

export function StudentFeeStatusTab({
  colors,
  selectedStudentId,
  selectedStudent,
  students,
  classes,
  allFees,
  studentReceipts,
  siblings,
  concessions,
  loadingStudentDetails,
  onSelectStudent,
  onSelectSibling,
  onChangeStudent,
  setParentScrollEnabled,
  classFilter,
  setClassFilter,
  searchQuery,
  setSearchQuery,
  onLoadMoreStudents,
  isLoadingStudents,
}: StudentFeeStatusTabProps) {

  const filteredStudentsList = useMemo(() => {
    if (!classFilter && !searchQuery) return [];
    return students.filter(s => {
      const matchesClass = !classFilter || s.classId === classFilter;
      const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesClass && matchesSearch;
    });
  }, [students, classFilter, searchQuery]);

  const student = selectedStudent || students.find(s => s.id === selectedStudentId);

  const { totalFees, totalPaid, totalConcessions, totalPending, totalOverdue } = useMemo(() => {
    const totalFeesVal = allFees.reduce((s, f) => s + f.amount, 0);
    const totalPaidVal = allFees.reduce((s, f) => s + (f.paidAmount || 0), 0);
    const totalConcessionsVal = allFees.reduce((s, f) => s + (f.concession || 0), 0);
    const totalPendingVal = allFees.filter(f => f.status !== 'paid').reduce((s, f) => s + (f.amount - (f.concession || 0) - (f.paidAmount || 0)), 0);
    const totalOverdueVal = allFees.filter(f => f.status === 'overdue').reduce((s, f) => s + (f.amount - (f.concession || 0) - (f.paidAmount || 0)), 0);
    return {
      totalFees: totalFeesVal,
      totalPaid: totalPaidVal,
      totalConcessions: totalConcessionsVal,
      totalPending: totalPendingVal,
      totalOverdue: totalOverdueVal
    };
  }, [allFees]);

  if (!selectedStudentId) {
    return (
      <View style={[styles.mainSearchCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="person-circle-outline" size={24} color="#34C759" />
            <ThemedText type="defaultSemiBold" style={{ fontSize: 18 }}>Check Fee Status</ThemedText>
          </View>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
            Search for a student to view their complete fee history and status.
          </ThemedText>
        </View>

        <View 
          style={styles.filterSection}
          onStartShouldSetResponder={() => {
            setParentScrollEnabled?.(false);
            return false;
          }}
        >
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ gap: 8, paddingBottom: 12, paddingRight: 16 }}
            bounces={false}
            overScrollMode="never"
            onTouchStart={() => setParentScrollEnabled?.(false)}
            onTouchEnd={() => setParentScrollEnabled?.(true)}
            onTouchCancel={() => setParentScrollEnabled?.(true)}
          >
            {classes.map(c => (
              <TouchableOpacity 
                key={c.id}
                onPress={() => setClassFilter(classFilter === c.id ? '' : c.id)}
                style={[styles.classPill, { 
                  backgroundColor: classFilter === c.id ? '#34C759' : colors.background,
                  borderColor: classFilter === c.id ? '#34C759' : colors.backgroundSelected 
                }]}
              >
                <ThemedText style={{ color: classFilter === c.id ? '#FFF' : colors.text, fontSize: 13, fontWeight: classFilter === c.id ? 'bold' : 'normal' }}>
                  {c.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
            
            {/* End of List Indicator */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 8, opacity: 0.5 }}>
              <View style={{ width: 1, height: 20, backgroundColor: colors.backgroundSelected, marginRight: 12 }} />
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>End of List</ThemedText>
            </View>
          </ScrollView>

          <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
            <TextInput 
              placeholder="Search by student name..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={{ flex: 1, minHeight: 300 }}>
          {filteredStudentsList.length === 0 ? (
            <View style={styles.emptyResults}>
              <Ionicons name="people-outline" size={48} color={colors.backgroundSelected} />
              <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>
                {!classFilter && !searchQuery ? 'Select a class or search to see students' : 'No students found matching your filters'}
              </ThemedText>
            </View>
          ) : (
            <TypedFlashList
              data={filteredStudentsList}
              estimatedItemSize={70}
              keyExtractor={(s: StudentOption) => s.id}
              onEndReached={onLoadMoreStudents}
              onEndReachedThreshold={0.3}
              ListFooterComponent={() => (
                isLoadingStudents ? (
                  <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#34C759" />
                  </View>
                ) : null
              )}
              renderItem={({ item: s }: { item: StudentOption }) => (
                <TouchableOpacity 
                  style={[styles.studentListItem, { borderBottomColor: colors.backgroundSelected }]}
                  onPress={() => onSelectStudent(s.id)}
                >
                  <View style={[styles.avatarSmall, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                    <ThemedText style={{ color: '#34C759', fontWeight: 'bold', fontSize: 12 }}>
                      {s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </ThemedText>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>{s.name}</ThemedText>
                    <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>
                      {s.className} {s.rollNumber ? `• Roll: ${s.rollNumber}` : ''} {s.phone ? `• ${s.phone}` : ''}
                    </ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      {/* Student Header Card */}
      <View style={[styles.studentDetailsCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
        <View style={styles.studentHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <View style={[styles.avatar, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
              <ThemedText style={{ color: '#34C759', fontWeight: 'bold' }}>
                {student?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </ThemedText>
            </View>
            <View style={{ marginLeft: 12, flex: 1, minWidth: 0 }}>
              <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{student?.name || 'Unknown Student'}</ThemedText>
              <ThemedText style={{ fontSize: 13, color: colors.textSecondary }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {student?.className} • Roll: {student?.rollNumber || 'N/A'} {student?.phone ? `• ${student.phone}` : ''}
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.changeStudentBtn, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
            onPress={onChangeStudent}
          >
            <ThemedText style={{ fontSize: 12, color: '#007AFF', fontWeight: 'bold' }}>Change</ThemedText>
          </TouchableOpacity>
        </View>

        {siblings.length > 0 && (
          <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: colors.backgroundSelected, paddingTop: 10 }}>
            <ThemedText style={{ fontSize: 11, color: colors.textSecondary, fontWeight: 'bold', marginBottom: 6 }}>
              SIBLINGS:
            </ThemedText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {siblings.map((sib) => (
                <TouchableOpacity
                  key={sib.id}
                  onPress={() => onSelectSibling(sib.id)}
                  style={[styles.siblingPill, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                >
                  <Ionicons name="people-outline" size={12} color="#007AFF" style={{ marginRight: 4 }} />
                  <ThemedText style={{ fontSize: 11, color: '#007AFF' }}>{sib.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {loadingStudentDetails ? (
        <View style={{ gap: 16 }}>
          {/* Student Header */}
          <View style={{ height: 76, borderRadius: 14, backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.backgroundSelected, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Skeleton width={44} height={44} borderRadius={22} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="50%" height={16} />
              <Skeleton width="30%" height={12} />
            </View>
          </View>

          {/* Summary Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <View style={{ flexGrow: 1, flexBasis: '48%', height: 80, borderRadius: 16, backgroundColor: colors.backgroundElement, padding: 16, gap: 8 }}>
              <Skeleton width="50%" height={12} />
              <Skeleton width="80%" height={18} />
            </View>
            <View style={{ flexGrow: 1, flexBasis: '48%', height: 80, borderRadius: 16, backgroundColor: colors.backgroundElement, padding: 16, gap: 8 }}>
              <Skeleton width="50%" height={12} />
              <Skeleton width="80%" height={18} />
            </View>
            <View style={{ flexGrow: 1, flexBasis: '48%', height: 80, borderRadius: 16, backgroundColor: colors.backgroundElement, padding: 16, gap: 8 }}>
              <Skeleton width="50%" height={12} />
              <Skeleton width="80%" height={18} />
            </View>
            <View style={{ flexGrow: 1, flexBasis: '48%', height: 80, borderRadius: 16, backgroundColor: colors.backgroundElement, padding: 16, gap: 8 }}>
              <Skeleton width="50%" height={12} />
              <Skeleton width="80%" height={18} />
            </View>
          </View>

          {/* Breakdown List */}
          <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.backgroundElement, gap: 16 }}>
             <Skeleton width="40%" height={18} />
             {Array.from({ length: 4 }).map((_, i) => (
               <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected }}>
                 <View style={{ gap: 6 }}>
                   <Skeleton width={100} height={14} />
                   <Skeleton width={60} height={10} />
                 </View>
                 <View style={{ alignItems: 'flex-end', gap: 6 }}>
                   <Skeleton width={50} height={14} />
                   <Skeleton width={40} height={16} borderRadius={4} />
                 </View>
               </View>
             ))}
          </View>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
          {/* Summary Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <View style={[styles.summaryCard, { backgroundColor: colors.backgroundElement, flexGrow: 1, flexBasis: '48%' }]}>
              <ThemedText style={styles.summaryLabel}>Total Fees</ThemedText>
              <ThemedText style={styles.summaryValue}>₹{totalFees.toLocaleString()}</ThemedText>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.backgroundElement, flexGrow: 1, flexBasis: '48%' }]}>
              <ThemedText style={[styles.summaryLabel, { color: '#34C759' }]}>Paid</ThemedText>
              <ThemedText style={[styles.summaryValue, { color: '#34C759' }]}>₹{totalPaid.toLocaleString()}</ThemedText>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.backgroundElement, flexGrow: 1, flexBasis: '48%' }]}>
              <ThemedText style={[styles.summaryLabel, { color: '#FF9500' }]}>Pending</ThemedText>
              <ThemedText style={[styles.summaryValue, { color: '#FF9500' }]}>₹{totalPending.toLocaleString()}</ThemedText>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.backgroundElement, flexGrow: 1, flexBasis: '48%' }]}>
              <ThemedText style={[styles.summaryLabel, { color: '#FF3B30' }]}>Overdue</ThemedText>
              <ThemedText style={[styles.summaryValue, { color: '#FF3B30' }]}>₹{totalOverdue.toLocaleString()}</ThemedText>
            </View>
          </View>

          {/* Fee Breakdown */}
          <View style={[styles.sectionCard, { backgroundColor: colors.backgroundElement }]}>
            <ThemedText type="defaultSemiBold" style={{ marginBottom: 12 }}>Fee Breakdown</ThemedText>
            {allFees.length === 0 ? (
              <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>No fee records found.</ThemedText>
            ) : (
              <View style={{ gap: 10 }}>
                {allFees.map((fee) => (
                  <View key={fee.id} style={[styles.feeRow, { borderBottomColor: colors.backgroundSelected }]}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 14, fontWeight: '500' }}>{fee.feeCategoryName || fee.type}</ThemedText>
                      <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>Due: {fee.dueDate}</ThemedText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <ThemedText style={{ fontSize: 14, fontWeight: 'bold' }}>₹{fee.amount.toLocaleString()}</ThemedText>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(fee.status, colors.textSecondary) + '20' }]}>
                        <ThemedText style={{ fontSize: 10, color: getStatusColor(fee.status, colors.textSecondary), fontWeight: 'bold', textTransform: 'uppercase' }}>
                          {fee.status.replace('_', ' ')}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Recent Payments */}
          {studentReceipts.length > 0 && (
            <View style={[styles.sectionCard, { backgroundColor: colors.backgroundElement }]}>
              <ThemedText type="defaultSemiBold" style={{ marginBottom: 12 }}>Recent Payments</ThemedText>
              <View style={{ gap: 10 }}>
                {studentReceipts.map((receipt) => (
                  <View key={receipt.id} style={[styles.receiptRow, { borderBottomColor: colors.backgroundSelected }]}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                      <Ionicons name="receipt-outline" size={18} color="#34C759" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <ThemedText style={{ fontSize: 13, fontWeight: 'bold' }}>{receipt.receiptNumber}</ThemedText>
                      <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>{receipt.paidDate} • {receipt.paymentMethod}</ThemedText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <ThemedText style={{ fontSize: 14, fontWeight: 'bold', color: '#34C759' }}>₹{receipt.paidAmount.toLocaleString()}</ThemedText>
                      <ThemedText style={{ fontSize: 10, color: colors.textSecondary }}>{receipt.status}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainSearchCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
  },
  cardHeader: {
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 16,
  },
  classPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  emptyResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  studentListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentDetailsCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  studentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeStudentBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexShrink: 0,
  },
  siblingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    minHeight: 82,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionCard: {
    padding: 16,
    borderRadius: 16,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
