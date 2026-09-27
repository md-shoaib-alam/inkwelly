export const rootTypeDefs = `#graphql
  type Query {
    """Platform-wide statistics (Super Admin)"""
    platformStats: PlatformStats!

    """Billing and subscription data (Super Admin)"""
    billingData(type: String): BillingData!

    """List tenants with optional filters"""
    tenants(status: String, plan: String, search: String, page: Int, limit: Int): TenantsResponse!

    """List users with pagination and filters"""
    users(role: String, tenantId: String, search: String, page: Int, limit: Int): UsersResponse!

    """Audit log entries with pagination"""
    auditLogs(action: String, role: String, tenantId: String, page: Int, limit: Int): AuditLogsResponse!

    """School admin dashboard data"""
    adminDashboard(tenantId: String): AdminDashboard!

    """Staff dashboard data (tenant metrics)"""
    staffDashboard(tenantId: String): AdminDashboard!

    """Teacher dashboard data"""
    teacherDashboard(teacherName: String): TeacherDashboard!

    """Student dashboard data"""
    studentDashboard(studentEmail: String): StudentDashboard!

    """Parent dashboard data"""
    parentDashboard(parentName: String): ParentDashboard!

    """Detailed tenant data including all related records"""
    tenantDetail(tenantId: String!): TenantDetail!

    """List subjects for a school"""
    subjects(tenantId: String, page: Int, limit: Int): SubjectsResponse!

    """List classes for selection"""
    classes(tenantId: String, page: Int, limit: Int): ClassesResponse!

    """List teachers for selection"""
    teachers(tenantId: String, search: String, page: Int, limit: Int): TeachersResponse!

    """List students"""
    students(tenantId: String, classId: String, search: String, status: String, gender: String, page: Int, limit: Int): StudentsResponse!

    """List parents"""
    parents(tenantId: String, search: String, page: Int, limit: Int): ParentsResponse!

    """List notices"""
    notices(tenantId: String, page: Int, limit: Int): NoticesResponse!

    """List fees"""
    fees(tenantId: String, page: Int, limit: Int): FeesResponse!

    """List attendance"""
    attendance(tenantId: String!, page: Int, limit: Int): AttendanceResponse!

    """List staff and teacher attendance"""
    staffAttendance(tenantId: String, role: String, date: String, page: Int, limit: Int): StaffAttendanceResponse!

    """List custom roles for a tenant"""
    customRoles(tenantId: String): [CustomRole!]!

    """List subscriptions with pagination and filters"""
    subscriptions(tenantId: String, status: String, search: String, startDate: String, endDate: String, page: Int, limit: Int): SubscriptionsResponse!

    """List staff for a tenant"""
    staff(tenantId: String, role: String, search: String, page: Int, limit: Int): StaffResponse!

    # Granular Dashboard Queries for Progressive Loading
    dashboardSummary(tenantId: String!): DashboardSummary!
    dashboardAttendance(tenantId: String!): [AttendanceRate!]!
    dashboardAcademic(tenantId: String!): AcademicStats!
    dashboardFinancial(tenantId: String!): FinancialStats!
    dashboardNotices(tenantId: String!): [NoticeInfo!]!
    
    """Fetch calendar events for a month"""
    calendarEvents(tenantId: String, month: String): [Event!]!
  }

  type Mutation {
    """Create a new user"""
    createUser(data: CreateUserInput!): User!

    """Create a new tenant"""
    createTenant(data: TenantInput!): Tenant!

    """Update an existing tenant"""
    updateTenant(id: ID!, data: TenantUpdateInput!): Tenant!

    """Delete a tenant and all related data"""
    deleteTenant(id: ID!): Boolean!

    """Restore a deleted tenant back to active state"""
    restoreTenant(id: ID!): Tenant!

    """Toggle tenant active/suspended status"""
    toggleTenantStatus(id: ID!, status: String!): TenantBasic!

    """Create a subject"""
    createSubject(data: SubjectInput!): Subject!

    """Update a subject"""
    updateSubject(id: ID!, data: SubjectInput!): Subject!

    """Delete a subject"""
    deleteSubject(id: ID!): Boolean!

    """Toggle user active/inactive status"""
    toggleUserStatus(id: ID!, isActive: Boolean!): User!

    """Update an existing user"""
    updateUser(id: ID!, data: UpdateUserInput!): User!

    """Delete a user permanently"""
    deleteUser(id: ID!): Boolean!
    
    """Create a custom role"""
    createCustomRole(tenantId: String, name: String!, description: String, color: String!, permissions: JSON!): CustomRole!
    
    """Update a custom role"""
    updateCustomRole(id: ID!, name: String, description: String, color: String, permissions: JSON): CustomRole!
    
    """Delete a custom role"""
    deleteCustomRole(id: ID!): Boolean!
    
    """Assign custom role to user"""
    assignRoleToUser(userId: String!, roleId: String, tenantId: String): Boolean!

    """Request password reset"""
    requestPasswordReset(email: String!): Boolean!

    """Change password"""
    changePassword(email: String!, oldPassword: String!, newPassword: String!): Boolean!

    """Mark staff or teacher attendance"""
    markStaffAttendance(data: StaffAttendanceInput!): Boolean!

    """Mark bulk staff or teacher attendance"""
    markBulkStaffAttendance(data: [StaffAttendanceInput!]!): Boolean!

    """Create a calendar event"""
    createEvent(data: EventInput!): Event!

    """Update a calendar event"""
    updateEvent(id: ID!, data: EventInput!): Event!

    """Delete a calendar event"""
    deleteEvent(id: ID!): Boolean!

    # Platform Notifications & Notices
    saveNotificationToken(token: String!, platform: String): NotificationToken!
    sendGlobalPush(title: String!, body: String!, target: String!, schoolId: ID, link: String, imageUrl: String): PushResponse!
    sendDirectPush(token: String!, title: String!, body: String!, link: String, imageUrl: String): PushResponse!
    sendGlobalNotice(title: String!, body: String!, target: String!, schoolId: ID): PushResponse!
    deletePlatformNotice(id: ID!): PushResponse!
  }
`;
