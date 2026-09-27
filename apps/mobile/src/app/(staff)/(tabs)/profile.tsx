import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { ProfileCard } from '@/components/ProfileCard';

export default function StaffProfileScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const profileItems = [
    { label: 'Employee Name', value: user?.name, icon: 'person-outline' },
    { label: 'Staff ID', value: 'STF-2026-089', icon: 'card-outline' },
    { label: 'Department', value: 'Operations & Maintenance', icon: 'business-outline' },
    { label: 'Email Address', value: user?.email, icon: 'mail-outline' },
    { label: 'Joining Date', value: 'August 12, 2022', icon: 'calendar-outline' },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {user && <ProfileCard user={user} />}

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Employment Details</ThemedText>
          <View style={[styles.infoList, { backgroundColor: colors.backgroundElement }]}>
            {profileItems.map((item, index) => (
              <View 
                key={index} 
                style={[
                  styles.infoItem, 
                  index < profileItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected }
                ]}
              >
                <View style={styles.iconBox}>
                  <Ionicons name={item.icon as any} size={18} color="#007AFF" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>{item.label}</ThemedText>
                  <ThemedText style={styles.infoValue}>{item.value}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.editButton}>
          <ThemedText style={styles.editButtonText}>Request Information Update</ThemedText>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    opacity: 0.7,
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
  editButton: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
