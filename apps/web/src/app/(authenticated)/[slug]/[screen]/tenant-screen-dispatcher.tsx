"use client";

import { useEffect, useSyncExternalStore } from 'react';
import { useParams, redirect } from 'next/navigation';
import { useAppStore } from '@/store/use-app-store';
import { hasPermission } from '@/lib/permissions';
import { navItems } from '@/components/layout/nav-config';
import { isAdminModuleScreen } from '@/components/layout/sidebar/module-nav-config';
import { componentKey, parseRoute } from '@/lib/routing/module-routes';
import dynamic from 'next/dynamic';
import { FullPageSkeleton } from "@/components/ui/full-page-skeleton";
import { AdminDashboardSkeleton } from "@/modules/dashboard/components/adminDashboard/DashboardSkeleton";

const LoadingScreen = () => <FullPageSkeleton />;
const DashboardLoadingScreen = () => <AdminDashboardSkeleton />;

const ParentHomework = dynamic(() => import('@/modules/assessment/components/ParentHomework').then(m => m.ParentHomework), { loading: LoadingScreen });
const TeacherDashboard = dynamic(() => import('@/modules/dashboard/components/teacherDashboard/index').then(m => m.TeacherDashboard), { loading: LoadingScreen });
const StudentDashboard = dynamic(() => import('@/modules/dashboard/components/StudentDashboard').then(m => m.StudentDashboard), { loading: LoadingScreen });
const ParentDashboard = dynamic(() => import('@/modules/dashboard/components/ParentDashboard').then(m => m.ParentDashboard), { loading: LoadingScreen });
const StaffDashboard = dynamic(() => import('@/modules/dashboard/components/staffDashboard/index').then(m => m.StaffDashboard), { loading: LoadingScreen });
const AdminDashboard = dynamic(() => import('@/modules/dashboard/components/adminDashboard/index').then(m => m.AdminDashboard), { loading: DashboardLoadingScreen });
const SuperAdminDashboard = dynamic(() => import('@/modules/dashboard/components/SuperAdminDashboard').then(m => m.SuperAdminDashboard), { loading: LoadingScreen });
const AdminStudents = dynamic(() => import('@/modules/students/students').then(m => m.AdminStudents), { loading: LoadingScreen });
const AdminTeachers = dynamic(() => import('@/modules/employees/teachers').then(m => m.AdminTeachers), { loading: LoadingScreen });
const AdminParents = dynamic(() => import('@/modules/employees/parents').then(m => m.AdminParents), { loading: LoadingScreen });
const AdminClasses = dynamic(() => import('@/modules/academics/components/AdminClasses').then(m => m.AdminClasses), { loading: LoadingScreen });
const AdminSubjects = dynamic(() => import('@/modules/academics/components/AdminSubjects').then(m => m.AdminSubjects), { loading: LoadingScreen });
const AdminAttendance = dynamic(() => import('@/modules/student-attendance/attendance').then(m => m.AdminAttendance), { loading: LoadingScreen });
const AdminFees = dynamic(() => import('@/modules/finance/components/AdminFees').then(m => m.AdminFees), { loading: LoadingScreen });
const AdminNotices = dynamic(() => import('@/modules/communication/components/AdminNotices').then(m => m.AdminNotices), { loading: LoadingScreen });
const AdminTimetable = dynamic(() => import('@/modules/timetable/components/AdminTimetable').then(m => m.AdminTimetable), { loading: LoadingScreen });
const AdminCalendar = dynamic(() => import('@/modules/timetable/components/AdminCalendar').then(m => m.AdminCalendar), { loading: LoadingScreen });
const AdminReports = dynamic(() => import('@/modules/data-io/components/AdminReports').then(m => m.AdminReports), { loading: LoadingScreen });
const AdminRoles = dynamic(() => import('@/modules/iam/roles').then(m => m.AdminRoles), { loading: LoadingScreen });
const AdminIamDashboard = dynamic(() => import('@/modules/iam/iam-dashboard').then(m => m.AdminIamDashboard), { loading: LoadingScreen });
const AdminPermissionsCatalog = dynamic(() => import('@/modules/iam/permissions-catalog').then(m => m.AdminPermissionsCatalog), { loading: LoadingScreen });
const AdminRoleAssignments = dynamic(() => import('@/modules/iam/role-assignments').then(m => m.AdminRoleAssignments), { loading: LoadingScreen });
const AdminStaff = dynamic(() => import('@/modules/employees/staff').then(m => m.AdminStaff), { loading: LoadingScreen });
const AdminTickets = dynamic(() => import('@/modules/support/components/AdminTickets').then(m => m.AdminTickets), { loading: LoadingScreen });
const AdminSchoolSettings = dynamic(() => import('@/modules/tenancy/components/AdminSchoolSettings').then(m => m.AdminSchoolSettings), { loading: LoadingScreen });
const AdminPromotions = dynamic(() => import('@/modules/students/promotions').then(m => m.AdminPromotions), { loading: LoadingScreen });
const StudentsBulkPromote = dynamic(() => import('@/modules/students/bulk-promote').then(m => m.StudentsBulkPromote), { loading: LoadingScreen });
const StudentsGraduated = dynamic(() => import('@/modules/students/graduated').then(m => m.StudentsGraduated), { loading: LoadingScreen });
const AdminCertificates = dynamic(() => import('@/modules/students/certificates').then(m => m.AdminCertificates), { loading: LoadingScreen });
const AdminLeaves = dynamic(() => import('@/modules/leaves/student-leaves').then(m => m.AdminLeaves), { loading: LoadingScreen });
const StaffAttendance = dynamic(() => import('@/modules/employee-attendance/teacher-attendance').then(m => m.StaffAttendance), { loading: LoadingScreen });
const EmployeeStaffAttendance = dynamic(() => import('@/modules/employee-attendance/staff-attendance').then(m => m.EmployeeStaffAttendance), { loading: LoadingScreen });
const LeavesTeacherLeaves = dynamic(() => import('@/modules/leaves/teacher-leaves').then(m => m.LeavesTeacherLeaves), { loading: LoadingScreen });
const LeavesStaffLeaves = dynamic(() => import('@/modules/leaves/staff-leaves').then(m => m.LeavesStaffLeaves), { loading: LoadingScreen });
const AdminExams = dynamic(() => import('@/modules/assessment/components/AdminExams').then(m => m.AdminExams), { loading: LoadingScreen });
const AdminPrintMarksheet = dynamic(() => import('@/modules/assessment/components/AdminPrintMarksheet').then(m => m.AdminPrintMarksheet), { loading: LoadingScreen });
const AdminAdmitCards = dynamic(() => import('@/modules/certificates/components/AdminAdmitCards').then(m => m.AdminAdmitCards), { loading: LoadingScreen });
const AcademicYearsScreen = dynamic(() => import('@/modules/academics/components/AdminAcademicYears').then(m => m.AcademicYearsScreen), { loading: LoadingScreen });
const ExpensesScreen = dynamic(() => import('@/modules/finance/components/AdminExpenses').then(m => m.ExpensesScreen), { loading: LoadingScreen });
const AdminSubscription = dynamic(() => import('@/modules/tenancy/components/AdminSubscription').then(m => m.SchoolSubscriptionScreen), { loading: LoadingScreen });
const ManagePlanScreen = dynamic(() => import('@/modules/tenancy/components/AdminManagePlan').then(m => m.ManagePlanScreen), { loading: LoadingScreen });

const TeacherClasses = dynamic(() => import('@/modules/academics/components/TeacherMyClasses').then(m => m.TeacherClasses), { loading: LoadingScreen });
const TeacherSubjects = dynamic(() => import('@/modules/academics/components/TeacherMySubjects').then(m => m.TeacherSubjects), { loading: LoadingScreen });
const TeacherAttendance = dynamic(() => import('@/modules/attendance/components/TeacherTakeAttendance').then(m => m.TeacherAttendance), { loading: LoadingScreen });
const TeacherMyAttendance = dynamic(() => import('@/modules/attendance/components/TeacherMyAttendance').then(m => m.TeacherMyAttendance), { loading: LoadingScreen });
const TeacherGrades = dynamic(() => import('@/modules/assessment/components/TeacherGradeManagement').then(m => m.TeacherGrades), { loading: LoadingScreen });
const TeacherExamsEntry = dynamic(() => import('@/modules/assessment/components/TeacherExamsEntry').then(m => m.TeacherExamsEntry), { loading: LoadingScreen });
const TeacherAssignments = dynamic(() => import('@/modules/assessment/components/teacherHomework/index').then(m => m.TeacherAssignments), { loading: LoadingScreen });
const TeacherTimetable = dynamic(() => import('@/modules/timetable/components/TeacherTimetable').then(m => m.TeacherTimetable), { loading: LoadingScreen });
const TeacherCalendar = dynamic(() => import('@/modules/timetable/components/TeacherCalendar').then(m => m.TeacherCalendar), { loading: LoadingScreen });
const TeacherNotices = dynamic(() => import('@/modules/communication/components/TeacherNotices').then(m => m.TeacherNotices), { loading: LoadingScreen });
const TeacherLeaves = dynamic(() => import('@/modules/attendance/components/TeacherLeaves').then(m => m.TeacherLeaves), { loading: LoadingScreen });
const TeacherTickets = dynamic(() => import('@/modules/support/components/TeacherTickets').then(m => m.TeacherTickets), { loading: LoadingScreen });

const StudentClasses = dynamic(() => import('@/modules/academics/components/StudentMyClasses').then(m => m.StudentClasses), { loading: LoadingScreen });
const StudentGrades = dynamic(() => import('@/modules/assessment/components/StudentMyGrades').then(m => m.StudentGrades), { loading: LoadingScreen });
const StudentAttendance = dynamic(() => import('@/modules/attendance/components/StudentMyAttendance').then(m => m.StudentAttendance), { loading: LoadingScreen });
const StudentAssignments = dynamic(() => import('@/modules/assessment/components/StudentHomework').then(m => m.StudentHomework), { loading: LoadingScreen });
const StudentTimetable = dynamic(() => import('@/modules/timetable/components/StudentTimetable').then(m => m.StudentTimetable), { loading: LoadingScreen });
const StudentCalendar = dynamic(() => import('@/modules/timetable/components/StudentCalendar').then(m => m.StudentCalendar), { loading: LoadingScreen });
const StudentNotices = dynamic(() => import('@/modules/communication/components/StudentNotices').then(m => m.StudentNotices), { loading: LoadingScreen });
const StudentFees = dynamic(() => import('@/modules/finance/components/StudentFees').then(m => m.StudentFees), { loading: LoadingScreen });
const StudentTickets = dynamic(() => import('@/modules/support/components/StudentTickets').then(m => m.StudentTickets), { loading: LoadingScreen });
const StudentLeaves = dynamic(() => import('@/modules/attendance/components/StudentLeaves').then(m => m.StudentLeaves), { loading: LoadingScreen });
const StudentMarksheet = dynamic(() => import('@/modules/assessment/components/StudentMarksheet').then(m => m.StudentMarksheet), { loading: LoadingScreen });

const ParentChildren = dynamic(() => import('@/modules/people/components/ParentChildren').then(m => m.ParentChildren), { loading: LoadingScreen });
const ParentGrades = dynamic(() => import('@/modules/assessment/components/ParentGrades').then(m => m.ParentGrades), { loading: LoadingScreen });
const ParentAttendance = dynamic(() => import('@/modules/attendance/components/ParentAttendance').then(m => m.ParentAttendance), { loading: LoadingScreen });
const ParentFees = dynamic(() => import('@/modules/finance/components/ParentFees').then(m => m.ParentFees), { loading: LoadingScreen });
const ParentNotices = dynamic(() => import('@/modules/communication/components/ParentNotices').then(m => m.ParentNotices), { loading: LoadingScreen });
const ParentSubscription = dynamic(() => import('@/modules/tenancy/components/ParentSubscription').then(m => m.ParentSubscription), { loading: LoadingScreen });
const ParentCalendar = dynamic(() => import('@/modules/timetable/components/ParentCalendar').then(m => m.ParentCalendar), { loading: LoadingScreen });
const ParentTimetable = dynamic(() => import('@/modules/timetable/components/ParentTimetable').then(m => m.ParentTimetable), { loading: LoadingScreen });
const ParentTickets = dynamic(() => import('@/modules/support/components/ParentTickets').then(m => m.ParentTickets), { loading: LoadingScreen });

const NotFoundScreen = dynamic(() => import('@/components/shared/error/not-found').then(m => m.NotFoundScreen));

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
const STAFF_FORBIDDEN_SCREENS = new Set([
  'roles',
  'role-assignments',
  'iam-dashboard',
  'permissions-catalog',
  'school-settings',
]);

export default function TenantScreenDispatcherClient() {
  const { slug, screen, detail } = useParams();
  const mounted = useHydrated();
  const { currentUser } = useAppStore();

  // This route always puts the tenant in the first segment, so parts[0] is the
  // root by construction and can never be a module name.
  // A module-scoped admin URL arrives as screen=module, detail=screen.
  const route = parseRoute(`/${slug}/${screen}${detail ? `/${detail}` : ''}`, {
    isModuleScreen: isAdminModuleScreen,
    isTenantRoot: (first) => first === slug,
  });
  const screenKey = componentKey(route.module, route.screen);

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
    if (screen === 'dashboard') {
      return <DashboardLoadingScreen />;
    }
    return <LoadingScreen />;
  }

  const urlSlug = slug.toLowerCase();
  const userTenantId = currentUser?.tenantId?.toLowerCase() || '';
  const userTenantSlug = currentUser?.tenantSlug?.toLowerCase() || '';
  const isTenantMatch = (urlSlug === userTenantId || urlSlug === userTenantSlug);

  if (currentUser.role !== 'super_admin' && !isTenantMatch) {
    if (screen === 'dashboard') {
      return <DashboardLoadingScreen />;
    }
    return <LoadingScreen />;
  }
  
  if (currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'staff') {
    // Permission guard for staff users
    if (currentUser.role === 'staff') {
      const denied =
        STAFF_FORBIDDEN_SCREENS.has(screenKey) ||
        (STAFF_SCREEN_MODULES[screenKey] !== undefined &&
          !hasPermission(currentUser, STAFF_SCREEN_MODULES[screenKey], 'view'));

      if (denied) {
        const tid = currentUser.tenantSlug || currentUser.tenantId || slug;
        redirect(`/${tid}/dashboard`);
      }
    }

    switch (screenKey) {
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
      case 'iam-dashboard':
      case 'security-pin':
      case 'seed-defaults': return <AdminIamDashboard />;
      case 'permissions-catalog': return <AdminPermissionsCatalog />;
      case 'role-assignments': return <AdminRoleAssignments />;
      case 'staff': return <AdminStaff />;
      case 'school-settings': return <AdminSchoolSettings />;
      case 'academic-years': return <AcademicYearsScreen />;
      case 'expenses': return <ExpensesScreen />;
      case 'tickets': return <AdminTickets />;
      case 'school-subscription': return <AdminSubscription />;
      case 'manage-plan': return <ManagePlanScreen />;
      case 'promotions': return <AdminPromotions key="individual-prom" initialTab="individual" />;
      case 'bulk-promote': return <StudentsBulkPromote key="bulk-prom" />;
      case 'graduated': return <StudentsGraduated key="graduated-prom" />;
      case 'certificates': return <AdminCertificates />;
      case 'leaves': return <LeavesTeacherLeaves key="teacher-leaves-main" />;
      case 'student-leaves': return <AdminLeaves key="student-leaves" initialTab="student" />;
      case 'teacher-leaves': return <LeavesTeacherLeaves key="teacher-leaves" />;
      case 'staff-leaves': return <LeavesStaffLeaves key="staff-leaves" />;
      case 'grades': return <TeacherGrades />;
      case 'teacher-attendance': return <StaffAttendance key="teacher-att" initialTab="teacher" />;
      case 'staff-attendance': return <EmployeeStaffAttendance key="staff-att" />;
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
