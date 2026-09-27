import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { TimetableSlot, formatTime } from './types';
import { Menu } from 'react-native-paper';

interface TimetableSlotCardProps {
  item: TimetableSlot;
  colors: any;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function TimetableSlotCard({ item, colors, isAdmin, onEdit, onDelete }: TimetableSlotCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const isBreak = !!item.label;

  const isToday = React.useMemo(() => {
    const jsDay = new Date().getDay();
    const dayMap: Record<number, string> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };
    return dayMap[jsDay].toLowerCase() === item.day.toLowerCase();
  }, [item.day]);

  const isCurrent = React.useMemo(() => {
    if (!isToday) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = item.startTime.split(':').map(Number);
    const [endH, endM] = item.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }, [isToday, item.startTime, item.endTime]);

  return (
    <View 
      style={[
        styles.slotCard, 
        { 
          backgroundColor: colors.backgroundElement, 
          borderColor: isCurrent ? '#3a68ffff' : colors.backgroundSelected,
          borderWidth: isCurrent ? 1.5 : 1,
        },
        isCurrent && styles.currentCardHighlight
      ]}
    >
      {/* Left Side: Time */}
      <View style={styles.timeSection}>
        <ThemedText style={[styles.timeText, { color: colors.text }]}>{formatTime(item.startTime)}</ThemedText>
        <Ionicons name="arrow-down" size={10} color={colors.textSecondary} style={{ marginVertical: 2 }} />
        <ThemedText style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(item.endTime)}</ThemedText>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.backgroundSelected }]} />

      {/* Right Side: Details */}
      <View style={styles.infoSection}>
        {isBreak ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <View>
              <ThemedText type="defaultSemiBold" style={[styles.breakText, { color: '#FF9500' }]}>
                {item.label?.toUpperCase()}
              </ThemedText>
              <ThemedText style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                Rest Period / Break
              </ThemedText>
            </View>
            {isCurrent && (
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <ThemedText style={{ color: '#3a86ff', fontSize: 10, fontWeight: 'bold' }}>
                  NOW
                </ThemedText>
              </View>
            )}
          </View>
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <ThemedText type="defaultSemiBold" style={[styles.subjectName, { color: colors.text }]}>
                {item.subjectName}
              </ThemedText>
              <View style={styles.teacherRow}>
                {isAdmin ? (
                  <>
                    <Ionicons name="person-outline" size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                    <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>
                      {item.teacherName || 'No Teacher'}
                    </ThemedText>
                  </>
                ) : (
                  <>
                    <Ionicons name="school-outline" size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                    <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>
                      {item.className || 'N/A'}
                    </ThemedText>
                  </>
                )}
              </View>
              {isAdmin && (
                <View style={[styles.classBadge, { backgroundColor: colors.backgroundSelected, marginTop: 6 }]}>
                  <ThemedText style={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'bold' }}>
                    {item.className}
                  </ThemedText>
                </View>
              )}
            </View>
            {isCurrent && (
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <ThemedText style={{ color: '#3a86ff', fontSize: 10, fontWeight: 'bold' }}>
                  NOW
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Edit / Delete Buttons */}
      {isAdmin && (
        <View style={styles.actionsColumn}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity style={styles.actionIconBtn} onPress={() => setMenuVisible(true)}>
                <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            }
            contentStyle={{ backgroundColor: colors.backgroundElement, borderRadius: 12 }}
          >
            <Menu.Item
              leadingIcon={() => <Ionicons name="create" size={16} color="#007AFF" style={{ marginRight: -10 }} />}
              onPress={() => {
                setMenuVisible(false);
                onEdit();
              }}
              title="Edit"
              titleStyle={{ color: colors.text, fontSize: 14 }}
            />
            <Menu.Item
              leadingIcon={() => <Ionicons name="trash" size={16} color="#FF3B30" style={{ marginRight: -10 }} />}
              onPress={() => {
                setMenuVisible(false);
                onDelete();
              }}
              title="Delete"
              titleStyle={{ color: '#FF3B30', fontSize: 14 }}
            />
          </Menu>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slotCard: {
    flexDirection: 'row',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  currentCardHighlight: {
    shadowColor: '#3a86ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a86ff15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    flexShrink: 0,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3a86ff',
  },
  timeSection: {
    width: 80,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    width: 1,
    marginVertical: 12,
  },
  infoSection: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  subjectName: {
    fontSize: 15,
  },
  breakText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  classBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  actionsColumn: {
    padding: 8,
    justifyContent: 'center',
    gap: 12,
  },
  actionIconBtn: {
    padding: 4,
  },
});
