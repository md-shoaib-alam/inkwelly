export const responseTypeDefs = `#graphql
  type UsersResponse {
    users: [User!]!
    total: Int!
    page: Int!
    totalPages: Int!
    roleCounts: [RoleCount!]!
  }

  type AuditLogsResponse {
    logs: [AuditLog!]!
    total: Int!
    page: Int!
    totalPages: Int!
    actionTypes: [ActionCount!]!
  }

  type StudentsResponse {
    students: [TenantStudent!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type TeachersResponse {
    teachers: [TenantTeacher!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type ParentsResponse {
    parents: [TenantParent!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type ClassesResponse {
    classes: [TenantClass!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type FeesResponse {
    fees: [TenantFee!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type AttendanceResponse {
    records: [TenantAttendance!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type StaffAttendanceResponse {
    records: [StaffAttendance!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type NoticesResponse {
    notices: [NoticeInfo!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type StaffResponse {
    staff: [StaffMember!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type TenantsResponse {
    tenants: [Tenant!]!
    total: Int!
    page: Int!
    totalPages: Int!
    stats: TenantCounts
  }

  type SubscriptionsResponse {
    subscriptions: [Subscription!]!
    total: Int!
    page: Int!
    totalPages: Int!
    stats: SubscriptionStats
  }

  type SubjectsResponse {
    subjects: [Subject!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }
`;
