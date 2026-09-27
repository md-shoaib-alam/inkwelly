import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { api } from '@/lib/api';
import type { StaffMember, CustomRole } from '../types';
import { EMERALD } from './types';

interface StaffOverviewTabProps {
  member: StaffMember;
  roles?: CustomRole[];
  canEdit?: boolean;
  onUpdated?: (updated: StaffMember) => void;
}

export function StaffOverviewTab({ member, roles = [], canEdit = true, onUpdated }: StaffOverviewTabProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  // Collapse states
  const [collapsed, setCollapsed] = useState<{ personal: boolean; role: boolean }>({
    personal: false,
    role: false,
  });

  // Edit states
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: member.name || '',
    email: member.email || '',
    phone: member.phone || '',
    address: member.address || '',
  });

  const toggleCollapse = (sec: 'personal' | 'role') => {
    setCollapsed(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleStartEdit = () => {
    setFormData({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      address: member.address || '',
    });
    setIsEditingPersonal(true);
  };

  const handleCancelEdit = () => {
    setIsEditingPersonal(false);
  };

  const handleSavePersonal = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    try {
      setIsSaving(true);
      const payload: any = {
        id: member.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        role: 'staff',
      };

      await api.put('/staff', payload);

      const updatedMember: StaffMember = {
        ...member,
        ...payload,
      };

      if (onUpdated) onUpdated(updatedMember);
      setIsEditingPersonal(false);
      Alert.alert('Success', 'Staff member details updated successfully.');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not update staff information.');
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
            {canEdit && !isEditingPersonal && (
              <TouchableOpacity
                style={[styles.miniEditBtn, { borderColor: EMERALD.border, backgroundColor: EMERALD.light }]}
                onPress={handleStartEdit}
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
            {isEditingPersonal ? (
              <View style={styles.formContainer}>
                <View style={styles.fieldGroup}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Full Name *</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#D1D5DB', backgroundColor: colors.backgroundElement }]}
                    value={formData.name}
                    onChangeText={v => setFormData(p => ({ ...p, name: v }))}
                    placeholder="e.g. John Doe"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email Address *</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#D1D5DB', backgroundColor: colors.backgroundElement }]}
                    value={formData.email}
                    onChangeText={v => setFormData(p => ({ ...p, email: v }))}
                    placeholder="e.g. john@school.com"
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

                <View style={styles.fieldGroup}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Address / Location</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#D1D5DB', backgroundColor: colors.backgroundElement }]}
                    value={formData.address}
                    onChangeText={v => setFormData(p => ({ ...p, address: v }))}
                    placeholder="e.g. Campus North Wing"
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
                    onPress={handleSavePersonal}
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
              <View style={styles.gridContainer}>
                <View style={styles.gridItem}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Full Name</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{member.name || '—'}</ThemedText>
                </View>
                <View style={styles.gridItem}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email Address</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]} numberOfLines={1}>{member.email || '—'}</ThemedText>
                </View>
                <View style={styles.gridItem}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Phone Number</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{member.phone || '—'}</ThemedText>
                </View>
                <View style={styles.gridItem}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Address / Location</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{member.address || '—'}</ThemedText>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* CARD 2: Role & Employment Details */}
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
        <TouchableOpacity 
          style={styles.cardHeader} 
          onPress={() => toggleCollapse('role')} 
          activeOpacity={0.8}
        >
          <View style={styles.cardTitleRow}>
            <View style={[styles.iconPill, { backgroundColor: EMERALD.light }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={EMERALD.primary} />
            </View>
            <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
              Role & Permissions
            </ThemedText>
          </View>
          <Ionicons
            name={collapsed.role ? 'chevron-down' : 'chevron-up'}
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {!collapsed.role && (
          <View style={styles.cardBody}>
            <View style={styles.gridContainer}>
              <View style={styles.gridItem}>
                <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Account Role</ThemedText>
                <ThemedText style={[styles.fieldValue, { color: colors.text, textTransform: 'capitalize' }]}>
                  {member.role || 'Staff'}
                </ThemedText>
              </View>

              <View style={styles.gridItem}>
                <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Assigned Role</ThemedText>
                <View style={[styles.roleBadgePill, { backgroundColor: member.customRole?.color ? `${member.customRole.color}20` : EMERALD.light, borderColor: member.customRole?.color || EMERALD.border }]}>
                  <ThemedText style={[styles.roleBadgeText, { color: member.customRole?.color || EMERALD.dark }]}>
                    {member.customRole?.name || 'Standard Staff'}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.gridItem}>
                <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Status</ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: member.isActive ? '#ECFDF5' : '#FEF2F2', borderColor: member.isActive ? '#A7F3D0' : '#FECACA' }]}>
                  <View style={[styles.statusDot, { backgroundColor: member.isActive ? EMERALD.primary : '#EF4444' }]} />
                  <ThemedText style={[styles.statusBadgeText, { color: member.isActive ? EMERALD.dark : '#B91C1C' }]}>
                    {member.isActive ? 'Active Member' : 'Inactive'}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.gridItem}>
                <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Staff ID</ThemedText>
                <ThemedText style={[styles.fieldValue, { color: colors.text }]}>
                  STF{(member.id || '000').slice(-4).toUpperCase()}
                </ThemedText>
              </View>
            </View>
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
    minWidth: 140,
    gap: 3,
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
  roleBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
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
