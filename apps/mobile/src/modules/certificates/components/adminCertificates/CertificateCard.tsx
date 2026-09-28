import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { CertificateRecord, CERT_TYPE_COLORS, formatDate } from './types';

interface CertificateCardProps {
  item: CertificateRecord;
  colors: any;
  isAdmin: boolean;
  onView: (cert: CertificateRecord) => void;
  onRevoke: (cert: CertificateRecord) => void;
}

export function CertificateCard({ item, colors, isAdmin, onView, onRevoke }: CertificateCardProps) {
  const colorsMap = CERT_TYPE_COLORS[item.certificateType] || { bg: '#F2F2F7', text: '#8E8E93', border: '#E5E5EA' };
  const isActive = item.status === 'active';

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <ThemedText type="defaultSemiBold" style={{ color: colors.text, fontSize: 16 }}>
            {item.content?.studentName || item.student?.user?.name || '  '}
          </ThemedText>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>
            {item.certificateNo}
          </ThemedText>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: colorsMap.bg, borderColor: colorsMap.border }]}>
          <ThemedText style={{ color: colorsMap.text, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
            {item.certificateType}
          </ThemedText>
        </View>
      </View>

      <View style={styles.cardDetailRow}>
        <View>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 11 }}>Date of Issue</ThemedText>
          <ThemedText style={{ color: colors.text, fontSize: 13, fontWeight: '500', marginTop: 2 }}>
            {formatDate(item.issueDate)}
          </ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isActive ? '#E8F8EE' : '#FEE2E2' }]}>
          <ThemedText style={{ color: isActive ? '#166534' : '#991B1B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
            {item.status}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.backgroundSelected }]} />

      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={[styles.btnOutline, { borderColor: colors.backgroundSelected }]}
          onPress={() => onView(item)}
        >
          <Ionicons name="eye-outline" size={14} color={colors.text} style={{ marginRight: 6 }} />
          <ThemedText style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>View Certificate</ThemedText>
        </TouchableOpacity>

        {isActive && isAdmin && (
          <TouchableOpacity 
            style={[styles.btnOutline, { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' }]}
            onPress={() => onRevoke(item)}
          >
            <Ionicons name="ban-outline" size={14} color="#EF4444" style={{ marginRight: 6 }} />
            <ThemedText style={{ fontSize: 12, fontWeight: '600', color: '#EF4444' }}>Revoke</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    // Android shadow
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
    opacity: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
