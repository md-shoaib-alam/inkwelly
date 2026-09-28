"use client";

import { useReducer, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, fetchAllStudents } from '@/lib/api';
import { toast } from "sonner";

// Sub-components
import { RoutesAndVehiclesView } from './transport/RoutesAndVehiclesView';
import { StudentAssignmentsView } from './transport/StudentAssignmentsView';
import { TransportDialogs } from './transport/TransportDialogs';
import { RouteDetailsView } from './transport/RouteDetailsView';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

type State = {
  activeTab: 'routes' | 'assignments';
  assignDialogOpen: boolean;
  addRouteOpen: boolean;
  addVehicleOpen: boolean;
  editingRouteId: string | null;
  editingVehicleId: string | null;
  assignmentData: { studentId: string; routeId: string; classId: string; startDate: string; pickupPoint?: string; newPickupPointFee?: number };
  routeData: { name: string; fee: string; vehicleId: string };
  vehicleData: { number: string; type: string; capacity: string; status: string };
};

type Action =
  | { type: 'SET_ACTIVE_TAB'; payload: 'routes' | 'assignments' }
  | { type: 'SET_ASSIGN_DIALOG'; payload: boolean }
  | { type: 'SET_ROUTE_DIALOG'; payload: boolean }
  | { type: 'SET_VEHICLE_DIALOG'; payload: boolean }
  | { type: 'SET_ASSIGNMENT_DATA'; payload: Partial<State['assignmentData']> }
  | { type: 'SET_ROUTE_DATA'; payload: Partial<State['routeData']> }
  | { type: 'SET_VEHICLE_DATA'; payload: Partial<State['vehicleData']> }
  | { type: 'START_EDIT_ROUTE'; payload: any }
  | { type: 'START_EDIT_VEHICLE'; payload: any }
  | { type: 'RESET_ASSIGNMENT' }
  | { type: 'RESET_ROUTE' }
  | { type: 'RESET_VEHICLE' };

const initialAssignmentData = { studentId: '', routeId: '', classId: '', startDate: new Date().toISOString().split('T')[0], pickupPoint: '', newPickupPointFee: undefined as number | undefined };
const initialRouteData = { name: '', fee: '', vehicleId: 'none' };
const initialVehicleData = { number: '', type: 'bus', capacity: '40', status: 'active' };

const initialState: State = {
  activeTab: 'routes',
  assignDialogOpen: false,
  addRouteOpen: false,
  addVehicleOpen: false,
  editingRouteId: null,
  editingVehicleId: null,
  assignmentData: initialAssignmentData,
  routeData: initialRouteData,
  vehicleData: initialVehicleData,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_ASSIGN_DIALOG':
      return { ...state, assignDialogOpen: action.payload };
    case 'SET_ROUTE_DIALOG':
      return { ...state, addRouteOpen: action.payload, editingRouteId: action.payload ? state.editingRouteId : null };
    case 'SET_VEHICLE_DIALOG':
      return { ...state, addVehicleOpen: action.payload, editingVehicleId: action.payload ? state.editingVehicleId : null };
    case 'SET_ASSIGNMENT_DATA':
      return { ...state, assignmentData: { ...state.assignmentData, ...action.payload } };
    case 'SET_ROUTE_DATA':
      return { ...state, routeData: { ...state.routeData, ...action.payload } };
    case 'SET_VEHICLE_DATA':
      return { ...state, vehicleData: { ...state.vehicleData, ...action.payload } };
    case 'START_EDIT_ROUTE':
      return {
        ...state,
        addRouteOpen: true,
        editingRouteId: action.payload.id,
        routeData: {
          name: action.payload.name,
          fee: String(action.payload.fee),
          vehicleId: action.payload.vehicleId || 'none',
        }
      };
    case 'START_EDIT_VEHICLE':
      return {
        ...state,
        addVehicleOpen: true,
        editingVehicleId: action.payload.id,
        vehicleData: {
          number: action.payload.number,
          type: action.payload.type || 'bus',
          capacity: String(action.payload.capacity || 40),
          status: action.payload.status || 'active',
        }
      };
    case 'RESET_ASSIGNMENT':
      return { ...state, assignmentData: initialAssignmentData, assignDialogOpen: false };
    case 'RESET_ROUTE':
      return { ...state, routeData: initialRouteData, addRouteOpen: false, editingRouteId: null };
    case 'RESET_VEHICLE':
      return { ...state, vehicleData: initialVehicleData, addVehicleOpen: false, editingVehicleId: null };
    default:
      return state;
  }
}

export function TransportFeeTab() {
  const { slug, detail } = useParams();
  const decodedRouteName = detail ? decodeURIComponent(detail as string) : null;
  const queryClient = useQueryClient();
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    activeTab,
    assignDialogOpen,
    addRouteOpen,
    addVehicleOpen,
    editingRouteId,
    editingVehicleId,
    assignmentData,
    routeData,
    vehicleData,
  } = state;

  // ── Queries ──
  const { data: routes = [], isLoading: loadingRoutes } = useQuery({
    queryKey: ['transport-routes'],
    queryFn: async () => {
      const res = await apiFetch('/api/transport-routes');
      return res.json();
    }
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await apiFetch('/api/vehicles');
      return res.json();
    }
  });

  const { data: assignmentsData, isLoading: loadingAssignments } = useQuery({
    queryKey: ['transport-assignments'],
    queryFn: async () => {
      const res = await apiFetch('/api/transport-assignments');
      return res.json();
    }
  });
  const assignments = Array.isArray(assignmentsData) ? assignmentsData : assignmentsData?.items || [];

  const { data: classes = [] } = useQuery({
    queryKey: ['classes-min'],
    queryFn: async () => {
      const res = await apiFetch('/api/classes?mode=min');
      return res.json();
    }
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students-min'],
    queryFn: () => fetchAllStudents()
  });
  const students = useMemo(() => Array.isArray(studentsData) ? studentsData : [], [studentsData]);

  // ── Mutations ──
  const assignMutation = useMutation<any, any, any>({
    mutationFn: async (data: any) => {
      const res = await apiFetch('/api/transport-assignments', { method: 'POST', body: JSON.stringify(data) });
      if (!res.ok) throw new Error('Failed to assign');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['transport-routes'] });
      dispatch({ type: 'RESET_ASSIGNMENT' });
      toast.success('Student assigned to route successfully');
    },
    onError: () => toast.error('Failed to assign student')
  });

  const deleteMutation = useMutation<any, any, any>({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/transport-assignments?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['transport-routes'] });
      toast.success('Assignment removed successfully');
    },
    onError: () => toast.error('Failed to remove assignment')
  });

  const addRouteMutation = useMutation<any, any, any>({
    mutationFn: async (data: any) => {
      const url = '/api/transport-routes';
      const method = editingRouteId ? 'PUT' : 'POST';
      const bodyData = editingRouteId ? { id: editingRouteId, ...data } : data;
      const res = await apiFetch(url, { method, body: JSON.stringify(bodyData) });
      if (!res.ok) throw new Error(editingRouteId ? 'Failed to update route' : 'Failed to add route');
      return res.json();
    },
    onSuccess: () => {
      toast.success(editingRouteId ? 'Route updated successfully' : 'Route added successfully');
      queryClient.invalidateQueries({ queryKey: ['transport-routes'] });
      dispatch({ type: 'RESET_ROUTE' });
    },
    onError: () => toast.error(editingRouteId ? 'Error updating route' : 'Error adding route')
  });

  const addVehicleMutation = useMutation<any, any, any>({
    mutationFn: async (data: any) => {
      const url = '/api/vehicles';
      const method = editingVehicleId ? 'PUT' : 'POST';
      const bodyData = editingVehicleId ? { id: editingVehicleId, ...data } : data;
      const res = await apiFetch(url, { method, body: JSON.stringify(bodyData) });
      if (!res.ok) throw new Error(editingVehicleId ? 'Failed to update vehicle' : 'Failed to add vehicle');
      return res.json();
    },
    onSuccess: () => {
      toast.success(editingVehicleId ? 'Vehicle updated successfully' : 'Vehicle added successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      dispatch({ type: 'RESET_VEHICLE' });
    },
    onError: () => toast.error(editingVehicleId ? 'Error updating vehicle' : 'Error adding vehicle')
  });

  const currentRoute = decodedRouteName 
    ? routes.find((r: any) => r.name.toLowerCase() === decodedRouteName.toLowerCase()) 
    : null;

  return (
    <div className="space-y-4">
      {detail ? (
        !currentRoute ? (
          loadingRoutes ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-48" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-[400px] w-full lg:col-span-2" />
              </div>
            </div>
          ) : (
            <div className="p-6 text-center border rounded-xl bg-card">
              <h2 className="text-lg font-semibold">Route Not Found</h2>
              <p className="text-zinc-500 text-sm mt-1">
                The transport route &ldquo;{decodedRouteName}&rdquo; does not exist or has been deleted.
              </p>
              <Button className="mt-4" onClick={() => window.location.href = `/${slug}/transport-fee`}>
                Go Back
              </Button>
            </div>
          )
        ) : (
          <RouteDetailsView
            route={currentRoute}
            assignments={assignments}
            onEditRoute={(route) => dispatch({ type: 'START_EDIT_ROUTE', payload: route })}
          />
        )
      ) : (
        <>
          <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
            <Button variant={activeTab === 'routes' ? 'default' : 'ghost'} size="sm" onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'routes' })} className="h-8">Routes & Vehicles</Button>
            <Button variant={activeTab === 'assignments' ? 'default' : 'ghost'} size="sm" onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'assignments' })} className="h-8">Student Assignments</Button>
          </div>

          {activeTab === 'routes' ? (
            <RoutesAndVehiclesView 
              loadingRoutes={loadingRoutes}
              routes={routes}
              onAddRoute={() => dispatch({ type: 'SET_ROUTE_DIALOG', payload: true })}
              vehicles={vehicles}
              onAddVehicle={() => dispatch({ type: 'SET_VEHICLE_DIALOG', payload: true })}
              onEditRoute={(route) => dispatch({ type: 'START_EDIT_ROUTE', payload: route })}
              onEditVehicle={(vehicle) => dispatch({ type: 'START_EDIT_VEHICLE', payload: vehicle })}
              onViewStudents={(routeId) => {
                setSelectedRouteId(routeId);
                dispatch({ type: 'SET_ACTIVE_TAB', payload: 'assignments' });
              }}
            />
          ) : (
            <StudentAssignmentsView 
              loadingAssignments={loadingAssignments}
              assignments={assignments}
              onAssignClick={() => {
                setIsEditingAssignment(false);
                dispatch({ type: 'RESET_ASSIGNMENT' });
                dispatch({ type: 'SET_ASSIGN_DIALOG', payload: true });
              }}
              onDelete={(id) => deleteMutation.mutate(id)}
              deletingId={deleteMutation.variables as string}
              isDeleting={deleteMutation.isPending}
              selectedRouteId={selectedRouteId}
              onRouteFilterChange={setSelectedRouteId}
              routes={routes}
              onEditAssignment={(assign) => {
                setIsEditingAssignment(true);
                dispatch({
                  type: 'SET_ASSIGNMENT_DATA',
                  payload: {
                    studentId: assign.studentId,
                    routeId: assign.routeId,
                    classId: assign.student?.classId || '',
                    pickupPoint: assign.pickupPoint || '',
                    startDate: assign.startDate || new Date().toISOString().split('T')[0]
                  }
                });
                dispatch({ type: 'SET_ASSIGN_DIALOG', payload: true });
              }}
            />
          )}
        </>
      )}

      <TransportDialogs 
        assignOpen={assignDialogOpen}
        onAssignOpenChange={(open) => dispatch({ type: 'SET_ASSIGN_DIALOG', payload: open })}
        assignmentData={assignmentData}
        setAssignmentData={(data: any) => {
            if (typeof data === 'function') {
                dispatch({ type: 'SET_ASSIGNMENT_DATA', payload: data(assignmentData) });
            } else {
                dispatch({ type: 'SET_ASSIGNMENT_DATA', payload: data });
            }
        }}
        classes={classes}
        students={students}
        routes={routes}
        onAssignSubmit={() => assignMutation.mutate(assignmentData)}
        assigning={assignMutation.isPending}
        isEditingAssignment={isEditingAssignment}

        routeOpen={addRouteOpen}
        onRouteOpenChange={(open) => dispatch({ type: 'SET_ROUTE_DIALOG', payload: open })}
        routeData={routeData}
        setRouteData={(data: any) => {
            if (typeof data === 'function') {
                dispatch({ type: 'SET_ROUTE_DATA', payload: data(routeData) });
            } else {
                dispatch({ type: 'SET_ROUTE_DATA', payload: data });
            }
        }}
        vehicles={vehicles}
        onRouteSubmit={() => addRouteMutation.mutate({ ...routeData, fee: 0, vehicleId: routeData.vehicleId === 'none' ? undefined : routeData.vehicleId })}
        addingRoute={addRouteMutation.isPending}
        isEditingRoute={!!editingRouteId}

        vehicleOpen={addVehicleOpen}
        onVehicleOpenChange={(open) => dispatch({ type: 'SET_VEHICLE_DIALOG', payload: open })}
        vehicleData={vehicleData}
        setVehicleData={(data: any) => {
            if (typeof data === 'function') {
                dispatch({ type: 'SET_VEHICLE_DATA', payload: data(vehicleData) });
            } else {
                dispatch({ type: 'SET_VEHICLE_DATA', payload: data });
            }
        }}
        onVehicleSubmit={() => addVehicleMutation.mutate(vehicleData)}
        registeringVehicle={addVehicleMutation.isPending}
        isEditingVehicle={!!editingVehicleId}
      />
    </div>
  );
}
