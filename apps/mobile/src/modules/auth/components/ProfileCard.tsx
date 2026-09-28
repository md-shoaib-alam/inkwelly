import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'student' | 'parent' | 'staff';

interface UserData {
  name: string;
  email: string;
  role: string;
  avatar?: string;
  tenantName?: string;
}

interface ProfileCardProps {
  user: UserData;
}

const roleGradients: Record<UserRole, [string, string, string]> = {
  super_admin: ['#0d9488', '#0f766e', '#115e59'],
  admin: ['#059669', '#047857', '#065f46'],
  teacher: ['#2563eb', '#1d4ed8', '#1e40af'],
  student: ['#7c3aed', '#6d28d9', '#5b21b6'],
  parent: ['#d97706', '#b45309', '#92400e'],
  staff: ['#ea580c', '#c2410c', '#9a3412'],
};

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Platform Super Admin',
  admin: 'School Administrator',
  teacher: 'Faculty Educator',
  student: 'Academic Student',
  parent: 'Student Guardian',
  staff: 'Operations Staff',
};

export function ProfileCard({ user }: ProfileCardProps) {
  const { width } = useWindowDimensions();
  const roleKey = (user.role?.toLowerCase() || 'student') as UserRole;
  const gradientColors = roleGradients[roleKey] || roleGradients.student;
  const roleLabel = roleLabels[roleKey] || user.role || 'User';

  const isSmallDevice = width <= 375;
  const paddingVal = isSmallDevice ? 14 : 20;
  const avatarSize = isSmallDevice ? 52 : 68;
  const avatarRad = avatarSize / 2;
  const nameSize = isSmallDevice ? 15 : 18;
  const emailSize = isSmallDevice ? 10.5 : 12;
  const gapVal = isSmallDevice ? 12 : 16;

  const initials = user.name
    ? user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
    : 'U';

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { padding: paddingVal }]}
    >
      {/* Absolute Decorative Circles */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />

      <View style={[styles.mainContainer, { gap: gapVal }]}>
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={[styles.avatarImage, { width: avatarSize, height: avatarSize, borderRadius: avatarRad }]} />
          ) : (
            <View style={[styles.avatarFallback, { width: avatarSize, height: avatarSize, borderRadius: avatarRad }]}>
              <ThemedText style={[styles.fallbackText, { fontSize: isSmallDevice ? 18 : 22 }]}>{initials}</ThemedText>
            </View>
          )}
        </View>

        {/* User details */}
        <View style={styles.detailsContainer}>
          <ThemedText type="defaultSemiBold" style={[styles.userName, { fontSize: nameSize }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            {user.name}
          </ThemedText>
          
          <View style={styles.emailContainer}>
            <Ionicons name="mail" size={isSmallDevice ? 11 : 13} color="rgba(255, 255, 255, 0.8)" />
            <ThemedText style={[styles.userEmail, { fontSize: emailSize }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{user.email}</ThemedText>
          </View>

          <View style={[styles.badge, isSmallDevice && { paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 }]}>
            <ThemedText style={[styles.badgeText, isSmallDevice && { fontSize: 9 }]}>{roleLabel}</ThemedText>
          </View>
        </View>
      </View>

      {/* Separator */}
      <View style={[styles.separator, { marginVertical: isSmallDevice ? 10 : 16 }]} />

      {/* Footer metadata */}
      <View style={styles.footerContainer}>
        <View style={styles.footerItem}>
          <Ionicons name="business" size={isSmallDevice ? 12 : 14} color="rgba(255, 255, 255, 0.7)" />
          <ThemedText style={[styles.footerText, { fontSize: isSmallDevice ? 9.5 : 11 }]} numberOfLines={1}>
            School: {user.role === 'super_admin' ? 'SaaS Platform Management' : user.tenantName || 'NutKhut School'}
          </ThemedText>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="checkmark-circle" size={isSmallDevice ? 12 : 14} color="#34C759" />
          <ThemedText style={[styles.footerText, { fontSize: isSmallDevice ? 9.5 : 11 }]}>Verified Account</ThemedText>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
  },
  circleTopRight: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -50,
    right: -50,
  },
  circleBottomLeft: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    bottom: -40,
    left: -40,
  },
  mainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  avatarFallback: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  fallbackText: {
    color: '#1F2937',
    fontSize: 22,
    fontWeight: '800',
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  detailsContainer: {
    flex: 1,
    gap: 4,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
    marginVertical: 16,
  },
  footerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 12,
    rowGap: 6,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '600',
  },
});
