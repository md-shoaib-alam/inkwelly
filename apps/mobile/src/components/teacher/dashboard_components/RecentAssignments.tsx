import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/store/settings-context';
import type { TeacherRecentAssignment } from '@/types';

interface RecentAssignmentsProps {
  assignments: TeacherRecentAssignment[];
  onViewAll?: () => void;
  formatDate?: (dateStr: string) => string;
}

export function RecentAssignments({
  assignments = [],
  onViewAll,
  formatDate,
}: RecentAssignmentsProps) {
  const { activeTheme } = useSettings();
  const isDark = activeTheme === 'dark';

  const defaultFormatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    if (formatDate) return formatDate(dateStr);
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr.slice(0, 10);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#18181B' : '#FFFFFF',
          borderColor: isDark ? '#27272A' : '#E4E4E7',
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: isDark ? '#27272A' : '#F4F4F5' },
        ]}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="document-text-outline" size={17} color="#2563EB" />
          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? '#F4F4F5' : '#09090B' },
            ]}
          >
            Recent Homework
          </Text>
        </View>

        <TouchableOpacity onPress={onViewAll} activeOpacity={0.75}>
          <Text style={styles.viewAllText}>View All →</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {assignments.slice(0, 3).map((assignment) => {
          const isOverdue = assignment.dueDate
            ? new Date(assignment.dueDate) < new Date()
            : false;
          const total = assignment.totalStudents || 20;
          const submissions = assignment.submissions || 0;
          const progressPct =
            total > 0 ? Math.min(100, Math.round((submissions / total) * 100)) : 0;

          return (
            <TouchableOpacity
              key={assignment.id}
              activeOpacity={0.75}
              onPress={onViewAll}
              style={[
                styles.assignmentCard,
                {
                  backgroundColor: isDark ? '#202024' : '#F8FAFC',
                  borderColor: isDark ? '#2E2E33' : '#F1F5F9',
                },
              ]}
            >
              {/* Top row */}
              <View style={styles.cardTopRow}>
                <View style={styles.titleInfo}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(225,29,72,0.18)'
                          : '#FFF1F2',
                        borderColor: isDark
                          ? 'rgba(244,63,94,0.3)'
                          : '#FFE4E6',
                      },
                    ]}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={16}
                      color="#E11D48"
                    />
                  </View>

                  <View style={styles.textColumn}>
                    <Text
                      style={[
                        styles.assignmentTitle,
                        { color: isDark ? '#F4F4F5' : '#0F172A' },
                      ]}
                      numberOfLines={1}
                    >
                      {assignment.title}
                    </Text>
                    <Text
                      style={[
                        styles.assignmentSub,
                        { color: isDark ? '#A1A1AA' : '#64748B' },
                      ]}
                      numberOfLines={1}
                    >
                      {assignment.subjectName}
                      {assignment.className ? ` • ${assignment.className}` : ''}
                    </Text>
                  </View>
                </View>

                {/* Status pill */}
                <View
                  style={[
                    styles.statusPill,
                    isOverdue
                      ? {
                          backgroundColor: isDark
                            ? 'rgba(225,29,72,0.18)'
                            : '#FFF1F2',
                          borderColor: isDark
                            ? 'rgba(244,63,94,0.3)'
                            : '#FFE4E6',
                        }
                      : {
                          backgroundColor: isDark
                            ? 'rgba(37,99,235,0.18)'
                            : '#EFF6FF',
                          borderColor: isDark
                            ? 'rgba(59,130,246,0.3)'
                            : '#DBEAFE',
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: isOverdue ? '#E11D48' : '#2563EB' },
                    ]}
                  >
                    {isOverdue ? 'Overdue' : 'Active'}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressRow}>
                <View
                  style={[
                    styles.progressBarTrack,
                    { backgroundColor: isDark ? '#2E2E33' : '#E2E8F0' },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progressPct}%`,
                        backgroundColor: isOverdue ? '#E11D48' : '#2563EB',
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.progressLabel,
                    { color: isDark ? '#A1A1AA' : '#64748B' },
                  ]}
                >
                  {submissions}/{total} submitted
                </Text>
              </View>

              {/* Footer Meta */}
              <View style={styles.footerRow}>
                <View style={styles.metaItem}>
                  <Ionicons
                    name="calendar-outline"
                    size={12}
                    color={isDark ? '#71717A' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.metaText,
                      { color: isDark ? '#A1A1AA' : '#64748B' },
                    ]}
                  >
                    Due: {defaultFormatDate(assignment.dueDate)}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <Ionicons
                    name="people-outline"
                    size={12}
                    color={isDark ? '#71717A' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.metaText,
                      { color: isDark ? '#A1A1AA' : '#64748B' },
                    ]}
                  >
                    {total} students
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {assignments.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={28}
              color={isDark ? '#52525B' : '#CBD5E1'}
            />
            <Text
              style={[
                styles.emptyTitle,
                { color: isDark ? '#E4E4E7' : '#27272A' },
              ]}
            >
              No recent homework
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: isDark ? '#71717A' : '#71717A' },
              ]}
            >
              All assigned exercises and homework are up to date
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  body: {
    paddingTop: 10,
    gap: 10,
  },
  assignmentCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  assignmentTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  assignmentSub: {
    fontSize: 11,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  progressBarTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 11,
  },
});
