import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  isActive: boolean;
}

interface StaffManagementModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function StaffManagementModal({ visible, onDismiss }: StaffManagementModalProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Dialog Actions Form States
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/staff');
      if (Array.isArray(res)) {
        setStaff(res);
      } else if (res && Array.isArray(res.items)) {
        setStaff(res.items);
      }
    } catch (error) {
      console.error('Failed to fetch staff members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        fetchStaff();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleOpenCreate = () => {
    setDialogMode('create');
    setEditingStaff(null);
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setPassword('');
    setDialogVisible(true);
  };

  const handleOpenEdit = (member: StaffMember) => {
    setDialogMode('edit');
    setEditingStaff(member);
    setName(member.name);
    setEmail(member.email);
    setPhone(member.phone || '');
    setAddress(member.address || '');
    setPassword('');
    setDialogVisible(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || (dialogMode === 'create' && !password.trim())) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      const data = {
        name,
        email,
        phone,
        address,
        role: 'staff',
        isActive: true,
        ...(dialogMode === 'create' ? { password } : {})
      };

      if (dialogMode === 'create') {
        await api.post('/staff', data);
        Alert.alert('Success', 'Staff member created successfully.');
      } else {
        await api.put(`/staff`, { id: editingStaff?.id, ...data });
        Alert.alert('Success', 'Staff details updated successfully.');
      }
      setDialogVisible(false);
      fetchStaff();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit staff information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (member: StaffMember) => {
    Alert.alert(
      'Delete Staff Member',
      `Are you sure you want to permanently remove ${member.name} from the staff list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/staff?id=${member.id}`);
              Alert.alert('Success', 'Staff member removed successfully.');
              fetchStaff();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete staff member.');
            }
          }
        }
      ]
    );
  };

  const filteredStaff = staff.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={onDismiss} 
        style={[styles.dialog, { backgroundColor: colors.backgroundElement }]}
      >
        <Dialog.Title style={{ color: colors.text }}>Staff & Employee Management</Dialog.Title>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
          
          <View style={styles.headerControls}>
            <TextInput 
              placeholder="Search staff..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleOpenCreate}>
              <Ionicons name="add" size={20} color="#FFF" />
              <ThemedText style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13, marginLeft: 4 }}>Add Staff</ThemedText>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {filteredStaff.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <ThemedText style={{ color: colors.textSecondary }}>No staff members found.</ThemedText>
                </View>
              ) : (
                filteredStaff.map((member) => (
                  <View 
                    key={member.id} 
                    style={[styles.staffCard, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                  >
                    <View style={styles.avatar}>
                      <ThemedText style={styles.avatarText}>{member.name.charAt(0)}</ThemedText>
                    </View>
                    <View style={styles.staffInfo}>
                      <ThemedText style={[styles.staffName, { color: colors.text }]}>{member.name}</ThemedText>
                      <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{member.email}</ThemedText>
                      {member.phone && <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>📞 {member.phone}</ThemedText>}
                    </View>
                    <View style={styles.actionColumn}>
                      <TouchableOpacity onPress={() => handleOpenEdit(member)} style={styles.actionBtn}>
                        <Ionicons name="pencil" size={16} color="#007AFF" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(member)} style={styles.actionBtn}>
                        <Ionicons name="trash" size={16} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}

        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button textColor="#007AFF" onPress={onDismiss}>Close</Button>
        </Dialog.Actions>
      </Dialog>

      {/* Staff Add/Edit Form Dialog */}
      <Portal>
        <Dialog 
          visible={dialogVisible} 
          onDismiss={() => setDialogVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>
            {dialogMode === 'create' ? 'Add Staff Member' : 'Edit Staff Details'}
          </Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}>
              <TextInput 
                placeholder="Full Name *"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
                style={[styles.formInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
              />
              <TextInput 
                placeholder="Email Address *"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.formInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
              />
              {dialogMode === 'create' && (
                <TextInput 
                  placeholder="Password *"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  style={[styles.formInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                />
              )}
              <TextInput 
                placeholder="Phone Number"
                placeholderTextColor={colors.textSecondary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={[styles.formInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
              />
              <TextInput 
                placeholder="Home Address"
                placeholderTextColor={colors.textSecondary}
                value={address}
                onChangeText={setAddress}
                style={[styles.formInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button textColor="#007AFF" disabled={isSubmitting} onPress={handleSubmit}>
              {isSubmitting ? 'Submitting...' : 'Save'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
    borderRadius: 16,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 8,
  },
  centerLoading: {
    padding: 40,
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionColumn: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    padding: 6,
  },
  formInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 14,
  },
});
