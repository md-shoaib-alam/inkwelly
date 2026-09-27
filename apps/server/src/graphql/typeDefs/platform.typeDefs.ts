export const platformTypeDefs = `#graphql
  type PlatformStats {
    tenants: TenantCounts!
    users: UserCounts!
    classes: Int!
    subscriptions: SubscriptionCounts!
    revenue: RevenueStats!
    planDistribution: [PlanCount!]!
    activityLogs: [AuditLog!]!
    monthlyData: [MonthlyDataPoint!]!
    topTenants: [TopTenant!]!
  }

  type TenantCounts {
    total: Int!
    active: Int!
    trial: Int!
    suspended: Int!
    expiring: Int
  }

  type UserCounts {
    total: Int!
    students: Int!
    teachers: Int!
    parents: Int!
    admins: Int!
  }

  type SubscriptionCounts {
    total: Int!
    active: Int!
  }

  type RevenueStats {
    active: Float!
    total: Float!
  }

  type PlanCount {
    plan: String!
    count: Int!
  }

  type BillingData {
    subscriptions: [Subscription!]!
    tenantBilling: [TenantBilling!]!
    planRevenue: JSON!
    methodRevenue: JSON!
    monthlyTrend: [BillingTrend!]!
    statusDistribution: JSON!
    totalActiveRevenue: Float!
  }

  type BillingTrend {
    month: String!
    revenue: Float!
    newSubscriptions: Int!
    churned: Int!
  }

  type TenantBilling {
    id: String!
    name: String!
    slug: String!
    logo: String
    email: String
    phone: String
    address: String
    website: String
    plan: String!
    status: String!
    maxStudents: Int!
    maxTeachers: Int!
    maxParents: Int!
    maxClasses: Int!
    settings: String
    startDate: String!
    endDate: String
    createdAt: String!
    updatedAt: String!
    deletedAt: String
    totalRevenue: Float!
    activeRevenue: Float!
    activeSubscriptions: Int!
    totalSubscriptions: Int!
    _count: TenantCountInfo!
  }

  type Tenant {
    id: String!
    name: String!
    slug: String!
    logo: String
    email: String
    phone: String
    address: String
    website: String
    plan: String!
    status: String!
    maxStudents: Int!
    maxTeachers: Int!
    maxParents: Int!
    maxClasses: Int!
    settings: String
    startDate: String!
    endDate: String
    createdAt: String!
    updatedAt: String!
    deletedAt: String
    studentCount: Int
    teacherCount: Int
    parentCount: Int
    adminCount: Int
    activeSubscriptions: Int
    totalRevenue: Float
    _count: TenantCountInfo
  }

  type TopTenant {
    id: String!
    name: String!
    slug: String!
    logo: String
    email: String
    phone: String
    address: String
    website: String
    plan: String!
    status: String!
    maxStudents: Int!
    maxTeachers: Int!
    maxParents: Int!
    maxClasses: Int!
    settings: String
    startDate: String!
    endDate: String
    createdAt: String!
    updatedAt: String!
    deletedAt: String
    studentCount: Int!
    teacherCount: Int!
    revenue: Float!
    _count: TenantCountInfo!
  }

  type User {
    id: String!
    name: String!
    email: String!
    role: String!
    phone: String
    address: String
    avatar: String
    isActive: Boolean!
    tenantId: String
    customRoleId: String
    customRole: CustomRole
    createdAt: String!
    tenant: Tenant
  }

  type CustomRole {
    id: String!
    tenantId: String!
    name: String!
    description: String
    color: String!
    permissions: JSON!
    userCount: Int!
    createdAt: String!
  }

  type AuditLog {
    id: String!
    tenantId: String
    userId: String
    action: String!
    resource: String!
    details: String!
    ipAddress: String
    createdAt: String!
    tenant: Tenant
    user: User
  }

  type Subscription {
    id: String!
    tenantId: String!
    parentId: String!
    planName: String!
    planId: String!
    amount: Float!
    period: String!
    status: String!
    paymentMethod: String!
    transactionId: String
    startDate: String!
    endDate: String
    autoRenew: Boolean!
    addons: String
    createdAt: String!
    updatedAt: String!
    tenant: Tenant
    parent: SubscriptionParent
  }

  type SubscriptionParent {
    user: SubscriptionParentUser!
  }

  type SubscriptionParentUser {
    name: String!
    email: String!
  }

  type SubscriptionStats {
    activeSubscriptions: Int!
    totalSubscriptions: Int!
    totalRevenue: Float!
  }

  type TenantBasic {
    id: String!
    name: String!
    slug: String!
    plan: String!
    status: String!
    maxStudents: Int
    maxTeachers: Int
    startDate: String
    endDate: String
    deletedAt: String
  }
`;
