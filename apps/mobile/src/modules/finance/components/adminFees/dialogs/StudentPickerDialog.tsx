import React from 'react';
import { View, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { StudentOption } from '../types';

interface StudentPickerDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  studentSearch: string;
  setStudentSearch: (query: string) => void;
  filteredStudents: StudentOption[];
  onSelectStudent: (studentId: string) => void;
  onEndReached?: () => void;
  isLoadingMore?: boolean;
}

export function StudentPickerDialog({
  visible,
  onDismiss,
  colors,
  studentSearch,
  setStudentSearch,
  filteredStudents,
  onSelectStudent,
  onEndReached,
  isLoadingMore
}: StudentPickerDialogProps) {
  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={onDismiss} 
        style={{ backgroundColor: colors.backgroundElement, maxHeight: 440 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 8 }}>
          <Dialog.Title style={{ color: colors.text }}>Select Student</Dialog.Title>
          <TouchableOpacity onPress={onDismiss} style={{ padding: 8 }}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
          <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
            <Ionicons name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search student by name..."
              placeholderTextColor={colors.textSecondary}
              value={studentSearch}
              onChangeText={setStudentSearch}
              style={[styles.searchInputText, { color: colors.text }]}
            />
          </View>
        </View>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.id}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 10 }} /> : null}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected }}
                onPress={() => {
                  onSelectStudent(item.id);
                }}
              >
                <ThemedText style={{ color: colors.text }}>{item.name}</ThemedText>
              </TouchableOpacity>
            )}
          />
        </Dialog.ScrollArea>
        <Dialog.Actions style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <TouchableOpacity 
            onPress={onDismiss} 
            style={{ 
              paddingHorizontal: 20, 
              paddingVertical: 8, 
              borderRadius: 20, 
              backgroundColor: colors.backgroundSelected || '#E5E7EB',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ThemedText style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Close</ThemedText>
          </TouchableOpacity>
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
