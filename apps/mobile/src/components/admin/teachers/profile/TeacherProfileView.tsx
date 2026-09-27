import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Platform 
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { api } from '@/lib/api';
import type { Teacher } from '../types';
import { 
  TeacherProfileProps, 
  TeacherProfileTab, 
  EMERALD, 
  getInitials 
} from './types';
import { TeacherOverviewTab } from './TeacherOverviewTab';
import { TeacherClassesTab } from './TeacherClassesTab';
import { ProfileActionsModal, ActionItem } from '@/components/ui/ProfileActionsModal';

const TABS: { id: TeacherProfileTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'overview', label: 'Overview', icon: 'person-outline' },
  { id: 'classes', label: 'Classes & Subjects', icon: 'school-outline' },
  { id: 'attendance', label: 'Attendance', icon: 'calendar-outline' },
];

export function TeacherProfileView({
  teacher,
  onBack,
  canEdit = true,
  canDelete = true,
  onEdit,
  onDelete,
  onRefresh,
}: TeacherProfileProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [teacherDetails, setTeacherDetails] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TeacherProfileTab>('overview');
  const [copiedId, setCopiedId] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Fetch full details if needed
  useEffect(() => {
    async function loadDetails() {
      if (!teacher?.id) return;
      try {
        setIsLoading(true);
        const res: any = await api.get(`/teachers/${teacher.id}`);
        if (res && res.id) {
          setTeacherDetails(res);
        }
      } catch (err) {
        // Fallback to prop teacher gracefully
      } finally {
        setIsLoading(false);
      }
    }
    loadDetails();
  }, [teacher?.id]);

  const currentTeacher = teacherDetails || teacher;
  const displayTeacherId = `TCH${(currentTeacher.id || '000').slice(-4).toUpperCase()}`;

  const handleCopyId = async () => {
    await Clipboard.setStringAsync(displayTeacherId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    Alert.alert('Copied', 'Teacher ID copied to clipboard!');
  };

  const menuActions: ActionItem[] = [
    ...(canEdit && onEdit ? [{
      id: 'edit',
      label: 'Edit Teacher',
      icon: 'pencil-outline' as const,
      color: '#007AFF',
      onPress: () => onEdit(currentTeacher),
    }] : []),
    ...(canDelete && onDelete ? [{
      id: 'delete',
      label: 'Delete Teacher',
      icon: 'trash-outline' as const,
      destructive: true,
      onPress: () => onDelete(currentTeacher),
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
            Back to Teachers
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
            {/* Avatar Circle with initials */}
            <View style={[styles.avatarCircle, { backgroundColor: EMERALD.light, borderColor: EMERALD.border }]}>
              <ThemedText style={[styles.avatarText, { color: EMERALD.dark }]}>
                {getInitials(currentTeacher.name)}
              </ThemedText>
            </View>

            {/* Basic Info */}
            <View style={styles.headerInfo}>
              <ThemedText style={[styles.teacherName, { color: colors.text }]} numberOfLines={1}>
                {currentTeacher.name}
              </ThemedText>

              {/* Status & Role Badges */}
              <View style={styles.badgeRow}>
                <View style={[styles.roleBadge, { backgroundColor: EMERALD.light, borderColor: EMERALD.border }]}>
                  <ThemedText style={[styles.roleBadgeText, { color: EMERALD.dark }]}>
                    Academic Faculty
                  </ThemedText>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <View style={[styles.statusDot, { backgroundColor: EMERALD.primary }]} />
                  <ThemedText style={[styles.statusBadgeText, { color: EMERALD.dark }]}>
                    Active
                  </ThemedText>
                </View>
              </View>

              {/* Email line */}
              <View style={styles.iconLine}>
                <Ionicons name="mail-outline" size={13} color={colors.textSecondary} />
                <ThemedText style={[styles.iconLineText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {currentTeacher.email || '—'}
                </ThemedText>
              </View>

              {/* Teacher ID with Copy Button */}
              <View style={styles.iconLine}>
                <ThemedText style={[styles.iconLineText, { color: colors.textSecondary }]}>
                  Teacher ID: <ThemedText style={{ fontWeight: '600', color: colors.text, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) }}>{displayTeacherId}</ThemedText>
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={EMERALD.primary} />
          </View>
        ) : (
          <View style={styles.tabContentContainer}>
            {activeTab === 'overview' && (
              <TeacherOverviewTab
                teacher={currentTeacher}
                canEdit={canEdit}
                onUpdated={(updated) => {
                  setTeacherDetails(updated);
                  if (onRefresh) onRefresh();
                }}
              />
            )}
            {activeTab === 'classes' && (
              <TeacherClassesTab teacher={currentTeacher} />
            )}
            {activeTab === 'attendance' && (
              <View style={[styles.emptyCard, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
                <Ionicons name="calendar-outline" size={32} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 8 }} />
                <ThemedText style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
                  Attendance logs are maintained in Attendance tab.
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Custom Action Modal for 3-dot options */}
      <ProfileActionsModal
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        title={currentTeacher.name}
        subtitle="Teacher Actions"
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
  teacherName: {
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
    borderRadius: 3,
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
    paddingHorizontal: 12,
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
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
