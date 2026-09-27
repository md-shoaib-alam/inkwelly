import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { Portal, Dialog } from 'react-native-paper';

interface SetFeesTabProps {
  colors: any;
  structures: any[];
  categories: any[];
  setStructureDialogVisible: (v: boolean) => void;
  resetStructureForm: () => void;
  handleDeleteStructure: (id: string) => void;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  yearFilter: string;
  setYearFilter: (v: string) => void;
  catFilter: string;
  setCatFilter: (v: string) => void;
  onAssign: (s: any) => void;
  onEdit: (s: any) => void;
  academicYears: any[];
}

export function SetFeesTab({
  colors,
  structures = [],
  categories = [],
  setStructureDialogVisible,
  resetStructureForm,
  handleDeleteStructure,
  canCreate,
  canEdit,
  canDelete,
  yearFilter,
  setYearFilter,
  catFilter,
  setCatFilter,
  onAssign,
  onEdit,
  academicYears = [],
}: SetFeesTabProps) {
  const [yearPickerOpen, setYearPickerOpen] = React.useState(false);
  const [catPickerOpen, setCatPickerOpen] = React.useState(false);

  // Use academicYears from database for picker list
  const filterYears = React.useMemo(() => {
    const years = academicYears.map(y => y.name);
    return ['all', ...years];
  }, [academicYears]);

  // Filter structures
  const filtered = React.useMemo(() => {
    return structures.filter(s => {
      const matchYear = yearFilter === 'all' || s.academicYear === yearFilter;
      const matchCat = catFilter === 'all' || s.feeCategoryId === catFilter;
      return matchYear && matchCat;
    });
  }, [structures, yearFilter, catFilter]);

  // Total Expected Revenue from current filtered structures
  const totalRevenue = React.useMemo(() => {
    return filtered.reduce((sum, s) => sum + (s.amount || 0), 0);
  }, [filtered]);

  return (
    <View style={{ gap: 16 }}>
      {/* SUMMARY STATS CARDS */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
            <Ionicons name="pricetags-outline" size={20} color="#34C759" />
          </View>
          <View>
            <ThemedText style={{ fontSize: 10, color: colors.textSecondary }}>Categories</ThemedText>
            <ThemedText style={styles.statVal}>{categories.length}</ThemedText>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
            <Ionicons name="layers-outline" size={20} color="#007AFF" />
          </View>
          <View>
            <ThemedText style={{ fontSize: 10, color: colors.textSecondary }}>Structures</ThemedText>
            <ThemedText style={styles.statVal}>{filtered.length}</ThemedText>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
            <Ionicons name="cash-outline" size={20} color="#FF9500" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 10, color: colors.textSecondary }}>Expected Rev.</ThemedText>
            <ThemedText style={[styles.statVal, { fontSize: 13 }]} numberOfLines={1}>₹{totalRevenue.toLocaleString()}</ThemedText>
          </View>
        </View>
      </View>

      {/* FILTERS & ADD BAR */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 10 }}>
          {/* Year Filter Trigger */}
          <TouchableOpacity
            style={[styles.filterSelector, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}
            onPress={() => setYearPickerOpen(true)}
          >
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <ThemedText style={styles.filterText} numberOfLines={1}>
              {yearFilter === 'all' ? 'All Years' : yearFilter}
            </ThemedText>
            <Ionicons name="chevron-down" size={12} color={colors.textSecondary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          {/* Category Filter Trigger */}
          <TouchableOpacity
            style={[styles.filterSelector, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}
            onPress={() => setCatPickerOpen(true)}
          >
            <Ionicons name="funnel-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <ThemedText style={styles.filterText} numberOfLines={1}>
              {catFilter === 'all' ? 'All Categories' : (categories.find(c => c.id === catFilter)?.name || 'Category')}
            </ThemedText>
            <Ionicons name="chevron-down" size={12} color={colors.textSecondary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </ScrollView>

        {canCreate && (
          <TouchableOpacity
            style={styles.tabActionBtn}
            onPress={() => {
              resetStructureForm();
              setStructureDialogVisible(true);
            }}
          >
            <Ionicons name="add" size={16} color="#FFF" style={{ marginRight: 4 }} />
            <ThemedText style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>Add</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* FILTER DIALOGS */}
      <Portal>
        <Dialog visible={yearPickerOpen} onDismiss={() => setYearPickerOpen(false)} style={{ backgroundColor: colors.backgroundElement }}>
          <Dialog.Title style={{ color: colors.text }}>Select Academic Year</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <ScrollView>
              {filterYears.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.pickerItem, { borderBottomColor: colors.backgroundSelected }]}
                  onPress={() => {
                    setYearFilter(y);
                    setYearPickerOpen(false);
                  }}
                >
                  <ThemedText style={{ color: colors.text, fontWeight: yearFilter === y ? 'bold' : 'normal' }}>
                    {y === 'all' ? 'All Academic Years' : y}
                  </ThemedText>
                  {yearFilter === y && <Ionicons name="checkmark" size={16} color="#007AFF" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={catPickerOpen} onDismiss={() => setCatPickerOpen(false)} style={{ backgroundColor: colors.backgroundElement }}>
          <Dialog.Title style={{ color: colors.text }}>Select Category</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <ScrollView>
              <TouchableOpacity
                style={[styles.pickerItem, { borderBottomColor: colors.backgroundSelected }]}
                onPress={() => {
                  setCatFilter('all');
                  setCatPickerOpen(false);
                }}
              >
                <ThemedText style={{ color: colors.text, fontWeight: catFilter === 'all' ? 'bold' : 'normal' }}>
                  All Categories
                </ThemedText>
                {catFilter === 'all' && <Ionicons name="checkmark" size={16} color="#007AFF" />}
              </TouchableOpacity>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.pickerItem, { borderBottomColor: colors.backgroundSelected }]}
                  onPress={() => {
                    setCatFilter(c.id);
                    setCatPickerOpen(false);
                  }}
                >
                  <ThemedText style={{ color: colors.text, fontWeight: catFilter === c.id ? 'bold' : 'normal' }}>
                    {c.name}
                  </ThemedText>
                  {catFilter === c.id && <Ionicons name="checkmark" size={16} color="#007AFF" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>

      {/* CONFIGURED CLASS FEES */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Configured Structures ({filtered.length})</ThemedText>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="layers-outline" size={40} color={colors.textSecondary} style={{ opacity: 0.4, marginBottom: 8 }} />
          <ThemedText style={{ color: colors.textSecondary }}>No fee structures configured.</ThemedText>
        </View>
      ) : (
        filtered.map((s) => (
          <View key={s.id} style={[styles.structureCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
            <View style={styles.structureHeader}>
              <View style={{ flex: 1, marginRight: 8, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <ThemedText type="defaultSemiBold" style={{ fontSize: 14, flexShrink: 1, minWidth: 0 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{s.feeCategoryName}</ThemedText>
                  {s.feeCategoryStatus === 'inactive' && (
                    <View style={styles.inactiveBadge}>
                      <ThemedText style={styles.inactiveBadgeText}>Inactive</ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                  Class: {s.className} ({s.academicYear})
                </ThemedText>
              </View>

              <View style={{ alignItems: 'flex-end', gap: 8, flexShrink: 1 }}>
                <ThemedText style={{ fontWeight: 'bold', fontSize: 15, color: '#007AFF' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>₹{s.amount.toLocaleString()}</ThemedText>
                
                <View style={styles.cardActions}>
                  {/* Assign to students button */}
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}
                    onPress={() => onAssign(s)}
                    disabled={s.feeCategoryStatus === 'inactive'}
                  >
                    <Ionicons name="people" size={14} color={s.feeCategoryStatus === 'inactive' ? colors.textSecondary : '#34C759'} />
                  </TouchableOpacity>

                  {/* Edit Structure amount */}
                  {canEdit && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}
                      onPress={() => onEdit(s)}
                    >
                      <Ionicons name="pencil" size={14} color="#007AFF" />
                    </TouchableOpacity>
                  )}

                  {/* Delete Structure */}
                  {canDelete && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}
                      onPress={() => handleDeleteStructure(s.id)}
                    >
                      <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginVertical: 4,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  statCard: {
    flex: 1,
    minWidth: 96,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  filterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 130,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  structureCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 2,
  },
  structureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  inactiveBadge: {
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(142, 142, 147, 0.15)',
  },
  inactiveBadgeText: {
    fontSize: 9,
    color: '#8E8E93',
    fontWeight: 'bold',
  },
});
