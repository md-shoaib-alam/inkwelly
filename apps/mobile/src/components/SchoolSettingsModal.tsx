import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { api } from '@/lib/api';

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

interface SchoolSettingsModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function SchoolSettingsModal({ visible, onDismiss }: SchoolSettingsModalProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workingDays, setWorkingDays] = useState<Set<DayKey>>(new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']));
  
  // Customisable parameters modeled from school-web Settings Card
  const [enableTabulationPreview, setEnableTabulationPreview] = useState(false);
  const [enableMarksheetPreview, setEnableMarksheetPreview] = useState(false);
  const [enableAdmitCardPreview, setEnableAdmitCardPreview] = useState(false);
  const [enableGradeSelection, setEnableGradeSelection] = useState(false);
  
  const [templateId, setTemplateId] = useState('classic');
  const [templateVisible, setTemplateVisible] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      if (!visible) return;
      try {
        setLoading(true);
        const res = await api.get('/tenant-settings');
        if (res) {
          if (Array.isArray(res.workingDays)) {
            setWorkingDays(new Set(res.workingDays as DayKey[]));
          }
          setEnableTabulationPreview(!!res.enableModalTabulationPreview);
          setEnableMarksheetPreview(!!res.enableModalMarksheetPreview);
          setEnableAdmitCardPreview(!!res.enableModalAdmitCardPreview);
          setEnableGradeSelection(res.enableGradeSelection === true);
          if (res.defaultMarksheetTemplateId) {
            setTemplateId(res.defaultMarksheetTemplateId);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [visible]);

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
        enableGradeSelection: enableGradeSelection,
      };

      await api.put('/tenant-settings', { settings });
      Alert.alert('Success', 'School settings updated successfully.');
      onDismiss();
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={onDismiss} 
        style={[styles.dialog, { backgroundColor: colors.backgroundElement }]}
      >
        <Dialog.Title style={{ color: colors.text }}>School Settings Config</Dialog.Title>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#007AFF" />
              <ThemedText style={{ marginTop: 10, color: colors.textSecondary }}>Fetching school configs...</ThemedText>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              
              {/* Working Days Config Section */}
              <ThemedText type="defaultSemiBold" style={[styles.sectionHeader, { color: colors.text }]}>Working Days</ThemedText>
              <View style={styles.daysGrid}>
                {ALL_DAYS.map((day) => {
                  const isSelected = workingDays.has(day.key);
                  return (
                    <TouchableOpacity
                      key={day.key}
                      style={[
                        styles.dayBadge,
                        { 
                          backgroundColor: isSelected ? '#34C759' : colors.background,
                          borderColor: colors.backgroundSelected 
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

              {/* Marksheet template Selector */}
              <ThemedText type="defaultSemiBold" style={[styles.sectionHeader, { color: colors.text, marginTop: 20 }]}>Marksheet Options</ThemedText>
              <View style={styles.selectorRow}>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 14 }}>Default Template</ThemedText>
                <TouchableOpacity 
                  style={[styles.dropdownTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                  onPress={() => setTemplateVisible(true)}
                >
                  <ThemedText style={{ color: colors.text, fontSize: 13, fontWeight: 'bold' }}>
                    {templateId.toUpperCase()}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Toggles */}
              <ThemedText type="defaultSemiBold" style={[styles.sectionHeader, { color: colors.text, marginTop: 20 }]}>Feature Previews</ThemedText>
              
              <View style={styles.switchRow}>
                <ThemedText style={{ color: colors.text, fontSize: 14 }}>Enable Marksheet Preview</ThemedText>
                <Switch 
                  value={enableMarksheetPreview}
                  onValueChange={setEnableMarksheetPreview}
                  trackColor={{ false: '#767577', true: '#34C759' }}
                  thumbColor="#FFF"
                />
              </View>

              <View style={styles.switchRow}>
                <ThemedText style={{ color: colors.text, fontSize: 14 }}>Enable Tabulation Preview</ThemedText>
                <Switch 
                  value={enableTabulationPreview}
                  onValueChange={setEnableTabulationPreview}
                  trackColor={{ false: '#767577', true: '#34C759' }}
                  thumbColor="#FFF"
                />
              </View>

              <View style={styles.switchRow}>
                <ThemedText style={{ color: colors.text, fontSize: 14 }}>Enable Admit Card Preview</ThemedText>
                <Switch 
                  value={enableAdmitCardPreview}
                  onValueChange={setEnableAdmitCardPreview}
                  trackColor={{ false: '#767577', true: '#34C759' }}
                  thumbColor="#FFF"
                />
              </View>

              <View style={styles.switchRow}>
                <ThemedText style={{ color: colors.text, fontSize: 14 }}>Enable Grade Selection</ThemedText>
                <Switch 
                  value={enableGradeSelection}
                  onValueChange={setEnableGradeSelection}
                  trackColor={{ false: '#767577', true: '#34C759' }}
                  thumbColor="#FFF"
                />
              </View>

            </ScrollView>
          )}
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button textColor={colors.textSecondary} onPress={onDismiss}>Cancel</Button>
          <Button textColor="#34C759" disabled={saving} onPress={handleSave}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Internal template selection sub-dialog */}
      <Portal>
        <Dialog 
          visible={templateVisible} 
          onDismiss={() => setTemplateVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Select Marksheet Template</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected }}>
            {['classic', 'modern', 'detailed', 'compact'].map((t) => (
              <TouchableOpacity 
                key={t}
                style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected }}
                onPress={() => {
                  setTemplateId(t);
                  setTemplateVisible(false);
                }}
              >
                <ThemedText style={{ color: colors.text, fontSize: 15, fontWeight: t === templateId ? 'bold' : 'normal' }}>
                  {t.toUpperCase()} {t === templateId && '✓'}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => setTemplateVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
    borderRadius: 16,
  },
  centerLoading: {
    padding: 30,
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
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
  },
  quickText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownTrigger: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
});
