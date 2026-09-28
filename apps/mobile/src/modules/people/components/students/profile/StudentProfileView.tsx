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
import type { Student } from '@/types/index';
import { 
  StudentProfileProps, 
  ProfileTab, 
  EMERALD, 
  getInitials 
} from './types';
import { StudentOverviewTab } from './StudentOverviewTab';
import { StudentAcademicsTab } from './StudentAcademicsTab';
import { StudentAttendanceTab } from './StudentAttendanceTab';
import { StudentFeesTab } from './StudentFeesTab';
import { ProfileActionsModal, ActionItem } from '@/components/ui/ProfileActionsModal';

const TABS: { id: ProfileTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'overview', label: 'Overview', icon: 'person-outline' },
  { id: 'academics', label: 'Academics', icon: 'school-outline' },
  { id: 'attendance', label: 'Attendance', icon: 'calendar-outline' },
  { id: 'fees', label: 'Fees', icon: 'card-outline' },
];

// In-memory cache for student profile details to provide instant navigation without repeated loading spinners
const studentProfileCache = new Map<string, { data: Student; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function StudentProfileView({
  student,
  onBack,
  canEdit = true,
  canDelete = true,
  onEdit,
  onToggleStatus,
  onStudentUpdated,
}: StudentProfileProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const cachedEntry = student?.id ? studentProfileCache.get(student.id) : null;
  const isCacheValid = !!cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL_MS);

  const [studentDetails, setStudentDetails] = useState<Student | null>(() => {
    return cachedEntry ? cachedEntry.data : null;
  });

  // Only show loading placeholder if neither cache nor initial student prop exists
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !cachedEntry && !student;
  });

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [copiedId, setCopiedId] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Fetch full details in background (stale-while-revalidate)
  useEffect(() => {
    if (!student?.id) return;

    const currentCached = studentProfileCache.get(student.id);
    const isFresh = currentCached && (Date.now() - currentCached.timestamp < 60 * 1000);

    if (currentCached) {
      setStudentDetails(currentCached.data);
      setIsLoading(false);
      // Skip network fetch if fetched in the last 60 seconds
      if (isFresh) return;
    }

    async function loadDetails() {
      try {
        if (!currentCached && !student) {
          setIsLoading(true);
        }
        const res = await api.get<any>(`/students/${student?.id}`);
        if (res && res.id) {
          studentProfileCache.set(res.id, { data: res, timestamp: Date.now() });
          setStudentDetails(res);
        }
      } catch (err) {
        console.error("Failed to load student details:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDetails();
  }, [student?.id]);

  const currentStudent = studentDetails || student;
  const isInactive = currentStudent.status === 'inactive';
  const displayStudentId = currentStudent.username || currentStudent.rollNumber || currentStudent.id.substring(0, 8);
  const displayRollNo = currentStudent.rollNumber || '—';

  const handleCopyId = async () => {
    await Clipboard.setStringAsync(displayStudentId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    Alert.alert('Copied', 'Student ID copied to clipboard!');
  };

  const menuActions: ActionItem[] = [
    ...(canEdit && onEdit ? [{
      id: 'edit',
      label: 'Edit Student',
      icon: 'pencil-outline' as const,
      color: '#007AFF',
      onPress: () => onEdit(currentStudent),
    }] : []),
    ...(canDelete && onToggleStatus ? [{
      id: 'toggle-status',
      label: isInactive ? 'Activate Student' : 'Deactivate Student',
      icon: isInactive ? ('checkmark-circle-outline' as const) : ('power-outline' as const),
      color: isInactive ? '#34C759' : '#FF9500',
      destructive: !isInactive,
      onPress: () => onToggleStatus(currentStudent),
    }] : []),
  ];

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.backgroundElement }]}>
      {/* 1. Top Navigation Bar (< Back to Students & Action Menu) */}
      <View style={styles.topNavBar}>
        <TouchableOpacity 
          style={[styles.backPillBtn, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={16} color={colors.text} style={{ marginRight: 4 }} />
          <ThemedText style={[styles.backBtnText, { color: colors.text }]}>
            Back to Students
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuCircleBtn, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Top Profile Header Card (Exact match to school-web mobile) */}
        <View style={[styles.profileCard, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
          <View style={styles.profileCardContent}>
            {/* Big Circular Avatar */}
            <View style={[styles.avatarCircle, { backgroundColor: EMERALD.avatarBg, borderColor: EMERALD.lightBorder }]}>
              <ThemedText style={[styles.avatarInitials, { color: EMERALD.avatarText }]}>
                {getInitials(currentStudent.name)}
              </ThemedText>
            </View>

            {/* Student Info Details */}
            <View style={styles.profileInfoCol}>
              {/* Name & Active Pill */}
              <View style={styles.nameHeaderRow}>
                <ThemedText style={[styles.studentTitle, { color: colors.text }]} numberOfLines={1}>
                  {currentStudent.name}
                </ThemedText>
                <View style={[
                  styles.statusPill, 
                  { 
                    backgroundColor: isInactive ? '#FEE2E2' : '#ECFDF5', 
                    borderColor: isInactive ? '#FCA5A5' : '#A7F3D0' 
                  }
                ]}>
                  <View style={[
                    styles.statusDot, 
                    { backgroundColor: isInactive ? '#EF4444' : '#10B981' }
                  ]} />
                  <ThemedText style={[
                    styles.statusText, 
                    { color: isInactive ? '#DC2626' : '#059669' }
                  ]}>
                    {isInactive ? 'Inactive' : 'Active'}
                  </ThemedText>
                </View>
              </View>

              {/* Grade Pill */}
              <View style={styles.gradePillRow}>
                <View style={[styles.gradePill, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <Ionicons name="school" size={13} color={EMERALD.primary} style={{ marginRight: 5 }} />
                  <ThemedText style={[styles.gradePillText, { color: '#059669' }]}>
                    {currentStudent.className || 'Unassigned'}
                  </ThemedText>
                </View>
              </View>

              {/* Student ID Row with Copy */}
              <View style={styles.metaRow}>
                <ThemedText style={[styles.metaLabel, { color: colors.textSecondary }]}>
                  Student ID:
                </ThemedText>
                <ThemedText style={[styles.metaValue, { color: colors.text }]}>
                  {displayStudentId}
                </ThemedText>
                <TouchableOpacity onPress={handleCopyId} style={styles.copyBtn} activeOpacity={0.6}>
                  <Ionicons 
                    name={copiedId ? "checkmark" : "copy-outline"} 
                    size={14} 
                    color={copiedId ? EMERALD.primary : colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>

              {/* Roll No Row */}
              <View style={styles.metaRow}>
                <ThemedText style={[styles.metaLabel, { color: colors.textSecondary }]}>
                  Roll No:
                </ThemedText>
                <ThemedText style={[styles.metaValue, { color: colors.text }]}>
                  {displayRollNo}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* 3. Horizontal Tab Navigation Bar */}
        <View style={[styles.tabBarCard, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={[
                    styles.tabPill,
                    isActive 
                      ? [styles.activeTabPill, { backgroundColor: EMERALD.primary }] 
                      : [styles.inactiveTabPill, { backgroundColor: 'transparent' }]
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={tab.icon} 
                    size={16} 
                    color={isActive ? '#FFFFFF' : colors.textSecondary} 
                    style={{ marginRight: 6 }} 
                  />
                  <ThemedText style={[
                    styles.tabText, 
                    { 
                      color: isActive ? '#FFFFFF' : colors.textSecondary, 
                    }
                  ]}>
                    {tab.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Tab Content Area */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={EMERALD.primary} size="large" />
            <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading student profile...
            </ThemedText>
          </View>
        ) : (
          <>
            {activeTab === 'overview' && (
              <StudentOverviewTab 
                student={currentStudent} 
                canEdit={canEdit} 
                onUpdateStudent={(updated) => {
                  studentProfileCache.set(updated.id, { data: updated, timestamp: Date.now() });
                  setStudentDetails(updated);
                  onStudentUpdated?.(updated);
                }}
              />
            )}
            {activeTab === 'academics' && (
              <StudentAcademicsTab student={currentStudent} />
            )}
            {activeTab === 'attendance' && (
              <StudentAttendanceTab student={currentStudent} />
            )}
            {activeTab === 'fees' && (
              <StudentFeesTab student={currentStudent} />
            )}
          </>
        )}
      </ScrollView>

      {/* Custom Action Modal for 3-dot options */}
      <ProfileActionsModal
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        title={currentStudent.name}
        subtitle="Student Actions"
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
    paddingTop: 10,
    paddingBottom: 10,
  },
  backPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  menuCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  profileCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  profileCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  avatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '700',
  },
  profileInfoCol: {
    flex: 1,
    gap: 4,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  studentTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    borderWidth: 1,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  gradePillRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  gradePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  gradePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 12.5,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  copyBtn: {
    padding: 3,
  },
  tabBarCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tabScrollContent: {
    gap: 6,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  activeTabPill: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  inactiveTabPill: {},
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: 12,
  },
});
