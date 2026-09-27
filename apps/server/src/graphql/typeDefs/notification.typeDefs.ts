export const notificationTypeDefs = `#graphql
  type NotificationToken {
    id: ID!
    userId: ID!
    token: String!
    platform: String!
    createdAt: String!
  }

  type PushResponse {
    success: Boolean!
    message: String
  }

  type PlatformNotice {
    id: ID!
    title: String!
    content: String!
    target: String!
    isActive: Boolean!
    createdAt: String!
  }

  extend type Query {
    platformNotices(limit: Int): [PlatformNotice!]!
    activePlatformNotice: PlatformNotice
  }
`;
