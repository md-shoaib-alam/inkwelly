export const studentsDashboardTypeDefs = /* GraphQL */ `#graphql
  type StudentsSession {
    name: String!
    isCurrent: Boolean!
    startDate: String!
    endDate: String!
    totalDays: Int!
    dayNumber: Int!
    percentComplete: Int!
  }

  type StudentsStats {
    total: Int!
    admissions: Int!
    withdrawals: Int!
    graduated: Int!
    "Completed promotions inside the current session."
    promoted: Int!
    profileCompletePercent: Int!
    boys: Int!
    girls: Int!
    otherGenders: Int!
    medianAge: Int!
    youngestAge: Int!
    oldestAge: Int!
    ageUnknown: Int!
    classes: Int!
    averageClassSize: Int!
    largestClassName: String!
    largestClassSize: Int!
    upcomingBirthdays: Int!
    openAlerts: Int!
  }

  type StudentStage {
    key: String!
    label: String!
    students: Int!
  }

  type StudentAgeBand {
    band: String!
    boys: Int!
    girls: Int!
  }

  type StudentClassStrength {
    classId: String!
    label: String!
    students: Int!
    boys: Int!
    girls: Int!
    capacity: Int!
  }

  type StudentMovementPoint {
    month: String!
    label: String!
    admissions: Int!
    withdrawals: Int!
  }

  type StudentEnrolmentPoint {
    period: String!
    label: String!
    students: Int!
  }

  type StudentBirthday {
    id: String!
    name: String!
    className: String!
    date: String!
    daysAway: Int!
  }

  type StudentAlert {
    code: String!
    severity: String!
    count: Int!
    title: String!
    detail: String!
    screen: String!
  }

  """A tile the shipped design shows and this build cannot answer, with what is missing."""
  type StudentsUntrackedTile {
    key: String!
    label: String!
    reason: String!
  }

  """The last time a student's own record changed."""
  type StudentActivityEntry {
    id: String!
    name: String!
    className: String!
    at: String!
    daysAgo: Int!
  }

  type StudentsCommandCenter {
    session: StudentsSession
    stats: StudentsStats!
    stages: [StudentStage!]!
    agePyramid: [StudentAgeBand!]!
    classStrength: [StudentClassStrength!]!
    movement: [StudentMovementPoint!]!
    enrolment: [StudentEnrolmentPoint!]!
    birthdays: [StudentBirthday!]!
    alerts: [StudentAlert!]!
    recentActivity: [StudentActivityEntry!]!
    """When the newest student record in this cohort changed, as a whole ISO instant."""
    lastUpdated: String
    untracked: [StudentsUntrackedTile!]!
  }

  extend type Query {
    studentsCommandCenter(tenantId: String, academicYear: String): StudentsCommandCenter!
  }
`;
