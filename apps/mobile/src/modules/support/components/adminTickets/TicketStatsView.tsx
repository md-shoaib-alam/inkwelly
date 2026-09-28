import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { TICKET_STATUS_CONFIG } from './types';

interface TicketStatsViewProps {
  tickets: any[];
  colors: any;
  currentStatus: string;
  onStatusChange: (status: string) => void;
}

export function TicketStatsView({ tickets, colors, currentStatus, onStatusChange }: TicketStatsViewProps) {
  const getCount = (status: string) => {
    if (status === 'all') return tickets.length;
    return tickets.filter(t => t.status === status).length;
  };

  const statItems = [
    { key: 'all', label: 'All Tickets', color: '#007AFF' },
    { key: 'open', label: 'Open', color: TICKET_STATUS_CONFIG.open.color },
    { key: 'in_progress', label: 'In Progress', color: TICKET_STATUS_CONFIG.in_progress.color },
    { key: 'on_hold', label: 'On Hold', color: TICKET_STATUS_CONFIG.on_hold.color },
    { key: 'resolved', label: 'Resolved', color: TICKET_STATUS_CONFIG.resolved.color },
    { key: 'closed', label: 'Closed', color: TICKET_STATUS_CONFIG.closed.color },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {statItems.map((item) => {
          const isSelected = currentStatus === item.key;
          const count = getCount(item.key);

          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: isSelected ? item.color : colors.backgroundSelected,
                }
              ]}
              onPress={() => onStatusChange(item.key)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.label}
                </ThemedText>
                <View style={[styles.badgeDot, { backgroundColor: item.color }]} />
              </View>
              <ThemedText style={[styles.statCount, { color: colors.text }]}>
                {count}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    gap: 10,
    paddingRight: 16,
  },
  statCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    minWidth: 135,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statCount: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
});
