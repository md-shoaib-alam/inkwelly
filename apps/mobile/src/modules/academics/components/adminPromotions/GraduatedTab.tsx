import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Skeleton } from '@/components/Skeleton';
import { ClassOption, StudentOption, PromotionRecord } from './types';
import { statusConfig } from './utils';

interface GraduatedTabProps {
  classes: ClassOption[];
  gradClassId: string;
  gradAcademicYear: string;
  setGradAcademicYear: (year: string) => void;
  gradRemarks: string;
  setGradRemarks: (remarks: string) => void;
  gradPreview: StudentOption[];
  gradSelectedIds: string[];
  onToggleGradStudent: (id: string) => void;
  onToggleAll: () => void;
  onOpenClassPicker: () => void;
  onSubmit: () => void;
  submitting: boolean;
  graduations: PromotionRecord[];
  loadingGraduations: boolean;
  colors: any;
}

export const GraduatedTab: React.FC<GraduatedTabProps> = ({
  classes,
  gradClassId,
  gradAcademicYear,
  setGradAcademicYear,
  gradRemarks,
  setGradRemarks,
  gradPreview,
  gradSelectedIds,
  onToggleGradStudent,
  onToggleAll,
  onOpenClassPicker,
  onSubmit,
  submitting,
  graduations,
  loadingGraduations,
  colors,
}) => {
  const classObj = classes.find(c => c.id === gradClassId);
  const selectedSet = new Set(gradSelectedIds);
  const allSelected = gradPreview.length > 0 && gradPreview.every(s => selectedSet.has(s.id));

  const renderPreviewItem = ({ item }: { item: StudentOption }) => {
    const isSelected = selectedSet.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.studentRow, { borderBottomColor: colors.backgroundSelected }]}
        onPress={() => onToggleGradStudent(item.id)}
      >
        <Ionicons
          name={isSelected ? 'checkbox' : 'square-outline'}
          size={20}
          color={isSelected ? '#AF52DE' : colors.textSecondary}
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

  const renderGradRecord = ({ item }: { item: PromotionRecord }) => {
    const config = statusConfig[item.status] || statusConfig.approved;
    return (
      <View style={[styles.gradCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
        <View style={styles.gradRow}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(175, 82, 222, 0.12)' }]}>
            <Ionicons name="school" size={16} color="#AF52DE" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>{item.studentName}</ThemedText>
            <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>
              Class: {item.fromClassName} • Year: {item.academicYear}
            </ThemedText>
          </View>
          <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
            <ThemedText style={{ fontSize: 11, fontWeight: '700', color: config.color }}>
              Graduated
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ gap: 16 }}>
      {/* Quick Graduate Card */}
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <View style={[styles.iconBadge, { backgroundColor: 'rgba(175, 82, 222, 0.15)' }]}>
            <Ionicons name="school-outline" size={18} color="#AF52DE" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 15 }}>Quick Graduate / Pass-Out</ThemedText>
            <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>
              Mark final class students as graduated from school.
            </ThemedText>
          </View>
        </View>

        {/* Class Selection */}
        <ThemedText style={styles.label}>Class *</ThemedText>
        <TouchableOpacity
          style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
          onPress={onOpenClassPicker}
        >
          <ThemedText style={{ color: classObj ? colors.text : colors.textSecondary, fontSize: 14 }}>
            {classObj ? `${classObj.name}-${classObj.section}` : 'Select class to graduate from'}
          </ThemedText>
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Academic Year */}
        <ThemedText style={[styles.label, { marginTop: 12 }]}>Academic Year *</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
          placeholder="e.g. 2024-2025"
          placeholderTextColor={colors.textSecondary}
          value={gradAcademicYear}
          onChangeText={setGradAcademicYear}
        />

        {/* Remarks */}
        <ThemedText style={[styles.label, { marginTop: 12 }]}>Graduation Note (Optional)</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected, height: 70, textAlignVertical: 'top', paddingVertical: 10 }]}
          placeholder="Graduation remarks..."
          placeholderTextColor={colors.textSecondary}
          value={gradRemarks}
          onChangeText={setGradRemarks}
          multiline
        />

        {/* Student Preview List for Selection */}
        {gradClassId ? (
          <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <ThemedText type="defaultSemiBold" style={{ fontSize: 13 }}>
                Select Students ({gradSelectedIds.length}/{gradPreview.length})
              </ThemedText>
              <TouchableOpacity onPress={onToggleAll}>
                <ThemedText style={{ fontSize: 12, color: '#AF52DE', fontWeight: 'bold' }}>
                  {allSelected ? 'Deselect All' : 'Select All'}
                </ThemedText>
              </TouchableOpacity>
            </View>
            <View style={{ height: 280, borderRadius: 10, borderWidth: 1, borderColor: colors.backgroundSelected, paddingHorizontal: 8 }}>
              <FlashList
                data={gradPreview}
                renderItem={renderPreviewItem}
              />
            </View>
          </View>
        ) : null}

        {/* Graduate Action Button */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: '#AF52DE', opacity: (!gradClassId || gradSelectedIds.length === 0 || submitting) ? 0.5 : 1 }]}
          onPress={onSubmit}
          disabled={!gradClassId || gradSelectedIds.length === 0 || submitting}
        >
          <Ionicons name="school" size={18} color="#FFF" />
          <ThemedText style={styles.submitBtnText}>
            {submitting ? 'Processing Graduation...' : `Graduate Selected (${gradSelectedIds.length})`}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Graduation Records List */}
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
        <ThemedText type="defaultSemiBold" style={{ fontSize: 15, marginBottom: 10 }}>
          Graduated Students History ({graduations.length})
        </ThemedText>
        {loadingGraduations ? (
          <View style={{ gap: 8 }}>
            <Skeleton width="100%" height={50} borderRadius={10} />
            <Skeleton width="100%" height={50} borderRadius={10} />
          </View>
        ) : graduations.length === 0 ? (
          <ThemedText style={{ fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', paddingVertical: 12, textAlign: 'center' }}>
            No graduated student records yet.
          </ThemedText>
        ) : (
          <View style={{ height: 260 }}>
            <FlashList
              data={graduations}
              renderItem={renderGradRecord}
            />
          </View>
        )}
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
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  gradCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  gradRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
});
