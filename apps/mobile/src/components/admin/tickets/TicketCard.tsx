import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Ticket, TICKET_STATUS_CONFIG, TICKET_PRIORITY_CONFIG, TICKET_CATEGORY_CONFIG } from './types';

interface TicketCardProps {
  ticket: Ticket;
  colors: any;
  onPress: (ticket: Ticket) => void;
}

export function TicketCard({ ticket, colors, onPress }: TicketCardProps) {
  const statusCfg = TICKET_STATUS_CONFIG[ticket.status] || { label: ticket.status, color: '#8E8E93' };
  const priorityCfg = TICKET_PRIORITY_CONFIG[ticket.priority] || { label: ticket.priority, color: '#8E8E93' };
  const categoryCfg = TICKET_CATEGORY_CONFIG[ticket.category] || { label: ticket.category, icon: 'help-circle-outline' };

  const formattedDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr.slice(0, 10);
    }
  };

  const creatorInitials = ticket.creator?.name
    ? ticket.creator.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundElement,
          borderColor: colors.backgroundSelected,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.03,
          shadowRadius: 5,
          elevation: 2,
        }
      ]}
      onPress={() => onPress(ticket)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.categoryRow}>
          <View style={[styles.iconContainer, { backgroundColor: statusCfg.color + '12' }]}>
            <Ionicons name={categoryCfg.icon as any} size={14} color={statusCfg.color} />
          </View>
          <ThemedText style={[styles.categoryLabel, { color: colors.textSecondary }]}>
            {categoryCfg.label}
          </ThemedText>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '12' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
          <ThemedText style={{ color: statusCfg.color, fontSize: 10, fontWeight: '700', letterSpacing: 0.3 }}>
            {statusCfg.label.toUpperCase()}
          </ThemedText>
        </View>
      </View>

      <ThemedText type="defaultSemiBold" style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {ticket.title}
      </ThemedText>

      <ThemedText style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
        {ticket.description}
      </ThemedText>

      <View style={[styles.footer, { borderTopColor: colors.backgroundSelected }]}>
        <View style={styles.creatorInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.backgroundSelected }]}>
            <ThemedText style={[styles.avatarText, { color: colors.text }]}>{creatorInitials}</ThemedText>
          </View>
          <View>
            <ThemedText style={[styles.creatorName, { color: colors.text }]} numberOfLines={1}>
              {ticket.creator?.name || 'User'}
            </ThemedText>
            <ThemedText style={{ fontSize: 10, color: colors.textSecondary, textTransform: 'capitalize' }}>
              {ticket.creator?.role || 'user'} • {formattedDate(ticket.createdAt)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.badges}>
          <View style={[styles.priorityBadge, { backgroundColor: priorityCfg.color + '12' }]}>
            <ThemedText style={{ color: priorityCfg.color, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>
              {priorityCfg.label}
            </ThemedText>
          </View>

          {ticket._count && ticket._count.messages > 0 && (
            <View style={[styles.messageCount, { backgroundColor: colors.backgroundSelected }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={12} color={colors.textSecondary} style={{ marginRight: 3 }} />
              <ThemedText style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary }}>
                {ticket._count.messages}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  title: {
    fontSize: 15,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  creatorName: {
    fontSize: 12,
    fontWeight: '600',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  messageCount: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
