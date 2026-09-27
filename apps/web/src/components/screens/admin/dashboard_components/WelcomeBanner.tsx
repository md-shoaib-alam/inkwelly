"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Users, Activity, Calendar } from "lucide-react";
import Image from "next/image";

interface WelcomeBannerProps {
  userName: string;
  tenantName: string;
  tenantLogo: string;
  isLoading: boolean;
  summaryData?: {
    totalStudents: number;
    totalTeachers: number;
    attendanceRate: number;
    upcomingEvents: number;
  };
}

export function WelcomeBanner({
  userName,
  tenantName,
  tenantLogo,
  isLoading,
  summaryData
}: WelcomeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 p-6 text-white shadow-lg">
      <div className="absolute top-0 right-0 size-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-1/3 size-48 bg-white/5 rounded-full translate-y-1/2" />
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-3">
          <div className="size-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm overflow-hidden relative">
            <Image
              src={tenantLogo || "/test.webp"}
              alt={tenantName || "School Logo"}
              fill
              priority
              fetchPriority="high"
              className="object-cover"
              sizes="56px"
            />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight" suppressHydrationWarning>
              {tenantName || "the school"}
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {isLoading && !summaryData ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={`welcome-skel-${i}`} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                  <Skeleton className="h-3 w-20 bg-white/20" />
                  <Skeleton className="h-7 w-12 bg-white/20 mt-1" />
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <p className="text-teal-100 text-xs font-medium">Total Students</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <GraduationCap className="size-5 text-teal-200" />
                  {summaryData?.totalStudents ?? 0}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <p className="text-teal-100 text-xs font-medium">Total Teachers</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <Users className="size-5 text-teal-200" />
                  {summaryData?.totalTeachers ?? 0}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <p className="text-teal-100 text-xs font-medium">Attendance Rate</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <Activity className="size-5 text-teal-200" />
                  {Number(summaryData?.attendanceRate ?? 0).toFixed(2).replace(/\.00$/, "")}%
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <p className="text-teal-100 text-xs font-medium">Upcoming Events</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <Calendar className="size-5 text-teal-200" />
                  {summaryData?.upcomingEvents ?? 0}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
