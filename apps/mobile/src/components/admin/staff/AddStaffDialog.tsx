import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Dialog, Portal, Button, RadioButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { FormInput } from '@/components/ui/FormInput';
import { StaffMember, CustomRole } from './types';

interface AddStaffDialogProps {
  visible: boolean;
  onDismiss: () => void;
  dialogMode: 'create' | 'edit';
  editingStaff: StaffMember | null;
  isSubmitting: boolean;
  roles: CustomRole[];
  colors: any;
  activeTheme: string;
  onSubmit: (data: any) => void;
}

export function AddStaffDialog({
  visible,
  onDismiss,
  dialogMode,
  editingStaff,
  isSubmitting,
  roles,
  colors,
  activeTheme,
  onSubmit,
}: AddStaffDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [customRoleId, setCustomRoleId] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Nested role selection dialog state
  const [roleSelectVisible, setRoleSelectVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      if (dialogMode === 'edit' && editingStaff) {
        setName(editingStaff.name);
        setEmail(editingStaff.email);
        setPhone(editingStaff.phone || '');
        setAddress(editingStaff.address || '');
        setPassword('');
        setCustomRoleId(editingStaff.customRole?.id || '');
        setIsActive(editingStaff.isActive);
      } else {
        setName('');
        setEmail('');
        setPhone('');
        setAddress('');
        setPassword('');
        setCustomRoleId('');
        setIsActive(true);
      }
    }
  }, [visible, dialogMode, editingStaff]);

  const handleSubmitClick = () => {
    if (!name.trim() || !email.trim() || (dialogMode === 'create' && !password.trim())) {
      return;
    }
    onSubmit({
      name,
      email,
      phone,
      address,
      isActive,
      customRoleId: customRoleId || null,
      ...(dialogMode === 'create' ? { password } : {})
    });
  };

  const isDark = activeTheme === 'dark';
  const inputBg = isDark ? '#1C1D21' : '#F9FBFD';
  const inputBorder = colors.backgroundSelected;

  return (
    <>
      <Portal>
        <Dialog 
          visible={visible} 
          onDismiss={onDismiss}
          style={{ backgroundColor: colors.backgroundElement, borderRadius: 24, alignSelf: 'center', maxWidth: 460, width: '90%' }}
        >
          <Dialog.Title style={{ color: colors.text, fontWeight: '700', fontSize: 20 }}>
            {dialogMode === 'create' ? 'Add Staff Member' : 'Edit Staff Details'}
          </Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}>
              <FormInput 
                label="Full Name *"
                value={name}
                onChangeText={setName}
              />

              <FormInput 
                label="Email Address *"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={dialogMode !== 'edit'}
                style={{ opacity: dialogMode === 'edit' ? 0.6 : 1 }}
              />

              {dialogMode === 'create' && (
                <FormInput 
                  label="Password *"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              )}
              
              {/* Custom Role Selector Row */}
              <TouchableOpacity
                onPress={() => setRoleSelectVisible(true)}
                style={[styles.roleSelectTrigger, { backgroundColor: inputBg, borderColor: inputBorder }]}
              >
                <View>
                  <ThemedText style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 }}>
                    Staff Role
                  </ThemedText>
                  <ThemedText style={{ color: customRoleId ? colors.text : colors.textSecondary, fontSize: 14, fontWeight: '500' }}>
                    {customRoleId ? (roles.find(r => r.id === customRoleId)?.name || 'Custom Role') : 'Standard / No Role'}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <FormInput 
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <FormInput 
                label="Home Address"
                value={address}
                onChangeText={setAddress}
              />

              {/* Status Row with Switch */}
              <View style={styles.switchRow}>
                <ThemedText style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>Active Account Status</ThemedText>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: '#767577', true: '#34C759' }}
                  thumbColor={isActive ? '#ffffff' : '#f4f3f4'}
                />
              </View>
            </ScrollView>
          </Dialog.ScrollArea>

          <Dialog.Actions style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'center' }}>
            <Button 
              mode="outlined" 
              textColor={colors.textSecondary} 
              style={{ borderRadius: 999, borderColor: colors.backgroundSelected, flex: 1 }} 
              labelStyle={{ fontWeight: '600' }}
              onPress={onDismiss}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              buttonColor="#007AFF" 
              textColor="#FFF" 
              disabled={isSubmitting || !name.trim() || !email.trim() || (dialogMode === 'create' && !password.trim())} 
              style={{ borderRadius: 999, flex: 1 }} 
              labelStyle={{ fontWeight: '700' }}
              onPress={handleSubmitClick}
            >
              {isSubmitting ? 'Saving...' : (dialogMode === 'create' ? 'Create' : 'Update')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Nested Role Picker Dialog */}
        <Dialog 
          visible={roleSelectVisible} 
          onDismiss={() => setRoleSelectVisible(false)}
          style={{ backgroundColor: colors.backgroundElement, borderRadius: 24, alignSelf: 'center', maxWidth: 340, width: '85%' }}
        >
          <Dialog.Title style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>Select Staff Role</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <ScrollView>
              <RadioButton.Group onValueChange={(val) => { setCustomRoleId(val); setRoleSelectVisible(false); }} value={customRoleId}>
                <View style={styles.radioOptionRow}>
                  <RadioButton.Android value="" color="#007AFF" />
                  <TouchableOpacity onPress={() => { setCustomRoleId(''); setRoleSelectVisible(false); }} style={{ flex: 1, paddingVertical: 12 }}>
                    <ThemedText style={{ color: colors.text }}>Standard / No Custom Role</ThemedText>
                  </TouchableOpacity>
                </View>
                {roles.map((r) => (
                  <View key={r.id} style={styles.radioOptionRow}>
                    <RadioButton.Android value={r.id} color="#007AFF" />
                    <TouchableOpacity onPress={() => { setCustomRoleId(r.id); setRoleSelectVisible(false); }} style={{ flex: 1, paddingVertical: 12 }}>
                      <ThemedText style={{ color: colors.text }}>{r.name}</ThemedText>
                      {r.description && (
                        <ThemedText style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>{r.description}</ThemedText>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            <Button 
              mode="contained" 
              buttonColor="#007AFF" 
              textColor="#FFF" 
              style={{ borderRadius: 999, width: '100%' }} 
              labelStyle={{ fontWeight: '700' }}
              onPress={() => setRoleSelectVisible(false)}
            >
              Done
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  roleSelectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 8,
  },
  radioOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
});
