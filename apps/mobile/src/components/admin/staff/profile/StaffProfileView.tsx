import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Platform 
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import type { StaffMember } from '../types';
import { 
  StaffProfileProps, 
  StaffProfileTab, 
  EMERALD, 
  getInitials 
} from './types';
import { StaffOverviewTab } from './StaffOverviewTab';
import { ProfileActionsModal, ActionItem } from '@/components/ui/ProfileActionsModal';

const TABS: { id: StaffProfileTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'overview', label: 'Overview', icon: 'person-outline' },
  { id: 'attendance', label: 'Attendance', icon: 'calendar-outline' },
];

export function StaffProfileView({
  member,
  roles = [],
  onBack,
  canEdit = true,
  canDelete = true,
  onEdit,
  onDelete,
  onRefresh,
}: StaffProfileProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [currentMember, setCurrentMember] = useState<StaffMember>(member);
  const [activeTab, setActiveTab] = useState<StaffProfileTab>('overview');
  const [copiedId, setCopiedId] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const displayStaffId = `STF${(currentMember.id || '000').slice(-4).toUpperCase()}`;

  const handleCopyId = async () => {
    await Clipboard.setStringAsync(displayStaffId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    Alert.alert('Copied', 'Staff ID copied to clipboard!');
  };

  const menuActions: ActionItem[] = [
    ...(canEdit && onEdit ? [{
      id: 'edit',
      label: 'Edit Staff',
      icon: 'pencil-outline' as const,
      color: '#007AFF',
      onPress: () => onEdit(currentMember),
    }] : []),
    ...(canDelete && onDelete ? [{
      id: 'delete',
      label: 'Delete Staff',
      icon: 'trash-outline' as const,
      destructive: true,
      onPress: () => onDelete(currentMember),
    }] : []),
  ];

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.backgroundElement }]}>
      {/* 1. Top Navigation Bar */}
      <View style={styles.topNavBar}>
        <TouchableOpacity 
          style={[styles.backPillBtn, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={16} color={colors.text} style={{ marginRight: 4 }} />
          <ThemedText style={[styles.backBtnText, { color: colors.text }]}>
            Back to Staff
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuCircleBtn, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={16} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Hero Header Card */}
        <View style={[styles.headerCard, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
          <View style={styles.headerTopRow}>
            {/* Avatar Circle */}
            <View style={[styles.avatarCircle, { backgroundColor: EMERALD.light, borderColor: EMERALD.border }]}>
              <ThemedText style={[styles.avatarText, { color: EMERALD.dark }]}>
                {getInitials(currentMember.name)}
              </ThemedText>
            </View>

            {/* Basic Info */}
            <View style={styles.headerInfo}>
              <ThemedText style={[styles.staffName, { color: colors.text }]} numberOfLines={1}>
                {currentMember.name}
              </ThemedText>

              {/* Status & Role Badges */}
              <View style={styles.badgeRow}>
                <View style={[styles.roleBadge, { backgroundColor: EMERALD.light, borderColor: EMERALD.border }]}>
                  <ThemedText style={[styles.roleBadgeText, { color: EMERALD.dark }]}>
                    {currentMember.customRole?.name || 'Staff Member'}
                  </ThemedText>
                </View>

                <View style={[styles.statusBadge, { 
                  backgroundColor: currentMember.isActive ? '#ECFDF5' : '#FEF2F2', 
                  borderColor: currentMember.isActive ? '#A7F3D0' : '#FECACA' 
                }]}>
                  <View style={[styles.statusDot, { backgroundColor: currentMember.isActive ? EMERALD.primary : '#EF4444' }]} />
                  <ThemedText style={[styles.statusBadgeText, { color: currentMember.isActive ? EMERALD.dark : '#B91C1C' }]}>
                    {currentMember.isActive ? 'Active' : 'Inactive'}
                  </ThemedText>
                </View>
              </View>

              {/* Email line */}
              <View style={styles.iconLine}>
                <Ionicons name="mail-outline" size={13} color={colors.textSecondary} />
                <ThemedText style={[styles.iconLineText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {currentMember.email || '—'}
                </ThemedText>
              </View>

              {/* Staff ID with Copy Button */}
              <View style={styles.iconLine}>
                <ThemedText style={[styles.iconLineText, { color: colors.textSecondary }]}>
                  Staff ID: <ThemedText style={{ fontWeight: '600', color: colors.text, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) }}>{displayStaffId}</ThemedText>
                </ThemedText>
                <TouchableOpacity onPress={handleCopyId} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons 
                    name={copiedId ? "checkmark-circle" : "copy-outline"} 
                    size={14} 
                    color={copiedId ? EMERALD.primary : colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* 3. Horizontal Tab Bar */}
        <View style={[styles.tabBarContainer, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScroll}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabItem,
                    isActive && [styles.activeTabItem, { backgroundColor: EMERALD.primary }]
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={tab.icon}
                    size={14}
                    color={isActive ? '#FFFFFF' : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <ThemedText
                    style={[
                      styles.tabLabel,
                      { color: isActive ? '#FFFFFF' : colors.textSecondary },
                      isActive && styles.activeTabLabel
                    ]}
                  >
                    {tab.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Tab Content */}
        <View style={styles.tabContentContainer}>
          {activeTab === 'overview' && (
            <StaffOverviewTab
              member={currentMember}
              roles={roles}
              canEdit={canEdit}
              onUpdated={(updated) => {
                setCurrentMember(updated);
                if (onRefresh) onRefresh();
              }}
            />
          )}
          {activeTab === 'attendance' && (
            <View style={[styles.emptyCard, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
              <Ionicons name="calendar-outline" size={32} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 8 }} />
              <ThemedText style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
                Staff attendance records are available under Attendance Management.
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom Action Modal for 3-dot options */}
      <ProfileActionsModal
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        title={currentMember.name}
        subtitle="Staff Actions"
        actions={menuActions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  menuCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  headerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    gap: 5,
  },
  staffName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconLineText: {
    fontSize: 12,
  },
  tabBarContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
  },
  tabBarScroll: {
    flexDirection: 'row',
    gap: 4,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  activeTabItem: {
    shadowColor: EMERALD.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabLabel: {
    fontWeight: '600',
  },
  tabContentContainer: {
    marginTop: 2,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
