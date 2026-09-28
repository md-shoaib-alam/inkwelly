import React, { useState, useMemo } from 'react';
import { StyleSheet, View, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Dialog, Portal, Button, Checkbox } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { RoleRecord, StaffMember } from './types';

const TypedFlashList = FlashList as any;

interface AssignStaffDialogProps {
  visible: boolean;
  onDismiss: () => void;
  activeRole: RoleRecord | null;
  staff: StaffMember[];
  assigningUser: string | null;
  colors: any;
  onAssignToggle: (member: StaffMember, isAssigned: boolean) => void;
}

export function AssignStaffDialog({
  visible,
  onDismiss,
  activeRole,
  staff,
  assigningUser,
  colors,
  onAssignToggle,
}: AssignStaffDialogProps) {
  const [search, setSearch] = useState('');

  const filteredStaff = useMemo(() => {
    return staff.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [staff, search]);

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={{ backgroundColor: colors.backgroundElement, maxHeight: '80%', width: '90%', maxWidth: 450, alignSelf: 'center', borderRadius: 16 }}
      >
        <Dialog.Title style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>
          Assign Staff to {activeRole?.name}
        </Dialog.Title>
        <View style={styles.assignSearchBox}>
          <View style={[styles.searchBarContainer, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
            <Ionicons name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search staff..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInputText, { color: colors.text }]}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        <View style={{ height: 320, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.backgroundSelected }}>
          <TypedFlashList
            data={filteredStaff}
            keyExtractor={(item: StaffMember) => item.id}
            estimatedItemSize={70}
            renderItem={({ item }: { item: StaffMember }) => {
              const isAssigned = item.customRole?.id === activeRole?.id;
              const isBusy = assigningUser === item.id;
              
              // Generate initials for avatar
              const initials = item.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <View style={[styles.assignUserRow, { borderBottomColor: colors.backgroundSelected }]}>
                  <View style={[styles.avatarCircle, { backgroundColor: activeRole?.color ? `${activeRole.color}15` : '#007AFF15' }]}>
                    <ThemedText style={[styles.avatarText, { color: activeRole?.color || '#007AFF' }]}>
                      {initials}
                    </ThemedText>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <ThemedText type="defaultSemiBold" style={{ color: colors.text, fontSize: 14 }}>{item.name}</ThemedText>
                    <ThemedText style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }}>{item.email}</ThemedText>
                    {item.customRole && !isAssigned && (
                      <ThemedText style={{ color: '#FF9500', fontSize: 10, marginTop: 2, fontWeight: '600' }}>
                        Currently: {item.customRole.name}
                      </ThemedText>
                    )}
                  </View>
                  {isBusy ? (
                    <ActivityIndicator size="small" color="#007AFF" style={{ marginRight: 10 }} />
                  ) : (
                    <Checkbox
                      status={isAssigned ? 'checked' : 'unchecked'}
                      onPress={() => onAssignToggle(item, isAssigned)}
                      color={activeRole?.color || '#007AFF'}
                    />
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Ionicons name="people-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.4, marginBottom: 8 }} />
                <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>No staff members found.</ThemedText>
              </View>
            }
          />
        </View>
        <Dialog.Actions style={{ paddingBottom: 16, paddingHorizontal: 16, paddingTop: 8 }}>
          <Button 
            mode="contained" 
            buttonColor="#007AFF" 
            textColor="#FFF" 
            style={{ borderRadius: 999, minWidth: 100 }} 
            labelStyle={{ fontWeight: '700' }}
            onPress={onDismiss}
          >
            Done
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  assignSearchBox: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInputText: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    padding: 0,
  },
  assignUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
});
