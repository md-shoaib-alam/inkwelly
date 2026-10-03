export const attendanceDashboardTypeDefs = /* GraphQL */ `#graphql
  type AttendanceSession {
    name: String!
    isCurrent: Boolean!
    startDate: String!
    endDate: String!
    totalDays: Int!
    dayNumber: Int!
    percentComplete: Int!
  }

  """The two numbers the school sets, plus what today looks like against them."""
  type AttendanceSettingsView {
    cutoffTime: String!
    targetRate: Int!
    """Whether the school's clock has passed the cutoff, so late marking is real."""
    cutoffPassed: Boolean!
    """Working day or not, from the school's own working days and its holiday events."""
    isSchoolDayToday: Boolean!
    todayHolidayName: String!
  }

  type AttendanceStats {
    "In school over the roll on it, where a late child counts as in school and a half day as half."
    todayRate: Float!
    presentToday: Int!
    absentToday: Int!
    "Students on an active roll with no row written for them today."
    unmarkedToday: Int!
    rollStrength: Int!
    markedClasses: Int!
    totalClasses: Int!
    classesLeft: Int!
    weekRate: Float!
    sessionRate: Float!
    "Last whole month's rate, or null when nothing was marked in it."
    previousMonthRate: Float
    "Session rate minus last month's, in points; null when there is no last month to compare."
    sessionRateDelta: Float
    "Today's rate minus the trailing week's, in points."
    todayRateDelta: Float!
  }

  type AttendanceStatusCell {
    key: String!
    label: String!
    "How many, of whatever the cell counts — see kind."
    students: Int!
    share: Float!
    """students for the five statuses, classes for the unmarked column."""
    kind: String!
  }

  type AttendanceMarkingRow {
    classId: String!
    label: String!
    marked: Boolean!
    studentsMarked: Int!
    studentsOnRoll: Int!
    rate: Float!
    present: Int!
    absent: Int!
    teacherName: String!
    teacherAvatar: String
  }

  type AttendanceCalendarDay {
    date: String!
    dayOfMonth: Int!
    rate: Float!
    marked: Boolean!
    isSchoolDay: Boolean!
    isHoliday: Boolean!
    markName: String!
    "off, unmarked, good, watch or critical, measured against the school's own target."
    band: String!
  }

  """A named day on the calendar: a holiday closes the school, an event only marks the cell."""
  type AttendanceMonthMark {
    date: String!
    name: String!
    kind: String!
  }

  type AttendanceCommandCenter {
    session: AttendanceSession
    settings: AttendanceSettingsView!
    stats: AttendanceStats!
    statusBreakdown: [AttendanceStatusCell!]!
    marking: [AttendanceMarkingRow!]!
    calendar: [AttendanceCalendarDay!]!
    monthLabel: String!
    "The YYYY-MM whose grid the calendar drew."
    displayedMonth: String!
    monthMarks: [AttendanceMonthMark!]!
    "The day every figure here was measured on, as YYYY-MM-DD on the school's own clock."
    today: String!
  }

  extend type Query {
    attendanceCommandCenter(tenantId: String, academicYear: String, month: String, date: String): AttendanceCommandCenter!
  }
`;
