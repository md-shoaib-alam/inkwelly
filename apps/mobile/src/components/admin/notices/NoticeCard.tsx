import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Notice } from './types';

interface NoticeCardProps {
  notice: Notice;
  colors: any;
  isAdmin: boolean;
  onEdit: (notice: Notice) => void;
  onDelete: (id: string) => void;
}

export const NoticeCard = React.memo(function NoticeCard({
  notice,
  colors,
  isAdmin,
  onEdit,
  onDelete,
}: NoticeCardProps) {
  const isHigh = notice.priority === 'high';

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return dateStr.slice(0, 10);
    }
  };

  return (
    <View 
      style={[
        styles.noticeCard, 
        { 
          backgroundColor: colors.backgroundElement, 
          borderColor: isHigh ? '#FF3B30' : colors.backgroundSelected 
        }
      ]}
    >
      <View style={styles.noticeHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
            {isHigh && (
              <View style={styles.highPriorityBadge}>
                <ThemedText style={styles.badgeText} numberOfLines={1}>HIGH</ThemedText>
              </View>
            )}
            <View style={[styles.roleBadge, { backgroundColor: colors.backgroundSelected }]}>
              <ThemedText style={[styles.roleBadgeText, { color: colors.textSecondary }]} numberOfLines={1}>
                {notice.targetRole.toUpperCase()}
              </ThemedText>
            </View>
          </View>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 16, color: colors.text }}>{notice.title}</ThemedText>
        </View>
        
        {isAdmin && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconAction} onPress={() => onEdit(notice)}>
              <Ionicons name="create-outline" size={18} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconAction} onPress={() => onDelete(notice.id)}>
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ThemedText style={[styles.noticeContentText, { color: colors.textSecondary }]}>
        {notice.content}
      </ThemedText>

      <View style={[styles.noticeFooter, { borderTopColor: colors.backgroundSelected }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="person-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
          <ThemedText style={[styles.footerText, { color: colors.textSecondary }]}>
            By: {notice.authorName}
          </ThemedText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="time-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
          <ThemedText style={[styles.footerText, { color: colors.textSecondary }]}>
            {formatDate(notice.createdAt)}
          </ThemedText>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  noticeCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 16,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  highPriorityBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconAction: {
    padding: 4,
  },
  noticeContentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  noticeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 11,
  },
});
