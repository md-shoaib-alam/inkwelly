import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Dialog, Portal, Button, Checkbox } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { 
  RoleRecord, 
  PERMISSION_MODULES, 
  PERMISSION_ACTIONS, 
  COLOR_PRESETS, 
  ROLE_TEMPLATES 
} from './types';

interface AddRoleDialogProps {
  visible: boolean;
  onDismiss: () => void;
  dialogMode: 'create' | 'edit';
  editingRole: RoleRecord | null;
  isSaving: boolean;
  colors: any;
  activeTheme: string;
  onSave: (data: { name: string; description: string; color: string; permissions: Record<string, string[]> }) => void;
}

export function AddRoleDialog({
  visible,
  onDismiss,
  dialogMode,
  editingRole,
  isSaving,
  colors,
  activeTheme,
  onSave,
}: AddRoleDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (visible) {
      if (dialogMode === 'edit' && editingRole) {
        setName(editingRole.name);
        setDescription(editingRole.description || '');
        setSelectedColor(editingRole.color || '#6366f1');
        setPermissions(editingRole.permissions || {});
      } else {
        setName('');
        setDescription('');
        setSelectedColor('#6366f1');
        setPermissions({});
      }
    }
  }, [visible, dialogMode, editingRole]);

  const handleApplyTemplate = (tmpl: typeof ROLE_TEMPLATES[0]) => {
    setName(tmpl.name);
    setDescription(tmpl.description);
    setSelectedColor(tmpl.color);
    setPermissions(tmpl.permissions as unknown as Record<string, string[]>);
  };

  const handleSelectAll = () => {
    const all: Record<string, string[]> = {};
    PERMISSION_MODULES.forEach((m) => {
      all[m.key] = ["view", "create", "edit", "delete"];
    });
    setPermissions(all);
  };

  const handleViewOnly = () => {
    const viewOnly: Record<string, string[]> = {};
    PERMISSION_MODULES.forEach((m) => {
      viewOnly[m.key] = ["view"];
    });
    setPermissions(viewOnly);
  };

  const handleClearAll = () => {
    setPermissions({});
  };

  const handleTogglePermission = (module: string, action: string) => {
    const currentActions = permissions[module] || [];
    let updatedActions: string[];

    if (currentActions.includes(action)) {
      updatedActions = currentActions.filter(a => a !== action);
    } else {
      updatedActions = [...currentActions, action];
    }

    setPermissions({
      ...permissions,
      [module]: updatedActions,
    });
  };

  const handleSaveClick = () => {
    if (!name.trim()) return;
    onSave({
      name,
      description,
      color: selectedColor,
      permissions,
    });
  };

  const totalPermissions = Object.values(permissions).flat().length;

  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={onDismiss}
        style={{ backgroundColor: colors.backgroundElement, maxHeight: '90%' }}
      >
        <Dialog.Title style={{ color: colors.text }}>
          {dialogMode === 'create' ? 'Create Custom Role' : `Edit "${editingRole?.name}"`}
        </Dialog.Title>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}>
            
            {/* Quick Templates for Create Mode */}
            {dialogMode === 'create' && (
              <View style={{ marginBottom: 16 }}>
                <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: 8 }]}>Quick Role Templates</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                  {ROLE_TEMPLATES.map((tmpl) => (
                    <TouchableOpacity
                      key={tmpl.name}
                      onPress={() => handleApplyTemplate(tmpl)}
                      style={[styles.templateCard, { backgroundColor: colors.background, borderColor: colors.backgroundSelected, borderLeftColor: tmpl.color }]}
                    >
                      <ThemedText style={{ fontWeight: 'bold', fontSize: 13, color: colors.text }}>{tmpl.name}</ThemedText>
                      <ThemedText numberOfLines={2} style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>{tmpl.description}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TextInput 
              placeholder="Role Name *"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              style={[styles.formInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
            />
            <TextInput 
              placeholder="Description"
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
              style={[styles.formInputMultiline, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
            />

            <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: colors.text }]}>Role Color Badge</ThemedText>
            <View style={COLOR_PRESETS.length > 0 ? styles.colorPresetsContainer : {}}>
              {COLOR_PRESETS.map((col) => (
                <TouchableOpacity
                  key={col}
                  onPress={() => setSelectedColor(col)}
                  style={[
                    styles.colorDot, 
                    { backgroundColor: col },
                    selectedColor === col && { borderWidth: 3, borderColor: colors.text }
                  ]}
                />
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 8 }}>
              <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Module Permissions</ThemedText>
              <View style={styles.badge}>
                <ThemedText style={{ color: '#007AFF', fontSize: 10, fontWeight: 'bold' }}>{totalPermissions} granted</ThemedText>
              </View>
            </View>

            {/* Bulk Actions */}
            <View style={styles.bulkActionsRow}>
              <TouchableOpacity style={[styles.bulkBtn, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} onPress={handleSelectAll}>
                <ThemedText style={{ fontSize: 11, color: colors.text }}>Select All</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bulkBtn, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} onPress={handleViewOnly}>
                <ThemedText style={{ fontSize: 11, color: colors.text }}>View Only</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bulkBtn, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} onPress={handleClearAll}>
                <ThemedText style={{ fontSize: 11, color: colors.text }}>Clear All</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Permissions Grid/Table Layout */}
            <View style={[styles.permsTable, { borderColor: colors.backgroundSelected }]}>
              {/* Table Header */}
              <View style={[styles.permsRow, styles.permsHeaderRow, { backgroundColor: colors.background, borderBottomColor: colors.backgroundSelected }]}>
                <ThemedText style={[styles.colHeader, { flex: 2, color: colors.textSecondary }]}>Module</ThemedText>
                <ThemedText style={[styles.colHeader, { color: colors.textSecondary }]}>View</ThemedText>
                <ThemedText style={[styles.colHeader, { color: colors.textSecondary }]}>Create</ThemedText>
                <ThemedText style={[styles.colHeader, { color: colors.textSecondary }]}>Edit</ThemedText>
                <ThemedText style={[styles.colHeader, { color: colors.textSecondary }]}>Delete</ThemedText>
              </View>

              {/* Table Body */}
              {PERMISSION_MODULES.map((mod, index) => {
                const modPerms = permissions[mod.key] || [];
                const isAlt = index % 2 === 1;
                return (
                  <View 
                    key={mod.key} 
                    style={[
                      styles.permsRow, 
                      { 
                        backgroundColor: isAlt ? (activeTheme === 'dark' ? '#1c1c1e' : '#f9f9f9') : (activeTheme === 'dark' ? '#2c2c2e' : '#ffffff'),
                        borderBottomColor: colors.backgroundSelected 
                      }
                    ]}
                  >
                    <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ThemedText style={{ fontSize: 13 }}>{mod.icon}</ThemedText>
                      <ThemedText numberOfLines={1} style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>{mod.label}</ThemedText>
                    </View>
                    {PERMISSION_ACTIONS.map((action) => {
                      const isChecked = modPerms.includes(action);
                      return (
                        <View key={action} style={styles.colCheckCell}>
                          <Checkbox
                            status={isChecked ? 'checked' : 'unchecked'}
                            onPress={() => handleTogglePermission(mod.key, action)}
                            color={selectedColor}
                          />
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>

          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={{ gap: 10, paddingBottom: 16, paddingHorizontal: 16 }}>
          <Button 
            mode="outlined" 
            textColor="#007AFF" 
            style={{ borderRadius: 20, borderColor: '#007AFF', borderWidth: 1, minWidth: 100 }} 
            labelStyle={{ fontWeight: '600' }}
            onPress={onDismiss}
          >
            Cancel
          </Button>
          <Button 
            mode="contained" 
            buttonColor="#007AFF" 
            textColor="#FFF" 
            disabled={isSaving || !name.trim()} 
            style={{ borderRadius: 20, minWidth: 100 }} 
            labelStyle={{ fontWeight: '700' }}
            onPress={handleSaveClick}
          >
            {isSaving ? 'Saving...' : (dialogMode === 'create' ? 'Save' : 'Update')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  templateCard: {
    width: 140,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  formInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  formInputMultiline: {
    minHeight: 60,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  colorPresetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#007AFF15',
  },
  bulkActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  bulkBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  permsTable: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  permsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  permsHeaderRow: {
    paddingVertical: 8,
  },
  colHeader: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  colCheckCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
