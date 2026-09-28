import React from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors, Palette } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { AttendanceRecordItem, AttendanceMetrics } from './types';

interface TodayAttendanceCardProps {
  todayRecord: AttendanceRecordItem | null;
  isCheckingIn: boolean;
  onCheckInToggle: () => void;
  onOpenQRScan: () => void;
  metrics: AttendanceMetrics;
}

export function TodayAttendanceCard({
  todayRecord,
  isCheckingIn,
  onCheckInToggle,
  onOpenQRScan,
  metrics,
}: TodayAttendanceCardProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  const isTodayPresent = todayRecord?.status?.toLowerCase() === 'present';
  const hasCheckedIn = Boolean(todayRecord?.checkIn);
  const hasCheckedOut = Boolean(todayRecord?.checkOut);

  const confirmCheckOut = () => {
    const timeStr = new Date().toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    Alert.alert(
      'Confirm Daily Check-Out?',
      `Are you sure you want to check out now at ${timeStr} (IST)? Once checked out, your working hours for today will be finalized.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Check Out',
          style: 'destructive',
          onPress: onCheckInToggle,
        },
      ]
    );
  };

  return (
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
      <View style={styles.headerRow}>
        <ThemedText style={[styles.title, { color: colors.text }]}>
          Today&apos;s Attendance
        </ThemedText>
        <View
          style={[
            styles.badge,
            isTodayPresent
              ? {
                  backgroundColor: isDark ? 'rgba(5,150,105,0.18)' : '#ECFDF5',
                  borderColor: isDark ? 'rgba(5,150,105,0.3)' : '#A7F3D0',
                }
              : {
                  backgroundColor: isDark ? '#27272A' : '#F1F5F9',
                  borderColor: isDark ? '#3F3F46' : '#E2E8F0',
                },
          ]}
        >
          <ThemedText
            style={[
              styles.badgeText,
              {
                color: isTodayPresent
                  ? isDark
                    ? Palette.okGreenSoft
                    : '#047857'
                  : colors.textSecondary,
              },
            ]}
          >
            {isTodayPresent ? '● Present Today' : '● Not Marked'}
          </ThemedText>
        </View>
      </View>

      {/* Status Highlight Banner */}
      <View
        style={[
          styles.highlightBox,
          isTodayPresent
            ? {
                backgroundColor: isDark ? 'rgba(5,150,105,0.1)' : '#F0FDF4',
                borderColor: isDark ? 'rgba(5,150,105,0.25)' : '#DCFCE7',
              }
            : {
                backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                borderColor: isDark ? '#3F3F46' : '#E2E8F0',
              },
        ]}
      >
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: isTodayPresent ? '#10B981' : '#94A3B8' },
          ]}
        >
          <Ionicons
            name={isTodayPresent ? 'checkmark' : 'time-outline'}
            size={18}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.highlightInfo}>
          <View style={styles.highlightTop}>
            <ThemedText style={[styles.highlightTitle, { color: colors.text }]}>
              {isTodayPresent ? 'Present Today' : 'Not Marked'}
            </ThemedText>
            <ThemedText style={[styles.highlightPhase, { color: colors.textSecondary }]}>
              {hasCheckedOut
                ? 'Shift Completed'
                : hasCheckedIn
                ? 'In Progress'
                : 'Pending'}
            </ThemedText>
          </View>
          <ThemedText style={[styles.highlightSub, { color: colors.textSecondary }]}>
            {hasCheckedIn
              ? 'Attendance active for today'
              : 'Check-in required for today'}
          </ThemedText>
        </View>
      </View>

      {/* In Time & Out Time Cards */}
      <View style={styles.tilesRow}>
        {/* In Time Tile */}
        <View
          style={[
            styles.tile,
            {
              backgroundColor: isDark ? '#27272A' : '#F8FAFC',
              borderColor: isDark ? '#3F3F46' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.tileHeader}>
            <View style={styles.tileLabelWrap}>
              <Ionicons name="log-in-outline" size={13} color="#059669" />
              <ThemedText style={[styles.tileLabel, { color: colors.textSecondary }]}>
                In Time
              </ThemedText>
            </View>
            <View
              style={[
                styles.tileTag,
                {
                  backgroundColor: todayRecord?.checkIn
                    ? isDark
                      ? 'rgba(5,150,105,0.2)'
                      : '#D1FAE5'
                    : isDark
                    ? '#3F3F46'
                    : '#E2E8F0',
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.tileTagText,
                  {
                    color: todayRecord?.checkIn
                      ? isDark
                        ? Palette.okGreenSoft
                        : '#047857'
                      : colors.textSecondary,
                  },
                ]}
              >
                {todayRecord?.checkIn ? 'Recorded' : 'Pending'}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.tileTime, { color: colors.text }]}>
            {todayRecord?.checkIn || '--:--'}
          </ThemedText>
        </View>

        {/* Out Time Tile */}
        <View
          style={[
            styles.tile,
            {
              backgroundColor: isDark ? '#27272A' : '#F8FAFC',
              borderColor: isDark ? '#3F3F46' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.tileHeader}>
            <View style={styles.tileLabelWrap}>
              <Ionicons name="log-out-outline" size={13} color="#E11D48" />
              <ThemedText style={[styles.tileLabel, { color: colors.textSecondary }]}>
                Out Time
              </ThemedText>
            </View>
            <View
              style={[
                styles.tileTag,
                {
                  backgroundColor: todayRecord?.checkOut
                    ? isDark
                      ? 'rgba(37,99,235,0.2)'
                      : '#DBEAFE'
                    : todayRecord?.checkIn
                    ? isDark
                      ? 'rgba(245,158,11,0.2)'
                      : '#FEF3C7'
                    : isDark
                    ? '#3F3F46'
                    : '#E2E8F0',
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.tileTagText,
                  {
                    color: todayRecord?.checkOut
                      ? '#2563EB'
                      : todayRecord?.checkIn
                      ? '#D97706'
                      : colors.textSecondary,
                  },
                ]}
              >
                {todayRecord?.checkOut
                  ? 'Completed'
                  : todayRecord?.checkIn
                  ? 'In Progress'
                  : 'Pending'}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.tileTime, { color: colors.text }]}>
            {todayRecord?.checkOut || '--:--'}
          </ThemedText>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsWrap}>
        {hasCheckedOut ? (
          <View style={styles.completedBtn}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <ThemedText style={styles.completedBtnText}>
              Attendance Completed Today
            </ThemedText>
          </View>
        ) : hasCheckedIn ? (
          <TouchableOpacity
            style={styles.checkOutBtn}
            onPress={confirmCheckOut}
            disabled={isCheckingIn}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
            <ThemedText style={styles.checkOutBtnText}>
              {isCheckingIn ? 'Checking out...' : 'Check Out'}
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={styles.qrActionSection}>
            <TouchableOpacity
              onPress={onOpenQRScan}
              activeOpacity={0.85}
              style={styles.qrButtonWrapper}
            >
              <LinearGradient
                colors={['#2563EB', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.qrButton}
              >
                <Ionicons name="qr-code" size={19} color="#FFFFFF" />
                <ThemedText style={styles.qrButtonText}>
                  Scan School QR to Check In
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>

            <View
              style={[
                styles.noticeBanner,
                {
                  backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : '#FFFBEB',
                  borderColor: isDark ? 'rgba(245,158,11,0.25)' : '#FEF3C7',
                },
              ]}
            >
              <Ionicons
                name="shield-checkmark"
                size={14}
                color={isDark ? '#FBBF24' : '#D97706'}
                style={{ marginTop: 1 }}
              />
              <ThemedText
                style={[
                  styles.noticeText,
                  { color: isDark ? '#FBBF24' : '#B45309' },
                ]}
              >
                Remote check-in disabled. Scan live QR code or enter kiosk code on campus.
              </ThemedText>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightInfo: {
    flex: 1,
    gap: 2,
  },
  highlightTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  highlightPhase: {
    fontSize: 11,
    fontWeight: '600',
  },
  highlightSub: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tile: {
    flex: 1,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tileLabel: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  tileTag: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  tileTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  tileTime: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  actionsWrap: {
    gap: 8,
  },
  completedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(5,150,105,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(5,150,105,0.25)',
  },
  completedBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  checkOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#E11D48',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  checkOutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  qrActionSection: {
    gap: 8,
  },
  qrButtonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  qrButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  noticeText: {
    fontSize: 10.5,
    fontWeight: '500',
    lineHeight: 14,
    flex: 1,
  },
});
