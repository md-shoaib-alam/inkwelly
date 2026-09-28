"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Map, Truck, Bus, Pencil, Eye } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatVehicleType } from "./TransportDialogs";

 interface RoutesAndVehiclesViewProps {
   loadingRoutes: boolean;
   routes: any[];
   onAddRoute: () => void;
   vehicles: any[];
   onAddVehicle: () => void;
   onEditRoute: (route: any) => void;
   onEditVehicle: (vehicle: any) => void;
   onViewStudents?: (routeId: string) => void;
 }
 
 export function RoutesAndVehiclesView({
   loadingRoutes,
   routes,
   onAddRoute,
   vehicles,
   onAddVehicle,
   onEditRoute,
   onEditVehicle,
   onViewStudents,
 }: RoutesAndVehiclesViewProps) {
   const router = useRouter();
   const { slug } = useParams();

   const getRouteFeeDisplay = (r: any) => {
     const stops = (() => {
       try {
         return typeof r.stops === 'string' ? JSON.parse(r.stops) : (r.stops || []);
       } catch (e) {
         return [];
       }
     })();
     if (stops.length === 0) return "No stops defined";
     const fees = stops.map((s: any) => Number(s.fee || 0));
     const min = Math.min(...fees);
     const max = Math.max(...fees);
     if (min === max) return `₹${min.toLocaleString()}`;
     return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
   };

   return (
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <Card className="lg:col-span-2">
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <div>
             <CardTitle className="text-base flex items-center gap-2">
               <Map className="size-4 text-emerald-600 dark:text-emerald-400" />
               Transport Routes
             </CardTitle>
             <CardDescription>All active school bus routes and fees</CardDescription>
           </div>
           <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600" onClick={onAddRoute}>
             Add Route
           </Button>
         </CardHeader>
         <CardContent className="p-0">
           {loadingRoutes ? (
             <div className="p-6 space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
           ) : (
             <div className="overflow-x-auto">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead className="pl-6 h-12">Route Name</TableHead>
                     <TableHead className="h-12">Vehicle</TableHead>
                     <TableHead className="h-12">Students</TableHead>
                     <TableHead className="h-12 w-20 text-center">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {routes.length === 0 ? (
                     <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No routes defined</TableCell></TableRow>
                   ) : routes.map((r: any) => (
                     <TableRow key={r.id}>
                       <TableCell className="pl-6 py-4 font-semibold text-sm">
                          <Link
                            href={`/${slug}/transport-fee/${encodeURIComponent(r.name)}`}
                            className="hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 text-left transition-colors cursor-pointer block w-full"
                          >
                            {r.name}
                          </Link>
                       </TableCell>
                       <TableCell className="py-4 text-xs">{r.vehicle?.number || 'Not Assigned'}</TableCell>
                       <TableCell className="py-4">
                         <button 
                           onClick={() => onViewStudents?.(r.id)}
                           className="focus:outline-none block"
                           title="Click to view assigned students"
                         >
                           <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 cursor-pointer dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors">
                             {r.students?.length || 0} Students
                           </Badge>
                         </button>
                       </TableCell>
                        <TableCell className="py-4 flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                            onClick={() => router.push(`/${slug}/transport-fee/${encodeURIComponent(r.name)}`)}
                            title="View Route Details"
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8 text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50" onClick={() => onEditRoute(r)} title="Edit Route">
                            <Pencil className="size-4" />
                          </Button>
                        </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>
           )}
         </CardContent>
       </Card>
 
       <Card>
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <div>
             <CardTitle className="text-base flex items-center gap-2">
               <Truck className="size-4 text-blue-600 dark:text-blue-400" />
               Vehicles
             </CardTitle>
             <CardDescription>Fleet status</CardDescription>
           </div>
           <Button size="sm" variant="outline" className="h-8" onClick={onAddVehicle}>Add</Button>
         </CardHeader>
         <CardContent className="space-y-4">
           {vehicles.length === 0 ? (
             <p className="text-center py-8 text-xs text-muted-foreground">No vehicles registered</p>
           ) : vehicles.map((v: any) => (
             <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
               <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                 <Bus className="size-5" />
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-semibold">{v.number}</p>
                 <p className="text-[10px] text-muted-foreground">{formatVehicleType(v.type)} • Cap: {v.capacity}</p>
               </div>
               <div className="flex items-center gap-2">
                 <Badge className={v.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}>{v.status}</Badge>
                 <Button variant="ghost" size="icon" className="size-8 text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50" onClick={() => onEditVehicle(v)} title="Edit Vehicle">
                   <Pencil className="size-3.5" />
                 </Button>
               </div>
             </div>
           ))}
         </CardContent>
       </Card>
     </div>
   );
 }
