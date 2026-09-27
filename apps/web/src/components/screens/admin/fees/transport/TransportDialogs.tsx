"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { parseISO } from "date-fns";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const formatVehicleType = (type: string) => {
  if (!type) return "";
  const mapping: Record<string, string> = {
    bus: "Bus",
    mini_bus: "Mini Bus",
    van: "Van",
    traveler: "Force Traveler",
    magic: "Tata Magic",
    auto: "Auto Rickshaw",
    car: "Car / Cab"
  };
  return mapping[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1);
};

interface TransportDialogsProps {
  assignOpen: boolean;
  onAssignOpenChange: (open: boolean) => void;
  assignmentData: any;
  setAssignmentData: (v: any) => void;
  classes: any[];
  students: any[];
  routes: any[];
  onAssignSubmit: () => void;
  assigning: boolean;
  isEditingAssignment?: boolean;

  routeOpen: boolean;
  onRouteOpenChange: (open: boolean) => void;
  routeData: any;
  setRouteData: (v: any) => void;
  vehicles: any[];
  onRouteSubmit: () => void;
  addingRoute: boolean;
  isEditingRoute?: boolean;

  vehicleOpen: boolean;
  onVehicleOpenChange: (open: boolean) => void;
  vehicleData: any;
  setVehicleData: (v: any) => void;
  onVehicleSubmit: () => void;
  registeringVehicle: boolean;
  isEditingVehicle?: boolean;
}

export function TransportDialogs({
  assignOpen, onAssignOpenChange, assignmentData, setAssignmentData, classes, students, routes, onAssignSubmit, assigning, isEditingAssignment = false,
  routeOpen, onRouteOpenChange, routeData, setRouteData, vehicles, onRouteSubmit, addingRoute, isEditingRoute = false,
  vehicleOpen, onVehicleOpenChange, vehicleData, setVehicleData, onVehicleSubmit, registeringVehicle, isEditingVehicle = false,
}: TransportDialogsProps) {
  const [showCustomPickup, setShowCustomPickup] = useState(false);
  const [customPickupName, setCustomPickupName] = useState("");
  const [customPickupFee, setCustomPickupFee] = useState("");

  const selectedRoute = routes.find((r: any) => r.id === assignmentData.routeId);
  const routeStops = selectedRoute ? (() => {
    try {
      return typeof selectedRoute.stops === "string" ? JSON.parse(selectedRoute.stops) : (selectedRoute.stops || []);
    } catch (e) {
      return [];
    }
  })() : [];

  // Reset custom pickup fields when dialog toggles or route changes
  useEffect(() => {
    setShowCustomPickup(false);
    setCustomPickupName("");
    setCustomPickupFee("");
  }, [assignOpen, assignmentData.routeId]);

  return (
    <>
      {/* Assign Student Dialog */}
      <Dialog open={assignOpen} onOpenChange={onAssignOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditingAssignment ? "Edit Transport Assignment" : "Assign Transport Route"}</DialogTitle>
            <DialogDescription>Select a student and a transport route to begin service.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Select Class *</Label>
              <Select value={assignmentData.classId} onValueChange={v => setAssignmentData((prev: any) => ({...prev, classId: v, studentId: ''}))} disabled={isEditingAssignment}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select class first..." /></SelectTrigger>
                <SelectContent>
                  {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}-{c.section} (Grade {c.grade})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select Student *</Label>
              <Select value={assignmentData.studentId} onValueChange={v => setAssignmentData((prev: any) => ({...prev, studentId: v}))} disabled={!assignmentData.classId || isEditingAssignment}>
                <SelectTrigger className="w-full"><SelectValue placeholder={assignmentData.classId ? "Select student..." : "Pick a class first"} /></SelectTrigger>
                <SelectContent>
                  {students.reduce((acc: React.ReactNode[], s: any) => {
                    if (!assignmentData.classId || s.classId === assignmentData.classId) {
                      acc.push(<SelectItem key={s.id} value={s.id}>{s.user?.name || s.name}</SelectItem>);
                    }
                    return acc;
                  }, [])}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select Route *</Label>
              <Select value={assignmentData.routeId} onValueChange={v => setAssignmentData((prev: any) => ({...prev, routeId: v, pickupPoint: ''}))}>
                <SelectTrigger><SelectValue placeholder="Select route..." /></SelectTrigger>
                <SelectContent>
                  {routes.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {assignmentData.routeId && (
              <div className="space-y-2">
                <Label>Select Pickup Point *</Label>
                {!showCustomPickup ? (
                  <Select
                    value={assignmentData.pickupPoint || ""}
                    onValueChange={(v) => {
                      if (v === "__new__") {
                        setShowCustomPickup(true);
                        setAssignmentData((prev: any) => ({ ...prev, pickupPoint: "" }));
                      } else {
                        setAssignmentData((prev: any) => ({ ...prev, pickupPoint: v }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose pickup point..." />
                    </SelectTrigger>
                    <SelectContent>
                      {routeStops.map((stop: any, idx: number) => (
                        <SelectItem key={idx} value={stop.name}>
                          {stop.name} (₹{stop.fee})
                        </SelectItem>
                      ))}
                      <SelectItem value="__new__" className="text-emerald-600 font-semibold focus:text-emerald-700">
                        + Create New Pickup Point...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-3 p-3 rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/20">
                    <div className="space-y-1">
                      <Label className="text-xs">New Pickup Point Name *</Label>
                      <Input
                        placeholder="e.g. Sector 5 Crossing"
                        value={customPickupName}
                        onChange={(e) => {
                          setCustomPickupName(e.target.value);
                          setAssignmentData((prev: any) => ({ ...prev, pickupPoint: e.target.value }));
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Pickup Fee (₹) *</Label>
                      <Input
                        type="number"
                        placeholder="Enter pickup fee"
                        value={customPickupFee}
                        onChange={(e) => {
                          setCustomPickupFee(e.target.value);
                          setAssignmentData((prev: any) => ({ ...prev, newPickupPointFee: Number(e.target.value) }));
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="text-xs p-0 h-auto"
                      onClick={() => {
                        setShowCustomPickup(false);
                        setCustomPickupName("");
                        setCustomPickupFee("");
                        setAssignmentData((prev: any) => {
                          const { newPickupPointFee, ...rest } = prev;
                          return { ...rest, pickupPoint: "" };
                        });
                      }}
                    >
                      Select existing pickup point
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 flex flex-col">
              <Label className="mb-1">Start Date</Label>
              <DatePicker 
                date={assignmentData.startDate ? parseISO(assignmentData.startDate) : undefined} 
                onChange={(d) => setAssignmentData((prev: any) => ({...prev, startDate: d ? d.toISOString().split('T')[0] : ''}))} 
                className="w-full h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onAssignOpenChange(false)}>Cancel</Button>
            <Button onClick={onAssignSubmit} disabled={assigning || !assignmentData.studentId || !assignmentData.routeId || !assignmentData.pickupPoint}>
              {assigning ? 'Saving...' : (isEditingAssignment ? 'Save Changes' : 'Assign Route')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Route Dialog */}
      <Dialog open={routeOpen} onOpenChange={onRouteOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditingRoute ? 'Edit Transport Route' : 'Add Transport Route'}</DialogTitle>
            <DialogDescription>{isEditingRoute ? 'Modify details of this transportation route.' : 'Create a new route for school transportation.'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Route Name *</Label>
              <Input placeholder="e.g. North Sector Loop" value={routeData.name} onChange={e => setRouteData((prev: any) => ({...prev, name: e.target.value}))} />
            </div>
            <div className="space-y-2">
              <Label>Assign Vehicle (Optional)</Label>
              <Select value={routeData.vehicleId} onValueChange={v => setRouteData((prev: any) => ({...prev, vehicleId: v}))}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Vehicle</SelectItem>
                  {vehicles.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.number} ({formatVehicleType(v.type)})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onRouteOpenChange(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600" onClick={onRouteSubmit} disabled={addingRoute || !routeData.name}>
              {addingRoute ? 'Saving...' : (isEditingRoute ? 'Save Changes' : 'Add Route')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Vehicle Dialog */}
      <Dialog open={vehicleOpen} onOpenChange={onVehicleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditingVehicle ? 'Edit Vehicle' : 'Register Vehicle'}</DialogTitle>
            <DialogDescription>{isEditingVehicle ? 'Modify details of this vehicle in the fleet.' : 'Add a new vehicle to the school transport fleet.'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Vehicle Number *</Label>
              <Input placeholder="e.g. DL 01 AB 1234" value={vehicleData.number} onChange={e => setVehicleData((prev: any) => ({...prev, number: e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={vehicleData.type} onValueChange={v => setVehicleData((prev: any) => ({...prev, type: v}))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                     <SelectItem value="bus">Bus</SelectItem>
                     <SelectItem value="mini_bus">Mini Bus</SelectItem>
                     <SelectItem value="van">Van</SelectItem>
                     <SelectItem value="traveler">Force Traveler</SelectItem>
                     <SelectItem value="magic">Tata Magic</SelectItem>
                     <SelectItem value="auto">Auto Rickshaw</SelectItem>
                     <SelectItem value="car">Car / Cab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" value={vehicleData.capacity} onChange={e => setVehicleData((prev: any) => ({...prev, capacity: e.target.value}))} />
              </div>
            </div>
            {isEditingVehicle && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={vehicleData.status} onValueChange={v => setVehicleData((prev: any) => ({...prev, status: v}))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                     <SelectItem value="active">Active</SelectItem>
                     <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onVehicleOpenChange(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600" onClick={onVehicleSubmit} disabled={registeringVehicle || !vehicleData.number}>
              {registeringVehicle ? 'Saving...' : (isEditingVehicle ? 'Save Changes' : 'Register Vehicle')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
