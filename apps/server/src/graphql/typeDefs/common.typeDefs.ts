export const commonTypeDefs = `#graphql
  scalar DateTime
  scalar JSON

  type MonthlyDataPoint {
    month: String!
    newTenants: Int!
    newUsers: Int!
    revenue: Float!
  }

  type TenantCountInfo {
    users: Int!
    classes: Int!
    subscriptions: Int!
    notices: Int!
    events: Int!
  }

  type RoleCount {
    role: String!
    count: Int!
  }

  type ActionCount {
    action: String!
    count: Int!
  }
`;
