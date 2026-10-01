import "dotenv/config";
import { db } from "../lib/db";
import * as schema from "./schema";
import { eq, sql } from "drizzle-orm";
import { formatDate } from "../lib/date-utils";

const PASSWORD = 'test@123';
const TENANT_SLUG = 'demo-academy';
const SUPER_ADMIN_EMAIL = 'shoaibalamcse0786@gmail.com';

/**
 * Wipes one tenant, not the database. This used to be a `TRUNCATE ... RESTART IDENTITY
 * CASCADE` over every table, which also deleted the `loadtest-academy` fixture — 1.1M
 * attendance rows sharing this schema — so a re-seed cost a afternoon to rebuild.
 */
async function wipeTenant(slug: string) {
  const [tenant] = await db.select({ id: schema.tenants.id }).from(schema.tenants).where(eq(schema.tenants.slug, slug));
  if (!tenant) return;
  const tenantId = tenant.id;

  const userIds = sql`(select "id" from "User" where "tenantId" = ${tenantId})`;
  const classIds = sql`(select "id" from "Class" where "tenantId" = ${tenantId})`;
  const studentIds = sql`(select "id" from "Student" where "userId" in ${userIds} or "classId" in ${classIds})`;

  // These carry no tenantId, so each is scoped through the row it points at — and each has
  // to go before the sweep below removes those parents. There are only two real foreign
  // keys in this schema, so nothing cascades on its own.
  const throughParents = [
    sql`delete from "ExamResult" where "examId" in (select "id" from "Exam" where "tenantId" = ${tenantId}) or "studentId" in ${studentIds}`,
    sql`delete from "ClassTeacher" where "classId" in ${classIds} or "teacherId" in (select "id" from "Teacher" where "userId" in ${userIds})`,
    sql`delete from "Timetable" where "classId" in ${classIds}`,
    sql`delete from "FeeStructure" where "classId" in ${classIds} or "feeCategoryId" in (select "id" from "FeeCategory" where "tenantId" = ${tenantId})`,
    sql`delete from "TransportAssignment" where "studentId" in ${studentIds} or "routeId" in (select "id" from "TransportRoute" where "tenantId" = ${tenantId})`,
    sql`delete from "TicketMessage" where "ticketId" in (select "id" from "Ticket" where "tenantId" = ${tenantId}) or "userId" in ${userIds}`,
    sql`delete from "NotificationToken" where "userId" in ${userIds}`,
    sql`delete from "Student" where "userId" in ${userIds} or "classId" in ${classIds}`,
    sql`delete from "Teacher" where "userId" in ${userIds}`,
    sql`delete from "Parent" where "userId" in ${userIds}`,
  ];
  for (const statement of throughParents) await db.execute(statement);

  // Read the tenant-scoped tables from the schema itself so a table added next month
  // cannot quietly survive the wipe.
  const tables = await db.execute(sql`
    select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'tenantId'
      and table_name in (
        select table_name from information_schema.tables
        where table_schema = 'public' and table_type = 'BASE TABLE'
      )`);
  for (const row of tables) {
    const table = row['table_name'];
    if (typeof table !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) continue;
    await db.execute(sql`delete from ${sql.identifier(table)} where "tenantId" = ${tenantId}`);
  }

  // The seed's own super admin belongs to no tenant, so the sweep above left it standing.
  await db.execute(sql`delete from "User" where "tenantId" is null and "email" = ${SUPER_ADMIN_EMAIL}`);
  await db.execute(sql`delete from "Tenant" where "id" = ${tenantId}`);
  console.log(`🧹 Wiped ${slug}; every other tenant left untouched.`);
}


async function main() {
  console.log('🌱 Starting Rich Seed with Drizzle...');
  const hashedPassword = await Bun.password.hash(PASSWORD);
  const now = new Date();

  await wipeTenant(TENANT_SLUG);

  const [tenant] = await db.insert(schema.tenants).values({
    name: 'Demo Academy',
    slug: TENANT_SLUG,
    plan: 'enterprise',
    status: 'active',
    startDate: '2026-04-01',
    endDate: '2026-09-31',
    maxStudents: 500,
    maxTeachers: 50,
    maxParents: 300,
    maxClasses: 30,
    settings: JSON.stringify({ theme: 'emerald', currency: 'USD' }),
    createdAt: now,
    updatedAt: now
  }).returning();

  if (!tenant) throw new Error("Failed to create tenant");

  // The session and the numbering rules are things a school sets in the UI, not things a
  // seed makes, and the wipe destroys them. Without the current year every URL under
  // /demo-academy/<session>/ resolves to nothing, so the screen comes back blank after a
  // re-seed. These mirror the rows the demo school already had.
  await db.insert(schema.academicYears).values([
    { tenantId: tenant.id, name: '2025-2026', startDate: '2026-05-01', endDate: '2026-11-24', status: 'active', isCurrent: false, createdAt: now, updatedAt: now },
    { tenantId: tenant.id, name: '2026-27', startDate: '2026-06-30', endDate: '2027-09-29', status: 'active', isCurrent: true, createdAt: now, updatedAt: now },
  ]);

  await db.insert(schema.studentIdSettings).values({
    tenantId: tenant.id,
    schoolCode: 'DEL',
    rollNumberEnabled: true,
    rollNumberStartingNumber: 1,
    createdAt: now,
    updatedAt: now,
  });

  const mkUser = async (email: string, name: string, role: string, tenantId?: string) => {
    const [u] = await db.insert(schema.users).values({
      email,
      name,
      role,
      password: hashedPassword,
      tenantId: tenantId || null,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }).returning();
    return u!;
  };

  const superAdmin = await mkUser(SUPER_ADMIN_EMAIL, 'Super Admin', 'super_admin');
  const admin = await mkUser('admin@school.com', 'School Admin', 'admin', tenant.id);

  const teacherUsers = await Promise.all(Array.from({ length: 40 }, (_, i: number) => mkUser(`teacher${String(i + 1).padStart(3, '0')}@school.com`, `Teacher ${i + 1}`, 'teacher', tenant.id)));
  const parentUsers = await Promise.all(Array.from({ length: 400 }, (_, i: number) => mkUser(`parent${String(i + 1).padStart(3, '0')}@school.com`, `Parent ${i + 1}`, 'parent', tenant.id)));
  const studentUsers = await Promise.all(Array.from({ length: 400 }, (_, i: number) => mkUser(`student${String(i + 1).padStart(3, '0')}@school.com`, `Student ${i + 1}`, 'student', tenant.id)));
  const staffUsers = await Promise.all(Array.from({ length: 10 }, (_, i: number) => mkUser(`staff${String(i + 1).padStart(3, '0')}@school.com`, `Staff ${i + 1}`, 'staff', tenant.id)));

  const teachers = await Promise.all(teacherUsers.map(async (u: any, i: number) => {
    const [t] = await db.insert(schema.teachers).values({
      userId: u.id,
      qualification: ['M.Ed', 'B.Ed', 'PhD', 'MSc', 'MA'][i % 5],
      experience: `${(i % 10) + 1} years`,
      joiningDate: '2024-04-01',
      createdAt: now,
      updatedAt: now
    }).returning();
    return t!;
  }));

  const parents = await Promise.all(parentUsers.map(async (u: any, i: number) => {
    const [p] = await db.insert(schema.parents).values({
      userId: u.id,
      occupation: ['Engineer', 'Doctor', 'Business', 'Teacher', 'Lawyer'][i % 5],
      createdAt: now,
      updatedAt: now
    }).returning();
    return p!;
  }));

  const classes = await Promise.all(Array.from({ length: 20 }, async (_, i) => {
    const [c] = await db.insert(schema.classes).values({
      name: `Class ${Math.floor(i / 2) + 1}`,
      section: i % 2 === 0 ? 'A' : 'B',
      classLevel: `${Math.floor(i / 2) + 1}`,
      capacity: 40,
      tenantId: tenant.id,
      createdAt: now,
      updatedAt: now
    }).returning();
    return c!;
  }));

  const students = await Promise.all(studentUsers.map(async (u: any, i: number) => {
    const c = classes[i % classes.length]!;
    const [s] = await db.insert(schema.students).values({
      userId: u.id,
      rollNumber: `${c.classLevel}${c.section}${String(i + 1).padStart(3, '0')}`,
      classId: c.id,
      parentId: parents[i]!.id,
      academicYear: '2024-2025',
      dateOfBirth: `201${i % 9}-0${(i % 9) + 1}-15`,
      gender: i % 2 === 0 ? 'male' : 'female',
      bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'A-'][i % 5],
      admissionDate: '2024-04-01',
      status: 'active',
      createdAt: now,
      updatedAt: now
    }).returning();
    return s!;
  }));

  const subs: any[] = [];
  const sn = ['Mathematics', 'Science', 'English', 'History', 'Geography'];
  for (const c of classes) {
    for (let s = 0; s < 5; s++) {
      const [sub] = await db.insert(schema.subjects).values({
        name: sn[s]!,
        code: `${sn[s]!.slice(0, 3).toUpperCase()}${c.classLevel}${c.section}`,
        classId: c.id,
        tenantId: tenant.id,
        teacherId: teachers[s % teachers.length]!.id,
        createdAt: now,
        updatedAt: now
      }).returning();
      subs.push(sub!);
    }
  }

  await Promise.all(teachers.map((t: any, i: number) => {
    return db.insert(schema.classTeachers).values({
      classId: classes[i % classes.length]!.id,
      teacherId: t.id,
      isClassTeacher: i < classes.length,
      createdAt: now
    });
  }));

  const att: any[] = [];
  for (const s of students) {
    for (let d = 0; d < 30; d++) {
      const dt = new Date('2024-04-01');
      dt.setDate(dt.getDate() + d);
      const ds = formatDate(dt);
      att.push({
        tenantId: tenant.id,
        studentId: s.id,
        classId: s.classId,
        date: ds,
        month: ds.slice(0, 7),
        status: ['present', 'present', 'present', 'present', 'absent'][Math.floor(Math.random() * 5)],
        createdAt: now
      });
    }
  }
  for (let i = 0; i < att.length; i += 500) {
    await db.insert(schema.attendance).values(att.slice(i, i + 500));
  }

  const gr: any[] = [];
  let gc = 0;
  for (const s of students) {
    const ss = subs.filter(x => x.classId === s.classId).slice(0, 3);
    for (const su of ss) {
      gr.push({
        tenantId: tenant.id,
        studentId: s.id,
        subjectId: su.id,
        teacherId: teachers[gc % teachers.length]!.id,
        examType: ['unit_test', 'midterm', 'final'][gc % 3],
        marks: 50 + Math.floor(Math.random() * 45),
        maxMarks: 100,
        grade: ['A', 'B', 'C', 'A+', 'B+'][gc % 5],
        createdAt: now,
        updatedAt: now
      });
      gc++;
    }
  }
  for (let i = 0; i < gr.length; i += 500) {
    await db.insert(schema.grades).values(gr.slice(i, i + 500));
  }

  const fcats: any[] = [];
  for (const n of ['Tuition', 'Exam', 'Transport', 'Library', 'Sports']) {
    const [fcat] = await db.insert(schema.feeCategories).values({
      tenantId: tenant.id,
      name: n,
      code: n.slice(0, 3).toUpperCase(),
      description: `${n} fee`,
      frequency: n === 'Tuition' ? 'monthly' : 'yearly',
      status: 'active',
      createdAt: now,
      updatedAt: now
    }).returning();
    fcats.push(fcat!);
  }

  const fe: any[] = [];
  let fcc = 0;
  for (const s of students) {
    for (const c of fcats) {
      const a = c.name === 'Tuition' ? 500 : 1000;
      fe.push({
        tenantId: tenant.id,
        studentId: s.id,
        feeCategoryId: c.id,
        amount: a,
        type: c.name,
        status: ['pending', 'paid', 'overdue'][fcc % 3],
        dueDate: '2024-04-15',
        paidAmount: fcc % 3 === 1 ? a : 0,
        createdAt: now,
        updatedAt: now
      });
      fcc++;
    }
  }
  for (let i = 0; i < fe.length; i += 500) {
    await db.insert(schema.fees).values(fe.slice(i, i + 500));
  }

  await db.insert(schema.notices).values(Array.from({ length: 20 }, (_, i: number) => ({
    tenantId: tenant.id,
    title: `Notice ${i + 1}`,
    content: `Content ${i + 1}`,
    authorId: admin.id,
    targetRole: ['all', 'student', 'teacher', 'parent'][i % 4],
    priority: ['normal', 'high', 'urgent'][i % 3],
    createdAt: now,
    updatedAt: now
  })));

  await db.insert(schema.events).values(Array.from({ length: 15 }, (_, i) => ({
    tenantId: tenant.id,
    title: `Event ${i + 1}`,
    description: `Desc ${i + 1}`,
    date: `2024-04-${String((i % 28) + 1).padStart(2, '0')}`,
    type: ['exam', 'holiday', 'event', 'meeting', 'sports'][i % 5],
    targetRole: 'all',
    color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'][i % 4],
    allDay: i % 2 === 0,
    location: i % 3 === 0 ? 'School Hall' : null,
    createdAt: now
  })));

  await db.insert(schema.tickets).values(Array.from({ length: 25 }, (_, i) => ({
    tenantId: tenant.id,
    title: `Ticket ${i + 1}`,
    description: `Issue ${i + 1}`,
    status: ['open', 'in_progress', 'resolved'][i % 3],
    priority: ['low', 'medium', 'high', 'urgent'][i % 4],
    category: ['general', 'billing', 'technical', 'academics'][i % 4],
    createdBy: i % 2 === 0 ? admin.id : superAdmin.id,
    assignedTo: i % 3 === 0 ? teachers[0]!.userId : null,
    createdAt: now,
    updatedAt: now
  })));

  await db.insert(schema.assignments).values(Array.from({ length: 30 }, (_, i) => {
    const su = subs[i % subs.length]!;
    return {
      tenantId: tenant.id,
      subjectId: su.id,
      classId: su.classId,
      teacherId: teachers[i % teachers.length]!.id,
      title: `Assignment ${i + 1}`,
      description: `Complete exercises for assignment ${i + 1}`,
      dueDate: `2024-04-${String((i % 28) + 1).padStart(2, '0')}`,
      createdAt: now,
      updatedAt: now
    };
  }));

  await db.insert(schema.subscriptions).values(parents.map((p: any, i: number) => ({
    tenantId: tenant.id,
    parentId: p.id,
    planName: ['Basic', 'Standard', 'Premium'][i % 3]!,
    planId: `plan-${i % 3}`,
    amount: [99, 199, 299][i % 3]!,
    period: 'yearly',
    status: 'active',
    paymentMethod: 'card',
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    autoRenew: true,
    createdAt: now,
    updatedAt: now
  })));

  await db.insert(schema.platformRoles).values({
    name: 'Support Agent',
    description: 'Handles tickets',
    color: '#6366f1',
    permissions: JSON.stringify({ tickets: ['view', 'edit'], users: ['view'] }),
    createdAt: now,
    updatedAt: now
  });

  await db.insert(schema.customRoles).values({
    tenantId: tenant.id,
    name: 'Finance Manager',
    description: 'Manages fees',
    color: '#10b981',
    permissions: JSON.stringify({ fees: ['view', 'create', 'edit'], receipts: ['view', 'create'] }),
    createdAt: now,
    updatedAt: now
  });

  console.log('\n🚀 SEEDING COMPLETE!');
  console.log('═══════════════════════════════════════');
  console.log('Users:', 1 + 1 + 40 + 400 + 400 + 10, '| Classes:', classes.length, '| Subjects:', subs.length);
  console.log('Attendance:', att.length, '| Grades:', gr.length, '| Fees:', fe.length);
  console.log('Password for ALL:', PASSWORD);
  console.log('═══════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  });
