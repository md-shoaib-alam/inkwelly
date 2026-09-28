import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { AttendanceRecordItem } from './types';
import { MONTH_NAMES } from './utils';

interface AttendanceHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  currentRealMonth: number;
  currentRealYear: number;
  currentMonthRecords: AttendanceRecordItem[];
}

export function AttendanceHistoryModal({
  visible,
  onClose,
  currentRealMonth,
  currentRealYear,
  currentMonthRecords,
}: AttendanceHistoryModalProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  if (!visible) return null;

  const sorted = [...currentMonthRecords].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#18181B' : '#FFFFFF',
              borderColor: isDark ? '#27272A' : '#E2E8F0',
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: isDark ? '#27272A' : '#F1F5F9' },
            ]}
          >
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="calendar" size={18} color="#2563EB" />
              </View>
              <View style={styles.headerTitleWrap}>
                <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
                  Attendance History
                </ThemedText>
                <ThemedText style={[styles.headerSub, { color: colors.textSecondary }]}>
                  {MONTH_NAMES[currentRealMonth]} {currentRealYear} · {sorted.length} days
                </ThemedText>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? '#27272A' : '#F1F5F9',
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* List */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {sorted.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons
                  name="calendar-clear-outline"
                  size={36}
                  color={colors.textSecondary}
                />
                <ThemedText
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  No attendance records found for {MONTH_NAMES[currentRealMonth]} {currentRealYear}.
                </ThemedText>
              </View>
            ) : (
              sorted.map((r, idx) => {
                const [y, m, d] = r.date.split('-').map(Number);
                const dateObj = new Date(y, (m || 1) - 1, d);
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                const mName = dateObj.toLocaleDateString('en-US', { month: 'short' });
                const formattedDate = `${dayName}, ${mName} ${d}, ${y}`;
                const statusKey = (r.status || 'present').toLowerCase();
                const isPresent = statusKey === 'present';
                const isAbsent = statusKey === 'absent';
                const isLeave = statusKey === 'leave';

                return (
                  <View
                    key={r.date}
                    style={[
                      styles.row,
                      idx < sorted.length - 1 && [
                        styles.rowBorder,
                        { borderBottomColor: isDark ? '#27272A' : '#F1F5F9' },
                      ],
                    ]}
                  >
                    <View style={styles.rowLeft}>
                      <ThemedText style={[styles.rowDate, { color: colors.text }]}>
                        {formattedDate}
                      </ThemedText>
                      <ThemedText style={[styles.rowTimes, { color: colors.textSecondary }]}>
                        {r.checkIn
                          ? `${r.checkIn}${r.checkOut ? ` - ${r.checkOut}` : ''}`
                          : r.remarks || 'No check-in recorded'}
                      </ThemedText>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        isPresent
                          ? {
                              backgroundColor: isDark ? 'rgba(5,150,105,0.18)' : '#ECFDF5',
                              borderColor: isDark ? 'rgba(5,150,105,0.3)' : '#D1FAE5',
                            }
                          : isAbsent
                          ? {
                              backgroundColor: isDark ? 'rgba(225,29,72,0.18)' : '#FFF1F2',
                              borderColor: isDark ? 'rgba(225,29,72,0.3)' : '#FFE4E6',
                            }
                          : isLeave
                          ? {
                              backgroundColor: isDark ? 'rgba(245,158,11,0.18)' : '#FFFBEB',
                              borderColor: isDark ? 'rgba(245,158,11,0.3)' : '#FEF3C7',
                            }
                          : {
                              backgroundColor: isDark ? 'rgba(147,51,234,0.18)' : '#FAF5FF',
                              borderColor: isDark ? 'rgba(147,51,234,0.3)' : '#F3E8FF',
                            },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.statusBadgeText,
                          {
                            color: isPresent
                              ? '#059669'
                              : isAbsent
                              ? '#E11D48'
                              : isLeave
                              ? '#D97706'
                              : '#9333EA',
                          },
                        ]}
                      >
                        {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                      </ThemedText>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              { borderTopColor: isDark ? '#27272A' : '#F1F5F9' },
            ]}
          >
            <TouchableOpacity
              onPress={onClose}
              style={styles.doneBtn}
              activeOpacity={0.85}
            >
              <ThemedText style={styles.doneBtnText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    gap: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollList: {
    maxHeight: 380,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 10,
  },
  rowBorder: {
    borderBottomWidth: 1,
  },
  rowLeft: {
    flex: 1,
    gap: 2,
  },
  rowDate: {
    fontSize: 13,
    fontWeight: '700',
  },
  rowTimes: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 7,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
  },
  doneBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
