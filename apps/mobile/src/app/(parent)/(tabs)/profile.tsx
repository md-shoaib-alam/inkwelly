import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { ProfileCard } from '@/components/ProfileCard';
import { api } from '@/lib/api';

import { useRouter } from 'expo-router';

export default function ParentProfileScreen() {
  const { user, updateUser, logout } = useAuth();
  const router = useRouter();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const freshMe = await api.get('/auth/me') as any;
      if (freshMe && freshMe.user) {
        await updateUser(freshMe.user);
      }
    } catch (err) {
      console.warn('Failed to refresh user profile data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    setIsSaving(true);
    try {
      const response = await api.put('/auth/profile', {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      }) as any;
      if (response && response.success) {
        await updateUser({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
        });
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', response?.error || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Profile save error:', err);
      Alert.alert('Error', err.message || 'An error occurred while saving your profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
    }
    setIsEditing(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is permanent and all your data will be deleted in compliance with Data Safety guidelines.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete('/auth/delete-account') as any;
              if (res && res.success) {
                await logout();
                router.replace('/' as any);
                Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
              } else {
                Alert.alert('Error', res?.error || 'Failed to delete account.');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete account. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />}
      >
        <ProfileCard user={user || { name: name, email: '', role: 'parent' } as any} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>Personal Information</ThemedText>
            {isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <ThemedText style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</ThemedText>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={[styles.infoList, { backgroundColor: colors.backgroundElement }]}>
            {/* Full Name */}
            <View style={[styles.infoItem, { borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.backgroundSelected }]}>
                <Ionicons name="person-outline" size={18} color="#007AFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Full Name</ThemedText>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, { color: colors.text, borderBottomColor: colors.backgroundSelected }]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter full name"
                    placeholderTextColor={colors.textSecondary}
                    editable={!isSaving}
                  />
                ) : (
                  <ThemedText style={styles.infoValue}>{user?.name || 'Not Set'}</ThemedText>
                )}
              </View>
            </View>

            {/* Email Address */}
            <View style={[styles.infoItem, { borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.backgroundSelected }]}>
                <Ionicons name="mail-outline" size={18} color="#007AFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Email Address</ThemedText>
                <ThemedText style={styles.infoValue}>{user?.email || 'Not Set'}</ThemedText>
              </View>
            </View>

            {/* Phone Number */}
            <View style={[styles.infoItem, { borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.backgroundSelected }]}>
                <Ionicons name="call-outline" size={18} color="#007AFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Phone Number</ThemedText>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, { color: colors.text, borderBottomColor: colors.backgroundSelected }]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter phone number"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                    editable={!isSaving}
                  />
                ) : (
                  <ThemedText style={styles.infoValue}>{user?.phone || 'Not Set'}</ThemedText>
                )}
              </View>
            </View>

            {/* Residential Address */}
            <View style={styles.infoItem}>
              <View style={[styles.iconBox, { backgroundColor: colors.backgroundSelected }]}>
                <Ionicons name="location-outline" size={18} color="#007AFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Residential Address</ThemedText>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, { color: colors.text, borderBottomColor: colors.backgroundSelected }]}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter residential address"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    editable={!isSaving}
                  />
                ) : (
                  <ThemedText style={styles.infoValue}>{user?.address || 'Not Set'}</ThemedText>
                )}
              </View>
            </View>
          </View>
        </View>

        {isEditing ? (
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: '#34C759' }]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <ThemedText style={styles.editButtonText}>Save Changes</ThemedText>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.deleteAccountButton} 
          onPress={handleDeleteAccount}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
          <ThemedText style={styles.deleteAccountButtonText}>Delete Account</ThemedText>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    opacity: 0.7,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoList: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 2,
    borderBottomWidth: 1,
  },
  editButton: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteAccountButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    backgroundColor: 'transparent',
    height: 50,
  },
  deleteAccountButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});
