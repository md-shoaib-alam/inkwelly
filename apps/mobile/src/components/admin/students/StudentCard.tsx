import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Student } from './types';

interface StudentCardProps {
  item: Student;
  colors: any;
  onPress: (student: Student) => void;
}

export const StudentCard = React.memo(function StudentCard({
  item,
  colors,
  onPress,
}: StudentCardProps) {
  const isMale = item.gender?.toLowerCase() === 'male';
  const isFemale = item.gender?.toLowerCase() === 'female';
  const genderTheme = isMale 
    ? { bg: '#007AFF12', text: '#007AFF' } 
    : isFemale 
      ? { bg: '#FF453A12', text: '#FF453A' } 
      : { bg: '#8E8E9312', text: '#8E8E93' };

  return (
    <TouchableOpacity
      style={[
        styles.studentCard, 
        { 
          backgroundColor: colors.backgroundElement, 
          borderColor: colors.backgroundSelected,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.03,
          shadowRadius: 5,
          elevation: 1.5,
        }
      ]}
      onPress={() => onPress(item)}
    >
      <View style={{ position: 'relative' }}>
        <View style={[styles.avatar, { backgroundColor: genderTheme.bg }]}>
          <ThemedText style={[styles.avatarText, { color: genderTheme.text }]}>
            {item.name.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        {item.status === 'inactive' && (
          <View style={[
            styles.inactiveDot,
            { backgroundColor: '#FF3B30', borderColor: colors.backgroundElement }
          ]} />
        )}
      </View>
      
      <View style={styles.studentInfo}>
        <ThemedText type="defaultSemiBold" style={[styles.studentName, { color: colors.text }]}>
          {item.name}
        </ThemedText>
        <View style={styles.metaRow}>
          <View style={[styles.classBadge, { backgroundColor: colors.backgroundSelected }]}>
            <ThemedText numberOfLines={1} style={[styles.classBadgeText, { color: colors.textSecondary }]}>
              {item.className}
            </ThemedText>
          </View>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '500' }}>
            Roll: {item.rollNumber}
          </ThemedText>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ marginRight: 2 }} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  classBadge: {
    flexShrink: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  classBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  idBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  idBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  inactiveDot: {
    position: 'absolute',
    bottom: 0,
    right: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    zIndex: 2,
  },
});
