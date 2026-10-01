import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Skeleton } from '@/components/Skeleton';
import { ClassOption, StudentOption } from './types';
import { isLastClass } from './utils';

interface BulkPromoteTabProps {
  classes: ClassOption[];
  bulkFromClass: string;
  onFromClassChange: (classId: string) => void;
  onClearFromClass?: () => void;
  bulkToClass: string;
  setBulkToClass: (classId: string) => void;
  onClearToClass?: () => void;
  bulkAcademicYear: string;
  setBulkAcademicYear: (year: string) => void;
  bulkRemarks: string;
  setBulkRemarks: (remarks: string) => void;
  bulkPreview: StudentOption[];
  bulkSelectedIds?: string[];
  onToggleBulkStudent?: (id: string) => void;
  onToggleAllBulk?: () => void;
  onOpenClassPicker: (type: 'from' | 'to') => void;
  onSubmit: () => void;
  submitting: boolean;
  colors: any;
}

export const BulkPromoteTab: React.FC<BulkPromoteTabProps> = ({
  classes,
  bulkFromClass,
  onClearFromClass,
  bulkToClass,
  setBulkToClass,
  onClearToClass,
  bulkAcademicYear,
  setBulkAcademicYear,
  bulkRemarks,
  setBulkRemarks,
  bulkPreview,
  bulkSelectedIds = [],
  onToggleBulkStudent,
  onToggleAllBulk,
  onOpenClassPicker,
  onSubmit,
  submitting,
  colors,
}) => {
  const fromClassObj = classes.find(c => c.id === bulkFromClass);
  const toClassObj = classes.find(c => c.id === bulkToClass);
  const isHighestClass = bulkFromClass ? isLastClass(bulkFromClass, classes) : false;
  const selectedSet = new Set(bulkSelectedIds);
  const allSelected = bulkPreview.length > 0 && bulkPreview.every(s => selectedSet.has(s.id));

  const renderStudentItem = ({ item }: { item: StudentOption }) => {
    const isSelected = selectedSet.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.studentRow, { borderBottomColor: colors.backgroundSelected }]}
        onPress={() => onToggleBulkStudent?.(item.id)}
      >
        <Ionicons
          name={isSelected ? 'checkbox' : 'square-outline'}
          size={20}
          color={isSelected ? '#FF9500' : colors.textSecondary}
          style={{ marginRight: 10 }}
        />
        <View style={{ flex: 1 }}>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 13 }}>{item.name}</ThemedText>
          {!!item.rollNumber && (
            <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>Roll No: {item.rollNumber}</ThemedText>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ gap: 16 }}>
      {/* Configuration Card */}
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <View style={[styles.iconBadge, { backgroundColor: 'rgba(255, 149, 0, 0.15)' }]}>
            <Ionicons name="flash-outline" size={18} color="#FF9500" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 15 }}>Bulk Class Promotion</ThemedText>
            <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>
              Promote selected students from source class to target class.
            </ThemedText>
          </View>
        </View>

        {/* From Class Picker with Unselect Icon */}
        <ThemedText style={styles.label}>From Class (Current) *</ThemedText>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity
            style={[styles.pickerTrigger, { flex: 1, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
            onPress={() => onOpenClassPicker('from')}
          >
            <ThemedText style={{ color: fromClassObj ? colors.text : colors.textSecondary, fontSize: 14 }} numberOfLines={1}>
              {fromClassObj ? `${fromClassObj.name}-${fromClassObj.section}` : 'Select class to promote from'}
            </ThemedText>
            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          {!!bulkFromClass && (
            <TouchableOpacity
              style={[styles.pickerTrigger, { width: 44, paddingHorizontal: 0, justifyContent: 'center', backgroundColor: colors.background, borderColor: '#FF3B30' }]}
              onPress={onClearFromClass}
            >
              <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>

        {isHighestClass && (
          <View style={styles.warningBanner}>
            <Ionicons name="school-outline" size={16} color="#AF52DE" />
            <ThemedText style={{ fontSize: 11, color: '#AF52DE', flex: 1 }}>
              This is the highest class: students should be <ThemedText style={{ fontWeight: 'bold' }}>graduated</ThemedText> instead.
            </ThemedText>
          </View>
        )}

        {/* To Class Picker with Unselect Icon */}
        <ThemedText style={[styles.label, { marginTop: 12 }]}>To Class (Next) *</ThemedText>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity
            style={[styles.pickerTrigger, { flex: 1, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
            onPress={() => onOpenClassPicker('to')}
          >
            <ThemedText style={{ color: toClassObj ? colors.text : colors.textSecondary, fontSize: 14 }} numberOfLines={1}>
              {toClassObj ? `${toClassObj.name}-${toClassObj.section}` : 'Auto-detected or select manually'}
            </ThemedText>
            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          {!!bulkToClass && (
            <TouchableOpacity
              style={[styles.pickerTrigger, { width: 44, paddingHorizontal: 0, justifyContent: 'center', backgroundColor: colors.background, borderColor: '#FF3B30' }]}
              onPress={onClearToClass}
            >
              <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>

        {/* Academic Year */}
        <ThemedText style={[styles.label, { marginTop: 12 }]}>Target Academic Year *</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
          placeholder="e.g. 2024-2025"
          placeholderTextColor={colors.textSecondary}
          value={bulkAcademicYear}
          onChangeText={setBulkAcademicYear}
        />

        {/* Remarks */}
        <ThemedText style={[styles.label, { marginTop: 12 }]}>Remarks (Optional)</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected, height: 70, textAlignVertical: 'top', paddingVertical: 10 }]}
          placeholder="Reason or notes..."
          placeholderTextColor={colors.textSecondary}
          value={bulkRemarks}
          onChangeText={setBulkRemarks}
          multiline
        />

        {/* Students List Selection Header & List */}
        {bulkFromClass ? (
          <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.backgroundSelected }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <ThemedText type="defaultSemiBold" style={{ fontSize: 13 }}>
                Select Students ({bulkSelectedIds.length}/{bulkPreview.length})
              </ThemedText>
              <TouchableOpacity onPress={onToggleAllBulk}>
                <ThemedText style={{ fontSize: 12, color: '#FF9500', fontWeight: 'bold' }}>
                  {allSelected ? 'Deselect All' : 'Select All'}
                </ThemedText>
              </TouchableOpacity>
            </View>
            {bulkPreview.length === 0 ? (
              <ThemedText style={{ fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', paddingVertical: 8 }}>
                No active students in selected class.
              </ThemedText>
            ) : (
              <View style={{ height: 280, borderRadius: 10, borderWidth: 1, borderColor: colors.backgroundSelected, paddingHorizontal: 8 }}>
                <FlashList
                  data={bulkPreview}
                  renderItem={renderStudentItem}
                />
              </View>
            )}
          </View>
        ) : null}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: '#FF9500', opacity: (!bulkFromClass || !bulkToClass || bulkSelectedIds.length === 0 || submitting) ? 0.5 : 1 }]}
          onPress={onSubmit}
          disabled={!bulkFromClass || !bulkToClass || bulkSelectedIds.length === 0 || submitting}
        >
          <Ionicons name="flash" size={18} color="#FFF" />
          <ThemedText style={styles.submitBtnText}>
            {submitting ? 'Promoting Selected...' : `Promote Selected (${bulkSelectedIds.length})`}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  pickerTrigger: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(175, 82, 222, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  submitBtn: {
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
});
