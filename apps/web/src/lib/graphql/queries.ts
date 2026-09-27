export const BILLING_DATA = `
  query BillingData($type: String) {
    billingData(type: $type) {
      totalActiveRevenue
      statusDistribution
      monthlyTrend { month revenue newSubscriptions churned }
      tenantBilling { id name slug plan status totalRevenue activeRevenue activeSubscriptions totalSubscriptions _count { users } }
      subscriptions { id planName amount status paymentMethod startDate createdAt tenant { name } parent { user { name email } } }
      planRevenue
      methodRevenue
    }
  }
`

export const TENANTS = `
  query Tenants($status: String, $plan: String, $search: String, $page: Int, $limit: Int) {
    tenants(status: $status, plan: $plan, search: $search, page: $page, limit: $limit) {
      tenants { id name slug logo email phone address website plan status maxStudents maxTeachers maxParents maxClasses startDate endDate createdAt deletedAt studentCount teacherCount parentCount adminCount activeSubscriptions totalRevenue _count { users classes subscriptions notices events } }
      total page totalPages
      stats { total active trial suspended expiring }
    }
  }
`

export const USERS = `
  query Users($role: String, $tenantId: String, $search: String, $page: Int, $limit: Int) {
    users(role: $role, tenantId: $tenantId, search: $search, page: $page, limit: $limit) {
      users { id name email role phone isActive createdAt tenant { id name slug } }
      total page totalPages
      roleCounts { role count }
    }
  }
`

export const AUDIT_LOGS = `
  query AuditLogs($action: String, $role: String, $tenantId: String, $page: Int, $limit: Int) {
    auditLogs(action: $action, role: $role, tenantId: $tenantId, page: $page, limit: $limit) {
      logs { 
        id action resource details ipAddress createdAt 
        tenant { id name slug email } 
        user { name email }
      }
      total page totalPages
      actionTypes { action count }
    }
  }
`

export const CREATE_TENANT = `
  mutation CreateTenant($data: TenantInput!) {
    createTenant(data: $data) { id name slug plan status }
  }
`

export const UPDATE_TENANT = `
  mutation UpdateTenant($id: ID!, $data: TenantUpdateInput!) {
    updateTenant(id: $id, data: $data) { id name slug plan status startDate endDate maxStudents maxTeachers }
  }
`

export const DELETE_TENANT = `
  mutation DeleteTenant($id: ID!) {
    deleteTenant(id: $id)
  }
`

export const TOGGLE_TENANT_STATUS = `
  mutation ToggleTenantStatus($id: ID!, $status: String!) {
    toggleTenantStatus(id: $id, status: $status) { id name status }
  }
`

export const ADMIN_DASHBOARD = `
  query AdminDashboard($tenantId: String!) {
    adminDashboard(tenantId: $tenantId) {
      totalStudents totalTeachers totalClasses totalParents
      totalRevenue pendingFees attendanceRate upcomingEvents
      monthlyAttendance { month rate }
      classDistribution { name students }
      gradeDistribution { grade count }
      recentNotices { id title content authorName priority createdAt targetRole }
      feeByType { type collected pending }
    }
  }
`

export const TEACHER_DASHBOARD = `
  query TeacherDashboard($teacherName: String!) {
    teacherDashboard(teacherName: $teacherName) {
      teacherId classes { id name section studentCount }
      subjects { id name code className }
      totalStudents pendingAssignments
      todaySchedule { id day startTime endTime subjectName className }
      todayAttendance { present total }
      todaySelfAttendance { status checkIn checkOut }
      recentAssignments { id title subjectName className dueDate submissions totalStudents mode }
    }
  }
`

export const STUDENT_DASHBOARD = `
  query StudentDashboard($studentEmail: String) {
    studentDashboard(studentEmail: $studentEmail) {
      studentId classId attendanceRate avgGrade pendingAssignments
      todaySchedule { id day startTime endTime subjectName className }
      recentGrades { id subjectName examType marks maxMarks grade }
      notices { id title content authorName priority createdAt targetRole }
    }
  }
`

export const PARENT_DASHBOARD = `
  query ParentDashboard($parentName: String!) {
    parentDashboard(parentName: $parentName) {
      children { 
        id userId name email className classId rollNumber gender dateOfBirth admissionDate
        grades { id studentId studentName subjectName examType marks maxMarks grade createdAt }
        attendance { id studentId studentName className date status remarks }
      }
      notices { id title content authorName priority createdAt targetRole }
      fees { id studentName type amount status dueDate paidAmount }
      performanceSummary { name attendanceRate avgGrade grade }
      subscriptionPlan
    }
  }
`;
export const TENANT_DETAIL = `
  query TenantDetail($tenantId: String!) {
    tenantDetail(tenantId: $tenantId) {
      tenant { id name slug logo email phone address website plan status maxStudents maxTeachers maxParents maxClasses startDate endDate createdAt deletedAt studentCount teacherCount parentCount adminCount activeSubscriptions totalRevenue _count { users classes subscriptions notices events } }
    }
  }
`

export const TENANT_METADATA = `
  query TenantMetadata($tenantId: String!) {
    tenantDetail(tenantId: $tenantId) {
      tenant { id name slug logo email phone address website plan status maxStudents maxTeachers maxParents maxClasses startDate endDate createdAt deletedAt studentCount teacherCount parentCount adminCount activeSubscriptions totalRevenue _count { users classes subscriptions notices events } }
    }
  }
`

export const SUBJECTS = `
  query Subjects($tenantId: String, $page: Int, $limit: Int) {
    subjects(tenantId: $tenantId, page: $page, limit: $limit) {
      subjects { id name code classId teacherId className teacherName }
      total page totalPages
    }
  }
`

export const CLASSES = `
  query Classes($tenantId: String, $page: Int, $limit: Int) {
    classes(tenantId: $tenantId, page: $page, limit: $limit) {
      classes { id name section grade capacity studentCount classTeacher }
      total page totalPages
    }
  }
`

export const TEACHERS = `
  query Teachers($tenantId: String, $search: String, $page: Int, $limit: Int) {
    teachers(tenantId: $tenantId, search: $search, page: $page, limit: $limit) {
      teachers { id name email phone qualification experience status subjects classes joiningDate }
      total page totalPages
    }
  }
`

export const STUDENTS = `
  query Students($tenantId: String, $classId: String, $search: String, $status: String, $gender: String, $page: Int, $limit: Int) {
    students(tenantId: $tenantId, classId: $classId, search: $search, status: $status, gender: $gender, page: $page, limit: $limit) {
      students { id name email phone rollNumber className gender dateOfBirth status classId parentId parentName admissionDate }
      total page totalPages
    }
  }
`

export const PARENTS = `
  query Parents($tenantId: String, $search: String, $page: Int, $limit: Int) {
    parents(tenantId: $tenantId, search: $search, page: $page, limit: $limit) {
      parents { 
        id userId name email username phone occupation status 
        children { id name email rollNumber className gender classId } 
        subscription { id planName planId amount period status transactionId startDate endDate autoRenew }
      }
      total page totalPages
    }
  }
`

export const SUBSCRIPTIONS = `
  query Subscriptions($tenantId: String, $status: String, $search: String, $startDate: String, $endDate: String, $page: Int, $limit: Int) {
    subscriptions(tenantId: $tenantId, status: $status, search: $search, startDate: $startDate, endDate: $endDate, page: $page, limit: $limit) {
      subscriptions { 
        id planName planId amount period status transactionId paymentMethod startDate endDate autoRenew createdAt
        parent { user { name email } }
        tenant { name }
      }
      total page totalPages
      stats { activeSubscriptions totalSubscriptions totalRevenue }
    }
  }
`

export const NOTICES = `
  query Notices($tenantId: String, $page: Int, $limit: Int) {
    notices(tenantId: $tenantId, page: $page, limit: $limit) {
      notices { id title content authorName priority targetRole createdAt }
      total page totalPages
    }
  }
`

export const FEES = `
  query Fees($tenantId: String, $page: Int, $limit: Int) {
    fees(tenantId: $tenantId, page: $page, limit: $limit) {
      fees { id studentName studentId className type amount status dueDate paidAmount }
      total page totalPages
    }
  }
`

export const ATTENDANCE = `
  query Attendance($tenantId: String!, $page: Int, $limit: Int) {
    attendance(tenantId: $tenantId, page: $page, limit: $limit) {
      records { id studentName date status className createdAt }
      total page totalPages
    }
  }
`

export const CUSTOM_ROLES = `
  query CustomRoles($tenantId: String) {
    customRoles(tenantId: $tenantId) {
      id name color permissions createdAt
    }
  }
`

export const STAFF = `
  query GetStaff($tenantId: String, $role: String, $search: String, $page: Int, $limit: Int) {
    staff(tenantId: $tenantId, role: $role, search: $search, page: $page, limit: $limit) {
      staff {
        id name email phone address role isActive 
        customRole { id name color }
        createdAt
      }
      total page totalPages
    }
  }
`

export const CREATE_SUBJECT = `
  mutation CreateSubject($data: SubjectInput!) {
    createSubject(data: $data) { id name code classId teacherId className teacherName }
  }
`

export const UPDATE_SUBJECT = `
  mutation UpdateSubject($id: ID!, $data: SubjectInput!) {
    updateSubject(id: $id, data: $data) { id name code classId teacherId className teacherName }
  }
`

export const DELETE_SUBJECT = `
  mutation DeleteSubject($id: ID!) {
    deleteSubject(id: $id)
  }
`

export const TOGGLE_USER_STATUS = `
  mutation ToggleUserStatus($id: ID!, $isActive: Boolean!) {
    toggleUserStatus(id: $id, isActive: $isActive) { id name isActive }
  }
`

export const REQUEST_PASSWORD_RESET = `
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`

export const CREATE_USER = `
  mutation CreateUser($data: CreateUserInput!) {
    createUser(data: $data) { id name email role isActive }
  }
`

export const UPDATE_USER = `
  mutation UpdateUser($id: ID!, $data: UpdateUserInput!) {
    updateUser(id: $id, data: $data) {
      id
      name
      email
      phone
      address
      role
      isActive
      createdAt
      tenant {
        id
        name
        slug
      }
    }
  }
`

export const CHANGE_PASSWORD = `
  mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword)
  }
`

export const CREATE_CUSTOM_ROLE = `
  mutation CreateCustomRole($tenantId: String, $name: String!, $description: String, $color: String!, $permissions: JSON!) {
    createCustomRole(tenantId: $tenantId, name: $name, description: $description, color: $color, permissions: $permissions) { id name color permissions createdAt }
  }
`

export const UPDATE_CUSTOM_ROLE = `
  mutation UpdateCustomRole($id: ID!, $name: String, $description: String, $color: String, $permissions: JSON) {
    updateCustomRole(id: $id, name: $name, description: $description, color: $color, permissions: $permissions) { id name color permissions createdAt }
  }
`

export const DELETE_CUSTOM_ROLE = `
  mutation DeleteCustomRole($id: ID!) {
    deleteCustomRole(id: $id)
  }
`

export const ASSIGN_ROLE_TO_USER = `
  mutation AssignRoleToUser($userId: String!, $roleId: String, $tenantId: String) {
    assignRoleToUser(userId: $userId, roleId: $roleId, tenantId: $tenantId)
  }
`

export const SAVE_NOTIFICATION_TOKEN = `
  mutation SaveNotificationToken($token: String!, $platform: String) {
    saveNotificationToken(token: $token, platform: $platform) { id token platform }
  }
`

export const SEND_GLOBAL_PUSH = `
  mutation SendGlobalPush($title: String!, $body: String!, $target: String!, $schoolId: ID, $link: String, $imageUrl: String) {
    sendGlobalPush(title: $title, body: $body, target: $target, schoolId: $schoolId, link: $link, imageUrl: $imageUrl) { success message }
  }
`

export const SEND_GLOBAL_NOTICE = `
  mutation SendGlobalNotice($title: String!, $body: String!, $target: String!, $schoolId: ID) {
    sendGlobalNotice(title: $title, body: $body, target: $target, schoolId: $schoolId) { success message }
  }
`

export const ACTIVE_PLATFORM_NOTICE = `
  query ActivePlatformNotice {
    activePlatformNotice {
      id title content target isActive createdAt
    }
  }
`

export const PLATFORM_NOTICES = `
  query PlatformNotices($limit: Int) {
    platformNotices(limit: $limit) {
      id title content target isActive createdAt
    }
  }
`

export const DELETE_PLATFORM_NOTICE = `
  mutation DeletePlatformNotice($id: ID!) {
    deletePlatformNotice(id: $id) { success message }
  }
`

export const RESTORE_TENANT = `
  mutation RestoreTenant($id: ID!) {
    restoreTenant(id: $id) { id name status deletedAt }
  }
`
