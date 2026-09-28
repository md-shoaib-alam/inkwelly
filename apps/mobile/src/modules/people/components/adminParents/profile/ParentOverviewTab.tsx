import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  useWindowDimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { api } from '@/lib/api';
import type { Parent, Child } from '../types';
import { EMERALD } from './types';

interface ParentOverviewTabProps {
  parent: Parent;
  canEdit?: boolean;
  onUpdated?: (updated: Parent) => void;
  onLinkChildClick?: () => void;
  onUnlinkChildClick?: (child: Child) => void;
}

export function ParentOverviewTab({
  parent,
  canEdit = true,
  onUpdated,
  onLinkChildClick,
  onUnlinkChildClick,
}: ParentOverviewTabProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  // Portrait ≥ 500 → 2 cols | Landscape ≥ 500 → 3 cols | narrow → 1 col
  const colCount = width < 500 ? 1 : isLandscape ? 3 : 2;
  const isTablet = colCount > 1;
  const isDark = activeTheme === 'dark';

  // Collapse states
  const [collapsed, setCollapsed] = useState<{ personal: boolean; account: boolean; children: boolean }>({
    personal: false,
    account: false,
    children: false,
  });

  // Edit states
  const [editingSection, setEditingSection] = useState<'personal' | 'account' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: parent.name || '',
    phone: parent.phone || '',
    email: parent.email || '',
    alternatePhone: parent.alternatePhone || '',
    occupation: parent.occupation || '',
    address: parent.address || '',
    gender: parent.gender || 'male',
    dateOfBirth: parent.dateOfBirth || '',
  });

  const children = parent.children || [];
  const displayParentId = `PRN${(parent.id || '20265626').replace(/\D/g, '').slice(0, 8) || '20265626'}`;

  const toggleCollapse = (sec: 'personal' | 'account' | 'children') => {
    setCollapsed(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleCopy = async (text: string, label: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const handleStartEdit = (sec: 'personal' | 'account') => {
    setFormData({
      name: parent.name || '',
      phone: parent.phone || '',
      email: parent.email || '',
      alternatePhone: parent.alternatePhone || '',
      occupation: parent.occupation || '',
      address: parent.address || '',
      gender: parent.gender || 'male',
      dateOfBirth: parent.dateOfBirth || '',
    });
    setEditingSection(sec);
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
  };

  const handleSaveSection = async (sec: 'personal' | 'account') => {
    if (sec === 'personal') {
      if (!formData.name.trim()) {
        Alert.alert('Validation Error', 'Full Name is required.');
        return;
      }
      if (!formData.phone.trim()) {
        Alert.alert('Validation Error', 'Phone Number is required.');
        return;
      }
      if (formData.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
          Alert.alert('Validation Error', 'Please enter a valid email address.');
          return;
        }
      }
    }

    try {
      setIsSaving(true);
      const payload: any = {
        id: parent.id,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        alternatePhone: formData.alternatePhone.trim() || undefined,
        occupation: formData.occupation.trim() || undefined,
        address: formData.address.trim() || undefined,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth.trim() || undefined,
      };

      await api.put('/parents', payload);

      const updatedParent: Parent = {
        ...parent,
        ...payload,
      };

      if (onUpdated) onUpdated(updatedParent);
      setEditingSection(null);
      Alert.alert('Success', `${sec === 'personal' ? 'Personal' : 'Account'} information updated successfully.`);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not update parent information.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── CARD 1: Personal & Contact Information ── */}
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
        <TouchableOpacity 
          style={styles.cardHeader} 
          onPress={() => toggleCollapse('personal')} 
          activeOpacity={0.8}
        >
          <View style={styles.cardTitleRow}>
            <Ionicons name="person-outline" size={17} color="#059669" />
            <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
              Personal & Contact Information
            </ThemedText>
          </View>

          <View style={styles.cardActions}>
            {canEdit && editingSection !== 'personal' && (
              <TouchableOpacity
                style={[styles.webPencilBtn, { borderColor: colors.border || '#E2E8F0', backgroundColor: colors.background }]}
                onPress={() => handleStartEdit('personal')}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={13} color={colors.text} style={{ marginRight: 5 }} />
                <ThemedText style={[styles.webPencilBtnText, { color: colors.text }]}>Edit</ThemedText>
              </TouchableOpacity>
            )}
            <Ionicons
              name={collapsed.personal ? 'chevron-down' : 'chevron-up'}
              size={18}
              color={isDark ? '#94A3B8' : '#8B9EB2'}
              style={{ marginLeft: 6 }}
            />
          </View>
        </TouchableOpacity>

        {!collapsed.personal && (
          <View style={styles.cardBody}>
            {editingSection === 'personal' ? (
              <View style={[styles.formContainer, isTablet && styles.formContainerTablet]}>
                <View style={[styles.fieldGroup, isTablet && styles.fieldGroupTablet]}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Full Name *</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#D1D5DB', backgroundColor: colors.backgroundElement }]}
                    value={formData.name}
                    onChangeText={v => setFormData(p => ({ ...p, name: v }))}
                    placeholder="Parent Full Name"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={[styles.fieldGroup, isTablet && styles.fieldGroupTablet]}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email Address *</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#D1D5DB', backgroundColor: colors.backgroundElement }]}
                    value={formData.email}
                    onChangeText={v => setFormData(p => ({ ...p, email: v }))}
                    placeholder="parent@school.com"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={[styles.fieldGroup, isTablet && styles.fieldGroupTablet]}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Phone Number *</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#D1D5DB', backgroundColor: colors.backgroundElement }]}
                    value={formData.phone}
                    onChangeText={v => setFormData(p => ({ ...p, phone: v }))}
                    placeholder="Enter phone number"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={[styles.fieldGroup, isTablet && styles.fieldGroupTablet]}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Alternate Phone</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#D1D5DB', backgroundColor: colors.backgroundElement }]}
                    value={formData.alternatePhone}
                    onChangeText={v => setFormData(p => ({ ...p, alternatePhone: v }))}
                    placeholder="Enter alternate phone number"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={[styles.fieldGroup, isTablet && styles.fieldGroupTablet]}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Occupation</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#D1D5DB', backgroundColor: colors.backgroundElement }]}
                    value={formData.occupation}
                    onChangeText={v => setFormData(p => ({ ...p, occupation: v }))}
                    placeholder="e.g. Business, Engineer"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={[styles.fieldGroup, isTablet && styles.fieldGroupTablet]}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Gender</ThemedText>
                  <View style={styles.genderRow}>
                    {(['male', 'female'] as const).map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.genderOption,
                          formData.gender === g && { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }
                        ]}
                        onPress={() => setFormData(p => ({ ...p, gender: g }))}
                      >
                        <ThemedText style={[
                          styles.genderOptionText,
                          { color: formData.gender === g ? '#059669' : colors.textSecondary }
                        ]}>
                          {g.charAt(0).toUpperCase() + g.slice(1)}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={[styles.fieldGroup, isTablet && styles.fieldGroupTablet]}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Date of Birth</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#D1D5DB', backgroundColor: colors.backgroundElement }]}
                    value={formData.dateOfBirth}
                    onChangeText={v => setFormData(p => ({ ...p, dateOfBirth: v }))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={[styles.fieldGroup, isTablet && styles.fieldGroupTablet]}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Address</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#D1D5DB', backgroundColor: colors.backgroundElement }]}
                    value={formData.address}
                    onChangeText={v => setFormData(p => ({ ...p, address: v }))}
                    placeholder="City, State / Full Address"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={[styles.editButtonRow, isTablet && { width: '100%', marginTop: 12 }]}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn, { borderColor: colors.border || '#D1D5DB' }]}
                    onPress={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <ThemedText style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.saveBtn, { backgroundColor: '#059669' }]}
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
              /* VIEW MODE: dynamic columns — portrait: 2, landscape: 3 */
              <View style={isTablet ? styles.tabletGridContainer : styles.singleColList}>
                <View style={isTablet ? [styles.tabletGridItem, { width: `${100 / colCount}%` }] : styles.singleColItem}>
                  <ThemedText style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#8B9EB2' }]}>FULL NAME</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{parent.name || '—'}</ThemedText>
                </View>

                <View style={isTablet ? [styles.tabletGridItem, { width: `${100 / colCount}%` }] : styles.singleColItem}>
                  <ThemedText style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#8B9EB2' }]}>RELATIONSHIP</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>Parent / Guardian</ThemedText>
                </View>

                <View style={isTablet ? [styles.tabletGridItem, { width: `${100 / colCount}%` }] : styles.singleColItem}>
                  <ThemedText style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#8B9EB2' }]}>PHONE NUMBER</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{parent.phone || '—'}</ThemedText>
                </View>

                <View style={isTablet ? [styles.tabletGridItem, { width: `${100 / colCount}%` }] : styles.singleColItem}>
                  <ThemedText style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#8B9EB2' }]}>GENDER</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text, textTransform: 'capitalize' }]}>
                    {parent.gender || '—'}
                  </ThemedText>
                </View>

                <View style={isTablet ? [styles.tabletGridItem, { width: `${100 / colCount}%` }] : styles.singleColItem}>
                  <ThemedText style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#8B9EB2' }]}>DATE OF BIRTH</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{parent.dateOfBirth || '—'}</ThemedText>
                </View>

                <View style={isTablet ? [styles.tabletGridItem, { width: `${100 / colCount}%` }] : styles.singleColItem}>
                  <ThemedText style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#8B9EB2' }]}>EMAIL ADDRESS</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]} numberOfLines={1}>
                    {parent.email || '—'}
                  </ThemedText>
                </View>

                <View style={isTablet ? [styles.tabletGridItem, { width: `${100 / colCount}%` }] : styles.singleColItem}>
                  <ThemedText style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#8B9EB2' }]}>OCCUPATION</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{parent.occupation || '—'}</ThemedText>
                </View>

                <View style={isTablet ? [styles.tabletGridItem, { width: `${100 / colCount}%` }] : styles.singleColItem}>
                  <ThemedText style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#8B9EB2' }]}>ADDRESS</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>
                    {parent.address || 'Bangalore, Karnataka'}
                  </ThemedText>
                </View>

                <View style={isTablet ? [styles.tabletGridItem, { width: `${100 / colCount}%` }] : styles.singleColItem}>
                  <ThemedText style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#8B9EB2' }]}>ALTERNATE PHONE</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{parent.alternatePhone || '—'}</ThemedText>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── CARD 2: Account Information ── */}
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
        <TouchableOpacity 
          style={styles.cardHeader} 
          onPress={() => toggleCollapse('account')} 
          activeOpacity={0.8}
        >
          <View style={styles.cardTitleRow}>
            <View style={[styles.iconPill, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="lock-closed-outline" size={16} color="#059669" />
            </View>
            <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
              Account Information
            </ThemedText>
          </View>

          <View style={styles.cardActions}>
            {canEdit && editingSection !== 'account' && (
              <TouchableOpacity
                style={[styles.webPencilBtn, { borderColor: colors.border || '#E2E8F0', backgroundColor: colors.backgroundElement }]}
                onPress={() => handleStartEdit('account')}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-sharp" size={12} color={colors.text} style={{ marginRight: 4 }} />
                <ThemedText style={[styles.webPencilBtnText, { color: colors.text }]}>Edit</ThemedText>
              </TouchableOpacity>
            )}
            <Ionicons
              name={collapsed.account ? 'chevron-down' : 'chevron-up'}
              size={18}
              color={colors.textSecondary}
              style={{ marginLeft: 8 }}
            />
          </View>
        </TouchableOpacity>

        {!collapsed.account && (
          <View style={styles.cardBody}>
            {editingSection === 'account' ? (
              <View style={[styles.formContainer, isTablet && styles.formContainerTablet]}>
                <View style={[styles.fieldGroup, isTablet && styles.fieldGroupTablet]}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Occupation</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#D1D5DB', backgroundColor: colors.backgroundElement }]}
                    value={formData.occupation}
                    onChangeText={v => setFormData(p => ({ ...p, occupation: v }))}
                    placeholder="e.g. Engineer, Business"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={[styles.fieldGroup, isTablet && styles.fieldGroupTablet]}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Alternate Phone</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border || '#D1D5DB', backgroundColor: colors.backgroundElement }]}
                    value={formData.alternatePhone}
                    onChangeText={v => setFormData(p => ({ ...p, alternatePhone: v }))}
                    placeholder="Enter alternate phone"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={[styles.editButtonRow, isTablet && { width: '100%', marginTop: 12 }]}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn, { borderColor: colors.border || '#D1D5DB' }]}
                    onPress={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <ThemedText style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.saveBtn, { backgroundColor: '#059669' }]}
                    onPress={() => handleSaveSection('account')}
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
              /* VIEW MODE: dynamic columns — portrait: 2, landscape: 3 */
              <View style={isTablet ? styles.tabletGridContainer : styles.singleColList}>
                <View style={isTablet ? [styles.tabletGridItem, { width: `${100 / colCount}%` }] : styles.singleColItem}>
                  <ThemedText style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#8B9EB2' }]}>PARENT LOGIN ID</ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ThemedText style={[styles.fieldValue, { color: colors.text, fontWeight: '700' }]}>
                      {displayParentId}
                    </ThemedText>
                    <TouchableOpacity onPress={() => handleCopy(displayParentId, 'Parent Login ID')}>
                      <Ionicons
                        name={copiedField === 'Parent Login ID' ? "checkmark-circle" : "copy-outline"}
                        size={14}
                        color={copiedField === 'Parent Login ID' ? '#059669' : (isDark ? '#94A3B8' : '#8B9EB2')}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={isTablet ? [styles.tabletGridItem, { width: `${100 / colCount}%` }] : styles.singleColItem}>
                  <ThemedText style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#8B9EB2' }]}>PASSWORD</ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ThemedText style={[styles.fieldValue, { color: colors.text, letterSpacing: showPassword ? 0 : 2 }]}>
                      {showPassword ? (parent.username || 'Parent@123') : '••••••••••'}
                    </ThemedText>
                    <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={15}
                        color={isDark ? '#94A3B8' : '#8B9EB2'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={isTablet ? [styles.tabletGridItem, { width: `${100 / colCount}%` }] : styles.singleColItem}>
                  <ThemedText style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#8B9EB2' }]}>ACCOUNT CREATED</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>—</ThemedText>
                </View>

                <View style={isTablet ? [styles.tabletGridItem, { width: `${100 / colCount}%` }] : styles.singleColItem}>
                  <ThemedText style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#8B9EB2' }]}>ACCOUNT STATUS</ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                    <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                    <ThemedText style={[styles.statusBadgeText, { color: '#059669' }]}>Active</ThemedText>
                  </View>
                </View>

                <View style={isTablet ? [styles.tabletGridItem, { width: `${100 / colCount}%` }] : styles.singleColItem}>
                  <ThemedText style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#8B9EB2' }]}>LAST LOGIN</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>Never</ThemedText>
                </View>

                <View style={isTablet ? [styles.tabletGridItem, { width: `${100 / colCount}%` }] : styles.singleColItem}>
                  <ThemedText style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#8B9EB2' }]}>CREATED BY</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>School Admin</ThemedText>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── CARD 3: Linked Children Card in Overview ── */}
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
        <TouchableOpacity 
          style={styles.cardHeader} 
          onPress={() => toggleCollapse('children')} 
          activeOpacity={0.8}
        >
          <View style={styles.cardTitleRow}>
            <View style={[styles.iconPill, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="people-outline" size={16} color="#059669" />
            </View>
            <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
              Linked Children ({children.length})
            </ThemedText>
          </View>

          <View style={styles.cardActions}>
            {canEdit && onLinkChildClick && (
              <TouchableOpacity
                style={[styles.linkChildBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
                onPress={onLinkChildClick}
                activeOpacity={0.7}
              >
                <Ionicons name="link-outline" size={13} color="#059669" style={{ marginRight: 4 }} />
                <ThemedText style={styles.linkChildBtnText}>Link Child</ThemedText>
              </TouchableOpacity>
            )}
            <Ionicons
              name={collapsed.children ? 'chevron-down' : 'chevron-up'}
              size={18}
              color={colors.textSecondary}
              style={{ marginLeft: 8 }}
            />
          </View>
        </TouchableOpacity>

        {!collapsed.children && (
          <View style={styles.cardBody}>
            {children.length > 0 ? (
              <View style={[isTablet ? styles.childrenGridTablet : { gap: 10 }]}>
                {children.map((child, index) => {
                  const isFemale = child.gender?.toLowerCase() === 'female';
                  return (
                    <View
                      key={child.id || index}
                      style={[
                        styles.overviewChildItem,
                        isTablet && { width: '48.5%' },
                        {
                          backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                          borderColor: colors.border || '#E2E8F0',
                        }
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        <View style={[styles.overviewChildAvatar, { backgroundColor: '#CCFBF1' }]}>
                          <ThemedText style={{ fontSize: 18 }}>{isFemale ? '👧' : '👦'}</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={[styles.childName, { color: colors.text }]} numberOfLines={1}>
                            {child.name}
                          </ThemedText>
                          <ThemedText style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
                            {child.className || 'Class Unassigned'} · Roll {child.rollNumber}
                          </ThemedText>
                        </View>
                      </View>

                      {canEdit && onUnlinkChildClick && (
                        <TouchableOpacity
                          onPress={() => onUnlinkChildClick(child)}
                          style={{ padding: 6 }}
                        >
                          <Ionicons name="link-outline" size={17} color={colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyOverviewChildren}>
                <Ionicons name="school-outline" size={32} color="#10B981" style={{ opacity: 0.5, marginBottom: 6 }} />
                <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>
                  No children linked to this parent.
                </ThemedText>
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
    gap: 14,
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
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
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
    gap: 6,
  },
  webPencilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  webPencilBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  linkChildBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  linkChildBtnText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  singleColList: {
    gap: 20,
  },
  singleColItem: {
    gap: 3,
  },
  tabletGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 24,
  },
  tabletGridItem: {
    width: '33.33%',
    paddingRight: 16,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
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
  formContainerTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
    justifyContent: 'space-between',
  },
  fieldGroup: {
    gap: 4,
  },
  fieldGroupTablet: {
    width: '31.5%',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    alignItems: 'center',
  },
  genderOptionText: {
    fontSize: 13,
    fontWeight: '600',
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
  overviewChildItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  childrenGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewChildAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childName: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  emptyOverviewChildren: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
});
