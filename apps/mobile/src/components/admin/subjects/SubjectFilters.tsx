import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

interface ClassInfo {
  id: string;
  name: string;
  section: string;
}

interface SubjectFiltersProps {
  colors: any;
  search: string;
  onSearchChange: (text: string) => void;
  classFilter: string;
  onClassFilterChange: (classId: string) => void;
  classes: ClassInfo[];
}

export function SubjectFilters({
  colors,
  search,
  onSearchChange,
  classFilter,
  onClassFilterChange,
  classes,
}: SubjectFiltersProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedClass = classes.find((c) => c.id === classFilter);

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          placeholder="Search subjects..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={onSearchChange}
          style={[styles.searchInput, { color: colors.text }]}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown Selector */}
      <TouchableOpacity
        style={[styles.pickerTrigger, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.pickerLeft}>
          <Ionicons name="funnel" size={16} color="#007AFF" />
          <ThemedText style={[styles.pickerText, { color: classFilter && classFilter !== 'all' ? colors.text : colors.textSecondary }]}>
            {classFilter === 'all' || !classFilter
              ? 'Filter by Class: All'
              : `Class: ${selectedClass?.name || ''} - ${selectedClass?.section || ''}`}
          </ThemedText>
        </View>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Dropdown Modal List */}
      <Portal>
        <Dialog
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}
        >
          <Dialog.Title style={{ color: colors.text }}>Select Class Filter</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0, maxHeight: 400 }}>
            <ScrollView>
              {[{ id: 'all', name: 'All Classes', section: '' }, ...classes].map((item) => {
                const isSelected = classFilter === item.id || (item.id === 'all' && !classFilter);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.classItem,
                      { borderBottomColor: colors.backgroundSelected },
                      isSelected && { backgroundColor: colors.backgroundSelected }
                    ]}
                    onPress={() => {
                      onClassFilterChange(item.id);
                      setModalVisible(false);
                    }}
                  >
                    <ThemedText style={{ color: isSelected ? '#007AFF' : colors.text, fontWeight: isSelected ? 'bold' : '500' }}>
                      {item.name} {item.section ? `- ${item.section}` : ''}
                    </ThemedText>
                    {isSelected && <Ionicons name="checkmark" size={18} color="#007AFF" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setModalVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  pickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pickerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  classItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
});
