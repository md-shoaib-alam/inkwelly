import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Portal, Dialog, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Class } from './types';

interface ClassDetailDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  activeTheme: string;
  selectedClass: Class | null;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function ClassDetailDialog({
  visible,
  onDismiss,
  colors,
  activeTheme,
  selectedClass,
  isAdmin,
  onEdit,
  onDelete,
}: ClassDetailDialogProps) {
  if (!selectedClass) return null;

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={[styles.premiumDialog, { backgroundColor: colors.backgroundElement }]}
      >
        <View style={styles.dialogCustomHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ThemedText style={{ color: '#10B981', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 }}>CLASS DETAILS</ThemedText>
          </View>
          <TouchableOpacity onPress={onDismiss} style={styles.dialogCloseBtn}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0, paddingBottom: 10 }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}>
            <View style={{ gap: 16 }}>
              {/* Top Profile Header */}
              <View style={styles.profileHeaderBox}>
                <View style={[styles.avatarLarge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <ThemedText style={[styles.avatarLargeText, { color: '#047857' }]}>
                    {selectedClass.name.slice(0, 2).toUpperCase()}
                  </ThemedText>
                </View>
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <ThemedText type="defaultSemiBold" style={{ fontSize: 18, color: colors.text, fontWeight: '800' }}>
                    {selectedClass.name}
                  </ThemedText>
                  <View style={[styles.roleBadge, { backgroundColor: '#D1FAE5' }]}>
                    <ThemedText style={{ color: '#047857', fontSize: 11, fontWeight: '700' }}>
                      Class {selectedClass.classLevel} • Section {selectedClass.section}
                    </ThemedText>
                  </View>
                </View>
              </View>

              <View style={[styles.modalDivider, { borderBottomColor: colors.backgroundSelected }]} />

              {/* Core Details Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="business-outline" size={16} color="#10B981" style={{ marginRight: 6 }} />
                <ThemedText style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 12, letterSpacing: 0.5 }}>ACADEMIC SETTINGS</ThemedText>
              </View>

              {/* Detail Info Cards */}
              <View style={[styles.detailBoxCard, { backgroundColor: activeTheme === 'dark' ? '#1E1E1E' : '#F9FAFB', borderColor: colors.backgroundSelected }]}>
                <Ionicons name="person-outline" size={18} color="#10B981" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.detailBoxLabel}>CLASS TEACHER</ThemedText>
                  <ThemedText style={[styles.detailBoxValue, { color: colors.text }]}>{selectedClass.classTeacher || 'Unassigned'}</ThemedText>
                </View>
                {selectedClass.classTeacher && (
                  <TouchableOpacity onPress={async () => { await Clipboard.setStringAsync(selectedClass.classTeacher); Alert.alert('Copied', 'Class teacher name copied to clipboard!'); }}>
                    <Ionicons name="copy-outline" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.detailBoxCard, { backgroundColor: activeTheme === 'dark' ? '#1E1E1E' : '#F9FAFB', borderColor: colors.backgroundSelected }]}>
                <Ionicons name="people-outline" size={18} color="#10B981" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.detailBoxLabel}>STUDENTS ENROLLED</ThemedText>
                  <ThemedText style={[styles.detailBoxValue, { color: colors.text }]}>
                    {selectedClass.studentCount} / {selectedClass.capacity}
                  </ThemedText>
                </View>
              </View>

              <View style={[styles.detailBoxCard, { backgroundColor: activeTheme === 'dark' ? '#1E1E1E' : '#F9FAFB', borderColor: colors.backgroundSelected }]}>
                <Ionicons name="ribbon-outline" size={18} color="#10B981" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.detailBoxLabel}>CLASS LEVEL</ThemedText>
                  <ThemedText style={[styles.detailBoxValue, { color: colors.text }]}>Class {selectedClass.classLevel}</ThemedText>
                </View>
              </View>
            </View>
          </ScrollView>
        </Dialog.ScrollArea>

        <Dialog.Actions style={{ paddingHorizontal: 12, paddingBottom: 16, flexDirection: 'row', gap: 6, justifyContent: 'space-between', width: '100%' }}>
          {isAdmin ? (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity 
                onPress={onDelete}
                style={{ 
                  borderRadius: 8, 
                  borderColor: '#FEC2D2', 
                  borderWidth: 1, 
                  paddingHorizontal: 10, 
                  height: 36, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 4
                }}
              >
                <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                <ThemedText style={{ color: '#FF3B30', fontSize: 12, fontWeight: 'bold' }}>
                  Delete
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={onEdit}
                style={{ 
                  borderRadius: 8, 
                  borderColor: '#A7F3D0', 
                  borderWidth: 1, 
                  paddingHorizontal: 10, 
                  height: 36, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 4
                }}
              >
                <Ionicons name="pencil" size={14} color="#10B981" />
                <ThemedText style={{ color: '#10B981', fontSize: 12, fontWeight: 'bold' }}>
                  Edit
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : <View />}
          <TouchableOpacity 
            onPress={onDismiss}
            style={{ 
              borderRadius: 8, 
              backgroundColor: '#10B981', 
              paddingHorizontal: 12, 
              height: 36, 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <ThemedText style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>
              Close Details
            </ThemedText>
          </TouchableOpacity>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  premiumDialog: {
    maxHeight: '90%',
    borderRadius: 20,
  },
  dialogCustomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 20,
  },
  dialogCloseBtn: {
    position: 'absolute',
    right: 16,
    top: 14,
    padding: 4,
  },
  profileHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLargeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  modalDivider: {
    borderBottomWidth: 1,
    marginVertical: 4,
  },
  detailBoxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  detailBoxLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  detailBoxValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
});
