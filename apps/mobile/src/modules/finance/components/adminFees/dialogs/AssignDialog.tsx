import React from 'react';
import { ScrollView, View, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { FeeStructure } from '../types';

interface AssignDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  assignStructureItem: FeeStructure | null;
  assignLoading: boolean;
  assignData: any;
  assignSelectedIds: Set<string>;
  setAssignSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  assignSearch: string;
  setAssignSearch: (search: string) => void;
  assignSaving: boolean;
  onSubmit: () => void;
}

export function AssignDialog({
  visible,
  onDismiss,
  colors,
  assignStructureItem,
  assignLoading,
  assignData,
  assignSelectedIds,
  setAssignSelectedIds,
  assignSearch,
  setAssignSearch,
  assignSaving,
  onSubmit
}: AssignDialogProps) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: colors.backgroundElement, borderRadius: 16, maxHeight: '80%' }}>
        <Dialog.Title style={{ color: colors.text }}>Assign {assignStructureItem?.feeCategoryName}</Dialog.Title>
        <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
          <ThemedText style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>
            {assignStructureItem?.className} ({assignStructureItem?.academicYear}) · ₹{assignStructureItem?.amount}
          </ThemedText>

          {assignLoading ? (
            <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 16 }} />
          ) : assignData && (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
                  {assignData.totalStudents} students ({assignSelectedIds.size} selected)
                </ThemedText>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => {
                      const unpaidStudents = assignData.students?.filter((s: any) => !s.isPaid) || [];
                      const allIds = unpaidStudents.map((s: any) => s.id);
                      if (assignSelectedIds.size === allIds.length) {
                        setAssignSelectedIds(new Set());
                      } else {
                        setAssignSelectedIds(new Set(allIds));
                      }
                    }}
                    style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: colors.backgroundSelected }}
                  >
                    <ThemedText style={{ fontSize: 11, fontWeight: 'bold', color: '#007AFF' }}>
                      {assignSelectedIds.size === (assignData.students?.filter((s: any) => !s.isPaid)?.length || 0) ? 'Deselect All' : 'Select All'}
                    </ThemedText>
                  </TouchableOpacity>
                  {(assignStructureItem?.feeCategoryCode === 'TRAN' || assignStructureItem?.feeCategoryName?.toLowerCase().includes('transport')) && (
                    <TouchableOpacity
                      onPress={() => {
                        const transportStudents = assignData.students?.filter((s: any) => s.hasTransport && !s.isPaid) || [];
                        setAssignSelectedIds(new Set(transportStudents.map((s: any) => s.id)));
                      }}
                      style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: colors.backgroundSelected }}
                    >
                      <ThemedText style={{ fontSize: 11, fontWeight: 'bold', color: '#007AFF' }}>Transport</ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
                <Ionicons name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Search students..."
                  placeholderTextColor={colors.textSecondary}
                  value={assignSearch}
                  onChangeText={setAssignSearch}
                  style={[styles.searchInputText, { color: colors.text }]}
                />
              </View>
            </View>
          )}
        </View>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
          {assignData && (
            <ScrollView style={{ maxHeight: 250 }}>
              {assignData.students
                ?.filter((s: any) => !assignSearch || s.name.toLowerCase().includes(assignSearch.toLowerCase()) || (s.rollNumber && s.rollNumber.toLowerCase().includes(assignSearch.toLowerCase())))
                .map((student: any) => {
                  const isSelected = assignSelectedIds.has(student.id);
                  return (
                    <TouchableOpacity
                      key={student.id}
                      disabled={student.isPaid}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.backgroundSelected,
                        backgroundColor: isSelected ? 'rgba(52, 199, 89, 0.08)' : 'transparent',
                        opacity: student.isPaid ? 0.7 : 1
                      }}
                      onPress={() => {
                        setAssignSelectedIds(prev => {
                          const next = new Set(prev);
                          if (next.has(student.id)) next.delete(student.id);
                          else next.add(student.id);
                          return next;
                        });
                      }}
                    >
                      <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: isSelected ? '#34C759' : colors.textSecondary, backgroundColor: isSelected ? '#34C759' : 'transparent', marginRight: 12, justifyContent: 'center', alignItems: 'center' }}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <ThemedText style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>{student.name}</ThemedText>
                          {student.rollNumber && <ThemedText style={{ color: colors.textSecondary, fontSize: 11 }}>#{student.rollNumber}</ThemedText>}
                          {student.hasTransport && (
                            <View style={{ paddingVertical: 1, paddingHorizontal: 4, borderRadius: 4, backgroundColor: 'rgba(0, 122, 255, 0.1)', flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="bus" size={10} color="#007AFF" style={{ marginRight: 2 }} />
                              <ThemedText style={{ fontSize: 9, color: '#007AFF' }}>Transport</ThemedText>
                            </View>
                          )}
                        </View>
                      </View>
                      {student.isPaid && (
                        <View style={{ paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, backgroundColor: 'rgba(52, 199, 89, 0.1)' }}>
                          <ThemedText style={{ fontSize: 10, color: '#34C759', fontWeight: 'bold' }}>Paid</ThemedText>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          )}
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button textColor={colors.textSecondary} onPress={onDismiss} disabled={assignSaving}>Cancel</Button>
          <Button textColor="#007AFF" onPress={onSubmit} disabled={assignSaving || assignLoading}>
            {assignSaving ? 'Saving...' : `Save (${assignSelectedIds.size})`}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
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
});
