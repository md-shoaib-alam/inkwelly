import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const ALL_DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

type DayKey = typeof ALL_DAYS[number]['key'];

export default function SchoolSettingsScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [workingDays, setWorkingDays] = useState<Set<DayKey>>(new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']));
  
  const [enableTabulationPreview, setEnableTabulationPreview] = useState(false);
  const [enableMarksheetPreview, setEnableMarksheetPreview] = useState(false);
  const [enableAdmitCardPreview, setEnableAdmitCardPreview] = useState(false);
  
  const [templateId, setTemplateId] = useState('classic');
  const [templateVisible, setTemplateVisible] = useState(false);

  const loadSettings = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) setLoading(true);
      const res = await api.get('/tenant-settings');
      if (res) {
        if (Array.isArray(res.workingDays)) {
          setWorkingDays(new Set(res.workingDays as DayKey[]));
        }
        setEnableTabulationPreview(!!res.enableModalTabulationPreview);
        setEnableMarksheetPreview(!!res.enableModalMarksheetPreview);
        setEnableAdmitCardPreview(!!res.enableModalAdmitCardPreview);
        if (res.defaultMarksheetTemplateId) {
          setTemplateId(res.defaultMarksheetTemplateId);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSettings(false);
  };

  const toggleDay = (day: DayKey) => {
    const next = new Set(workingDays);
    if (next.has(day)) {
      if (next.size <= 1) {
        Alert.alert('Error', 'At least one working day must be selected.');
        return;
      }
      next.delete(day);
    } else {
      next.add(day);
    }
    setWorkingDays(next);
  };

  const handleQuickSelect = (days: DayKey[]) => {
    setWorkingDays(new Set(days));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const settings = {
        workingDays: Array.from(workingDays),
        defaultMarksheetTemplateId: templateId,
        enableModalTabulationPreview: enableTabulationPreview,
        enableModalMarksheetPreview: enableMarksheetPreview,
        enableModalAdmitCardPreview: enableAdmitCardPreview,
      };

      await api.put('/tenant-settings', { settings });
      Alert.alert('Success', 'School settings updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container} safeAreaTop>
      {/* Header bar with Back button */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.backgroundSelected, justifyContent: 'center' }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.backgroundSelected, position: 'absolute', left: 16 }]} onPress={() => router.push('/(admin)/(tabs)/more')}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>School Settings</ThemedText>
      </View>

      {loading && !isRefreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#10B981" />
          <ThemedText style={{ marginTop: 10, color: colors.textSecondary }}>Fetching school configs...</ThemedText>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#10B981']} />
          }
        >
          {/* Working Days Config Section */}
          <ThemedText type="defaultSemiBold" style={[styles.sectionHeader, { color: colors.text }]}>Working Days</ThemedText>
          <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
            <View style={styles.daysGrid}>
              {ALL_DAYS.map((day) => {
                const isSelected = workingDays.has(day.key);
                return (
                  <TouchableOpacity
                    key={day.key}
                    style={[
                      styles.dayBadge,
                      { 
                        backgroundColor: isSelected ? '#10B981' : colors.background,
                        borderColor: isSelected ? '#10B981' : colors.backgroundSelected 
                      }
                    ]}
                    onPress={() => toggleDay(day.key)}
                  >
                    <ThemedText style={{ color: isSelected ? '#FFF' : colors.text, fontSize: 13, fontWeight: '500' }}>
                      {day.label.slice(0, 3)}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick selectors */}
            <View style={styles.quickSelectRow}>
              <TouchableOpacity onPress={() => handleQuickSelect(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])}>
                <ThemedText style={styles.quickText}>Mon - Fri</ThemedText>
              </TouchableOpacity>
              <ThemedText style={{ color: colors.textSecondary }}>|</ThemedText>
              <TouchableOpacity onPress={() => handleQuickSelect(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'])}>
                <ThemedText style={styles.quickText}>Mon - Sat</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Marksheet template Selector */}
          <ThemedText type="defaultSemiBold" style={[styles.sectionHeader, { color: colors.text, marginTop: 20 }]}>Marksheet Options</ThemedText>
          <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
            <View style={styles.selectorRow}>
              <ThemedText style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>Default Template</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdownTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                onPress={() => setTemplateVisible(true)}
              >
                <ThemedText style={{ color: colors.text, fontSize: 13, fontWeight: 'bold' }}>
                  {templateId.toUpperCase()}
                </ThemedText>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Toggles */}
          <ThemedText type="defaultSemiBold" style={[styles.sectionHeader, { color: colors.text, marginTop: 20 }]}>Feature Options</ThemedText>
          <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <ThemedText style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>Enable Marksheet Preview</ThemedText>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>Allow previewing marksheets inside modals.</ThemedText>
              </View>
              <Switch 
                value={enableMarksheetPreview}
                onValueChange={setEnableMarksheetPreview}
                trackColor={{ false: '#767577', true: '#10B981' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.backgroundSelected }]} />

            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <ThemedText style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>Enable Tabulation Preview</ThemedText>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>Display tabulation charts inside preview overlays.</ThemedText>
              </View>
              <Switch 
                value={enableTabulationPreview}
                onValueChange={setEnableTabulationPreview}
                trackColor={{ false: '#767577', true: '#10B981' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.backgroundSelected }]} />

            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <ThemedText style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>Enable Admit Card Preview</ThemedText>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>View student admit cards in popups.</ThemedText>
              </View>
              <Switch 
                value={enableAdmitCardPreview}
                onValueChange={setEnableAdmitCardPreview}
                trackColor={{ false: '#767577', true: '#10B981' }}
                thumbColor="#FFF"
              />
            </View>
          </View>

          {/* Action button */}
          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: '#10B981' }]} 
            onPress={handleSave}
            disabled={saving}
          >
            <ThemedText style={styles.saveBtnText}>
              {saving ? 'Saving Settings...' : 'Save Settings'}
            </ThemedText>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Internal template selection sub-dialog */}
      <Portal>
        <Dialog 
          visible={templateVisible} 
          onDismiss={() => setTemplateVisible(false)}
          style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}
        >
          <Dialog.Title style={{ color: colors.text }}>Select Marksheet Template</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            {['classic', 'modern', 'detailed', 'compact'].map((t) => (
              <TouchableOpacity 
                key={t}
                style={{ paddingVertical: 14, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                onPress={() => {
                  setTemplateId(t);
                  setTemplateVisible(false);
                }}
              >
                <ThemedText style={{ color: colors.text, fontSize: 15, fontWeight: t === templateId ? 'bold' : 'normal' }}>
                  {t.toUpperCase()}
                </ThemedText>
                {t === templateId && (
                  <Ionicons name="checkmark" size={18} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setTemplateVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#8e8e93',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  dayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  quickText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: 'bold',
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownTrigger: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
