export const inputTypeDefs = `#graphql
  input TenantInput {
    name: String!
    slug: String!
    email: String
    phone: String
    address: String
    website: String
    logo: String
    plan: String
    status: String
    maxStudents: Int
    maxTeachers: Int
    maxParents: Int
    maxClasses: Int
    startDate: String
    endDate: String
  }

  input TenantUpdateInput {
    name: String
    slug: String
    email: String
    phone: String
    address: String
    website: String
    plan: String
    status: String
    maxStudents: Int
    maxTeachers: Int
    maxParents: Int
    maxClasses: Int
    startDate: String
    endDate: String
  }

  input SubjectInput {
    name: String!
    code: String!
    classId: String!
    teacherId: String
  }

  input CreateUserInput {
    name: String!
    email: String!
    phone: String
    address: String
    password: String!
    role: String!
    tenantId: String
    customRoleId: String
    isActive: Boolean
  }

  input UpdateUserInput {
    name: String
    email: String
    phone: String
    address: String
    password: String
    role: String
    isActive: Boolean
    tenantId: String
    customRoleId: String
  }

  input StaffAttendanceInput {
    userId: String!
    date: String!
    status: String!
    checkIn: String
    checkOut: String
    remarks: String
  }
`;
