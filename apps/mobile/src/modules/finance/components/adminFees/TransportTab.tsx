import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { ClassOption, StudentOption } from './types';
import { Skeleton } from '@/components/Skeleton';
import { RoutesAndVehiclesView } from './transport/RoutesAndVehiclesView';
import { StudentAssignmentsView } from './transport/StudentAssignmentsView';
import { TransportDialogs } from './transport/TransportDialogs';

interface TransportTabProps {
  colors: any;
  classes: ClassOption[];
  students: StudentOption[];
  showCustomAlert: (
    title: string,
    message: string,
    type?: 'success' | 'error' | 'warning' | 'info' | 'confirm',
    onConfirm?: () => void,
    confirmText?: string,
    cancelText?: string
  ) => void;
  onLoadMoreStudents?: () => void;
  isLoadingStudents?: boolean;
}

export function TransportTab({ 
  colors, 
  classes, 
  students, 
  showCustomAlert,
  onLoadMoreStudents,
  isLoadingStudents
}: TransportTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'routes' | 'assignments'>('routes');
  const [loading, setLoading] = useState(true);

  // Data states
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  // Dialog visibilities
  const [routeDialogVisible, setRouteDialogVisible] = useState(false);
  const [vehicleDialogVisible, setVehicleDialogVisible] = useState(false);
  const [assignDialogVisible, setAssignDialogVisible] = useState(false);

  // Form states
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [routeName, setRouteName] = useState('');
  const [routeFee, setRouteFee] = useState('');
  const [routeVehicleId, setRouteVehicleId] = useState('none');
  const [routeSaving, setRouteSaving] = useState(false);

  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('bus');
  const [vehicleCapacity, setVehicleCapacity] = useState('40');
  const [vehicleStatus, setVehicleStatus] = useState('active');
  const [vehicleSaving, setVehicleSaving] = useState(false);

  const [assignStudentId, setAssignStudentId] = useState('');
  const [assignRouteId, setAssignRouteId] = useState('');
  const [assignClassId, setAssignClassId] = useState('');
  const [assignPickupPoint, setAssignPickupPoint] = useState('');
  const [assignStartDate, setAssignStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [assignSaving, setAssignSaving] = useState(false);

  const [studentSearch, setStudentSearch] = useState('');
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleStudentSearchChange = useCallback((value: string) => {
    setStudentSearch(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedStudentSearch(value);
    }, 200);
  }, []);

  const [studentPickerVisible, setStudentPickerVisible] = useState(false);
  const [routePickerVisible, setRoutePickerVisible] = useState(false);

  // Load all transport data
  const loadData = async () => {
    setLoading(true);
    try {
      const [routesRes, vehiclesRes, assignmentsRes] = await Promise.all([
        api.get('/transport-routes'),
        api.get('/vehicles'),
        api.get('/transport-assignments'),
      ]);
      if (routesRes) setRoutes(Array.isArray(routesRes) ? routesRes : []);
      if (vehiclesRes) setVehicles(Array.isArray(vehiclesRes) ? vehiclesRes : []);
      if (assignmentsRes) setAssignments(Array.isArray(assignmentsRes) ? assignmentsRes : []);
    } catch (e) {
      console.error('Failed to load transport details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered lists
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(debouncedStudentSearch.toLowerCase());
      if (assignClassId) {
        return matchesSearch && s.classId === assignClassId;
      }
      return matchesSearch;
    });
  }, [students, debouncedStudentSearch, assignClassId]);

  // Route operations
  const handleSaveRoute = async () => {
    if (!routeName.trim() || !routeFee) {
      showCustomAlert('Validation Error', 'Route name and monthly fee are required.', 'warning');
      return;
    }
    setRouteSaving(true);
    try {
      const payload = {
        name: routeName.trim(),
        fee: Number(routeFee),
        vehicleId: routeVehicleId === 'none' ? null : routeVehicleId,
      };

      if (editingRouteId) {
        await api.put('/transport-routes', { id: editingRouteId, ...payload });
        setRouteDialogVisible(false);
        loadData();
        showCustomAlert('Success', 'Route updated successfully!', 'success');
      } else {
        await api.post('/transport-routes', payload);
        setRouteDialogVisible(false);
        loadData();
        showCustomAlert('Success', 'Route added successfully!', 'success');
      }
    } catch (e) {
      showCustomAlert('Error', 'Failed to save route details.', 'error');
    } finally {
      setRouteSaving(false);
    }
  };

  const handleDeleteRoute = (id: string) => {
    showCustomAlert(
      'Confirm Delete',
      'Are you sure you want to delete this transport route?',
      'confirm',
      async () => {
        try {
          await api.delete(`/transport-routes?id=${id}`);
          loadData();
        } catch (e) {
          showCustomAlert('Error', 'Failed to delete route.', 'error');
        }
      },
      'Delete'
    );
  };

  // Vehicle operations
  const handleSaveVehicle = async () => {
    if (!vehicleNumber.trim()) {
      showCustomAlert('Validation Error', 'Vehicle number is required.', 'warning');
      return;
    }
    setVehicleSaving(true);
    try {
      const payload = {
        number: vehicleNumber.trim(),
        type: vehicleType,
        capacity: Number(vehicleCapacity || 40),
        status: vehicleStatus,
      };

      if (editingVehicleId) {
        await api.put('/vehicles', { id: editingVehicleId, ...payload });
        setVehicleDialogVisible(false);
        loadData();
        showCustomAlert('Success', 'Vehicle updated successfully!', 'success');
      } else {
        await api.post('/vehicles', payload);
        setVehicleDialogVisible(false);
        loadData();
        showCustomAlert('Success', 'Vehicle registered successfully!', 'success');
      }
    } catch (e) {
      showCustomAlert('Error', 'Failed to save vehicle details.', 'error');
    } finally {
      setVehicleSaving(false);
    }
  };

  const handleDeleteVehicle = (id: string) => {
    showCustomAlert(
      'Confirm Delete',
      'Are you sure you want to remove this vehicle record?',
      'confirm',
      async () => {
        try {
          await api.delete(`/vehicles?id=${id}`);
          loadData();
        } catch (e) {
          showCustomAlert('Error', 'Failed to delete vehicle.', 'error');
        }
      },
      'Delete'
    );
  };

  // Assignment operations
  const handleSaveAssignment = async (customFee?: string) => {
    if (!assignStudentId || !assignRouteId) {
      showCustomAlert('Validation Error', 'Student and Route are required.', 'warning');
      return;
    }
    setAssignSaving(true);
    try {
      const payload = {
        studentId: assignStudentId,
        routeId: assignRouteId,
        pickupPoint: assignPickupPoint.trim() || null,
        startDate: assignStartDate,
        ...(customFee ? { newPickupPointFee: Number(customFee) } : {}),
      };
      await api.post('/transport-assignments', payload);
      setAssignDialogVisible(false);
      loadData();
      showCustomAlert('Success', 'Student assigned to route successfully!', 'success');
    } catch (e) {
      showCustomAlert('Error', 'Failed to save transport assignment.', 'error');
    } finally {
      setAssignSaving(false);
    }
  };

  const handleDeleteAssignment = (id: string) => {
    showCustomAlert(
      'Confirm Remove',
      'Are you sure you want to remove this student assignment from this route?',
      'confirm',
      async () => {
        try {
          await api.delete(`/transport-assignments?id=${id}`);
          loadData();
        } catch (e) {
          showCustomAlert('Error', 'Failed to remove assignment.', 'error');
        }
      },
      'Remove'
    );
  };

  const resetRouteForm = () => {
    setEditingRouteId(null);
    setRouteName('');
    setRouteFee('');
    setRouteVehicleId('none');
  };

  const resetVehicleForm = () => {
    setEditingVehicleId(null);
    setVehicleNumber('');
    setVehicleType('bus');
    setVehicleCapacity('40');
    setVehicleStatus('active');
  };

  const resetAssignForm = () => {
    setAssignStudentId('');
    setAssignRouteId('');
    setAssignClassId('');
    setAssignPickupPoint('');
    setAssignStartDate(new Date().toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <View style={{ gap: 16 }}>
        {/* SUMMARY STATS CARDS SKELETON */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
            <Skeleton width={32} height={32} borderRadius={8} />
            <View style={{ gap: 4 }}>
              <Skeleton width={50} height={10} />
              <Skeleton width={30} height={14} />
            </View>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
            <Skeleton width={32} height={32} borderRadius={8} />
            <View style={{ gap: 4 }}>
              <Skeleton width={50} height={10} />
              <Skeleton width={30} height={14} />
            </View>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
            <Skeleton width={32} height={32} borderRadius={8} />
            <View style={{ gap: 4 }}>
              <Skeleton width={50} height={10} />
              <Skeleton width={30} height={14} />
            </View>
          </View>
        </View>

        {/* SECTION HEADER SKELETON */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <Skeleton width={100} height={16} />
          <Skeleton width={70} height={26} borderRadius={8} />
        </View>

        {/* LIST ITEMS SKELETON */}
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={[styles.itemCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected, height: 60, justifyContent: 'center', gap: 6 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Skeleton width={120} height={14} />
              <Skeleton width={50} height={14} />
            </View>
            <Skeleton width={80} height={10} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      {/* SUMMARY STATS CARDS */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
            <Ionicons name="git-network-outline" size={20} color="#007AFF" />
          </View>
          <View>
            <ThemedText style={{ fontSize: 10, color: colors.textSecondary }}>Total Routes</ThemedText>
            <ThemedText style={styles.statVal}>{routes.length}</ThemedText>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
            <Ionicons name="bus-outline" size={20} color="#FF9500" />
          </View>
          <View>
            <ThemedText style={{ fontSize: 10, color: colors.textSecondary }}>Vehicles</ThemedText>
            <ThemedText style={styles.statVal}>{vehicles.length}</ThemedText>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
            <Ionicons name="people-outline" size={20} color="#34C759" />
          </View>
          <View>
            <ThemedText style={{ fontSize: 10, color: colors.textSecondary }}>Assigned</ThemedText>
            <ThemedText style={styles.statVal}>{assignments.length}</ThemedText>
          </View>
        </View>
      </View>

      {/* SUB TABS BAR */}
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={[styles.subTabButton, activeSubTab === 'routes' && { borderBottomColor: '#007AFF' }]}
          onPress={() => setActiveSubTab('routes')}
        >
          <ThemedText style={[styles.subTabLabel, activeSubTab === 'routes' && { color: '#007AFF', fontWeight: 'bold' }]} numberOfLines={1}>Routes & Vehicles</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTabButton, activeSubTab === 'assignments' && { borderBottomColor: '#007AFF' }]}
          onPress={() => setActiveSubTab('assignments')}
        >
          <ThemedText style={[styles.subTabLabel, activeSubTab === 'assignments' && { color: '#007AFF', fontWeight: 'bold' }]} numberOfLines={1}>Student Assignments</ThemedText>
        </TouchableOpacity>
      </View>

      {/* ROUTES AND VEHICLES TAB */}
      {activeSubTab === 'routes' && (
        <RoutesAndVehiclesView
          colors={colors}
          routes={routes}
          vehicles={vehicles}
          onAddRoute={() => {
            resetRouteForm();
            setRouteDialogVisible(true);
          }}
          onEditRoute={(r) => {
            setEditingRouteId(r.id);
            setRouteName(r.name);
            setRouteFee(String(r.fee));
            setRouteVehicleId(r.vehicleId || 'none');
            setRouteDialogVisible(true);
          }}
          onDeleteRoute={handleDeleteRoute}
          onAddVehicle={() => {
            resetVehicleForm();
            setVehicleDialogVisible(true);
          }}
          onEditVehicle={(v) => {
            setEditingVehicleId(v.id);
            setVehicleNumber(v.number);
            setVehicleType(v.type || 'bus');
            setVehicleCapacity(String(v.capacity || 40));
            setVehicleStatus(v.status || 'active');
            setVehicleDialogVisible(true);
          }}
          onDeleteVehicle={handleDeleteVehicle}
        />
      )}

      {/* ASSIGNMENTS TAB */}
      {activeSubTab === 'assignments' && (
        <StudentAssignmentsView
          colors={colors}
          assignments={assignments}
          onAddAssignment={() => {
            resetAssignForm();
            setAssignDialogVisible(true);
          }}
          onEditAssignment={(a) => {
            setAssignStudentId(a.studentId);
            setAssignRouteId(a.routeId);
            const std = students.find(s => s.id === a.studentId);
            if (std) setAssignClassId(std.classId || '');
            setAssignPickupPoint(a.pickupPoint || '');
            setAssignStartDate(a.startDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
            setAssignDialogVisible(true);
          }}
          onDeleteAssignment={handleDeleteAssignment}
        />
      )}

      {/* DIALOGS */}
      <TransportDialogs
        colors={colors}
        classes={classes}
        students={students}
        routes={routes}
        vehicles={vehicles}
        assignments={assignments}
        
        routeDialogVisible={routeDialogVisible}
        setRouteDialogVisible={setRouteDialogVisible}
        editingRouteId={editingRouteId}
        routeName={routeName}
        setRouteName={setRouteName}
        routeFee={routeFee}
        setRouteFee={setRouteFee}
        routeVehicleId={routeVehicleId}
        setRouteVehicleId={setRouteVehicleId}
        routeSaving={routeSaving}
        handleSaveRoute={handleSaveRoute}

        vehicleDialogVisible={vehicleDialogVisible}
        setVehicleDialogVisible={setVehicleDialogVisible}
        editingVehicleId={editingVehicleId}
        vehicleNumber={vehicleNumber}
        setVehicleNumber={setVehicleNumber}
        vehicleCapacity={vehicleCapacity}
        setVehicleCapacity={setVehicleCapacity}
        vehicleType={vehicleType}
        setVehicleType={setVehicleType}
        vehicleStatus={vehicleStatus}
        setVehicleStatus={setVehicleStatus}
        vehicleSaving={vehicleSaving}
        handleSaveVehicle={handleSaveVehicle}

        assignDialogVisible={assignDialogVisible}
        setAssignDialogVisible={setAssignDialogVisible}
        assignClassId={assignClassId}
        setAssignClassId={setAssignClassId}
        assignStudentId={assignStudentId}
        setAssignStudentId={setAssignStudentId}
        assignRouteId={assignRouteId}
        setAssignRouteId={setAssignRouteId}
        assignPickupPoint={assignPickupPoint}
        setAssignPickupPoint={setAssignPickupPoint}
        assignStartDate={assignStartDate}
        setAssignStartDate={setAssignStartDate}
        assignSaving={assignSaving}
        handleSaveAssignment={handleSaveAssignment}

        studentPickerVisible={studentPickerVisible}
        setStudentPickerVisible={setStudentPickerVisible}
        studentSearch={studentSearch}
        setStudentSearch={handleStudentSearchChange}
        filteredStudents={filteredStudents}
        onLoadMoreStudents={onLoadMoreStudents}
        isLoadingMoreStudents={isLoadingStudents}
        routePickerVisible={routePickerVisible}
        setRoutePickerVisible={setRoutePickerVisible}
        showCustomAlert={showCustomAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  subTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 142, 147, 0.15)',
  },
  subTabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
});
