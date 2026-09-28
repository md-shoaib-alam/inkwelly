"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Bus, Trash2, Plus, Users, Receipt, Calendar } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { formatVehicleType } from "./TransportDialogs";

interface RouteDetailsViewProps {
  route: any;
  assignments: any[];
  onEditRoute: (route: any) => void;
}

export function RouteDetailsView({ route, assignments, onEditRoute }: RouteDetailsViewProps) {
  const router = useRouter();
  const { slug } = useParams();
  const queryClient = useQueryClient();

  const [newStopName, setNewStopName] = useState("");
  const [newStopFee, setNewStopFee] = useState("");
  const [showStudentsList, setShowStudentsList] = useState(false);

  const routeStops = (() => {
    try {
      return typeof route.stops === "string" ? JSON.parse(route.stops) : (route.stops || []);
    } catch (e) {
      return [];
    }
  })();

  const routeStudents = assignments.filter((a: any) => a.routeId === route.id);

  // Mutation to update route (for stops management)
  const updateRouteMutation = useMutation({
    mutationFn: async (updatedStops: any[]) => {
      const res = await apiFetch("/api/transport-routes", {
        method: "PUT",
        body: JSON.stringify({
          id: route.id,
          stops: updatedStops,
        }),
      });
      if (!res.ok) throw new Error("Failed to update route stops");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-routes"] });
      toast.success("Route stops updated successfully");
    },
    onError: () => {
      toast.error("Failed to update route stops");
    },
  });

  const handleAddStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStopName.trim() || !newStopFee.trim()) {
      toast.error("Please enter a stop name and fee");
      return;
    }

    const updatedStops = [...routeStops, { name: newStopName.trim(), fee: Number(newStopFee) }];
    updateRouteMutation.mutate(updatedStops);
    setNewStopName("");
    setNewStopFee("");
  };

  const handleRemoveStop = (index: number) => {
    const updatedStops = routeStops.filter((_: any, i: number) => i !== index);
    updateRouteMutation.mutate(updatedStops);
  };

  return (
    <div className="space-y-6">
      {/* Header and Back navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(`/${slug}/transport-fee`)}
          className="size-9 rounded-full border-zinc-200 dark:border-zinc-800"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{route.name}</h1>
          <p className="text-sm text-muted-foreground">Route Details & Pricing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Route and Stops Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden border-emerald-100 dark:border-emerald-900/40">
            <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/10 pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bus className="size-4 text-emerald-600 dark:text-emerald-400" />
                Route Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Vehicle Assigned</Label>
                <p className="text-sm font-semibold mt-0.5">
                  {route.vehicle ? `${route.vehicle.number} (${formatVehicleType(route.vehicle.type)})` : "No Vehicle Assigned"}
                </p>
                {route.vehicle && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Capacity: {route.vehicle.capacity} seats • Driver: {route.vehicle.driverName || "N/A"}
                  </p>
                )}
              </div>
              <hr className="border-zinc-100 dark:border-zinc-800" />
              <div>
                <Label className="text-xs text-muted-foreground">Pickup Points Fee Range</Label>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {routeStops.length === 0 ? "No pickup points" : (() => {
                    const fees = routeStops.map((s: any) => Number(s.fee || 0));
                    const min = Math.min(...fees);
                    const max = Math.max(...fees);
                    if (min === max) return `₹${min.toLocaleString()}`;
                    return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
                  })()}
                </p>
              </div>
              <Button size="sm" className="w-full mt-2" variant="outline" onClick={() => onEditRoute(route)}>
                Edit Basic Details
              </Button>
            </CardContent>
          </Card>

          {/* Stops & Pickup Points Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="size-4 text-blue-600 dark:text-blue-400" />
                Pickup Points & Fees
              </CardTitle>
              <CardDescription>Configure distinct fees for each pickup stop.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Stop Form */}
              <form onSubmit={handleAddStop} className="space-y-3 p-3 rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/20">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Pickup Point *</Label>
                    <Input
                      placeholder="e.g. Crossroad A"
                      value={newStopName}
                      onChange={(e) => setNewStopName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Fee (₹) *</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 1200"
                      value={newStopFee}
                      onChange={(e) => setNewStopFee(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <Button type="submit" size="sm" className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700" disabled={updateRouteMutation.isPending}>
                  <Plus className="size-3.5 mr-1" /> Add Pickup Point
                </Button>
              </form>

              {/* Stops List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {routeStops.length === 0 ? (
                  <p className="text-center py-6 text-xs text-muted-foreground">No custom pickup points defined</p>
                ) : (
                  routeStops.map((stop: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">{stop.name}</p>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">₹{Number(stop.fee || 0).toLocaleString()} / month</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveStop(index)}
                        className="size-7 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                        title="Remove Stop"
                        disabled={updateRouteMutation.isPending}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Assigned Students */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="size-4 text-indigo-600 dark:text-indigo-400" />
                  Assigned Students
                </CardTitle>
                <CardDescription>Students currently assigned to this route</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400">
                  {routeStudents.length} Assigned
                </Badge>
                <Button variant="outline" size="sm" className="h-8 text-xs cursor-pointer" onClick={() => setShowStudentsList(!showStudentsList)}>
                  {showStudentsList ? "Hide List" : "Show List"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className={showStudentsList ? "p-0" : "p-6"}>
              {!showStudentsList ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center gap-3 bg-zinc-50/30 dark:bg-zinc-900/10 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
                  <Users className="size-8 text-zinc-300 dark:text-zinc-700" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">List is Collapsed</p>
                    <p className="text-xs text-muted-foreground">Click the "Show List" button above to view {routeStudents.length} assigned students.</p>
                  </div>
                </div>
              ) : routeStudents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground space-y-2">
                  <Users className="size-8 mx-auto text-zinc-300" />
                  <p className="text-sm">No students assigned to this route yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6 h-10">Student</TableHead>
                        <TableHead className="h-10">Class & Roll</TableHead>
                        <TableHead className="h-10">Pickup Point</TableHead>
                        <TableHead className="h-10 pr-6">Start Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {routeStudents.map((assign: any) => (
                        <TableRow key={assign.id}>
                          <TableCell className="pl-6 py-3 font-semibold text-sm">
                            {assign.student?.user?.name || "N/A"}
                          </TableCell>
                          <TableCell className="py-3 text-xs">
                            {assign.student?.class ? `${assign.student.class.name}-${assign.student.class.section}` : "N/A"}
                            <span className="block text-[10px] text-muted-foreground mt-0.5">
                              Roll: {assign.student?.rollNumber || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 text-xs">
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3 text-zinc-400 shrink-0" />
                              {assign.pickupPoint || "Default Route Stop"}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground pr-6">
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3 shrink-0" />
                              {assign.startDate}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
