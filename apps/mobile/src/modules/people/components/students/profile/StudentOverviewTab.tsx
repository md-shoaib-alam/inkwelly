import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput,
  TouchableOpacity, 
  Linking, 
  Alert,
  ActivityIndicator
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { api } from '@/lib/api';
import type { Student, SiblingInfo } from '@/types/index';
import { EMERALD, formatDate, calculateAge } from './types';

interface StudentOverviewTabProps {
  student: Student;
  canEdit?: boolean;
  onUpdateStudent?: (updated: Student) => void;
}

export function StudentOverviewTab({
  student,
  canEdit = true,
  onUpdateStudent,
}: StudentOverviewTabProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [collapsed, setCollapsed] = useState<{ [key: string]: boolean }>({
    personal: false,
    academic: false,
    parent: false,
    transport: false,
    siblings: false,
  });

  const [editingSection, setEditingSection] = useState<'personal' | 'academic' | 'parent' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: student.name || '',
    gender: (student.gender || 'female').toLowerCase(),
    dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
    bloodGroup: (student as any).bloodGroup || '',
    phone: student.phone || '',
    rollNumber: student.rollNumber || '',
    admissionDate: student.admissionDate ? student.admissionDate.split('T')[0] : '',
    parentName: student.parentName || '',
    parentRelationship: 'Parent',
    parentPhone: student.parentPhone || '',
    parentEmail: student.parentEmail || '',
    email: student.email || '',
    address: (student as any).address || (student as any).parentAddress || '',
  });

  useEffect(() => {
    setFormData({
      name: student.name || '',
      gender: (student.gender || 'female').toLowerCase(),
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      bloodGroup: (student as any).bloodGroup || '',
      phone: student.phone || '',
      rollNumber: student.rollNumber || '',
      admissionDate: student.admissionDate ? student.admissionDate.split('T')[0] : '',
      parentName: student.parentName || '',
      parentRelationship: 'Parent',
      parentPhone: student.parentPhone || '',
      parentEmail: student.parentEmail || '',
      email: student.email || '',
      address: (student as any).address || (student as any).parentAddress || '',
    });
  }, [student]);

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const startEdit = (section: 'personal' | 'academic' | 'parent') => {
    setCollapsed((prev) => ({ ...prev, [section]: false }));
    setEditingSection(section);
  };

  const cancelEdit = () => {
    setFormData({
      name: student.name || '',
      gender: (student.gender || 'female').toLowerCase(),
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      bloodGroup: (student as any).bloodGroup || '',
      phone: student.phone || '',
      rollNumber: student.rollNumber || '',
      admissionDate: student.admissionDate ? student.admissionDate.split('T')[0] : '',
      parentName: student.parentName || '',
      parentRelationship: 'Parent',
      parentPhone: student.parentPhone || '',
      parentEmail: student.parentEmail || '',
      email: student.email || '',
      address: (student as any).address || (student as any).parentAddress || '',
    });
    setEditingSection(null);
  };

  const handleSaveSection = async (section: 'personal' | 'academic' | 'parent') => {
    if (!formData.name.trim()) {
      Alert.alert('Validation', 'Student name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        id: student.id,
        name: formData.name.trim(),
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth : undefined,
        bloodGroup: formData.bloodGroup ? formData.bloodGroup : undefined,
        phone: formData.phone ? formData.phone : undefined,
        rollNumber: formData.rollNumber ? formData.rollNumber : undefined,
        admissionDate: formData.admissionDate ? formData.admissionDate : undefined,
        parentName: formData.parentName ? formData.parentName : undefined,
        parentPhone: formData.parentPhone ? formData.parentPhone : undefined,
        parentEmail: formData.parentEmail ? formData.parentEmail : undefined,
        email: formData.email ? formData.email : undefined,
        address: formData.address ? formData.address : undefined,
      };

      await api.put('/students', payload);
      const updated: Student = {
        ...student,
        ...payload,
      };
      onUpdateStudent?.(updated);
      setEditingSection(null);
      Alert.alert('Success', 'Student details updated successfully!');
    } catch (err: any) {
      console.error('Failed to update student:', err);
      Alert.alert('Save Failed', err?.message || 'Could not update student details.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayStudentId = student.username || student.rollNumber || student.id.substring(0, 8);

  const handleCopy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard!`);
  };

  const handleCall = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email?: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <View style={styles.container}>
      {/* 1. Personal Information Card */}
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="person-outline" size={18} color={EMERALD.primary} style={{ marginRight: 8 }} />
            <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
              Personal Information
            </ThemedText>
          </View>
          
          <View style={styles.cardHeaderActions}>
            {editingSection === 'personal' ? (
              <View style={styles.editActionsRow}>
                <TouchableOpacity 
                  style={[styles.cancelBtn, { borderColor: colors.border || '#E5E7EB' }]}
                  onPress={cancelEdit}
                  disabled={isSaving}
                  activeOpacity={0.7}
                >
                  <ThemedText style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.saveBtn, { backgroundColor: EMERALD.primary }]}
                  onPress={() => handleSaveSection('personal')}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={14} color="#FFF" style={{ marginRight: 4 }} />
                      <ThemedText style={styles.saveBtnText}>Save</ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              canEdit && (
                <TouchableOpacity 
                  style={[styles.editPillBtn, { borderColor: colors.border || '#E5E7EB' }]} 
                  onPress={() => startEdit('personal')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <ThemedText style={[styles.editPillText, { color: colors.textSecondary }]}>Edit</ThemedText>
                </TouchableOpacity>
              )
            )}

            <TouchableOpacity onPress={() => toggleCollapse('personal')} style={styles.chevronBtn}>
              <Ionicons 
                name={collapsed.personal ? "chevron-down" : "chevron-up"} 
                size={18} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {!collapsed.personal && (
          <View style={styles.cardBody}>
            {editingSection === 'personal' ? (
              /* Inline Edit Mode Form */
              <View style={styles.formContainer}>
                {/* Full Name */}
                <View style={styles.formField}>
                  <View style={styles.labelRow}>
                    <ThemedText style={[styles.formLabel, { color: colors.textSecondary }]}>Full Name</ThemedText>
                    <ThemedText style={styles.requiredAsterisk}>*</ThemedText>
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#E5E7EB', backgroundColor: colors.backgroundElement }]}
                    value={formData.name}
                    onChangeText={(text) => setFormData(p => ({ ...p, name: text }))}
                    placeholder="Enter student name"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                {/* Gender Selector */}
                <View style={styles.formField}>
                  <View style={styles.labelRow}>
                    <ThemedText style={[styles.formLabel, { color: colors.textSecondary }]}>Gender</ThemedText>
                    <ThemedText style={styles.requiredAsterisk}>*</ThemedText>
                  </View>
                  <View style={styles.genderRow}>
                    {(['female', 'male', 'other'] as const).map((g) => {
                      const isSelected = formData.gender === g;
                      return (
                        <TouchableOpacity
                          key={g}
                          style={[
                            styles.genderPill,
                            { borderColor: isSelected ? EMERALD.primary : (colors.border || '#E5E7EB') },
                            isSelected && { backgroundColor: EMERALD.lightBg }
                          ]}
                          onPress={() => setFormData(p => ({ ...p, gender: g }))}
                        >
                          <Ionicons 
                            name={g === 'male' ? 'male-outline' : g === 'female' ? 'female-outline' : 'person-outline'} 
                            size={14} 
                            color={isSelected ? EMERALD.primary : colors.textSecondary} 
                            style={{ marginRight: 4 }} 
                          />
                          <ThemedText style={[
                            styles.genderPillText, 
                            { color: isSelected ? EMERALD.primary : colors.text, fontWeight: isSelected ? '700' : '500' }
                          ]}>
                            {g.charAt(0).toUpperCase() + g.slice(1)}
                          </ThemedText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Date of Birth */}
                <View style={styles.formField}>
                  <View style={styles.labelRow}>
                    <ThemedText style={[styles.formLabel, { color: colors.textSecondary }]}>Date of Birth</ThemedText>
                    <ThemedText style={styles.requiredAsterisk}>*</ThemedText>
                  </View>
                  <View style={[styles.inputWithIcon, { borderColor: colors.border || '#E5E7EB', backgroundColor: colors.backgroundElement }]}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.inputFieldInner, { color: colors.text }]}
                      value={formData.dateOfBirth}
                      onChangeText={(text) => setFormData(p => ({ ...p, dateOfBirth: text }))}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>

                {/* Age (Read-only calculated) */}
                <View style={styles.formField}>
                  <ThemedText style={[styles.formLabel, { color: colors.textSecondary }]}>Age</ThemedText>
                  <View style={[styles.inputDisabled, { borderColor: colors.border || '#E5E7EB', backgroundColor: colors.backgroundSelected }]}>
                    <ThemedText style={{ color: colors.textSecondary, fontSize: 14 }}>
                      {calculateAge(formData.dateOfBirth)}
                    </ThemedText>
                  </View>
                </View>

                {/* Blood Group */}
                <View style={styles.formField}>
                  <ThemedText style={[styles.formLabel, { color: colors.textSecondary }]}>Blood Group</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#E5E7EB', backgroundColor: colors.backgroundElement }]}
                    value={formData.bloodGroup}
                    onChangeText={(text) => setFormData(p => ({ ...p, bloodGroup: text }))}
                    placeholder="e.g. O+, A+, B+, AB+"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                {/* Phone */}
                <View style={styles.formField}>
                  <ThemedText style={[styles.formLabel, { color: colors.textSecondary }]}>Phone Number</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#E5E7EB', backgroundColor: colors.backgroundElement }]}
                    value={formData.phone}
                    onChangeText={(text) => setFormData(p => ({ ...p, phone: text }))}
                    placeholder="Student phone number"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            ) : (
              /* Read-only Display Mode */
              <>
                <View style={styles.gridRow}>
                  <View style={styles.gridCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Full Name</ThemedText>
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{student.name}</ThemedText>
                  </View>
                  <View style={styles.gridCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Gender</ThemedText>
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>
                      {student.gender ? (student.gender.charAt(0).toUpperCase() + student.gender.slice(1)) : '—'}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.gridRow}>
                  <View style={styles.gridCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>DOB</ThemedText>
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{formatDate(student.dateOfBirth)}</ThemedText>
                  </View>
                  <View style={styles.gridCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Age</ThemedText>
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{calculateAge(student.dateOfBirth)}</ThemedText>
                  </View>
                </View>

                <View style={[styles.gridRow, { marginBottom: 0 }]}>
                  <View style={styles.gridCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Blood Group</ThemedText>
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>
                      {(student as any).bloodGroup || 'Not Added'}
                    </ThemedText>
                  </View>
                  <View style={styles.gridCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Phone</ThemedText>
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>
                      {student.phone || '—'}
                    </ThemedText>
                  </View>
                </View>
              </>
            )}
          </View>
        )}
      </View>

      {/* 2. Academic Information Card */}
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="school-outline" size={18} color={EMERALD.primary} style={{ marginRight: 8 }} />
            <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
              Academic Information
            </ThemedText>
          </View>

          <View style={styles.cardHeaderActions}>
            {editingSection === 'academic' ? (
              <View style={styles.editActionsRow}>
                <TouchableOpacity 
                  style={[styles.cancelBtn, { borderColor: colors.border || '#E5E7EB' }]}
                  onPress={cancelEdit}
                  disabled={isSaving}
                  activeOpacity={0.7}
                >
                  <ThemedText style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.saveBtn, { backgroundColor: EMERALD.primary }]}
                  onPress={() => handleSaveSection('academic')}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={14} color="#FFF" style={{ marginRight: 4 }} />
                      <ThemedText style={styles.saveBtnText}>Save</ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              canEdit && (
                <TouchableOpacity 
                  style={[styles.editPillBtn, { borderColor: colors.border || '#E5E7EB' }]} 
                  onPress={() => startEdit('academic')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <ThemedText style={[styles.editPillText, { color: colors.textSecondary }]}>Edit</ThemedText>
                </TouchableOpacity>
              )
            )}

            <TouchableOpacity onPress={() => toggleCollapse('academic')} style={styles.chevronBtn}>
              <Ionicons 
                name={collapsed.academic ? "chevron-down" : "chevron-up"} 
                size={18} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {!collapsed.academic && (
          <View style={styles.cardBody}>
            {editingSection === 'academic' ? (
              /* Inline Edit Mode for Academic */
              <View style={styles.formContainer}>
                <View style={styles.formField}>
                  <ThemedText style={[styles.formLabel, { color: colors.textSecondary }]}>Class Roll Number</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#E5E7EB', backgroundColor: colors.backgroundElement }]}
                    value={formData.rollNumber}
                    onChangeText={(text) => setFormData(p => ({ ...p, rollNumber: text }))}
                    placeholder="e.g. 10"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.formField}>
                  <ThemedText style={[styles.formLabel, { color: colors.textSecondary }]}>Admission Date</ThemedText>
                  <View style={[styles.inputWithIcon, { borderColor: colors.border || '#E5E7EB', backgroundColor: colors.backgroundElement }]}>
                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.inputFieldInner, { color: colors.text }]}
                      value={formData.admissionDate}
                      onChangeText={(text) => setFormData(p => ({ ...p, admissionDate: text }))}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>
              </View>
            ) : (
              /* Read-only Academic */
              <>
                <View style={styles.gridRow}>
                  <View style={styles.gridCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Class & Section</ThemedText>
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{student.className || 'Unassigned'}</ThemedText>
                  </View>
                  <View style={styles.gridCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Roll No</ThemedText>
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{student.rollNumber || '—'}</ThemedText>
                  </View>
                </View>

                <View style={[styles.gridRow, { marginBottom: 0 }]}>
                  <View style={styles.gridCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Student ID</ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <ThemedText style={[styles.fieldValue, { color: colors.text, marginRight: 6 }]}>
                        {displayStudentId}
                      </ThemedText>
                      <TouchableOpacity onPress={() => handleCopy(displayStudentId, 'Student ID')}>
                        <Ionicons name="copy-outline" size={14} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.gridCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Admission Date</ThemedText>
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>
                      {formatDate(student.admissionDate || (student as any).createdAt)}
                    </ThemedText>
                  </View>
                </View>
              </>
            )}
          </View>
        )}
      </View>

      {/* 3. Parent & Contact Details Card */}
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="people-outline" size={18} color={EMERALD.primary} style={{ marginRight: 8 }} />
            <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
              Parent & Contact Details
            </ThemedText>
          </View>

          <View style={styles.cardHeaderActions}>
            {editingSection === 'parent' ? (
              <View style={styles.editActionsRow}>
                <TouchableOpacity 
                  style={[styles.cancelBtn, { borderColor: colors.border || '#E5E7EB' }]}
                  onPress={cancelEdit}
                  disabled={isSaving}
                  activeOpacity={0.7}
                >
                  <ThemedText style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.saveBtn, { backgroundColor: EMERALD.primary }]}
                  onPress={() => handleSaveSection('parent')}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={14} color="#FFF" style={{ marginRight: 4 }} />
                      <ThemedText style={styles.saveBtnText}>Save</ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              canEdit && (
                <TouchableOpacity 
                  style={[styles.editPillBtn, { borderColor: colors.border || '#E5E7EB' }]} 
                  onPress={() => startEdit('parent')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <ThemedText style={[styles.editPillText, { color: colors.textSecondary }]}>Edit</ThemedText>
                </TouchableOpacity>
              )
            )}

            <TouchableOpacity onPress={() => toggleCollapse('parent')} style={styles.chevronBtn}>
              <Ionicons 
                name={collapsed.parent ? "chevron-down" : "chevron-up"} 
                size={18} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {!collapsed.parent && (
          <View style={styles.cardBody}>
            {editingSection === 'parent' ? (
              /* Inline Edit Mode for Parent */
              <View style={styles.formContainer}>
                <View style={styles.formField}>
                  <ThemedText style={[styles.formLabel, { color: colors.textSecondary }]}>Parent / Guardian Name</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#E5E7EB', backgroundColor: colors.backgroundElement }]}
                    value={formData.parentName}
                    onChangeText={(text) => setFormData(p => ({ ...p, parentName: text }))}
                    placeholder="Parent or guardian name"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.formField}>
                  <ThemedText style={[styles.formLabel, { color: colors.textSecondary }]}>Relationship (Parent)</ThemedText>
                  <TextInput
                    style={[styles.input, styles.inputDisabled, { color: colors.textSecondary, borderColor: colors.border || '#E5E7EB', backgroundColor: colors.backgroundSelected }]}
                    value="Parent"
                    editable={false}
                  />
                </View>

                <View style={styles.formField}>
                  <ThemedText style={[styles.formLabel, { color: colors.textSecondary }]}>Parent Phone</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#E5E7EB', backgroundColor: colors.backgroundElement }]}
                    value={formData.parentPhone}
                    onChangeText={(text) => setFormData(p => ({ ...p, parentPhone: text }))}
                    placeholder="Parent contact number"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.formField}>
                  <ThemedText style={[styles.formLabel, { color: colors.textSecondary }]}>Parent Email</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#E5E7EB', backgroundColor: colors.backgroundElement }]}
                    value={formData.parentEmail}
                    onChangeText={(text) => setFormData(p => ({ ...p, parentEmail: text }))}
                    placeholder="parent@example.com"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.formField}>
                  <ThemedText style={[styles.formLabel, { color: colors.textSecondary }]}>Student Email</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#E5E7EB', backgroundColor: colors.backgroundElement }]}
                    value={formData.email}
                    onChangeText={(text) => setFormData(p => ({ ...p, email: text }))}
                    placeholder="student@example.com"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.formField}>
                  <ThemedText style={[styles.formLabel, { color: colors.textSecondary }]}>Address</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#E5E7EB', backgroundColor: colors.backgroundElement }]}
                    value={formData.address}
                    onChangeText={(text) => setFormData(p => ({ ...p, address: text }))}
                    placeholder="Enter address"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>
            ) : (
              /* Read-only Parent */
              <>
                {/* Row 1: Parent Name & Parent Phone */}
                <View style={styles.gridRow}>
                  <View style={styles.gridCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Parent Name</ThemedText>
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>
                      {formData.parentName || student.parentName || '–'}
                    </ThemedText>
                  </View>
                  <View style={styles.gridCol}>
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Parent Phone</ThemedText>
                    {(formData.parentPhone || student.parentPhone) ? (
                      <TouchableOpacity onPress={() => handleCall(formData.parentPhone || student.parentPhone)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="call" size={13} color={EMERALD.primary} />
                        <ThemedText style={[styles.fieldValue, { color: EMERALD.primary }]}>
                          {formData.parentPhone || student.parentPhone}
                        </ThemedText>
                      </TouchableOpacity>
                    ) : (
                      <ThemedText style={[styles.fieldValue, { color: colors.textSecondary }]}>—</ThemedText>
                    )}
                  </View>
                </View>

                {/* Row 2: Relationship */}
                <View style={{ marginBottom: 14 }}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Relationship</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>
                    {formData.parentRelationship || 'Parent'}
                  </ThemedText>
                </View>

                {/* Row 3: Parent Email (Full Row) */}
                <View style={{ marginBottom: 14 }}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Parent Email</ThemedText>
                  {(formData.parentEmail || student.parentEmail) ? (
                    <TouchableOpacity onPress={() => handleEmail(formData.parentEmail || student.parentEmail)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="mail" size={13} color={EMERALD.primary} />
                      <ThemedText style={[styles.fieldValue, { color: EMERALD.primary }]}>
                        {formData.parentEmail || student.parentEmail}
                      </ThemedText>
                    </TouchableOpacity>
                  ) : (
                    <ThemedText style={[styles.fieldValue, { color: colors.textSecondary }]}>—</ThemedText>
                  )}
                </View>

                {/* Row 4: Student Email (Full Row) */}
                <View style={{ marginBottom: 14 }}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Student Email</ThemedText>
                  {(formData.email || student.email) ? (
                    <TouchableOpacity onPress={() => handleEmail(formData.email || student.email)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="mail" size={13} color={EMERALD.primary} />
                      <ThemedText style={[styles.fieldValue, { color: colors.text }]}>
                        {formData.email || student.email}
                      </ThemedText>
                    </TouchableOpacity>
                  ) : (
                    <ThemedText style={[styles.fieldValue, { color: colors.textSecondary }]}>—</ThemedText>
                  )}
                </View>

                {/* Row 5: Address (Full Row) */}
                <View style={{ marginBottom: 0 }}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Address</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>
                    {formData.address || (student as any).address || (student as any).parentAddress || 'Not Added'}
                  </ThemedText>
                </View>
              </>
            )}
          </View>
        )}
      </View>

      {/* 4. Transport Details Card */}
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="bus-outline" size={18} color={EMERALD.primary} style={{ marginRight: 8 }} />
            <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
              Transport Details
            </ThemedText>
          </View>
          <View style={styles.cardHeaderActions}>
            <TouchableOpacity onPress={() => toggleCollapse('transport')} style={styles.chevronBtn}>
              <Ionicons 
                name={collapsed.transport ? "chevron-down" : "chevron-up"} 
                size={18} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {!collapsed.transport && (
          <View style={styles.cardBody}>
            <View style={[
              styles.transportBanner, 
              { backgroundColor: student.transport ? (activeTheme === 'dark' ? '#064E3B28' : '#ECFDF5') : colors.backgroundSelected }
            ]}>
              <Ionicons 
                name="bus" 
                size={20} 
                color={student.transport ? EMERALD.primary : colors.textSecondary} 
                style={{ marginRight: 10 }}
              />
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.transportStatusText, { color: student.transport ? EMERALD.primary : colors.textSecondary }]}>
                  {student.transport ? 'Active Bus Service' : 'No Active Bus Subscription'}
                </ThemedText>
              </View>
            </View>

            {student.transport && (
              <View style={[styles.gridRow, { marginTop: 12, marginBottom: 0 }]}>
                <View style={styles.gridCol}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Assigned Route</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>
                    {student.transport.routeId || 'Standard Route'}
                  </ThemedText>
                </View>
                <View style={styles.gridCol}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Pickup Point</ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="location" size={13} color={EMERALD.primary} />
                    <ThemedText style={[styles.fieldValue, { color: colors.text }]}>
                      {student.transport.pickupPoint || 'City Center'}
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* 5. Siblings Card (if any) */}
      {student.siblings && student.siblings.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="people-circle-outline" size={18} color={EMERALD.primary} style={{ marginRight: 8 }} />
              <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
                Siblings ({student.siblings.length})
              </ThemedText>
            </View>
          </View>
          <View style={styles.cardBody}>
            {student.siblings.map((sib: SiblingInfo) => (
              <View 
                key={sib.id} 
                style={[styles.siblingRow, { backgroundColor: colors.backgroundSelected }]}
              >
                <View style={[styles.siblingAvatar, { backgroundColor: EMERALD.avatarBg }]}>
                  <ThemedText style={[styles.siblingAvatarText, { color: EMERALD.avatarText }]}>
                    {sib.name ? sib.name.charAt(0).toUpperCase() : 'S'}
                  </ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.siblingName, { color: colors.text }]}>{sib.name}</ThemedText>
                  <ThemedText style={[styles.siblingClass, { color: colors.textSecondary }]}>
                    {sib.className || 'Class Unassigned'}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 20,
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
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  editPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  editActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  chevronBtn: {
    padding: 4,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridCol: {
    flex: 1,
    paddingRight: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  formContainer: {
    gap: 12,
    paddingTop: 4,
  },
  formField: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  requiredAsterisk: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputFieldInner: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  inputDisabled: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  genderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  genderPillText: {
    fontSize: 12,
  },
  transportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  transportStatusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  siblingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  siblingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  siblingAvatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  siblingName: {
    fontSize: 13,
    fontWeight: '700',
  },
  siblingClass: {
    fontSize: 11,
    marginTop: 2,
  },
});
