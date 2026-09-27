import "dotenv/config";
import * as schema from "./schema";
import { sql } from "drizzle-orm";
import { formatDate } from "../lib/date-utils";
import { createId } from '@paralleldrive/cuid2';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import readline from 'readline';

const connectionString = process.env.DATABASE_URL!.replace(/^["']|["']$/g, '');
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema, logger: false });

const PASSWORD = 'test@123';
const SCHOOL_COUNT = 200;
const ATTENDANCE_DAYS = 120; // ~6 months

function printProgress(current: number, total: number, startTime: number, label: string) {
  const percentage = Math.round((current / total) * 100);
  const barLength = 50;
  const completedLength = Math.round((current / total) * barLength);
  
  const GREEN = "\x1b[32m";
  const BLUE = "\x1b[34m";
  const YELLOW = "\x1b[33m";
  const CYAN = "\x1b[36m";
  const RESET = "\x1b[0m";
  const BOLD = "\x1b[1m";

  const bar = GREEN + '█'.repeat(completedLength) + RESET + '░'.repeat(barLength - completedLength);
  
  const elapsed = (Date.now() - startTime) / 1000;
  const eta = current > 0 ? (elapsed / current) * (total - current) : 0;

  readline.cursorTo(process.stdout, 0);
  process.stdout.write(
    `${BOLD}${CYAN}LIVE SEEDING:${RESET} [${bar}] ${BOLD}${percentage}%${RESET}\n` +
    `${BOLD}${BLUE}📦 RECORDS  :${RESET} ${current.toLocaleString()}000 | ` +
    `${BOLD}${YELLOW}TABLE    :${RESET} ${label.padEnd(12)} | ` +
    `${BOLD}${YELLOW}TIME LEFT:${RESET} ${eta.toFixed(0)}s    `
  );
  readline.moveCursor(process.stdout, 0, -1);
}

async function main() {
  console.clear();
  console.log(`\x1b[1m\x1b[35m═══════════════════════════════════════════════════════════════\x1b[0m`);
  console.log(`\x1b[1m\x1b[32m🚀 ULTIMATE DATA ENGINE v3.1 (FULL PROGRESS)\x1b[0m`);
  console.log(`\x1b[36mTarget: ~1,000,000 Production Records\x1b[0m`);
  console.log(`\x1b[1m\x1b[35m═══════════════════════════════════════════════════════════════\x1b[0m\n`);

  const start = Date.now();
  const hashedPassword = await Bun.password.hash(PASSWORD);
  const now = new Date();

  // 1. CLEAN DATABASE
  try {
    process.stdout.write('🧹 Wiping database... ');
    await db.execute(sql`
      TRUNCATE TABLE 
        "TicketMessage", "Ticket", "ExamResult", "Exam", "Leave", 
        "StaffAttendance", "Certificate", "Promotion", "TransportAssignment", 
        "TransportRoute", "Vehicle", "FeeReceipt", "Fee", "FeeStructure", 
        "FeeCategory", "Grade", "Attendance", "Submission", "Assignment", 
        "Timetable", "Subject", "ClassTeacher", "Student", "Teacher", 
        "Parent", "Notice", "Event", "Subscription", "AuditLog", 
        "CustomRole", "PlatformRole", "Class", "User", "Tenant", "PlatformSetting" 
      RESTART IDENTITY CASCADE;
    `);
    console.log('\x1b[32mCLEAN\x1b[0m');
  } catch (e) {
    console.error('\n❌ FAILED. Stop Dev Server and try again.');
    process.exit(1);
  }

  // 2. DATA CONTAINERS
  const tenants: any[] = [];
  const users: any[] = [];
  const teachers: any[] = [];
  const parents: any[] = [];
  const classes: any[] = [];
  const students: any[] = [];
  const subjects: any[] = [];

  process.stdout.write('📦 Building virtual infrastructure... ');

  for (let s = 1; s <= SCHOOL_COUNT; s++) {
    const tenantId = createId();
    tenants.push({ id: tenantId, name: `Global Academy ${s}`, slug: `school-${s}`, plan: 'enterprise', status: 'active', startDate: '2024-04-01', createdAt: now, updatedAt: now, settings: '{}' });
    users.push({ tenantId, email: `admin@school${s}.com`, name: `Admin S${s}`, role: 'admin', password: hashedPassword, isActive: true });
    
    if (s === 1) {
      users.push({ email: 'shoaibalamcse0786@gmail.com', name: 'Shoaib Alam', role: 'super_admin', password: hashedPassword, isActive: true });
    }

    for (let t = 1; t <= 50; t++) {
      const uId = createId();
      users.push({ id: uId, tenantId, email: `teacher${t}@school${s}.com`, name: `Teacher ${t} S${s}`, role: 'teacher', password: hashedPassword, isActive: true });
      teachers.push({ id: createId(), userId: uId, qualification: 'PhD', experience: '10 years', joiningDate: '2024-04-01' });
    }

    for (let st = 1; st <= 20; st++) {
      users.push({ tenantId, email: `staff${st}@school${s}.com`, name: `Staff ${st} S${s}`, role: 'staff', password: hashedPassword, isActive: true });
    }

    for (let p = 1; p <= 400; p++) {
      const pUserId = createId(), pId = createId();
      users.push({ id: pUserId, tenantId, email: `parent${p}@school${s}.com`, name: `Parent ${p} S${s}`, role: 'parent', password: hashedPassword, isActive: true });
      parents.push({ id: pId, userId: pUserId, occupation: 'Engineer' });
      const sUserId = createId(), sId = createId();
      users.push({ id: sUserId, tenantId, email: `student${p}@school${s}.com`, name: `Student ${p} S${s}`, role: 'student', password: hashedPassword, isActive: true });
      students.push({ id: sId, tenantId, userId: sUserId, parentId: pId, rollNumber: `S${s}R${p}`, classId: 'placeholder', academicYear: '2024-2025' });
    }

    for (let c = 1; c <= 20; c++) {
      const classId = createId();
      classes.push({ id: classId, tenantId, name: `Grade ${Math.floor((c-1)/2)+1}`, section: c % 2 === 0 ? 'B' : 'A', grade: `${Math.floor((c-1)/2)+1}`, capacity: 40 });
    }
  }
  console.log('\x1b[32mREADY\x1b[0m');

  // 3. SUBJECTS & CALCS
  const sn = ['Math', 'Science', 'English', 'History', 'Physics'];
  for (let c of classes) {
    const schoolIdx = Math.floor(classes.indexOf(c) / 20);
    const schoolTeachers = teachers.slice(schoolIdx * 50, (schoolIdx + 1) * 50);
    for (let i = 0; i < 5; i++) {
      subjects.push({ id: createId(), tenantId: c.tenantId, name: sn[i], code: `${sn[i]!.toUpperCase()}${c.grade}`, classId: c.id, teacherId: schoolTeachers[i % 50]!.id });
    }
  }

  students.forEach((s, i) => {
    const schoolIdx = Math.floor(i / 400);
    const classOffset = schoolIdx * 20;
    s.classId = classes[classOffset + (i % 20)]!.id;
  });

  // 3.5 EXAMS
  const exams: any[] = [];
  const examMap = new Map<string, string>(); // Key: subjectId, Value: examId

  for (const sub of subjects) {
    const examId = createId();
    exams.push({
      id: examId,
      tenantId: sub.tenantId,
      classId: sub.classId,
      subjectId: sub.id,
      name: `Midterm Exam - ${sub.name}`,
      examType: 'midterm',
      academicYear: '2024-2025',
      date: '2024-10-15',
      startTime: '09:00',
      endTime: '12:00',
      totalMarks: 100,
      passingMarks: 40,
      status: 'completed',
      createdAt: now,
      updatedAt: now
    });
    examMap.set(sub.id, examId);
  }

  // 5. TOTAL PROGRESS CALC
  let weekdaysCount = 0;
  for (let d = 0; d < ATTENDANCE_DAYS; d++) {
    const dt = new Date('2024-04-01');
    dt.setDate(dt.getDate() + d);
    if (dt.getDay() !== 0 && dt.getDay() !== 6) {
      weekdaysCount++;
    }
  }

  const totalSteps = 
    Math.ceil(tenants.length / 100) + 
    Math.ceil(users.length / 400) + 
    Math.ceil(teachers.length / 500) + 
    Math.ceil(parents.length / 500) + 
    Math.ceil(classes.length / 500) + 
    Math.ceil(students.length / 400) + 
    Math.ceil(subjects.length / 500) +
    Math.ceil(exams.length / 500) +
    Math.ceil((students.length * weekdaysCount) / 1000) + 
    Math.ceil((students.length * 3) / 1000) + 
    Math.ceil((students.length * 3) / 1000) + 
    Math.ceil((students.length * 2) / 1000);

  let currentStep = 0;
  const globalStart = Date.now();

  console.log('\n\x1b[1m🚀 STARTING FULL SEED DEPLOYMENT\x1b[0m');

  const pushWithProgress = async (table: any, data: any[], size: number, label: string) => {
    for (let i = 0; i < data.length; i += size) {
      await db.insert(table).values(data.slice(i, i + size));
      currentStep++;
      printProgress(currentStep, totalSteps, globalStart, label);
    }
  };

  await pushWithProgress(schema.tenants, tenants, 100, 'Tenants');
  await pushWithProgress(schema.users, users, 400, 'Users');
  await pushWithProgress(schema.teachers, teachers, 500, 'Teachers');
  await pushWithProgress(schema.parents, parents, 500, 'Parents');
  await pushWithProgress(schema.classes, classes, 500, 'Classes');
  await pushWithProgress(schema.students, students, 400, 'Students');
  await pushWithProgress(schema.subjects, subjects, 500, 'Subjects');
  await pushWithProgress(schema.exams, exams, 500, 'Exams');

  // 5. THE GIANT STREAM
  let attBuf: any[] = [];
  let gradeBuf: any[] = [];
  let examResultBuf: any[] = [];
  let feeBuf: any[] = [];

  for (const s of students) {
    for (let d = 0; d < ATTENDANCE_DAYS; d++) {
      const dt = new Date('2024-04-01');
      dt.setDate(dt.getDate() + d);
      if (dt.getDay() !== 0 && dt.getDay() !== 6) {
        attBuf.push({ tenantId: s.tenantId, studentId: s.id, classId: s.classId, date: formatDate(dt), status: Math.random() > 0.05 ? 'present' : 'absent' });
      }
      if (attBuf.length >= 1000) { 
        await db.insert(schema.attendance).values(attBuf); 
        attBuf = []; 
        currentStep++;
        printProgress(currentStep, totalSteps, globalStart, 'Attendance');
      }
    }

    const studentSubs = subjects.filter(sub => sub.classId === s.classId).slice(0, 3);
    for (const sub of studentSubs) {
      const examId = examMap.get(sub.id)!;
      const marks = 70 + Math.random() * 25;
      const grade = marks >= 90 ? 'A+' : marks >= 80 ? 'A' : marks >= 70 ? 'B+' : 'B';

      gradeBuf.push({ tenantId: s.tenantId, studentId: s.id, subjectId: sub.id, teacherId: sub.teacherId, examType: 'midterm', marks, maxMarks: 100, grade });
      examResultBuf.push({ examId, studentId: s.id, marksObtained: marks, status: marks >= 40 ? 'pass' : 'fail', remarks: 'Good job' });

      if (gradeBuf.length >= 1000) { 
        await db.insert(schema.grades).values(gradeBuf); 
        gradeBuf = []; 
        currentStep++;
        printProgress(currentStep, totalSteps, globalStart, 'Grades');
      }

      if (examResultBuf.length >= 1000) {
        await db.insert(schema.examResults).values(examResultBuf);
        examResultBuf = [];
        currentStep++;
        printProgress(currentStep, totalSteps, globalStart, 'ExamResults');
      }
    }

    feeBuf.push({ tenantId: s.tenantId, studentId: s.id, amount: 500, type: 'Tuition', status: 'paid', dueDate: '2024-05-01' });
    feeBuf.push({ tenantId: s.tenantId, studentId: s.id, amount: 100, type: 'Transport', status: 'pending', dueDate: '2024-05-15' });
    if (feeBuf.length >= 1000) { 
      await db.insert(schema.fees).values(feeBuf); 
      feeBuf = []; 
      currentStep++;
      printProgress(currentStep, totalSteps, globalStart, 'Fees');
    }
  }

  // Final flush
  if (attBuf.length > 0) {
    await db.insert(schema.attendance).values(attBuf);
    currentStep++;
    printProgress(currentStep, totalSteps, globalStart, 'Attendance');
  }
  if (gradeBuf.length > 0) {
    await db.insert(schema.grades).values(gradeBuf);
    currentStep++;
    printProgress(currentStep, totalSteps, globalStart, 'Grades');
  }
  if (examResultBuf.length > 0) {
    await db.insert(schema.examResults).values(examResultBuf);
    currentStep++;
    printProgress(currentStep, totalSteps, globalStart, 'ExamResults');
  }
  if (feeBuf.length > 0) {
    await db.insert(schema.fees).values(feeBuf);
    currentStep++;
    printProgress(currentStep, totalSteps, globalStart, 'Fees');
  }

  const end = Date.now();
  console.log(`\n\n\x1b[1m\x1b[32m💎 MASSIVE SEED COMPLETE! TOTAL: ~1,000,000 RECORDS\x1b[0m`);
  console.log(`\x1b[36mTotal Time: ${((end - globalStart) / 1000).toFixed(1)}s\x1b[0m`);
  process.exit(0);
}

main().catch(e => { console.error('❌ Failed:', e); process.exit(1); });
