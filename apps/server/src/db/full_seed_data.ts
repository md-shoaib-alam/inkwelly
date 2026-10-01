import "dotenv/config";
import { db } from "../lib/db";
import * as schema from "./schema";
import { sql } from "drizzle-orm";
import { formatDate } from "../lib/date-utils";
import { createId } from "@paralleldrive/cuid2";

const PASSWORD = 'test@123';
const ACADEMIC_YEAR = '2026-2027';

async function main() {
  console.log('🌱 Starting comprehensive data seed of 5 schools...');
  const start = Date.now();
  const hashedPassword = await Bun.password.hash(PASSWORD);
  const now = new Date();

  // 1. Wipe database completely using CASCADE truncate
  try {
    console.log('🧹 Wiping database tables...');
    await db.execute(sql`
      TRUNCATE TABLE 
        "TicketMessage", "Ticket", "ExamResult", "Exam", "Leave", 
        "StaffAttendance", "Certificate", "Promotion", "TransportAssignment", 
        "TransportRoute", "Vehicle", "FeeReceipt", "Fee", "FeeStructure", 
        "FeeCategory", "Grade", "Attendance", "Submission", "Assignment", 
        "Timetable", "Subject", "ClassTeacher", "Student", "Teacher", 
        "Parent", "Notice", "Event", "Subscription", "AuditLog", 
        "CustomRole", "PlatformRole", "Class", "User", "Tenant", "PlatformSetting",
        "Expense", "ExpenseCategory", "NotificationToken", "Assessment", "AssessmentGrade",
        "AcademicYear", "Notification"
      RESTART IDENTITY CASCADE;
    `);
    console.log('✅ Database successfully wiped clean.');
  } catch (e) {
    console.warn('⚠️ Truncate failed, attempting standard table deletion (slower)...', e);
  }

  // 2. Platform settings and roles
  console.log('⚙️ Seeding platform configurations...');
  await db.insert(schema.platformSettings).values([
    { key: 'maintenance_mode', value: 'false', updatedAt: now },
    { key: 'allow_registration', value: 'true', updatedAt: now },
    { key: 'default_language', value: 'en', updatedAt: now }
  ]);

  const platformRolesCreated = await db.insert(schema.platformRoles).values([
    {
      id: createId(),
      name: 'Platform Support Agent',
      description: 'System support agent with access to tickets',
      color: '#e11d48',
      permissions: JSON.stringify({ tickets: ['view', 'edit', 'delete'], tenants: ['view'] }),
      createdAt: now,
      updatedAt: now
    },
    {
      id: createId(),
      name: 'Platform Billing Manager',
      description: 'System billing manager',
      color: '#3b82f6',
      permissions: JSON.stringify({ subscriptions: ['view', 'edit'], tenants: ['view'] }),
      createdAt: now,
      updatedAt: now
    }
  ]).returning();
  const supportRole = platformRolesCreated[0]!;
  const financeRole = platformRolesCreated[1]!;

  await db.insert(schema.platformNotices).values([
    { title: 'Welcome to SchoolSaaS Portal', content: 'We hope you enjoy the latest update v3.2.', target: 'everyone', isActive: true, createdAt: now, updatedAt: now },
    { title: 'Scheduled Maintenance Notice', content: 'System updates will occur this Saturday at 2 AM GMT.', target: 'admin', isActive: true, createdAt: now, updatedAt: now }
  ]);

  // Create Super Admin user
  const superAdminUsersCreated = await db.insert(schema.users).values({
    id: createId(),
    email: 'shoaibalamcse0786@gmail.com',
    name: 'Super Admin',
    password: hashedPassword,
    role: 'super_admin',
    phone: '+919999999999',
    username: 'superadmin',
    address: 'HQ Office, New Delhi',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    isActive: true,
    platformRoleId: null,
    createdAt: now,
    updatedAt: now
  }).returning();
  const superAdminUser = superAdminUsersCreated[0]!;

  // Create limited Platform Staff/Support Agent user
  await db.insert(schema.users).values({
    id: createId(),
    email: 'support@schoolsaas.com',
    name: 'Platform Support Agent',
    password: hashedPassword,
    role: 'super_admin',
    phone: '+919888888888',
    username: 'supportagent',
    address: 'HQ Office, New Delhi',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    isActive: true,
    platformRoleId: supportRole.id,
    createdAt: now,
    updatedAt: now
  });

  // Define 5 schools
  const schoolsData = [
    { name: 'Greenwood International School', slug: 'greenwood', theme: 'emerald' },
    { name: 'Sunrise Public School', slug: 'sunrise', theme: 'amber' },
    { name: 'Apex Academy', slug: 'apex', theme: 'indigo' },
    { name: 'Beacon Hill High', slug: 'beacon', theme: 'rose' },
    { name: 'Oakridge Prep School', slug: 'oakridge', theme: 'violet' }
  ];

  console.log('🏫 Seeding 5 schools/tenants...');
  const tenantsList = await Promise.all(
    schoolsData.map(async (school) => {
      const [tenant] = await db.insert(schema.tenants).values({
        id: createId(),
        name: school.name,
        slug: school.slug,
        plan: 'enterprise',
        status: 'active',
        maxStudents: 200,
        maxTeachers: 30,
        maxParents: 200,
        maxClasses: 15,
        settings: JSON.stringify({ theme: school.theme, currency: 'USD', academicYear: ACADEMIC_YEAR }),
        startDate: '2026-04-01',
        endDate: '2028-03-31',
        createdAt: now,
        updatedAt: now
      }).returning();
      return tenant!;
    })
  );

  // For each school, seed all entities
  for (let sIdx = 0; sIdx < tenantsList.length; sIdx++) {
    const tenant = tenantsList[sIdx]!;
    const schoolPrefix = schoolNameAbbreviation(tenant.name);
    console.log(`\n🏫 Seeding [${tenant.name}]...`);

    // Create Academic Years
    const academicYearsCreated = await db.insert(schema.academicYears).values({
      id: createId(),
      tenantId: tenant.id,
      name: ACADEMIC_YEAR,
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      status: 'active',
      isCurrent: true,
      createdAt: now,
      updatedAt: now
    }).returning();
    const academicYearRecord = academicYearsCreated[0]!;

    // Create Custom Roles
    const receptionistRolesCreated = await db.insert(schema.customRoles).values([
      {
        id: createId(),
        tenantId: tenant.id,
        name: 'Receptionist',
        description: 'Front desk management custom role',
        color: '#f59e0b',
        permissions: JSON.stringify({ notices: ['view', 'create'], visitors: ['view', 'create', 'edit'] }),
        createdAt: now,
        updatedAt: now
      }
    ]).returning();
    const receptionistRole = receptionistRolesCreated[0]!;

    // Create Admin User for this school
    const adminUsersCreated = await db.insert(schema.users).values({
      id: createId(),
      tenantId: tenant.id,
      email: `admin@${tenant.slug}.com`,
      name: `${tenant.name} Admin`,
      password: hashedPassword,
      role: 'admin',
      phone: `+91900000000${sIdx + 1}`,
      username: `${tenant.slug}_admin`,
      address: `Campus Drive, ${tenant.name}`,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }).returning();
    const adminUser = adminUsersCreated[0]!;

    // Generate 20 Teachers for this school
    console.log(`👨‍🏫 Creating 20 Teachers for ${tenant.name}...`);
    const teacherUsersData = Array.from({ length: 20 }, (_, i) => {
      const idxStr = String(i + 1).padStart(2, '0');
      return {
        id: createId(),
        tenantId: tenant.id,
        email: `teacher.${tenant.slug}.${idxStr}@school.com`,
        name: `Teacher ${i + 1} (${schoolPrefix})`,
        password: hashedPassword,
        role: 'teacher',
        phone: `+919876500${sIdx}${idxStr}`,
        username: `t_${tenant.slug}_${idxStr}`,
        address: `Teacher Quarter ${i + 1}, ${tenant.name}`,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };
    });
    const createdTeacherUsers = await db.insert(schema.users).values(teacherUsersData).returning();

    const teachersData = createdTeacherUsers.map((u, i) => ({
      id: createId(),
      userId: u.id,
      qualification: ['M.Ed', 'B.Ed', 'MSc Physics', 'MA English', 'Ph.D. Mathematics', 'B.P.Ed'][i % 6],
      experience: `${(i % 12) + 2} years`,
      joiningDate: '2024-06-01',
      createdAt: now,
      updatedAt: now
    }));
    const createdTeachers = await db.insert(schema.teachers).values(teachersData).returning();

    // Generate 5 Staff Members
    console.log(`🛠️ Creating 5 Staff for ${tenant.name}...`);
    const staffUsersData = Array.from({ length: 5 }, (_, i) => {
      const idxStr = String(i + 1).padStart(2, '0');
      return {
        id: createId(),
        tenantId: tenant.id,
        email: `staff.${tenant.slug}.${idxStr}@school.com`,
        name: `Staff ${i + 1} (${schoolPrefix})`,
        password: hashedPassword,
        role: 'staff',
        phone: `+919765400${sIdx}${idxStr}`,
        username: `staff_${tenant.slug}_${idxStr}`,
        address: `Staff Colony, ${tenant.name}`,
        isActive: true,
        customRoleId: receptionistRole.id,
        createdAt: now,
        updatedAt: now
      };
    });
    const createdStaffUsers = await db.insert(schema.users).values(staffUsersData).returning();

    // Generate 100 Parents
    console.log(`👪 Creating 100 Parents for ${tenant.name}...`);
    const parentUsersData = Array.from({ length: 100 }, (_, i) => {
      const idxStr = String(i + 1).padStart(2, '0');
      return {
        id: createId(),
        tenantId: tenant.id,
        email: `parent.${tenant.slug}.${idxStr}@school.com`,
        name: `Parent ${i + 1} (${schoolPrefix})`,
        password: hashedPassword,
        role: 'parent',
        phone: `+919654300${sIdx}${idxStr}`,
        username: `p_${tenant.slug}_${idxStr}`,
        address: `Residential Street ${i + 1}, City`,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };
    });
    const createdParentUsers = await db.insert(schema.users).values(parentUsersData).returning();

    const parentsData = createdParentUsers.map((u, i) => ({
      id: createId(),
      userId: u.id,
      occupation: ['Software Engineer', 'Civil Servant', 'Physician', 'Entrepreneur', 'Teacher', 'Retailer'][i % 6],
      createdAt: now,
      updatedAt: now
    }));
    const createdParents = await db.insert(schema.parents).values(parentsData).returning();

    // Generate 6 classes for this school
    console.log(`🏫 Creating Classes for ${tenant.name}...`);
    const classLevels = ['1', '2', '3', '4', '5', '6'];
    const classesData = classLevels.map((level) => ({
      id: createId(),
      tenantId: tenant.id,
      name: `Class ${level}`,
      section: 'A',
      classLevel: level,
      capacity: 35,
      createdAt: now,
      updatedAt: now
    }));
    const createdClasses = await db.insert(schema.classes).values(classesData).returning();

    // Assign Class Teachers
    const classTeachersData = createdClasses.map((c, i) => ({
      id: createId(),
      classId: c.id,
      teacherId: createdTeachers[i % createdTeachers.length]!.id,
      isClassTeacher: true,
      createdAt: now
    }));
    await db.insert(schema.classTeachers).values(classTeachersData);

    // Generate 100 Students (around 16-17 per class)
    console.log(`👶 Creating 100 Students for ${tenant.name}...`);
    const studentUsersData = Array.from({ length: 100 }, (_, i) => {
      const idxStr = String(i + 1).padStart(3, '0');
      return {
        id: createId(),
        tenantId: tenant.id,
        email: `student.${tenant.slug}.${idxStr}@school.com`,
        name: `Student ${i + 1} (${schoolPrefix})`,
        password: hashedPassword,
        role: 'student',
        phone: `+919543200${sIdx}${idxStr}`,
        username: `s_${tenant.slug}_${idxStr}`,
        address: `Student Residence ${i + 1}, City`,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };
    });
    const createdStudentUsers = await db.insert(schema.users).values(studentUsersData).returning();

    const studentsData = createdStudentUsers.map((u, i) => {
      const c = createdClasses[i % createdClasses.length]!;
      const parent = createdParents[i % createdParents.length]!;
      const rollNo = `${c.classLevel}${c.section}${String(i + 1).padStart(3, '0')}`;
      return {
        id: createId(),
        userId: u.id,
        rollNumber: rollNo,
        classId: c.id,
        parentId: parent.id,
        academicYear: ACADEMIC_YEAR,
        dateOfBirth: `201${5 + (i % 5)}-0${(i % 9) + 1}-${10 + (i % 15)}`,
        gender: i % 2 === 0 ? 'male' : 'female',
        bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'O-', 'A-'][i % 6],
        admissionDate: '2026-04-01',
        status: 'active',
        createdAt: now,
        updatedAt: now
      };
    });
    const createdStudents = await db.insert(schema.students).values(studentsData).returning();

    // Create Subjects
    console.log(`📚 Creating Subjects for ${tenant.name}...`);
    const subjectNames = ['English', 'Mathematics', 'General Science', 'Social Science', 'Arts'];
    const subjectValues: any[] = [];
    for (const c of createdClasses) {
      for (let sIdx = 0; sIdx < subjectNames.length; sIdx++) {
        const sName = subjectNames[sIdx]!;
        subjectValues.push({
          id: createId(),
          name: sName,
          code: `${sName.slice(0, 3).toUpperCase()}-${c.classLevel}`,
          classId: c.id,
          teacherId: createdTeachers[(c.classLevel.charCodeAt(0) + sIdx) % createdTeachers.length]!.id,
          tenantId: tenant.id,
          createdAt: now,
          updatedAt: now
        });
      }
    }
    const createdSubjects = await db.insert(schema.subjects).values(subjectValues).returning();

    // Timetables
    console.log(`📅 Creating Timetables for ${tenant.name}...`);
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = [
      { start: '08:30', end: '09:30' },
      { start: '09:30', end: '10:30' },
      { start: '10:45', end: '11:45' },
      { start: '11:45', end: '12:45' },
      { start: '13:30', end: '14:30' }
    ];
    const timetableValues: any[] = [];
    for (const c of createdClasses) {
      const classSubs = createdSubjects.filter(sub => sub.classId === c.id);
      for (const day of weekdays) {
        for (let tIdx = 0; tIdx < timeSlots.length; tIdx++) {
          const slot = timeSlots[tIdx]!;
          const sub = classSubs[tIdx % classSubs.length]!;
          timetableValues.push({
            id: createId(),
            classId: c.id,
            subjectId: sub.id,
            teacherId: sub.teacherId,
            day: day,
            startTime: slot.start,
            endTime: slot.end,
            label: `Regular Class`,
            createdAt: now
          });
        }
      }
    }
    await db.insert(schema.timetables).values(timetableValues);

    // Seed transport routes & vehicle routing
    console.log(`🚌 Creating Transport routes & vehicle routing for ${tenant.name}...`);
    const vehiclesCreated = await db.insert(schema.vehicles).values([
      {
        id: createId(),
        tenantId: tenant.id,
        number: `${schoolPrefix}-BUS-01`,
        type: 'bus',
        capacity: 45,
        driverName: `Driver Ramesh (${schoolPrefix})`,
        driverPhone: '+919911223344',
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: createId(),
        tenantId: tenant.id,
        number: `${schoolPrefix}-BUS-02`,
        type: 'bus',
        capacity: 45,
        driverName: `Driver Suresh (${schoolPrefix})`,
        driverPhone: '+919922334455',
        status: 'active',
        createdAt: now,
        updatedAt: now
      }
    ]).returning();
    const vehicle1 = vehiclesCreated[0]!;
    const vehicle2 = vehiclesCreated[1]!;

    const routesCreated = await db.insert(schema.transportRoutes).values([
      {
        id: createId(),
        tenantId: tenant.id,
        name: 'North-West Route',
        fee: 120,
        vehicleId: vehicle1.id,
        stops: JSON.stringify([
          { name: 'Main Gate', fee: 0 },
          { name: 'City Center', fee: 120 },
          { name: 'Sector 15', fee: 130 },
          { name: 'Central Park', fee: 140 },
          { name: 'Green Meadows', fee: 150 }
        ]),
        createdAt: now,
        updatedAt: now
      },
      {
        id: createId(),
        tenantId: tenant.id,
        name: 'South-East Route',
        fee: 150,
        vehicleId: vehicle2.id,
        stops: JSON.stringify([
          { name: 'Main Gate', fee: 0 },
          { name: 'Metro Station', fee: 150 },
          { name: 'Tech Hub', fee: 160 },
          { name: 'Sector 29', fee: 170 },
          { name: 'Orchard Valley', fee: 180 }
        ]),
        createdAt: now,
        updatedAt: now
      }
    ]).returning();
    const route1 = routesCreated[0]!;
    const route2 = routesCreated[1]!;

    // Assign ~40 students per school to transport routes
    const transportAssignmentsList = createdStudents.slice(0, 40).map((s, idx) => {
      const route = idx % 2 === 0 ? route1 : route2;
      const stops = JSON.parse(route.stops);
      const stop = stops[(idx % (stops.length - 1)) + 1] || stops[1];
      return {
        id: createId(),
        studentId: s.id,
        routeId: route.id,
        pickupPoint: stop,
        status: 'active',
        startDate: '2026-04-01',
        createdAt: now,
        updatedAt: now
      };
    });
    await db.insert(schema.transportAssignments).values(transportAssignmentsList);

    // Fee structure, categories & student fees
    console.log(`💰 Generating Fee management settings & bills for ${tenant.name}...`);
    const feeCategoriesData = [
      { id: createId(), tenantId: tenant.id, name: 'Tuition Fee', code: 'TUIT', description: 'Academic tuition fee', frequency: 'monthly', status: 'active', createdAt: now, updatedAt: now },
      { id: createId(), tenantId: tenant.id, name: 'Exam Fee', code: 'EXAM', description: 'Term exams fee', frequency: 'yearly', status: 'active', createdAt: now, updatedAt: now },
      { id: createId(), tenantId: tenant.id, name: 'Transport Fee', code: 'TRAN', description: 'School bus transport fee', frequency: 'monthly', status: 'active', createdAt: now, updatedAt: now }
    ];
    const createdFeeCats = await db.insert(schema.feeCategories).values(feeCategoriesData).returning();

    const tuitCat = createdFeeCats.find(c => c.code === 'TUIT')!;
    const examCat = createdFeeCats.find(c => c.code === 'EXAM')!;
    const tranCat = createdFeeCats.find(c => c.code === 'TRAN')!;

    // Create structures
    const feeStructuresList: any[] = [];
    for (const c of createdClasses) {
      // Structure varies by grade
      const tuitionAmt = 300 + (parseInt(c.classLevel) * 20);
      feeStructuresList.push(
        { id: createId(), feeCategoryId: tuitCat.id, classId: c.id, amount: tuitionAmt, academicYear: ACADEMIC_YEAR, createdAt: now, updatedAt: now },
        { id: createId(), feeCategoryId: examCat.id, classId: c.id, amount: 80, academicYear: ACADEMIC_YEAR, createdAt: now, updatedAt: now },
        { id: createId(), feeCategoryId: tranCat.id, classId: c.id, amount: 150, academicYear: ACADEMIC_YEAR, createdAt: now, updatedAt: now }
      );
    }
    await db.insert(schema.feeStructures).values(feeStructuresList);

    // Bill student fees
    const feesList: any[] = [];
    const feeReceiptsList: any[] = [];

    // Filter students assigned to transport
    const studentTransportMap = new Map(transportAssignmentsList.map(ta => [ta.studentId, ta]));

    for (let sIdx = 0; sIdx < createdStudents.length; sIdx++) {
      const student = createdStudents[sIdx]!;
      const classStructs = feeStructuresList.filter(fs => fs.classId === student.classId);
      const tuitionAmt = classStructs.find(fs => fs.feeCategoryId === tuitCat.id)!.amount;
      const examAmt = classStructs.find(fs => fs.feeCategoryId === examCat.id)!.amount;

      // Make some students have a concession
      let concessionId = '';
      if (sIdx % 10 === 0) {
        concessionId = createId();
        await db.insert(schema.feeConcessions).values({
          id: concessionId,
          tenantId: tenant.id,
          studentId: student.id,
          feeCategoryId: tuitCat.id,
          concessionType: 'percentage',
          amount: 15.0, // 15% concession
          reason: 'Academic Merit Scholarship',
          status: 'active',
          validFrom: '2026-04-01',
          validUntil: '2027-03-31',
          approvedBy: adminUser.id,
          createdAt: now,
          updatedAt: now
        });
      }

      // 1. Tuition Fee (Paid, Pending, or Overdue)
      const tuitStatus = sIdx % 3 === 0 ? 'paid' : sIdx % 3 === 1 ? 'pending' : 'overdue';
      const tuitFeeId = createId();
      const tuitionConcessionAmount = concessionId ? (tuitionAmt * 0.15) : 0;
      feesList.push({
        id: tuitFeeId,
        tenantId: tenant.id,
        studentId: student.id,
        feeCategoryId: tuitCat.id,
        amount: tuitionAmt,
        type: 'Tuition Fee',
        status: tuitStatus,
        dueDate: '2026-05-10',
        paidAmount: tuitStatus === 'paid' ? (tuitionAmt - tuitionConcessionAmount) : 0,
        concession: tuitionConcessionAmount,
        paidDate: tuitStatus === 'paid' ? '2026-05-05' : null,
        paymentMethod: tuitStatus === 'paid' ? 'online' : null,
        remarks: concessionId ? 'Merit discount applied' : null,
        createdAt: now,
        updatedAt: now
      });

      // If paid, add a receipt record
      if (tuitStatus === 'paid') {
        feeReceiptsList.push({
          id: createId(),
          tenantId: tenant.id,
          receiptNumber: `RCP-${schoolPrefix}-2026-${String(sIdx + 1).padStart(4, '0')}`,
          studentId: student.id,
          feeIds: tuitFeeId,
          totalAmount: tuitionAmt,
          paidAmount: tuitionAmt - tuitionConcessionAmount,
          concessionTotal: tuitionConcessionAmount,
          paymentMethod: 'card',
          paidDate: '2026-05-05',
          collectedBy: adminUser.id,
          status: 'completed',
          createdAt: now,
          updatedAt: now
        });
      }

      // 2. Exam Fee (Paid/Pending)
      const examStatus = sIdx % 4 === 0 ? 'pending' : 'paid';
      const examFeeId = createId();
      feesList.push({
        id: examFeeId,
        tenantId: tenant.id,
        studentId: student.id,
        feeCategoryId: examCat.id,
        amount: examAmt,
        type: 'Exam Fee',
        status: examStatus,
        dueDate: '2026-06-15',
        paidAmount: examStatus === 'paid' ? examAmt : 0,
        paidDate: examStatus === 'paid' ? '2026-06-01' : null,
        paymentMethod: examStatus === 'paid' ? 'cash' : null,
        createdAt: now,
        updatedAt: now
      });

      // 3. Transport Fee if registered
      if (studentTransportMap.has(student.id)) {
        const transAmt = classStructs.find(fs => fs.feeCategoryId === tranCat.id)!.amount;
        const transStatus = sIdx % 2 === 0 ? 'paid' : 'pending';
        feesList.push({
          id: createId(),
          tenantId: tenant.id,
          studentId: student.id,
          feeCategoryId: tranCat.id,
          amount: transAmt,
          type: 'Transport Fee',
          status: transStatus,
          dueDate: '2026-05-10',
          paidAmount: transStatus === 'paid' ? transAmt : 0,
          paidDate: transStatus === 'paid' ? '2026-05-08' : null,
          paymentMethod: transStatus === 'paid' ? 'online' : null,
          createdAt: now,
          updatedAt: now
        });
      }
    }
    // Chunk fee inserts to prevent too many variables
    for (let i = 0; i < feesList.length; i += 300) {
      await db.insert(schema.fees).values(feesList.slice(i, i + 300));
    }
    for (let i = 0; i < feeReceiptsList.length; i += 300) {
      await db.insert(schema.feeReceipts).values(feeReceiptsList.slice(i, i + 300));
    }

    // Seed Attendance
    console.log(`📅 Seeding Attendance data for ${tenant.name}...`);
    const attendanceRecords: any[] = [];
    const weekdaysForAttendance = getPastWeekdays('2026-05-01', 20); // 20 working days in May 2026

    for (const student of createdStudents) {
      for (const dateStr of weekdaysForAttendance) {
        const rand = Math.random();
        attendanceRecords.push({
          id: createId(),
          tenantId: tenant.id,
          studentId: student.id,
          classId: student.classId,
          date: dateStr,
          month: dateStr.slice(0, 7),
          status: rand > 0.08 ? 'present' : rand > 0.03 ? 'absent' : 'late',
          remarks: rand <= 0.03 ? 'Sick leave' : null,
          createdAt: now
        });
      }
    }
    for (let i = 0; i < attendanceRecords.length; i += 400) {
      await db.insert(schema.attendance).values(attendanceRecords.slice(i, i + 400));
    }

    // Staff Attendance
    console.log(`📅 Seeding Staff Attendance data for ${tenant.name}...`);
    const staffAttendanceList: any[] = [];
    const allStaffUserIds = [...createdTeacherUsers.map(u => u.id), ...createdStaffUsers.map(u => u.id)];
    for (const uId of allStaffUserIds) {
      for (const dateStr of weekdaysForAttendance) {
        const rand = Math.random();
        staffAttendanceList.push({
          id: createId(),
          userId: uId,
          tenantId: tenant.id,
          date: dateStr,
          month: dateStr.slice(0, 7),
          status: rand > 0.04 ? 'present' : 'absent',
          checkIn: rand > 0.04 ? '08:25' : null,
          checkOut: rand > 0.04 ? '15:35' : null,
          remarks: rand <= 0.04 ? 'Personal work' : null,
          createdAt: now
        });
      }
    }
    for (let i = 0; i < staffAttendanceList.length; i += 400) {
      await db.insert(schema.staffAttendance).values(staffAttendanceList.slice(i, i + 400));
    }

    // Notices and Events
    console.log(`📢 Seeding Notices and Events for ${tenant.name}...`);
    await db.insert(schema.notices).values([
      { id: createId(), tenantId: tenant.id, title: 'Welcome Back to School', content: 'We look forward to an amazing and productive new academic year 2026-2027!', authorId: adminUser.id, targetRole: 'all', priority: 'normal', createdAt: now, updatedAt: now },
      { id: createId(), tenantId: tenant.id, title: 'Inter-School Sports Registration', content: 'Register with physical education teachers before June 15th.', authorId: adminUser.id, targetRole: 'student', priority: 'high', createdAt: now, updatedAt: now },
      { id: createId(), tenantId: tenant.id, title: 'PTA Meeting Schedule', content: 'Parents are requested to join the PTA conference in main auditorium this Friday at 4 PM.', authorId: adminUser.id, targetRole: 'parent', priority: 'urgent', createdAt: now, updatedAt: now },
      { id: createId(), tenantId: tenant.id, title: 'Grading Guidelines v1.0', content: 'Teachers please follow updated grading schemas for midterms.', authorId: adminUser.id, targetRole: 'teacher', priority: 'normal', createdAt: now, updatedAt: now }
    ]);

    await db.insert(schema.events).values([
      { id: createId(), tenantId: tenant.id, title: 'Annual Science Fair', description: 'Science exhibits by students from grades 4 to 6.', date: '2026-06-25', endDate: '2026-06-26', type: 'event', targetRole: 'all', color: '#10b981', allDay: true, location: 'School Indoor Stadium', createdAt: now },
      { id: createId(), tenantId: tenant.id, title: 'Midterm Assessments', description: 'First term assessments scheduled.', date: '2026-08-10', endDate: '2026-08-20', type: 'exam', targetRole: 'student', color: '#f59e0b', allDay: false, location: 'Class Rooms', createdAt: now },
      { id: createId(), tenantId: tenant.id, title: 'Summer Vacation Break', description: 'School closed for summer holidays.', date: '2026-07-01', endDate: '2026-07-31', type: 'holiday', targetRole: 'all', color: '#ef4444', allDay: true, location: 'Campus-wide', createdAt: now }
    ]);

    // Support Tickets & Messages
    console.log(`🎫 Seeding Support Tickets for ${tenant.name}...`);
    const ticketsData: any[] = [];
    const ticketMsgs: any[] = [];
    for (let tIdx = 0; tIdx < 5; tIdx++) {
      const ticketId = createId();
      const parent = createdParents[tIdx % createdParents.length]!;
      ticketsData.push({
        id: ticketId,
        tenantId: tenant.id,
        title: `Inquiry regarding ${['Transport Bus Delay', 'Fee Payment Issue', 'Exam Syllabus Query', 'Leave Request Submission', 'ID Card Replacement'][tIdx]}`,
        description: `Please resolve my issue as soon as possible. Detailed message content for ticket #${tIdx + 1}.`,
        status: ['open', 'in_progress', 'resolved'][tIdx % 3],
        priority: ['low', 'medium', 'high', 'urgent'][tIdx % 4],
        category: ['general', 'billing', 'academics', 'technical', 'general'][tIdx % 5],
        createdBy: parent.userId,
        assignedTo: createdTeachers[tIdx % createdTeachers.length]!.userId,
        createdAt: now,
        updatedAt: now
      });

      // Messages
      ticketMsgs.push(
        { id: createId(), ticketId: ticketId, userId: parent.userId, message: 'Hello, I wanted to follow up on this query.', createdAt: now },
        { id: createId(), ticketId: ticketId, userId: createdTeachers[tIdx % createdTeachers.length]!.userId, message: 'We are investigating this issue. We will update you shortly.', createdAt: now }
      );
    }
    await db.insert(schema.tickets).values(ticketsData);
    await db.insert(schema.ticketMessages).values(ticketMsgs);

    // Leaves
    console.log(`🍂 Seeding Leaves for ${tenant.name}...`);
    const leavesData = Array.from({ length: 4 }, (_, i) => {
      const teacher = createdTeachers[i % createdTeachers.length]!;
      const tUser = createdTeacherUsers.find(u => u.id === teacher.userId)!;
      return {
        id: createId(),
        tenantId: tenant.id,
        userId: tUser.id,
        userName: tUser.name,
        userEmail: tUser.email,
        role: 'teacher',
        leaveType: ['Sick Leave', 'Casual Leave', 'Maternity Leave', 'Medical Leave'][i % 4]!,
        startDate: `2026-06-0${1 + i}`,
        endDate: `2026-06-0${3 + i}`,
        reason: 'Not feeling well, need rest.',
        status: ['pending', 'approved', 'rejected', 'approved'][i % 4]!,
        approvedBy: adminUser.id,
        approverRemarks: 'Approved as requested.',
        createdAt: now,
        updatedAt: now
      };
    });
    await db.insert(schema.leaves).values(leavesData);

    // Exams & Exam Results
    console.log(`📝 Seeding Exams & Exam Results for ${tenant.name}...`);
    const examRecords: any[] = [];
    const examResultsRecords: any[] = [];

    for (const sub of createdSubjects.slice(0, 8)) {
      const examId = createId();
      examRecords.push({
        id: examId,
        tenantId: tenant.id,
        classId: sub.classId,
        subjectId: sub.id,
        name: `Term-1 ${sub.name} Exam`,
        examType: 'midterm',
        academicYear: ACADEMIC_YEAR,
        date: '2026-09-15',
        startTime: '10:00',
        endTime: '12:00',
        totalMarks: 100,
        passingMarks: 40,
        status: 'completed',
        createdAt: now,
        updatedAt: now
      });

      // Results for students in this class
      const classStudents = createdStudents.filter(s => s.classId === sub.classId);
      for (const s of classStudents) {
        const marks = 45 + Math.floor(Math.random() * 50);
        examResultsRecords.push({
          id: createId(),
          examId: examId,
          studentId: s.id,
          marksObtained: marks,
          status: marks >= 40 ? 'pass' : 'fail',
          remarks: marks > 85 ? 'Excellent performance!' : 'Satisfactory result.',
          createdAt: now,
          updatedAt: now
        });
      }
    }
    await db.insert(schema.exams).values(examRecords);
    if (examResultsRecords.length > 0) {
      await db.insert(schema.examResults).values(examResultsRecords);
    }

    // Assessments & Assessment Grades
    console.log(`🧠 Seeding Assessments for ${tenant.name}...`);
    const assessmentsRecords: any[] = [];
    const assessmentGradesRecords: any[] = [];

    for (const sub of createdSubjects.slice(0, 10)) {
      const assId = createId();
      assessmentsRecords.push({
        id: assId,
        tenantId: tenant.id,
        classId: sub.classId,
        subjectId: sub.id,
        teacherId: sub.teacherId!,
        title: `Quiz 1 - Basic Concepts`,
        type: 'quiz',
        totalMarks: 25,
        passingMarks: 10,
        status: 'completed',
        createdAt: now,
        updatedAt: now
      });

      const classStudents = createdStudents.filter(s => s.classId === sub.classId);
      for (const s of classStudents) {
        const marks = 12 + Math.floor(Math.random() * 13);
        assessmentGradesRecords.push({
          id: createId(),
          tenantId: tenant.id,
          assessmentId: assId,
          studentId: s.id,
          marksObtained: marks,
          remarks: 'Good Attempt',
          createdAt: now,
          updatedAt: now
        });
      }
    }
    await db.insert(schema.assessments).values(assessmentsRecords);
    if (assessmentGradesRecords.length > 0) {
      for (let i = 0; i < assessmentGradesRecords.length; i += 300) {
        await db.insert(schema.assessmentGrades).values(assessmentGradesRecords.slice(i, i + 300));
      }
    }

    // Homework Assignments & Submissions
    console.log(`✍️ Seeding Assignments for ${tenant.name}...`);
    const assValues: any[] = [];
    const subValues: any[] = [];

    for (let i = 0; i < Math.min(15, createdSubjects.length); i++) {
      const sub = createdSubjects[i]!;
      const assId = createId();
      assValues.push({
        id: assId,
        tenantId: tenant.id,
        subjectId: sub.id,
        classId: sub.classId,
        teacherId: sub.teacherId!,
        title: `Homework Assignment ${i + 1}`,
        description: `Answer chapter ${i + 1} questions in notebook.`,
        dueDate: '2026-06-30',
        status: 'active',
        mode: 'online',
        createdAt: now,
        updatedAt: now
      });

      const classStudents = createdStudents.filter(s => s.classId === sub.classId).slice(0, 5); // 5 submissions per assignment
      for (const student of classStudents) {
        subValues.push({
          id: createId(),
          tenantId: tenant.id,
          assignmentId: assId,
          studentId: student.id,
          content: 'I have attached my scanned homework PDF below.',
          status: 'submitted',
          submittedAt: now,
          grade: ['A', 'B', 'A+', 'B+'][i % 4],
          feedback: 'Well done! Keep up the good work.'
        });
      }
    }
    await db.insert(schema.assignments).values(assValues);
    if (subValues.length > 0) {
      await db.insert(schema.submissions).values(subValues);
    }

    // Expenses
    console.log(`💸 Seeding Expenses for ${tenant.name}...`);
    const expenseCatsCreated = await db.insert(schema.expenseCategories).values({
      id: createId(),
      tenantId: tenant.id,
      name: 'Utility Bills',
      description: 'Electricity, Water, and Internet expenses',
      createdAt: now,
      updatedAt: now
    }).returning();
    const expenseCat = expenseCatsCreated[0]!;

    await db.insert(schema.expenses).values([
      {
        id: createId(),
        tenantId: tenant.id,
        categoryId: expenseCat.id,
        amount: 450,
        date: '2026-05-28',
        description: 'Electricity bill for Admin Block',
        paymentMethod: 'bank_transfer',
        referenceNo: 'TXN89123891',
        status: 'paid',
        createdAt: now,
        updatedAt: now
      },
      {
        id: createId(),
        tenantId: tenant.id,
        categoryId: expenseCat.id,
        amount: 85,
        date: '2026-06-01',
        description: 'High-speed internet lease line renewal',
        paymentMethod: 'card',
        referenceNo: 'TXN91203912',
        status: 'paid',
        createdAt: now,
        updatedAt: now
      }
    ]);

    // Certificates
    console.log(`📜 Seeding Certificates for ${tenant.name}...`);
    await db.insert(schema.certificates).values([
      {
        id: createId(),
        tenantId: tenant.id,
        studentId: createdStudents[0]!.id,
        certificateType: 'Character Certificate',
        certificateNo: `${schoolPrefix}-CRT-2026-0001`,
        issueDate: '2026-05-15',
        content: JSON.stringify({ conduct: 'Exemplary', character: 'Excellent' }),
        status: 'active',
        createdAt: now,
        updatedAt: now
      }
    ]);

    // Promotions
    console.log(`📈 Seeding Promotion History for ${tenant.name}...`);
    await db.insert(schema.promotions).values([
      {
        id: createId(),
        tenantId: tenant.id,
        studentId: createdStudents[1]!.id,
        fromClassId: createdClasses[0]!.id,
        toClassId: createdClasses[1]!.id,
        academicYear: ACADEMIC_YEAR,
        status: 'completed',
        remarks: 'Promoted based on excellent annual assessment score.',
        type: 'promotion',
        createdAt: now,
        updatedAt: now
      }
    ]);

    // Audit logs for school actions
    console.log(`🗃️ Seeding Audit logs for ${tenant.name}...`);
    await db.insert(schema.auditLogs).values([
      {
        id: createId(),
        tenantId: tenant.id,
        userId: adminUser.id,
        action: 'CREATE_CLASS',
        resource: 'Class',
        details: JSON.stringify({ classesCreated: createdClasses.length }),
        ipAddress: '127.0.0.1',
        createdAt: now
      },
      {
        id: createId(),
        tenantId: tenant.id,
        userId: adminUser.id,
        action: 'PUBLISH_NOTICE',
        resource: 'Notice',
        details: JSON.stringify({ noticeTitle: 'Welcome Back to School' }),
        ipAddress: '127.0.0.1',
        createdAt: now
      }
    ]);
  }

  // Create active parent subscriptions
  console.log('💳 Seeding Parent Subscriptions...');
  const allParents = await db.select().from(schema.parents);
  const subscriptionsList = allParents.map((p, i) => ({
    id: createId(),
    tenantId: p.createdAt ? '' : '', // Will be updated if schema constraints require it, otherwise let's map parent tenant
    parentId: p.id,
    planName: ['Basic Monthly', 'Standard Annual', 'Premium Annual'][i % 3]!,
    planId: `plan-${i % 3}`,
    amount: [15, 120, 200][i % 3]!,
    period: i % 3 === 0 ? 'monthly' : 'yearly',
    status: 'active',
    paymentMethod: 'card',
    transactionId: `txn_sub_${createId().slice(0, 10)}`,
    startDate: '2026-04-01',
    endDate: i % 3 === 0 ? '2026-07-01' : '2027-03-31',
    autoRenew: true,
    createdAt: now,
    updatedAt: now
  }));

  // Update tenantId for subscriptions to avoid null issues if they are restricted
  // (We select the user tenant ID for that parent)
  const parentUsersList = await db.select().from(schema.users).where(sql`role = 'parent'`);
  const parentUserMap = new Map(parentUsersList.map(u => [u.id, u]));

  subscriptionsList.forEach(s => {
    const parentRecord = allParents.find(p => p.id === s.parentId)!;
    const userRecord = parentUserMap.get(parentRecord.userId)!;
    s.tenantId = userRecord.tenantId!;
  });

  for (let i = 0; i < subscriptionsList.length; i += 300) {
    await db.insert(schema.subscriptions).values(subscriptionsList.slice(i, i + 300));
  }

  const end = Date.now();
  console.log('\n💎==================================================');
  console.log('🎉 COMPREHENSIVE SEED COMPLETED SUCCESSFULLY!');
  console.log(`⏱️ Seeding duration: ${((end - start) / 1000).toFixed(1)} seconds`);
  console.log('--------------------------------------------------');
  console.log(`Schools (Tenants) Seeded  : 5`);
  console.log(`Super Admin User Created   : shoaibalamcse0786@gmail.com`);
  console.log(`Teachers Seeded           : 100`);
  console.log(`Staff Members Seeded      : 25`);
  console.log(`Parents Seeded            : 500`);
  console.log(`Students Seeded           : 500`);
  console.log(`Total Academic Classes     : 30`);
  console.log(`Timetable Periods Scheduled: ${30 * 5 * 5}`);
  console.log(`Common Password for All   : ${PASSWORD}`);
  console.log('==================================================💎\n');
  process.exit(0);
}

// Helpers
function schoolNameAbbreviation(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

function getPastWeekdays(startDateStr: string, count: number): string[] {
  const dates: string[] = [];
  const curr = new Date(startDateStr);
  while (dates.length < count) {
    const day = curr.getDay();
    if (day !== 0 && day !== 6) { // Avoid Sunday (0) and Saturday (6)
      dates.push(formatDate(curr));
    }
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

main().catch(e => {
  console.error('❌ Failed running full seed:', e);
  process.exit(1);
});
