import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { Portal, Dialog, Button, RadioButton } from 'react-native-paper';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { ThemedText } from '@/components/themed-text';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { AddStudentHeader } from './form/AddStudentHeader';
import { StudentPersonalInfoSection } from './form/StudentPersonalInfoSection';
import { StudentAcademicSection } from './form/StudentAcademicSection';
import { StudentAdditionalSection } from './form/StudentAdditionalSection';
import { AddStudentFooter } from './form/AddStudentFooter';

export interface StudentFormData {
  name: string;
  username?: string;
  email?: string;
  password?: string;
  phone?: string;
  rollNumber: string;
  classId: string;
  gender: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  parentId?: string;
  transportEnabled: boolean;
  routeId?: string;
  pickupPoint?: string;
}

export interface AddStudentScreenProps {
  onBack: () => void;
  colors: any;
  isDark?: boolean;
  dialogMode: 'create' | 'edit';
  formData: StudentFormData;
  setFormData: React.Dispatch<React.SetStateAction<StudentFormData>>;
  isSubmitting: boolean;
  onSubmit: () => void;
  onReset?: () => void;
}

// Module-level caches
let cachedClasses: any[] | null = null;
let cachedParents: any[] | null = null;
let cachedRoutes: any[] | null = null;

export function AddStudentScreen({
  onBack,
  colors,
  isDark = false,
  dialogMode,
  formData,
  setFormData,
  isSubmitting,
  onSubmit,
  onReset,
}: AddStudentScreenProps) {
  const [dobPickerOpen, setDobPickerOpen] = useState(false);

  // Metadata Lists
  const [classesList, setClassesList] = useState<{ id: string; name: string; section: string }[]>([]);
  const [parentsList, setParentsList] = useState<{ id: string; name: string; email: string; phone?: string }[]>([]);
  const [routesList, setRoutesList] = useState<{ id: string; name: string; stops: any }[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);

  // Pickers Modals
  const [classPickerVisible, setClassPickerVisible] = useState(false);
  const [parentPickerVisible, setParentPickerVisible] = useState(false);
  const [routePickerVisible, setRoutePickerVisible] = useState(false);
  const [pickupPickerVisible, setPickupPickerVisible] = useState(false);
  const [parentSearch, setParentSearch] = useState('');

  // Fetch classes & parents on load
  useEffect(() => {
    async function loadMetadata() {
      if (cachedClasses && cachedParents) {
        setClassesList(cachedClasses);
        setParentsList(cachedParents);
        return;
      }
      try {
        setIsLoadingMeta(true);
        const [resClasses, resParents] = await Promise.all([
          api.get('/classes?mode=min').catch(() => []),
          api.get('/parents?limit=200').catch(() => ({ items: [] })),
        ]);

        const resClassesArr = Array.isArray(resClasses)
          ? resClasses
          : (resClasses && Array.isArray((resClasses as any).items) ? (resClasses as any).items : []);

        const resParentsArr = resParents && Array.isArray((resParents as any).items)
          ? (resParents as any).items
          : (Array.isArray(resParents) ? resParents : []);

        cachedClasses = resClassesArr;
        cachedParents = resParentsArr;

        setClassesList(resClassesArr);
        setParentsList(resParentsArr);
      } catch (err) {
        console.error('Failed to load classes and parents:', err);
      } finally {
        setIsLoadingMeta(false);
      }
    }
    loadMetadata();
  }, []);

  // Fetch routes when transport is enabled
  useEffect(() => {
    async function loadRoutes() {
      if (!formData.transportEnabled) return;
      if (cachedRoutes) {
        setRoutesList(cachedRoutes);
        return;
      }
      try {
        const resRoutes: any = await api.get('/transport-routes?mode=min').catch(() => []);
        const resRoutesArr = Array.isArray(resRoutes) ? resRoutes : [];
        cachedRoutes = resRoutesArr;
        setRoutesList(resRoutesArr);
      } catch (err) {
        console.error('Failed to load routes:', err);
      }
    }
    loadRoutes();
  }, [formData.transportEnabled]);

  const handleFieldChange = (field: keyof StudentFormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'routeId') {
        updated.pickupPoint = '';
      }
      return updated;
    });
  };

  const selectedClass = useMemo(
    () => classesList.find((c) => c.id === formData.classId),
    [classesList, formData.classId]
  );
  const selectedParent = useMemo(
    () => parentsList.find((p) => p.id === formData.parentId),
    [parentsList, formData.parentId]
  );
  const selectedRoute = useMemo(
    () => routesList.find((r) => r.id === formData.routeId),
    [routesList, formData.routeId]
  );

  const routeStops = useMemo(() => {
    return selectedRoute
      ? typeof selectedRoute.stops === 'string'
        ? JSON.parse(selectedRoute.stops)
        : selectedRoute.stops || []
      : [];
  }, [selectedRoute]);

  const filteredParents = useMemo(() => {
    if (!parentSearch.trim()) return parentsList;
    const q = parentSearch.toLowerCase();
    return parentsList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q))
    );
  }, [parentsList, parentSearch]);

  const isFormValid = Boolean(
    formData.name?.trim() &&
    formData.classId?.trim() &&
    formData.rollNumber?.trim() &&
    (!formData.transportEnabled || (formData.routeId && formData.pickupPoint))
  );

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.backgroundElement }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Top Header Bar */}
        <AddStudentHeader
          onBack={onBack}
          dialogMode={dialogMode}
          colors={colors}
          isDark={isDark}
        />

        {/* Scrollable Form Body */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isLoadingMeta ? (
            <ActivityIndicator color="#059669" style={{ marginVertical: 30 }} />
          ) : (
            <>
              {/* SECTION 1: Personal Information */}
              <StudentPersonalInfoSection
                isDark={isDark}
                name={formData.name}
                setName={(val) => handleFieldChange('name', val)}
                gender={formData.gender || 'male'}
                setGender={(val) => handleFieldChange('gender', val)}
                dateOfBirth={formData.dateOfBirth || ''}
                onOpenDobPicker={() => setDobPickerOpen(true)}
                email={formData.email || ''}
                setEmail={(val) => handleFieldChange('email', val)}
                phone={formData.phone || ''}
                setPhone={(val) => handleFieldChange('phone', val)}
              />

              {/* SECTION 2: Academic Information */}
              <StudentAcademicSection
                isDark={isDark}
                classId={formData.classId}
                onOpenClassPicker={() => setClassPickerVisible(true)}
                selectedClassName={selectedClass ? `${selectedClass.name} - ${selectedClass.section}` : ''}
                rollNumber={formData.rollNumber}
                setRollNumber={(val) => handleFieldChange('rollNumber', val)}
                username={formData.username || ''}
                setUsername={(val) => handleFieldChange('username', val)}
                dialogMode={dialogMode}
              />

              {/* SECTION 3: Additional Details */}
              <StudentAdditionalSection
                isDark={isDark}
                bloodGroup={formData.bloodGroup || ''}
                setBloodGroup={(val) => handleFieldChange('bloodGroup', val)}
                parentId={formData.parentId || ''}
                onOpenParentPicker={() => setParentPickerVisible(true)}
                selectedParentName={selectedParent ? selectedParent.name : ''}
                transportEnabled={formData.transportEnabled}
                setTransportEnabled={(val) => handleFieldChange('transportEnabled', val)}
                routeId={formData.routeId || ''}
                onOpenRoutePicker={() => setRoutePickerVisible(true)}
                selectedRouteName={selectedRoute ? selectedRoute.name : ''}
                pickupPoint={formData.pickupPoint || ''}
                onOpenPickupPicker={() => setPickupPickerVisible(true)}
              />
            </>
          )}
        </ScrollView>

        {/* Bottom Screen Action Bar */}
        <AddStudentFooter
          dialogMode={dialogMode}
          isDark={isDark}
          isSubmitting={isSubmitting}
          isFormValid={isFormValid}
          onBack={onBack}
          onSubmit={onSubmit}
          onReset={onReset}
        />
      </KeyboardAvoidingView>

      {/* Date of Birth Picker Modal */}
      <DatePickerModal
        visible={dobPickerOpen}
        onDismiss={() => setDobPickerOpen(false)}
        onSelectDate={(dateStr) => {
          handleFieldChange('dateOfBirth', dateStr);
          setDobPickerOpen(false);
        }}
        value={formData.dateOfBirth || ''}
        title="Select Date of Birth"
      />

      {/* Class Selection Dialog Modal */}
      <Portal>
        <Dialog
          visible={classPickerVisible}
          onDismiss={() => setClassPickerVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Select Class</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 320, paddingHorizontal: 0 }}>
            <ScrollView>
              <RadioButton.Group
                onValueChange={(val) => {
                  handleFieldChange('classId', val);
                  setClassPickerVisible(false);
                }}
                value={formData.classId}
              >
                {classesList.map((cls) => (
                  <RadioButton.Item
                    key={cls.id}
                    label={`${cls.name} - ${cls.section}`}
                    value={cls.id}
                    labelStyle={{ color: colors.text, fontSize: 13 }}
                    color="#059669"
                  />
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setClassPickerVisible(false)}>
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Linked Parent Picker Dialog */}
        <Dialog
          visible={parentPickerVisible}
          onDismiss={() => setParentPickerVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Link Parent / Guardian</Dialog.Title>
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <View style={[styles.searchBox, { borderColor: isDark ? '#3F3F46' : '#E2E8F0', backgroundColor: colors.background }]}>
              <Ionicons name="search" size={16} color={colors.textSecondary} />
              <TextInput
                value={parentSearch}
                onChangeText={setParentSearch}
                placeholder="Search parents..."
                placeholderTextColor={colors.textSecondary}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>
          </View>
          <Dialog.ScrollArea style={{ maxHeight: 300, paddingHorizontal: 0 }}>
            <FlatList
              data={filteredParents}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item }) => {
                const isSelected = formData.parentId === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerRow,
                      { borderBottomColor: isDark ? '#27272A' : '#F1F5F9' },
                    ]}
                    onPress={() => {
                      handleFieldChange('parentId', isSelected ? '' : item.id);
                      setParentPickerVisible(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                        {item.name}
                      </ThemedText>
                      {item.phone ? (
                        <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>
                          {item.phone}
                        </ThemedText>
                      ) : null}
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color="#059669" />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <ThemedText style={{ textAlign: 'center', padding: 20, color: colors.textSecondary, fontSize: 12 }}>
                  No parents found.
                </ThemedText>
              }
            />
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button
              textColor="#EF4444"
              onPress={() => {
                handleFieldChange('parentId', '');
                setParentPickerVisible(false);
              }}
            >
              Unlink
            </Button>
            <Button textColor={colors.textSecondary} onPress={() => setParentPickerVisible(false)}>
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Transport Route Picker Dialog */}
        <Dialog
          visible={routePickerVisible}
          onDismiss={() => setRoutePickerVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Select Transport Route</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 300, paddingHorizontal: 0 }}>
            <ScrollView>
              <RadioButton.Group
                onValueChange={(val) => {
                  handleFieldChange('routeId', val);
                  setRoutePickerVisible(false);
                }}
                value={formData.routeId || ''}
              >
                {routesList.map((r) => (
                  <RadioButton.Item
                    key={r.id}
                    label={r.name}
                    value={r.id}
                    labelStyle={{ color: colors.text, fontSize: 13 }}
                    color="#059669"
                  />
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setRoutePickerVisible(false)}>
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Pickup Point Picker Dialog */}
        <Dialog
          visible={pickupPickerVisible}
          onDismiss={() => setPickupPickerVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Select Pickup Point</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 300, paddingHorizontal: 0 }}>
            <ScrollView>
              <RadioButton.Group
                onValueChange={(val) => {
                  handleFieldChange('pickupPoint', val);
                  setPickupPickerVisible(false);
                }}
                value={formData.pickupPoint || ''}
              >
                {routeStops.map((stop: any, idx: number) => {
                  const label = `${stop.name || stop} (₹${stop.fee || 0})`;
                  const val = stop.name || stop;
                  return (
                    <RadioButton.Item
                      key={idx}
                      label={label}
                      value={val}
                      labelStyle={{ color: colors.text, fontSize: 13 }}
                      color="#059669"
                    />
                  );
                })}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setPickupPickerVisible(false)}>
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

// Backward-compatible alias
export { AddStudentScreen as StudentDialog };

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
});
