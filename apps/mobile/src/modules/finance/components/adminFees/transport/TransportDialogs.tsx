import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Switch, FlatList, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { Portal, Dialog, RadioButton, Button } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { CustomAlertDialog } from '../dialogs/CustomAlertDialog';
import { FlashList } from '@shopify/flash-list';

const TypedFlashList = FlashList as any;

interface TransportDialogsProps {
  colors: any;
  classes: any[];
  students: any[];
  routes: any[];
  vehicles: any[];
  assignments: any[];
  
  // Route form states
  routeDialogVisible: boolean;
  setRouteDialogVisible: (v: boolean) => void;
  editingRouteId: string | null;
  routeName: string;
  setRouteName: (v: string) => void;
  routeFee: string;
  setRouteFee: (v: string) => void;
  routeVehicleId: string;
  setRouteVehicleId: (v: string) => void;
  routeSaving: boolean;
  handleSaveRoute: () => void;

  // Vehicle form states
  vehicleDialogVisible: boolean;
  setVehicleDialogVisible: (v: boolean) => void;
  editingVehicleId: string | null;
  vehicleNumber: string;
  setVehicleNumber: (v: string) => void;
  vehicleCapacity: string;
  setVehicleCapacity: (v: string) => void;
  vehicleType: string;
  setVehicleType: (v: string) => void;
  vehicleStatus: string;
  setVehicleStatus: (v: string) => void;
  vehicleSaving: boolean;
  handleSaveVehicle: () => void;

  // Assign Student states
  assignDialogVisible: boolean;
  setAssignDialogVisible: (v: boolean) => void;
  assignClassId: string;
  setAssignClassId: (v: string) => void;
  assignStudentId: string;
  setAssignStudentId: (v: string) => void;
  assignRouteId: string;
  setAssignRouteId: (v: string) => void;
  assignPickupPoint: string;
  setAssignPickupPoint: (v: string) => void;
  assignStartDate: string;
  setAssignStartDate: (v: string) => void;
  assignSaving: boolean;
  handleSaveAssignment: (customFee?: string) => void;

  // Local student picker
  studentPickerVisible: boolean;
  setStudentPickerVisible: (v: boolean) => void;
  studentSearch: string;
  setStudentSearch: (v: string) => void;
  filteredStudents: any[];
  onLoadMoreStudents?: () => void;
  isLoadingMoreStudents?: boolean;

  // Local route picker
  routePickerVisible: boolean;
  setRoutePickerVisible: (v: boolean) => void;
  showCustomAlert: (
    title: string,
    message: string,
    type?: 'success' | 'error' | 'warning' | 'info' | 'confirm',
    onConfirm?: () => void,
    confirmText?: string,
    cancelText?: string
  ) => void;
}

export function TransportDialogs({
  colors,
  classes,
  students,
  routes,
  vehicles,
  assignments,
  
  routeDialogVisible,
  setRouteDialogVisible,
  editingRouteId,
  routeName,
  setRouteName,
  routeFee,
  setRouteFee,
  routeVehicleId,
  setRouteVehicleId,
  routeSaving,
  handleSaveRoute,

  vehicleDialogVisible,
  setVehicleDialogVisible,
  editingVehicleId,
  vehicleNumber,
  setVehicleNumber,
  vehicleCapacity,
  setVehicleCapacity,
  vehicleType,
  setVehicleType,
  vehicleStatus,
  setVehicleStatus,
  vehicleSaving,
  handleSaveVehicle,

  assignDialogVisible,
  setAssignDialogVisible,
  assignClassId,
  setAssignClassId,
  assignStudentId,
  setAssignStudentId,
  assignRouteId,
  setAssignRouteId,
  assignPickupPoint,
  setAssignPickupPoint,
  assignStartDate,
  setAssignStartDate,
  assignSaving,
  handleSaveAssignment,

  studentPickerVisible,
  setStudentPickerVisible,
  studentSearch,
  setStudentSearch,
  filteredStudents,
  onLoadMoreStudents,
  isLoadingMoreStudents,

  routePickerVisible,
  setRoutePickerVisible,
  showCustomAlert,
}: TransportDialogsProps) {
  const [classPickerVisible, setClassPickerVisible] = useState(false);
  const [pickupPickerVisible, setPickupPickerVisible] = useState(false);
  const [showCustomPickup, setShowCustomPickup] = useState(false);
  const [startDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [newPickupPointFee, setNewPickupPointFee] = useState('');
  const [localAlert, setLocalAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showLocalAlert = React.useCallback((
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm' = 'info',
    onConfirm?: () => void
  ) => {
    setLocalAlert({
      visible: true,
      title,
      message,
      type,
      onConfirm
    });
  }, []);

  const selectedRoute = routes.find(r => r.id === assignRouteId);
  const isStudentAlreadyAssigned = assignments && assignments.some(a => a.studentId === assignStudentId);
  const routeStops = selectedRoute ? (() => {
    try {
      return typeof selectedRoute.stops === 'string' ? JSON.parse(selectedRoute.stops) : (selectedRoute.stops || []);
    } catch (e) {
      return [];
    }
  })() : [];

  React.useEffect(() => {
    setShowCustomPickup(false);
  }, [assignRouteId]);

  return (
    <>
      {/* ADD/EDIT ROUTE DIALOG */}
      <Portal>
        <Dialog visible={routeDialogVisible} onDismiss={() => setRouteDialogVisible(false)} style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}>
          <Dialog.Title style={{ color: colors.text }}>{editingRouteId ? 'Edit Transport Route' : 'Add Transport Route'}</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 16, paddingVertical: 12 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.inputLabel}>Route Name *</ThemedText>
              <TextInput
                placeholder="e.g. Sector 12 Express"
                placeholderTextColor={colors.textSecondary}
                value={routeName}
                onChangeText={setRouteName}
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected, marginBottom: 12 }]}
              />

              <ThemedText style={styles.inputLabel}>Monthly Route Fee (₹) *</ThemedText>
              <TextInput
                placeholder="Monthly charge in ₹"
                placeholderTextColor={colors.textSecondary}
                value={routeFee}
                onChangeText={(val) => setRouteFee(val.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected, marginBottom: 12 }]}
              />

              <ThemedText style={styles.inputLabel}>Assign Vehicle</ThemedText>
              <View style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected, paddingHorizontal: 0, height: 120 }]}>
                <ScrollView>
                  <TouchableOpacity
                    style={{ padding: 12, borderBottomWidth: 0.5, borderBottomColor: colors.backgroundSelected, flexDirection: 'row', justifyContent: 'space-between' }}
                    onPress={() => setRouteVehicleId('none')}
                  >
                    <ThemedText style={{ fontSize: 13, color: colors.text }}>No Vehicle</ThemedText>
                    {routeVehicleId === 'none' && <Ionicons name="checkmark" size={16} color="#007AFF" />}
                  </TouchableOpacity>
                  {vehicles.map(v => (
                    <TouchableOpacity
                      key={v.id}
                      style={{ padding: 12, borderBottomWidth: 0.5, borderBottomColor: colors.backgroundSelected, flexDirection: 'row', justifyContent: 'space-between' }}
                      onPress={() => setRouteVehicleId(v.id)}
                    >
                      <ThemedText style={{ fontSize: 13, color: colors.text }}>{v.number} ({v.type})</ThemedText>
                      {routeVehicleId === v.id && <Ionicons name="checkmark" size={16} color="#007AFF" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setRouteDialogVisible(false)} disabled={routeSaving}>Cancel</Button>
            <Button textColor="#007AFF" onPress={handleSaveRoute} disabled={routeSaving}>
              {routeSaving ? 'Saving...' : 'Save'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* REGISTER/EDIT VEHICLE DIALOG */}
      <Portal>
        <Dialog visible={vehicleDialogVisible} onDismiss={() => setVehicleDialogVisible(false)} style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}>
          <Dialog.Title style={{ color: colors.text }}>{editingVehicleId ? 'Edit Vehicle Detail' : 'Register Vehicle'}</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 16, paddingVertical: 12 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.inputLabel}>Vehicle Registration Number *</ThemedText>
              <TextInput
                placeholder="e.g. DL 1C A 1234"
                placeholderTextColor={colors.textSecondary}
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected, marginBottom: 12 }]}
              />

              <ThemedText style={styles.inputLabel}>Capacity (Seats)</ThemedText>
              <TextInput
                placeholder="e.g. 40"
                placeholderTextColor={colors.textSecondary}
                value={vehicleCapacity}
                onChangeText={setVehicleCapacity}
                keyboardType="numeric"
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected, marginBottom: 12 }]}
              />

              <ThemedText style={styles.inputLabel}>Vehicle Type</ThemedText>
              <View style={styles.radioGroup}>
                {['bus', 'van', 'mini-bus'].map((type) => (
                  <TouchableOpacity key={type} style={styles.radioOption} onPress={() => setVehicleType(type)}>
                    <RadioButton
                      value={type}
                      status={vehicleType === type ? 'checked' : 'unchecked'}
                      onPress={() => setVehicleType(type)}
                      color="#007AFF"
                      uncheckedColor={colors.textSecondary}
                    />
                    <ThemedText style={{ fontSize: 12, textTransform: 'capitalize' }}>{type}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <ThemedText style={styles.inputLabel}>Status</ThemedText>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderWidth: 1, borderColor: colors.backgroundSelected, backgroundColor: colors.background, borderRadius: 8 }}>
                <ThemedText style={{ fontSize: 13 }}>Vehicle Active Status</ThemedText>
                <Switch
                  value={vehicleStatus === 'active'}
                  onValueChange={(val) => setVehicleStatus(val ? 'active' : 'inactive')}
                  trackColor={{ false: colors.backgroundSelected, true: '#34C759' }}
                />
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setVehicleDialogVisible(false)} disabled={vehicleSaving}>Cancel</Button>
            <Button textColor="#007AFF" onPress={handleSaveVehicle} disabled={vehicleSaving}>
              {vehicleSaving ? 'Saving...' : 'Save'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* ASSIGN STUDENT TO ROUTE DIALOG */}
      <Portal>
        <Dialog visible={assignDialogVisible} onDismiss={() => setAssignDialogVisible(false)} style={{ backgroundColor: colors.backgroundElement, borderRadius: 16, maxHeight: '85%' }}>
          <Dialog.Title style={{ color: colors.text }}>
            {isStudentAlreadyAssigned ? 'Update Student Assignment' : 'Assign Student Route'}
          </Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 16, paddingVertical: 12 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.inputLabel}>Class Filter (Optional)</ThemedText>
              <TouchableOpacity
                style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected, marginBottom: 12 }]}
                onPress={() => setClassPickerVisible(true)}
              >
                <ThemedText style={{ color: assignClassId ? colors.text : colors.textSecondary }}>
                  {assignClassId ? (classes.find(c => c.id === assignClassId)?.name || 'All Classes') : 'All Classes'}
                </ThemedText>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <ThemedText style={styles.inputLabel}>Select Student *</ThemedText>
              <TouchableOpacity
                style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected, marginBottom: 12 }]}
                onPress={() => setStudentPickerVisible(true)}
              >
                <ThemedText style={{ color: assignStudentId ? colors.text : colors.textSecondary }}>
                  {assignStudentId ? (students.find(s => s.id === assignStudentId)?.name || 'Choose Student') : 'Select Student...'}
                </ThemedText>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <ThemedText style={styles.inputLabel}>Select Route *</ThemedText>
              <TouchableOpacity
                style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected, marginBottom: 12 }]}
                onPress={() => setRoutePickerVisible(true)}
              >
                <ThemedText style={{ color: assignRouteId ? colors.text : colors.textSecondary }}>
                  {assignRouteId ? (routes.find(r => r.id === assignRouteId)?.name || 'Choose Route') : 'Select Route...'}
                </ThemedText>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <ThemedText style={styles.inputLabel}>Pickup Point (Optional)</ThemedText>
              {!showCustomPickup ? (
                <View style={{ gap: 4, marginBottom: 12 }}>
                  <TouchableOpacity
                    style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                    onPress={() => {
                      if (!assignRouteId) {
                        showLocalAlert("Route Required", "Please select a route first.", "warning");
                        return;
                      }
                      setPickupPickerVisible(true);
                    }}
                  >
                    <ThemedText style={{ color: assignPickupPoint ? colors.text : colors.textSecondary }}>
                      {assignPickupPoint ? (routeStops.find((s: any) => s.name === assignPickupPoint) ? `${assignPickupPoint} (₹${routeStops.find((s: any) => s.name === assignPickupPoint)?.fee})` : assignPickupPoint) : 'Choose pickup point...'}
                    </ThemedText>
                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      if (!assignRouteId) {
                        showLocalAlert("Route Required", "Please select a route first.", "warning");
                        return;
                      }
                      setShowCustomPickup(true);
                    }} 
                    style={{ alignSelf: 'flex-start', marginTop: 4 }}
                  >
                    <ThemedText style={{ color: '#007AFF', fontSize: 12, fontWeight: '600' }}>+ Create Custom Pickup Point</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ gap: 4, marginBottom: 12 }}>
                  <TextInput
                    placeholder="Enter custom pickup point name..."
                    placeholderTextColor={colors.textSecondary}
                    value={assignPickupPoint}
                    onChangeText={setAssignPickupPoint}
                    style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected, marginBottom: 8 }]}
                  />
                  <TextInput
                    placeholder="Added Fee (₹)"
                    placeholderTextColor={colors.textSecondary}
                    value={newPickupPointFee}
                    onChangeText={(val) => setNewPickupPointFee(val.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric"
                    style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
                  />
                  <TouchableOpacity onPress={() => {
                    setShowCustomPickup(false);
                    setAssignPickupPoint('');
                    setNewPickupPointFee('');
                  }} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                    <ThemedText style={{ color: '#007AFF', fontSize: 12, fontWeight: '600' }}>Choose existing pickup point</ThemedText>
                  </TouchableOpacity>
                </View>
              )}

              <ThemedText style={styles.inputLabel}>Start Date</ThemedText>
              <TouchableOpacity
                style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                onPress={() => setStartDatePickerVisible(true)}
              >
                <ThemedText style={{ color: assignStartDate ? colors.text : colors.textSecondary }}>
                  {assignStartDate || 'Select Date...'}
                </ThemedText>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setAssignDialogVisible(false)} disabled={assignSaving}>Cancel</Button>
            <Button 
              textColor="#007AFF" 
              onPress={() => {
                if (showCustomPickup) {
                  if (!assignPickupPoint.trim()) {
                    showLocalAlert("Validation Error", "Please enter a custom pickup point name.", "warning");
                    return;
                  }
                  const sanitizedFee = newPickupPointFee.replace(/[^0-9.]/g, '');
                  if (!sanitizedFee || isNaN(Number(sanitizedFee))) {
                    showLocalAlert("Validation Error", "Please enter a valid numeric fee.", "warning");
                    return;
                  }
                  handleSaveAssignment(sanitizedFee);
                } else {
                  handleSaveAssignment();
                }
              }} 
              disabled={assignSaving || !assignStudentId || !assignRouteId}
            >
              {isStudentAlreadyAssigned 
                ? (assignSaving ? 'Updating...' : 'Update') 
                : (assignSaving ? 'Assigning...' : 'Assign')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* LOCAL ROUTE PICKER MODAL */}
      <Portal>
        <Dialog visible={routePickerVisible} onDismiss={() => setRoutePickerVisible(false)} style={{ backgroundColor: colors.backgroundElement, maxHeight: 500 }}>
          <Dialog.Title style={{ color: colors.text }}>Select Transport Route</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <ScrollView>
              {routes.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                  onPress={() => {
                    setAssignRouteId(r.id);
                    setRoutePickerVisible(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ color: colors.text, fontWeight: '600' }}>{r.name}</ThemedText>
                    <ThemedText style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>Monthly Fee: ₹{r.fee}</ThemedText>
                  </View>
                  {assignRouteId === r.id && <Ionicons name="checkmark-circle" size={20} color="#007AFF" />}
                </TouchableOpacity>
              ))}
              {routes.length === 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ThemedText style={{ color: colors.textSecondary }}>No routes available.</ThemedText>
                </View>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => setRoutePickerVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* LOCAL STUDENT PICKER MODAL */}
      <Portal>
        <Dialog visible={studentPickerVisible} onDismiss={() => setStudentPickerVisible(false)} style={{ backgroundColor: colors.backgroundElement, maxHeight: 500 }}>
          <Dialog.Title style={{ color: colors.text }}>Select Student</Dialog.Title>
          <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
            <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
              <Ionicons name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search student by name..."
                placeholderTextColor={colors.textSecondary}
                value={studentSearch}
                onChangeText={setStudentSearch}
                style={[styles.searchInputText, { color: colors.text }]}
              />
            </View>
          </View>
          <View style={{ height: 320, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.backgroundSelected }}>
            <TypedFlashList
              data={filteredStudents}
              keyExtractor={(s: any) => s.id}
              onEndReached={onLoadMoreStudents}
              onEndReachedThreshold={0.5}
              ListFooterComponent={isLoadingMoreStudents ? <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 10 }} /> : null}
              estimatedItemSize={60}
              renderItem={({ item: s }: any) => {
                const assigned = assignments && assignments.find(a => a.studentId === s.id);
                return (
                  <TouchableOpacity
                    style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                    onPress={() => {
                      setAssignStudentId(s.id);
                      setStudentPickerVisible(false);
                      setStudentSearch('');
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ color: colors.text, fontWeight: '500' }}>{s.name}</ThemedText>
                      {assigned && (
                        <ThemedText style={{ color: '#FF9500', fontSize: 11, marginTop: 2 }}>
                          Assigned Route: {assigned.routeName} {assigned.pickupPoint ? `(${assigned.pickupPoint})` : ''}
                        </ThemedText>
                      )}
                    </View>
                    {assigned && <Ionicons name="bus-outline" size={16} color="#FF9500" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => {
              setStudentPickerVisible(false);
              setStudentSearch('');
            }}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* LOCAL CLASS PICKER MODAL */}
      <Portal>
        <Dialog visible={classPickerVisible} onDismiss={() => setClassPickerVisible(false)} style={{ backgroundColor: colors.backgroundElement, maxHeight: 400 }}>
          <Dialog.Title style={{ color: colors.text }}>Select Class</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <ScrollView>
              <TouchableOpacity
                style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                onPress={() => {
                  setAssignClassId('');
                  setClassPickerVisible(false);
                }}
              >
                <ThemedText style={{ color: colors.text }}>All Classes</ThemedText>
                {!assignClassId && <Ionicons name="checkmark-circle" size={20} color="#007AFF" />}
              </TouchableOpacity>
              {classes.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                  onPress={() => {
                    setAssignClassId(c.id);
                    setClassPickerVisible(false);
                  }}
                >
                  <ThemedText style={{ color: colors.text }}>{c.name}</ThemedText>
                  {assignClassId === c.id && <Ionicons name="checkmark-circle" size={20} color="#007AFF" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => setClassPickerVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* LOCAL PICKUP PICKER MODAL */}
      <Portal>
        <Dialog visible={pickupPickerVisible} onDismiss={() => setPickupPickerVisible(false)} style={{ backgroundColor: colors.backgroundElement, maxHeight: 500 }}>
          <Dialog.Title style={{ color: colors.text }}>Select Pickup Point</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <ScrollView>
              {routeStops.map((stop: any, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                  onPress={() => {
                    setAssignPickupPoint(stop.name);
                    setPickupPickerVisible(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ color: colors.text, fontWeight: '600' }}>{stop.name}</ThemedText>
                    <ThemedText style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>Fee: ₹{stop.fee}</ThemedText>
                  </View>
                  {assignPickupPoint === stop.name && <Ionicons name="checkmark-circle" size={20} color="#007AFF" />}
                </TouchableOpacity>
              ))}
              {routeStops.length === 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ThemedText style={{ color: colors.textSecondary }}>No pickup points available.</ThemedText>
                </View>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => setPickupPickerVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* LOCAL START DATE CALENDAR PICKER MODAL */}
      <Portal>
        <Dialog visible={startDatePickerVisible} onDismiss={() => setStartDatePickerVisible(false)} style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}>
          <Dialog.Title style={{ color: colors.text }}>Select Start Date</Dialog.Title>
          <Dialog.ScrollArea style={{ paddingHorizontal: 0, borderColor: colors.backgroundSelected }}>
            <Calendar
              current={assignStartDate}
              onDayPress={(day) => {
                setAssignStartDate(day.dateString);
                setStartDatePickerVisible(false);
              }}
              markedDates={{
                [assignStartDate]: { selected: true, selectedColor: '#007AFF' }
              }}
              theme={{
                backgroundColor: colors.backgroundElement,
                calendarBackground: colors.backgroundElement,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: '#007AFF',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#007AFF',
                dayTextColor: colors.text,
                textDisabledColor: colors.backgroundSelected,
                dotColor: '#007AFF',
                selectedDotColor: '#ffffff',
                arrowColor: '#007AFF',
                disabledArrowColor: colors.backgroundSelected,
                monthTextColor: colors.text,
                indicatorColor: '#007AFF',
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '300',
                textDayFontSize: 14,
                textMonthFontSize: 15,
                textDayHeaderFontSize: 12
              }}
            />
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setStartDatePickerVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <CustomAlertDialog
        visible={localAlert.visible}
        onDismiss={() => setLocalAlert(prev => ({ ...prev, visible: false }))}
        colors={colors}
        title={localAlert.title}
        message={localAlert.message}
        type={localAlert.type}
        onConfirm={localAlert.onConfirm}
      />
    </>
  );
}

const styles = StyleSheet.create({
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8E8E93',
    marginBottom: 4,
  },
  textInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  pickerTrigger: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 36,
  },
  searchInputText: {
    flex: 1,
    fontSize: 13,
  },
});
