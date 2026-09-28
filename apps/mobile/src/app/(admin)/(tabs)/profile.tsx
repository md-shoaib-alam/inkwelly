import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { ProfileCard } from '@/modules/auth/components/ProfileCard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileDetails {
  phone?: string;
  address?: string;
  name: string;
  email: string;
  role: string;
  tenantName?: string;
  tenantId?: string;
  tenantSlug?: string;
}

const roleQuotes: Record<string, string> = {
  super_admin: "Commanding the platform and steering the digital infrastructure of our schools.",
  admin: "Empowering educators, managing resources, and shaping the future of education.",
  teacher: "Teaching is the greatest act of optimism. Inspiring minds, one class at a time.",
  student: "Knowledge is power. Success is the sum of small efforts, repeated day in and day out.",
  parent: "Supporting children's learning journey and fostering collaboration with the school.",
  staff: "Ensuring operations run smoothly to cultivate an environment of learning excellence.",
};

export default function ProfileScreen() {
  const { user, updateUser } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Copied state indicator
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // Edit states
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfileDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>('/auth/me');
      
      const overridesStr = await AsyncStorage.getItem('@local_profile_overrides');
      const overrides = overridesStr ? JSON.parse(overridesStr) : null;

      if (res) {
        const mergedProfile = {
          ...res,
          ...(overrides || {}),
        };
        setProfile(mergedProfile);
        setEditName(mergedProfile.name || user?.name || '');
        setEditPhone(mergedProfile.phone || '');
        setEditAddress(mergedProfile.address || 'HSR Layout, Bangalore, India');
      }
    } catch (error) {
      console.warn('Failed to fetch profile. Using local context.', error);
      const overridesStr = await AsyncStorage.getItem('@local_profile_overrides');
      const overrides = overridesStr ? JSON.parse(overridesStr) : null;
      if (user) {
        setProfile({
          name: user.name,
          email: user.email,
          role: user.role,
          tenantName: user.tenantName,
          tenantId: user.tenantId,
          ...(overrides || {}),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  const handleCopy = async (text: string, field: string) => {
    if (!text || text === 'Not Provided') return;
    await Clipboard.setStringAsync(text);
    setCopiedField(field);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }

    try {
      setIsSaving(true);
      
      const updatedProfile = {
        ...(profile || {}),
        name: editName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
      } as ProfileDetails;

      setProfile(updatedProfile);

      // Save locally to AsyncStorage overrides
      await AsyncStorage.setItem('@local_profile_overrides', JSON.stringify({
        name: editName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
      }));

      // Update global auth context
      if (updateUser) {
        await updateUser({
          name: editName.trim(),
        });
      }

      Alert.alert('Success', 'Profile details updated successfully.');
      setEditVisible(false);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  const schoolUrl = profile?.tenantSlug 
    ? `https://localhost:3000/${profile.tenantSlug}`
    : 'SaaS Platform Management';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <ProfileCard user={{
          name: profile?.name || user.name,
          email: user.email,
          role: user.role,
          tenantName: user.tenantName,
        }} />

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.detailsSection}>
            
            {/* Unified Information Container */}
            <View style={[styles.cardContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
              
              {/* Header inside Card */}
              <View style={[styles.cardHeader, { borderBottomColor: colors.backgroundSelected }]}>
                <ThemedText type="defaultSemiBold" style={{ fontSize: 15, color: colors.text }}>
                  Verification Details
                </ThemedText>
                
                <TouchableOpacity 
                  style={[styles.editBadge, { backgroundColor: 'rgba(0, 122, 255, 0.08)', borderColor: 'rgba(0, 122, 255, 0.15)' }]}
                  onPress={() => setEditVisible(true)}
                >
                  <Ionicons name="create" size={13} color="#007AFF" />
                  <ThemedText style={styles.editBadgeText}>Edit Details</ThemedText>
                </TouchableOpacity>
              </View>

              {/* Full Name Row */}
              <TouchableOpacity 
                activeOpacity={0.7} 
                style={styles.detailRow}
                onPress={() => handleCopy(profile?.name || user.name, 'Name')}
              >
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(52, 199, 89, 0.08)' }]}>
                  <Ionicons name="person" size={18} color="#34C759" />
                </View>
                <View style={styles.rowTextContainer}>
                  <ThemedText style={styles.rowLabel}>Full Name</ThemedText>
                  <ThemedText style={[styles.rowValue, { color: colors.text }]}>
                    {profile?.name || user.name}
                  </ThemedText>
                </View>
                <Ionicons 
                  name={copiedField === 'Name' ? 'checkmark-circle' : 'copy-outline'} 
                  size={16} 
                  color={copiedField === 'Name' ? '#34C759' : colors.textSecondary} 
                />
              </TouchableOpacity>

              <View style={[styles.rowDivider, { backgroundColor: colors.backgroundSelected }]} />

              {/* Email Row */}
              <TouchableOpacity 
                activeOpacity={0.7} 
                style={styles.detailRow}
                onPress={() => handleCopy(user.email, 'Email')}
              >
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(90, 200, 250, 0.08)' }]}>
                  <Ionicons name="mail" size={18} color="#5AC8FA" />
                </View>
                <View style={styles.rowTextContainer}>
                  <View style={styles.labelWithBadge}>
                    <ThemedText style={styles.rowLabel}>Email Address</ThemedText>
                    <View style={styles.verifiedBadge}>
                      <ThemedText style={styles.verifiedText}>Verified</ThemedText>
                    </View>
                  </View>
                  <ThemedText style={[styles.rowValue, { color: colors.text }]} numberOfLines={1}>
                    {user.email}
                  </ThemedText>
                </View>
                <Ionicons 
                  name={copiedField === 'Email' ? 'checkmark-circle' : 'copy-outline'} 
                  size={16} 
                  color={copiedField === 'Email' ? '#34C759' : colors.textSecondary} 
                />
              </TouchableOpacity>

              <View style={[styles.rowDivider, { backgroundColor: colors.backgroundSelected }]} />

              {/* Authority Role Row */}
              <View style={styles.detailRow}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(88, 86, 214, 0.08)' }]}>
                  <Ionicons name="shield-checkmark" size={18} color="#5856D6" />
                </View>
                <View style={styles.rowTextContainer}>
                  <ThemedText style={styles.rowLabel}>Authority Role</ThemedText>
                  <ThemedText style={[styles.rowValue, { color: colors.text }]}>
                    {roleQuotes[user.role] ? user.role.replace('_', ' ').toUpperCase() : 'USER'}
                  </ThemedText>
                </View>
                <Ionicons name="lock-closed" size={16} color={colors.textSecondary} style={{ opacity: 0.5 }} />
              </View>

              <View style={[styles.rowDivider, { backgroundColor: colors.backgroundSelected }]} />

              {/* Mobile Number Row */}
              <TouchableOpacity 
                activeOpacity={0.7} 
                style={styles.detailRow}
                onPress={() => handleCopy(profile?.phone || 'Not Provided', 'Mobile')}
              >
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 149, 0, 0.08)' }]}>
                  <Ionicons name="call" size={18} color="#FF9500" />
                </View>
                <View style={styles.rowTextContainer}>
                  <ThemedText style={styles.rowLabel}>Mobile Number</ThemedText>
                  <ThemedText style={[styles.rowValue, { color: profile?.phone ? colors.text : colors.textSecondary, fontStyle: profile?.phone ? 'normal' : 'italic' }]}>
                    {profile?.phone || 'Not Provided'}
                  </ThemedText>
                </View>
                {profile?.phone ? (
                  <Ionicons 
                    name={copiedField === 'Mobile' ? 'checkmark-circle' : 'copy-outline'} 
                    size={16} 
                    color={copiedField === 'Mobile' ? '#34C759' : colors.textSecondary} 
                  />
                ) : (
                  <Ionicons name="alert-circle-outline" size={16} color={colors.textSecondary} />
                )}
              </TouchableOpacity>

              <View style={[styles.rowDivider, { backgroundColor: colors.backgroundSelected }]} />

              {/* Residential Address Row */}
              <TouchableOpacity 
                activeOpacity={0.7} 
                style={styles.detailRow}
                onPress={() => handleCopy(profile?.address || 'Not Provided', 'Address')}
              >
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 59, 48, 0.08)' }]}>
                  <Ionicons name="location" size={18} color="#FF3B30" />
                </View>
                <View style={styles.rowTextContainer}>
                  <ThemedText style={styles.rowLabel}>Residential Address</ThemedText>
                  <ThemedText style={[styles.rowValue, { color: colors.text, fontSize: 13, lineHeight: 18 }]} numberOfLines={2}>
                    {profile?.address || 'Not Provided'}
                  </ThemedText>
                </View>
                <Ionicons 
                  name={copiedField === 'Address' ? 'checkmark-circle' : 'copy-outline'} 
                  size={16} 
                  color={copiedField === 'Address' ? '#34C759' : colors.textSecondary} 
                />
              </TouchableOpacity>

              {/* Shareable School Portal URL (Admins only) */}
              {user.role === 'admin' && (
                <>
                  <View style={[styles.rowDivider, { backgroundColor: colors.backgroundSelected }]} />
                  <TouchableOpacity 
                    activeOpacity={0.7} 
                    style={styles.detailRow}
                    onPress={() => handleCopy(schoolUrl, 'PortalUrl')}
                  >
                    <View style={[styles.iconWrapper, { backgroundColor: 'rgba(88, 86, 214, 0.08)' }]}>
                      <Ionicons name="globe" size={18} color="#5856D6" />
                    </View>
                    <View style={styles.rowTextContainer}>
                      <ThemedText style={[styles.rowLabel, { color: '#5856D6', fontWeight: '700' }]}>School URL Portal</ThemedText>
                      <ThemedText style={[styles.rowValue, { color: colors.text, fontSize: 11, fontFamily: 'monospace' }]} numberOfLines={1}>
                        {schoolUrl}
                      </ThemedText>
                    </View>
                    <Ionicons 
                      name={copiedField === 'PortalUrl' ? 'checkmark-circle' : 'copy-outline'} 
                      size={16} 
                      color={copiedField === 'PortalUrl' ? '#34C759' : '#5856D6'} 
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>


          </View>
        )}
      </ScrollView>

      <Portal>
        <Dialog
          visible={editVisible}
          onDismiss={() => setEditVisible(false)}
          style={{ backgroundColor: colors.backgroundElement, borderRadius: 16, maxWidth: 400, width: '90%', alignSelf: 'center' }}
        >
          <Dialog.Title style={{ color: colors.text }}>Edit Profile Info</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }}>
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <ThemedText style={[styles.label, { color: colors.text }]}>Full Name</ThemedText>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Full Name"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSelected, borderColor: colors.backgroundSelected }]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={[styles.label, { color: colors.text }]}>Phone Number</ThemedText>
                  <TextInput
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="Phone number"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSelected, borderColor: colors.backgroundSelected }]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={[styles.label, { color: colors.text }]}>Home Address</ThemedText>
                  <TextInput
                    value={editAddress}
                    onChangeText={setEditAddress}
                    placeholder="Address"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSelected, borderColor: colors.backgroundSelected }]}
                  />
                </View>
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions style={{ paddingBottom: 16, paddingHorizontal: 16, justifyContent: 'flex-end', gap: 8 }}>
            <Button 
              mode="outlined" 
              textColor={colors.text} 
              style={{ borderRadius: 20, borderColor: colors.backgroundSelected, minWidth: 90 }} 
              labelStyle={{ fontWeight: '600' }}
              onPress={() => setEditVisible(false)}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              buttonColor="#007AFF" 
              textColor="#FFF" 
              disabled={isSaving}
              style={{ borderRadius: 20, minWidth: 90 }} 
              labelStyle={{ fontWeight: '700' }}
              onPress={handleSaveProfile}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  detailsSection: {
    marginTop: 8,
  },
  cardContainer: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  editBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowTextContainer: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#8E8E93',
    letterSpacing: 0.3,
  },
  labelWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.08)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedText: {
    color: '#34C759',
    fontSize: 8,
    fontWeight: '800',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  quoteCard: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quoteTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  quoteText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
});
