import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { api } from '@/lib/api';
import type { Teacher } from '../types';
import { EMERALD, formatDate } from './types';

interface TeacherOverviewTabProps {
  teacher: Teacher;
  canEdit?: boolean;
  onUpdated?: (updated: Teacher) => void;
}

export function TeacherOverviewTab({ teacher, canEdit = true, onUpdated }: TeacherOverviewTabProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  // Section collapse state
  const [collapsed, setCollapsed] = useState<{ personal: boolean; professional: boolean }>({
    personal: false,
    professional: false,
  });

  // Editing state
  const [editingSection, setEditingSection] = useState<'personal' | 'professional' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: teacher.name || '',
    email: teacher.email || '',
    phone: teacher.phone || '',
    qualification: teacher.qualification || '',
    experience: teacher.experience || '',
  });

  const toggleCollapse = (sec: 'personal' | 'professional') => {
    setCollapsed(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleStartEdit = (sec: 'personal' | 'professional') => {
    setFormData({
      name: teacher.name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      qualification: teacher.qualification || '',
      experience: teacher.experience || '',
    });
    setEditingSection(sec);
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
  };

  const handleSaveSection = async (sec: 'personal' | 'professional') => {
    if (sec === 'personal') {
      if (!formData.name.trim() || !formData.email.trim()) {
        Alert.alert('Validation Error', 'Full Name and Email are required.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        Alert.alert('Validation Error', 'Please enter a valid email address.');
        return;
      }
    }

    try {
      setIsSaving(true);
      const payload: any = {
        id: teacher.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        qualification: formData.qualification.trim() || undefined,
        experience: formData.experience.trim() || undefined,
      };

      await api.put('/teachers', payload);

      const updatedTeacher: Teacher = {
        ...teacher,
        ...payload,
      };

      if (onUpdated) onUpdated(updatedTeacher);
      setEditingSection(null);
      Alert.alert('Success', 'Teacher details updated successfully.');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not update teacher information.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* CARD 1: Personal & Contact Information */}
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
        <TouchableOpacity 
          style={styles.cardHeader} 
          onPress={() => toggleCollapse('personal')} 
          activeOpacity={0.8}
        >
          <View style={styles.cardTitleRow}>
            <View style={[styles.iconPill, { backgroundColor: EMERALD.light }]}>
              <Ionicons name="person-outline" size={16} color={EMERALD.primary} />
            </View>
            <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
              Personal & Contact
            </ThemedText>
          </View>
          <View style={styles.cardActions}>
            {canEdit && editingSection !== 'personal' && (
              <TouchableOpacity
                style={[styles.miniEditBtn, { borderColor: EMERALD.border, backgroundColor: EMERALD.light }]}
                onPress={() => handleStartEdit('personal')}
              >
                <Ionicons name="pencil-outline" size={12} color={EMERALD.primary} style={{ marginRight: 4 }} />
                <ThemedText style={[styles.miniEditBtnText, { color: EMERALD.primary }]}>Edit</ThemedText>
              </TouchableOpacity>
            )}
            <Ionicons
              name={collapsed.personal ? 'chevron-down' : 'chevron-up'}
              size={18}
              color={colors.textSecondary}
              style={{ marginLeft: 8 }}
            />
          </View>
        </TouchableOpacity>

        {!collapsed.personal && (
          <View style={styles.cardBody}>
            {editingSection === 'personal' ? (
              <View style={styles.formContainer}>
                <View style={styles.fieldGroup}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Full Name *</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#D1D5DB', backgroundColor: colors.backgroundElement }]}
                    value={formData.name}
                    onChangeText={v => setFormData(p => ({ ...p, name: v }))}
                    placeholder="e.g. Dr. Jane Smith"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email Address *</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#D1D5DB', backgroundColor: colors.backgroundElement }]}
                    value={formData.email}
                    onChangeText={v => setFormData(p => ({ ...p, email: v }))}
                    placeholder="e.g. jane@school.com"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Phone Number</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#D1D5DB', backgroundColor: colors.backgroundElement }]}
                    value={formData.phone}
                    onChangeText={v => setFormData(p => ({ ...p, phone: v }))}
                    placeholder="e.g. +91 98765 43210"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.editButtonRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn, { borderColor: colors.border || '#D1D5DB' }]}
                    onPress={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <ThemedText style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.saveBtn, { backgroundColor: EMERALD.primary }]}
                    onPress={() => handleSaveSection('personal')}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <ThemedText style={styles.saveBtnText}>Save</ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.detailList}>
                <View style={styles.detailRow}>
                  <View style={[styles.iconBox, { backgroundColor: EMERALD.light }]}>
                    <Ionicons name="person-outline" size={16} color={EMERALD.primary} />
                  </View>
                  <View style={styles.detailTextCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Full Name</ThemedText>
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{teacher.name || '—'}</ThemedText>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <View style={[styles.iconBox, { backgroundColor: EMERALD.light }]}>
                    <Ionicons name="mail-outline" size={16} color={EMERALD.primary} />
                  </View>
                  <View style={styles.detailTextCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email Address</ThemedText>
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{teacher.email || '—'}</ThemedText>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <View style={[styles.iconBox, { backgroundColor: EMERALD.light }]}>
                    <Ionicons name="call-outline" size={16} color={EMERALD.primary} />
                  </View>
                  <View style={styles.detailTextCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Phone Number</ThemedText>
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{teacher.phone || '—'}</ThemedText>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <View style={[styles.iconBox, { backgroundColor: EMERALD.light }]}>
                    <Ionicons name="calendar-outline" size={16} color={EMERALD.primary} />
                  </View>
                  <View style={styles.detailTextCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Joining Date</ThemedText>
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{formatDate(teacher.joiningDate)}</ThemedText>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* CARD 2: Professional Details */}
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
        <TouchableOpacity 
          style={styles.cardHeader} 
          onPress={() => toggleCollapse('professional')} 
          activeOpacity={0.8}
        >
          <View style={styles.cardTitleRow}>
            <View style={[styles.iconPill, { backgroundColor: EMERALD.light }]}>
              <Ionicons name="briefcase-outline" size={16} color={EMERALD.primary} />
            </View>
            <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
              Professional Details
            </ThemedText>
          </View>
          <View style={styles.cardActions}>
            {canEdit && editingSection !== 'professional' && (
              <TouchableOpacity
                style={[styles.miniEditBtn, { borderColor: EMERALD.border, backgroundColor: EMERALD.light }]}
                onPress={() => handleStartEdit('professional')}
              >
                <Ionicons name="pencil-outline" size={12} color={EMERALD.primary} style={{ marginRight: 4 }} />
                <ThemedText style={[styles.miniEditBtnText, { color: EMERALD.primary }]}>Edit</ThemedText>
              </TouchableOpacity>
            )}
            <Ionicons
              name={collapsed.professional ? 'chevron-down' : 'chevron-up'}
              size={18}
              color={colors.textSecondary}
              style={{ marginLeft: 8 }}
            />
          </View>
        </TouchableOpacity>

        {!collapsed.professional && (
          <View style={styles.cardBody}>
            {editingSection === 'professional' ? (
              <View style={styles.formContainer}>
                <View style={styles.fieldGroup}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Qualification</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#D1D5DB', backgroundColor: colors.backgroundElement }]}
                    value={formData.qualification}
                    onChangeText={v => setFormData(p => ({ ...p, qualification: v }))}
                    placeholder="e.g. M.Sc, B.Ed"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Experience</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#D1D5DB', backgroundColor: colors.backgroundElement }]}
                    value={formData.experience}
                    onChangeText={v => setFormData(p => ({ ...p, experience: v }))}
                    placeholder="e.g. 5 years"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.editButtonRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn, { borderColor: colors.border || '#D1D5DB' }]}
                    onPress={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <ThemedText style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.saveBtn, { backgroundColor: EMERALD.primary }]}
                    onPress={() => handleSaveSection('professional')}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <ThemedText style={styles.saveBtnText}>Save</ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.detailList}>
                <View style={styles.detailRow}>
                  <View style={[styles.iconBox, { backgroundColor: EMERALD.light }]}>
                    <Ionicons name="school-outline" size={16} color={EMERALD.primary} />
                  </View>
                  <View style={styles.detailTextCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Qualification</ThemedText>
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{teacher.qualification || 'B.Ed'}</ThemedText>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <View style={[styles.iconBox, { backgroundColor: EMERALD.light }]}>
                    <Ionicons name="time-outline" size={16} color={EMERALD.primary} />
                  </View>
                  <View style={styles.detailTextCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Experience</ThemedText>
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{teacher.experience || '—'}</ThemedText>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <View style={[styles.iconBox, { backgroundColor: EMERALD.light }]}>
                    <Ionicons name="ribbon-outline" size={16} color={EMERALD.primary} />
                  </View>
                  <View style={styles.detailTextCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Designation</ThemedText>
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>Faculty Member</ThemedText>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <View style={[styles.iconBox, { backgroundColor: EMERALD.light }]}>
                    <Ionicons name="id-card-outline" size={16} color={EMERALD.primary} />
                  </View>
                  <View style={styles.detailTextCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Teacher ID</ThemedText>
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>TCH{teacher.id.slice(-4).toUpperCase()}</ThemedText>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconPill: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  miniEditBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  detailList: {
    gap: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextCol: {
    flex: 1,
    gap: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  formContainer: {
    gap: 12,
  },
  fieldGroup: {
    gap: 4,
  },
  input: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  editButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 80,
  },
  cancelBtn: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  saveBtn: {},
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
