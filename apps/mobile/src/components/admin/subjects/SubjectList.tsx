import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { Menu } from 'react-native-paper';

export interface SubjectInfo {
  id: string;
  name: string;
  code: string;
  className: string;
  teacherName?: string;
  classId: string;
  teacherId?: string;
}

interface SubjectCardProps {
  colors: any;
  subject: SubjectInfo;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (subject: SubjectInfo) => void;
  onDelete: (subject: SubjectInfo) => void;
  isTablet?: boolean;
}

export function SubjectCard({
  colors,
  subject,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  isTablet = false,
}: SubjectCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundElement,
          borderColor: colors.backgroundSelected,
          width: isTablet ? '48.5%' : '100%',
        },
      ]}
    >
      {/* Top Row: Icon, Subject Details, and Action buttons */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(0, 122, 255, 0.08)' }]}>
          <Ionicons name="book" size={18} color="#007AFF" />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="defaultSemiBold" style={[styles.title, { color: colors.text }]}>
            {subject.name}
          </ThemedText>
          <View style={[styles.codeBadge, { backgroundColor: colors.backgroundSelected }]}>
            <ThemedText style={[styles.codeText, { color: colors.textSecondary }]}>
              {subject.code}
            </ThemedText>
          </View>
        </View>

        {/* 3-dot options menu */}
        <View style={styles.actions}>
          {(canEdit || canDelete) && (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  onPress={() => setMenuVisible(true)}
                  style={[styles.actionButton, { backgroundColor: colors.backgroundSelected }]}
                >
                  <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              }
              contentStyle={{ backgroundColor: colors.backgroundElement, borderRadius: 12 }}
            >
              {canEdit && (
                <Menu.Item
                  leadingIcon={() => <Ionicons name="create" size={16} color="#007AFF" style={{ marginRight: -10 }} />}
                  onPress={() => {
                    setMenuVisible(false);
                    onEdit(subject);
                  }}
                  title="Edit"
                  titleStyle={{ color: colors.text, fontSize: 14 }}
                />
              )}
              {canDelete && (
                <Menu.Item
                  leadingIcon={() => <Ionicons name="trash" size={16} color="#FF3B30" style={{ marginRight: -10 }} />}
                  onPress={() => {
                    setMenuVisible(false);
                    onDelete(subject);
                  }}
                  title="Delete"
                  titleStyle={{ color: '#FF3B30', fontSize: 14 }}
                />
              )}
            </Menu>
          )}
        </View>
      </View>

      {/* Bottom Info Row */}
      <View style={styles.detailsContainer}>
        <View style={[styles.detailItem, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
          <Ionicons name="school" size={12} color="#007AFF" />
          <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Class: <ThemedText style={[styles.detailValue, { color: colors.text }]}>{subject.className}</ThemedText>
          </ThemedText>
        </View>

        <View style={[styles.detailItem, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
          <Ionicons name="person" size={12} color={subject.teacherName ? '#34C759' : colors.textSecondary} />
          <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Teacher:{' '}
            <ThemedText
              style={[
                styles.detailValue,
                {
                  color: subject.teacherName ? colors.text : colors.textSecondary,
                  fontStyle: subject.teacherName ? 'normal' : 'italic',
                },
              ]}
            >
              {subject.teacherName || 'Unassigned'}
            </ThemedText>
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontWeight: '700',
  },
});
