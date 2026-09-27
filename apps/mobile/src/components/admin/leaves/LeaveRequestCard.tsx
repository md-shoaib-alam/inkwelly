import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { LeaveRequest, STATUS_CONFIG, LEAVE_TYPE_CONFIG } from './types';

interface LeaveRequestCardProps {
  item: LeaveRequest;
  colors: any;
  onOpenActionDialog: (leave: LeaveRequest, action: 'approve' | 'reject') => void;
}

export const LeaveRequestCard = React.memo(function LeaveRequestCard({
  item,
  colors,
  onOpenActionDialog,
}: LeaveRequestCardProps) {
  const statusInfo = STATUS_CONFIG[item.status] || { color: '#8E8E93', label: item.status };
  const typeInfo = LEAVE_TYPE_CONFIG[item.leaveType] || { color: '#8E8E93', label: item.leaveType };
  const initials = item.userName ? item.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.backgroundSelected }]}>
            <ThemedText style={[styles.avatarText, { color: colors.text }]}>{initials}</ThemedText>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold" style={[styles.userName, { color: colors.text }]}>
              {item.userName}
            </ThemedText>
            <ThemedText style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
              {item.userEmail}
            </ThemedText>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '12' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
          <ThemedText style={{ color: statusInfo.color, fontSize: 10, fontWeight: '700', letterSpacing: 0.3 }} numberOfLines={1}>
            {statusInfo.label.toUpperCase()}
          </ThemedText>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.metaRow}>
          <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + '12' }]}>
            <ThemedText style={{ color: typeInfo.color, fontSize: 10, fontWeight: '700' }} numberOfLines={1}>
              {typeInfo.label.toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.dateRange}>
            <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <ThemedText style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>
              {item.startDate} to {item.endDate}
            </ThemedText>
          </View>
        </View>

        {item.reason && (
          <View style={[styles.reasonBox, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
            <ThemedText style={[styles.reasonLabel, { color: colors.textSecondary }]}>Reason</ThemedText>
            <ThemedText style={{ fontSize: 13, color: colors.text, lineHeight: 18, marginTop: 2 }}>
              {item.reason}
            </ThemedText>
          </View>
        )}

        {item.approverRemarks && (
          <View style={[styles.remarksBox, { borderLeftColor: statusInfo.color }]}>
            <ThemedText style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5 }}>
              ADMIN REMARKS
            </ThemedText>
            <ThemedText style={{ fontSize: 12, color: colors.text, fontStyle: 'italic', marginTop: 2 }}>
              "{item.approverRemarks}"
            </ThemedText>
          </View>
        )}
      </View>

      {item.status === 'pending' && (
        <View style={[styles.cardActions, { borderTopColor: colors.backgroundSelected }]}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton, { borderColor: '#FF3B301A', backgroundColor: '#FF3B300C' }]} 
            onPress={() => onOpenActionDialog(item, 'reject')}
          >
            <Ionicons name="close-circle-outline" size={15} color="#FF3B30" style={{ marginRight: 6 }} />
            <ThemedText style={{ color: '#FF3B30', fontSize: 13, fontWeight: '700' }}>Reject</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.approveButton, { backgroundColor: '#34C759' }]} 
            onPress={() => onOpenActionDialog(item, 'approve')}
          >
            <Ionicons name="checkmark-circle-outline" size={15} color="#FFF" style={{ marginRight: 6 }} />
            <ThemedText style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Approve</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  userName: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    flexShrink: 0,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  cardBody: {
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 2,
  },
  reasonLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  remarksBox: {
    marginTop: 10,
    paddingLeft: 8,
    borderLeftWidth: 2,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    borderWidth: 1,
  },
  approveButton: {},
});
