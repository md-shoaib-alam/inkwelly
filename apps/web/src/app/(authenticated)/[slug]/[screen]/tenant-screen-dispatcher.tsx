"use client";

import { useEffect, useSyncExternalStore } from 'react';
import { useParams, redirect } from 'next/navigation';
import { useAppStore } from '@/store/use-app-store';
import { hasPermission } from '@/lib/permissions';
import { navItems } from '@/components/layout/nav-config';
import dynamic from 'next/dynamic';
import { FullPageSkeleton } from "@/components/ui/full-page-skeleton";

const LoadingScreen = () => <FullPageSkeleton />;

const ParentHomework = dynamic(() => import('@/components/screens/parent/homework').then(m => m.ParentHomework), { loading: LoadingScreen });
const UserProfileScreen = dynamic(() => import('@/components/screens/profile').then(m => m.UserProfileScreen), { loading: LoadingScreen });
const TeacherDashboard = dynamic(() => import('@/components/screens/teacher/dashboard').then(m => m.TeacherDashboard));
const StudentDashboard = dynamic(() => import('@/components/screens/student/dashboard').then(m => m.StudentDashboard));
const ParentDashboard = dynamic(() => import('@/components/screens/parent/dashboard').then(m => m.ParentDashboard));
const StaffDashboard = dynamic(() => import('@/components/screens/staff/dashboard').then(m => m.StaffDashboard));
const AdminDashboard = dynamic(() => import('@/components/screens/admin/dashboard').then(m => m.AdminDashboard));
const SuperAdminDashboard = dynamic(() => import('@/components/screens/super-admin/dashboard').then(m => m.SuperAdminDashboard));
const AdminStudents = dynamic(() => import('@/components/screens/admin/students').then(m => m.AdminStudents), { loading: LoadingScreen });
const AdminTeachers = dynamic(() => import('@/components/screens/admin/teachers').then(m => m.AdminTeachers), { loading: LoadingScreen });
const AdminParents = dynamic(() => import('@/components/screens/admin/parents').then(m => m.AdminParents), { loading: LoadingScreen });
const AdminClasses = dynamic(() => import('@/components/screens/admin/classes').then(m => m.AdminClasses), { loading: LoadingScreen });
const AdminSubjects = dynamic(() => import('@/components/screens/admin/subjects').then(m => m.AdminSubjects), { loading: LoadingScreen });
const AdminAttendance = dynamic(() => import('@/components/screens/admin/attendance').then(m => m.AdminAttendance), { loading: LoadingScreen });
const AdminFees = dynamic(() => import('@/components/screens/admin/fees').then(m => m.AdminFees), { loading: LoadingScreen });
const AdminNotices = dynamic(() => import('@/components/screens/admin/notices').then(m => m.AdminNotices), { loading: LoadingScreen });
const AdminTimetable = dynamic(() => import('@/components/screens/admin/timetable').then(m => m.AdminTimetable), { loading: LoadingScreen });
const AdminCalendar = dynamic(() => import('@/components/screens/admin/calendar').then(m => m.AdminCalendar), { loading: LoadingScreen });
const AdminReports = dynamic(() => import('@/components/screens/admin/reports').then(m => m.AdminReports), { loading: LoadingScreen });
const AdminRoles = dynamic(() => import('@/components/screens/admin/roles').then(m => m.AdminRoles), { loading: LoadingScreen });
const AdminStaff = dynamic(() => import('@/components/screens/admin/staff').then(m => m.AdminStaff), { loading: LoadingScreen });
const AdminTickets = dynamic(() => import('@/components/screens/admin/tickets').then(m => m.AdminTickets), { loading: LoadingScreen });
const AdminSchoolSettings = dynamic(() => import('@/components/screens/admin/school-settings').then(m => m.AdminSchoolSettings), { loading: LoadingScreen });
const AdminPromotions = dynamic(() => import('@/components/screens/admin/promotions').then(m => m.AdminPromotions), { loading: LoadingScreen });
const AdminCertificates = dynamic(() => import('@/components/screens/admin/certificates').then(m => m.AdminCertificates), { loading: LoadingScreen });
const AdminLeaves = dynamic(() => import('@/components/screens/admin/leaves').then(m => m.AdminLeaves), { loading: LoadingScreen });
const StaffAttendance = dynamic(() => import('@/components/screens/admin/staff-attendance').then(m => m.StaffAttendance), { loading: LoadingScreen });
const AdminExams = dynamic(() => import('@/components/screens/admin/exams').then(m => m.AdminExams), { loading: LoadingScreen });
const AdminPrintMarksheet = dynamic(() => import('@/components/screens/admin/print-marksheet').then(m => m.AdminPrintMarksheet), { loading: LoadingScreen });
const AdminAdmitCards = dynamic(() => import('@/components/screens/admin/admit-cards').then(m => m.AdminAdmitCards), { loading: LoadingScreen });
const AcademicYearsScreen = dynamic(() => import('@/components/screens/admin/academic-years').then(m => m.AcademicYearsScreen), { loading: LoadingScreen });
const ExpensesScreen = dynamic(() => import('@/components/screens/admin/expenses').then(m => m.ExpensesScreen), { loading: LoadingScreen });
const AdminSubscription = dynamic(() => import('@/components/screens/admin/subscription').then(m => m.SchoolSubscriptionScreen), { loading: LoadingScreen });
const ManagePlanScreen = dynamic(() => import('@/components/screens/admin/manage-plan').then(m => m.ManagePlanScreen), { loading: LoadingScreen });

const TeacherClasses = dynamic(() => import('@/components/screens/teacher/my-classes').then(m => m.TeacherClasses), { loading: LoadingScreen });
const TeacherSubjects = dynamic(() => import('@/components/screens/teacher/my-subjects').then(m => m.TeacherSubjects), { loading: LoadingScreen });
const TeacherAttendance = dynamic(() => import('@/components/screens/teacher/take-attendance').then(m => m.TeacherAttendance), { loading: LoadingScreen });
const TeacherMyAttendance = dynamic(() => import('@/components/screens/teacher/my-attendance').then(m => m.TeacherMyAttendance), { loading: LoadingScreen });
const TeacherGrades = dynamic(() => import('@/components/screens/teacher/grade-management').then(m => m.TeacherGrades), { loading: LoadingScreen });
const TeacherExamsEntry = dynamic(() => import('@/components/screens/teacher/exams-entry').then(m => m.TeacherExamsEntry), { loading: LoadingScreen });
const TeacherAssignments = dynamic(() => import('@/components/screens/teacher/homework').then(m => m.TeacherAssignments), { loading: LoadingScreen });
const TeacherTimetable = dynamic(() => import('@/components/screens/teacher/timetable').then(m => m.TeacherTimetable), { loading: LoadingScreen });
const TeacherCalendar = dynamic(() => import('@/components/screens/teacher/calendar').then(m => m.TeacherCalendar), { loading: LoadingScreen });
const TeacherNotices = dynamic(() => import('@/components/screens/teacher/notices').then(m => m.TeacherNotices), { loading: LoadingScreen });
const TeacherLeaves = dynamic(() => import('@/components/screens/teacher/leaves').then(m => m.TeacherLeaves), { loading: LoadingScreen });
const TeacherTickets = dynamic(() => import('@/components/screens/teacher/tickets').then(m => m.TeacherTickets), { loading: LoadingScreen });

const StudentClasses = dynamic(() => import('@/components/screens/student/my-classes').then(m => m.StudentClasses), { loading: LoadingScreen });
const StudentGrades = dynamic(() => import('@/components/screens/student/my-grades').then(m => m.StudentGrades), { loading: LoadingScreen });
const StudentAttendance = dynamic(() => import('@/components/screens/student/my-attendance').then(m => m.StudentAttendance), { loading: LoadingScreen });
const StudentAssignments = dynamic(() => import('@/components/screens/student/homework').then(m => m.StudentHomework), { loading: LoadingScreen });
const StudentTimetable = dynamic(() => import('@/components/screens/student/timetable').then(m => m.StudentTimetable), { loading: LoadingScreen });
const StudentCalendar = dynamic(() => import('@/components/screens/student/calendar').then(m => m.StudentCalendar), { loading: LoadingScreen });
const StudentNotices = dynamic(() => import('@/components/screens/student/notices').then(m => m.StudentNotices), { loading: LoadingScreen });
const StudentFees = dynamic(() => import('@/components/screens/student/fees').then(m => m.StudentFees), { loading: LoadingScreen });
const StudentTickets = dynamic(() => import('@/components/screens/student/tickets').then(m => m.StudentTickets), { loading: LoadingScreen });
const StudentLeaves = dynamic(() => import('@/components/screens/student/leaves').then(m => m.StudentLeaves), { loading: LoadingScreen });
const StudentMarksheet = dynamic(() => import('@/components/screens/student/marksheet').then(m => m.StudentMarksheet), { loading: LoadingScreen });

const ParentChildren = dynamic(() => import('@/components/screens/parent/children').then(m => m.ParentChildren), { loading: LoadingScreen });
const ParentGrades = dynamic(() => import('@/components/screens/parent/grades').then(m => m.ParentGrades), { loading: LoadingScreen });
const ParentAttendance = dynamic(() => import('@/components/screens/parent/attendance').then(m => m.ParentAttendance), { loading: LoadingScreen });
const ParentFees = dynamic(() => import('@/components/screens/parent/fees').then(m => m.ParentFees), { loading: LoadingScreen });
const ParentNotices = dynamic(() => import('@/components/screens/parent/notices').then(m => m.ParentNotices), { loading: LoadingScreen });
const ParentSubscription = dynamic(() => import('@/components/screens/parent/subscription').then(m => m.ParentSubscription), { loading: LoadingScreen });
const ParentCalendar = dynamic(() => import('@/components/screens/parent/calendar').then(m => m.ParentCalendar), { loading: LoadingScreen });
const ParentTimetable = dynamic(() => import('@/components/screens/parent/timetable').then(m => m.ParentTimetable), { loading: LoadingScreen });
const ParentTickets = dynamic(() => import('@/components/screens/parent/tickets').then(m => m.ParentTickets), { loading: LoadingScreen });

const NotFoundScreen = dynamic(() => import('@/components/screens/error/not-found').then(m => m.NotFoundScreen));

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/**
 * Screens the dispatcher serves to staff that the staff sidebar either omits or
 * names differently from the URL (e.g. the nav group is `leave-management`,
 * while `/leaves` is a real screen). Derived map alone would leave these open.
 */
const STAFF_EXTRA_PERMISSIONS: Record<string, string> = {
  parents: 'parents',
  staff: 'staff',
  leaves: 'leaves',
};

/**
 * Screen -> permission module, derived from the staff sidebar so the two can
 * never drift. A child inherits its group's module unless it names one.
 * `permModule: null` means the screen is intentionally ungated.
 */
const STAFF_SCREEN_MODULES: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const item of navItems.staff) {
    const groupModule = item.permModule ?? undefined;
    if (groupModule) map[item.key] = groupModule;
    for (const child of item.children ?? []) {
      const module = child.permModule ?? groupModule;
      if (module) map[child.key] = module;
    }
  }
  return Object.assign(map, STAFF_EXTRA_PERMISSIONS);
})();

/**
 * Admin-only screens with no grantable module, so no permission could ever
 * open them for staff.
 */
const STAFF_FORBIDDEN_SCREENS = new Set(['roles', 'school-settings']);

export default function TenantScreenDispatcherClient() {
  const { slug, screen } = useParams();
  const mounted = useHydrated();
  const { currentUser } = useAppStore();

  // REDIRECTION LOGIC (DURING RENDER)
  if (mounted && currentUser && typeof slug === 'string' && typeof screen === 'string') {
    const urlSlug = slug.toLowerCase();
    const userTenantId = currentUser?.tenantId?.toLowerCase() || '';
    const userTenantSlug = currentUser?.tenantSlug?.toLowerCase() || '';
    const isTenantMatch = (urlSlug === userTenantId || urlSlug === userTenantSlug);

    if (currentUser.role !== 'super_admin' && !isTenantMatch) {
      const correctSlug = currentUser.tenantSlug || currentUser.tenantId;
      if (correctSlug) {
        redirect(`/${correctSlug}/${screen}`);
      }
    }
  }

  if (!mounted || !currentUser || typeof slug !== 'string' || typeof screen !== 'string') {
    return <LoadingScreen />;
  }

  const urlSlug = slug.toLowerCase();
  const userTenantId = currentUser?.tenantId?.toLowerCase() || '';
  const userTenantSlug = currentUser?.tenantSlug?.toLowerCase() || '';
  const isTenantMatch = (urlSlug === userTenantId || urlSlug === userTenantSlug);

  if (currentUser.role !== 'super_admin' && !isTenantMatch) {
    return <LoadingScreen />;
  }
  
  if (currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'staff') {
    // Permission guard for staff users
    if (currentUser.role === 'staff') {
      const denied =
        STAFF_FORBIDDEN_SCREENS.has(screen) ||
        (STAFF_SCREEN_MODULES[screen] !== undefined &&
          !hasPermission(currentUser, STAFF_SCREEN_MODULES[screen], 'view'));

      if (denied) {
        const tid = currentUser.tenantSlug || currentUser.tenantId || slug;
        redirect(`/${tid}/dashboard`);
      }
    }

    switch (screen) {
      case 'profile': return <UserProfileScreen />;
      case 'dashboard': 
        if (currentUser.role === 'super_admin' && slug === 'tenants') return <SuperAdminDashboard />;
        return currentUser.role === 'staff' ? <StaffDashboard /> : <AdminDashboard />;
      case 'students': return <AdminStudents />;
      case 'teachers': return <AdminTeachers />;
      case 'parents': return <AdminParents />;
      case 'classes': return <AdminClasses />;
      case 'subjects': return <AdminSubjects />;
      case 'attendance': return <AdminAttendance />;
      case 'fees':
      case 'fee-categories':
      case 'fee-concessions':
      case 'make-payment':
      case 'check-receipt':
      case 'fee-status':
      case 'check-payments':
      case 'transport-fee':
        return <AdminFees />;
      case 'notices': return <AdminNotices />;
      case 'timetable': return <AdminTimetable />;
      case 'calendar': return <AdminCalendar />;
      case 'reports': return <AdminReports />;
      case 'roles': return <AdminRoles />;
      case 'staff': return <AdminStaff />;
      case 'school-settings': return <AdminSchoolSettings />;
      case 'academic-years': return <AcademicYearsScreen />;
      case 'expenses': return <ExpensesScreen />;
      case 'tickets': return <AdminTickets />;
      case 'school-subscription': return <AdminSubscription />;
      case 'manage-plan': return <ManagePlanScreen />;
      case 'promotions': return <AdminPromotions key="individual-prom" initialTab="individual" />;
      case 'bulk-promote': return <AdminPromotions key="bulk-prom" initialTab="bulk" />;
      case 'graduated': return <AdminPromotions key="graduated-prom" initialTab="graduated" />;
      case 'certificates': return <AdminCertificates />;
      case 'leaves': return <AdminLeaves key="teacher-leaves-main" initialTab="teacher" />;
      case 'student-leaves': return <AdminLeaves key="student-leaves" initialTab="student" />;
      case 'teacher-leaves': return <AdminLeaves key="teacher-leaves" initialTab="teacher" />;
      case 'staff-leaves': return <AdminLeaves key="staff-leaves" initialTab="staff" />;
      case 'grades': return <TeacherGrades />;
      case 'teacher-attendance': return <StaffAttendance key="teacher-att" initialTab="teacher" />;
      case 'staff-attendance': return <StaffAttendance key="staff-att" initialTab="staff" />;
      case 'my-attendance':
        if (currentUser.role === 'staff') return <TeacherMyAttendance />;
        redirect(`/${currentUser.tenantSlug || currentUser.tenantId || slug}/dashboard`);
      case 'exams': return <AdminExams key="exams" initialTab="exams" />;
      case 'results-entry': return <AdminExams key="results" initialTab="results" />;
      case 'published-results': return <AdminExams key="published" initialTab="published" />;
      case 'print-marksheet': return <AdminPrintMarksheet />;
      case 'admit-cards': return <AdminAdmitCards />;
      default: {
        const tid = currentUser.tenantSlug || currentUser.tenantId || slug;
        if (screen !== 'dashboard') {
          redirect(`/${tid}/dashboard`);
        }
      }
    }
  }

  if (currentUser.role === 'teacher') {
    switch (screen) {
      case 'profile': return <UserProfileScreen />;
      case 'dashboard': return <TeacherDashboard />;
      case 'my-classes': return <TeacherClasses />;
      case 'my-subjects': return <TeacherSubjects />;
      case 'take-attendance': return <TeacherAttendance />;
      case 'attendance':
      case 'my-attendance': return <TeacherMyAttendance />;
      case 'grade-management':
      case 'assessments': return <TeacherGrades />;
      case 'school-exams': return <TeacherExamsEntry />;
      case 'assignments':
      case 'homework': return <TeacherAssignments showCompleted={false} />;
      case 'old-homework': return <TeacherAssignments showCompleted={true} />;
      case 'timetable': return <TeacherTimetable />;
      case 'notices': return <TeacherNotices />;
      case 'calendar': return <TeacherCalendar />;
      case 'leaves': return <TeacherLeaves />;
      case 'tickets': return <TeacherTickets />;
      default: {
        const tid = currentUser.tenantSlug || currentUser.tenantId || slug;
        if (screen !== 'dashboard') {
          redirect(`/${tid}/dashboard`);
        }
      }
    }
  }

  if (currentUser.role === 'student') {
    switch (screen) {
      case 'profile': return <UserProfileScreen />;
      case 'dashboard': return <StudentDashboard />;
      case 'my-classes': return <StudentClasses />;
      case 'my-grades': return <StudentGrades />;
      case 'school-exams': return <StudentGrades key="school-exams" initialTab="exams" />;
      case 'assessments': return <StudentGrades key="assessments" initialTab="assessments" />;
      case 'print-marksheet':
      case 'view-marksheet': return <StudentMarksheet />;
      case 'my-attendance': return <StudentAttendance />;
      case 'assignments':
      case 'homework': return <StudentAssignments />;
      case 'timetable': return <StudentTimetable />;
      case 'notices': return <StudentNotices />;
      case 'fees': return <StudentFees />;
      case 'tickets': return <StudentTickets />;
      case 'calendar': return <StudentCalendar />;
      case 'leaves': return <StudentLeaves />;
      default: {
        const tid = currentUser.tenantSlug || currentUser.tenantId || slug;
        if (screen !== 'dashboard') {
          redirect(`/${tid}/dashboard`);
        }
      }
    }
  }

  if (currentUser.role === 'parent') {
    switch (screen) {
      case 'profile': return <UserProfileScreen />;
      case 'dashboard': return <ParentDashboard />;
      case 'children': return <ParentChildren />;
      case 'homework': return <ParentHomework />;
      case 'grades': return <ParentGrades />;
      case 'school-exams': return <ParentGrades initialTab="exams" key="school-exams" />;
      case 'assessments': return <ParentGrades initialTab="assessments" key="assessments" />;
      case 'attendance': return <ParentAttendance />;
      case 'fees': return <ParentFees />;
      case 'notices': return <ParentNotices />;
      case 'timetable': return <ParentTimetable />;
      case 'subscription': return <ParentSubscription />;
      case 'calendar': return <ParentCalendar />;
      case 'tickets': return <ParentTickets />;
      case 'view-marksheet': return <StudentMarksheet />;
      default: {
        const tid = currentUser.tenantSlug || currentUser.tenantId || slug;
        if (screen !== 'dashboard') {
          redirect(`/${tid}/dashboard`);
        }
      }
    }
  }

  // FAIL-SAFE: If we got here and the user is logged in,
  // they are at an invalid screen. Redirect them to their dashboard.
  if (mounted && currentUser) {
    const fallback = currentUser.tenantSlug || currentUser.tenantId || slug || "";
    redirect(fallback ? `/${fallback}/dashboard` : "/dashboard");
  }

  return <NotFoundScreen />;
}
