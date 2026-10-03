/**
 * Stress seed: 50 schools, each with 500 students + 500 parents + 500 staff,
 * spread across 6 academic sessions (2020-2021 .. 2025-2026) so every
 * year-scoped table (attendance/fees/grades/exams/homework) holds 5+ years of
 * history. Set-based SQL (generate_series + dimension temp tables), not JS row
 * loops, so ~127k users and ~5M fact rows seed in seconds.
 *
 * Deterministic text ids ('su-<school>-<i>' etc.) let child rows rebuild the
 * parent key with the same formula, so no id is captured between passes.
 *
 * Local-only: refuses a non-localhost DATABASE_URL because it TRUNCATEs.
 *   bun run src/db/bulk_seed.ts
 */
import "dotenv/config";
import postgres from "postgres";

const URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
if (!/localhost|127\.0\.0\.1/.test(URL)) {
  console.error("REFUSING: DATABASE_URL is not localhost — this seed wipes the DB.");
  process.exit(1);
}
const sql = postgres(URL, { max: 3, idle_timeout: 30, connect_timeout: 20, prepare: false });

const SCHOOLS = 50;
const PER = 500;        // students, parents, staff each, per school
const TEACHERS = 50;    // teacher profiles per school (own subjects + classes)
const CLASSES = 10;     // class rows per school per session
const SESSIONS = [
  ["2020-2021", "2020-04-01", "2020-12-31"],
  ["2021-2022", "2021-04-01", "2021-12-31"],
  ["2022-2023", "2022-04-01", "2022-12-31"],
  ["2023-2024", "2023-04-01", "2023-12-31"],
  ["2024-2025", "2024-04-01", "2024-12-31"],
  ["2025-2026", "2025-04-01", "2025-12-31"],
];
const NSESSIONS = SESSIONS.length;
const CURRENT = NSESSIONS - 1;
const PASSWORD = "test@123";

const t0 = Date.now();
async function step(label: string, fn: () => Promise<unknown>) {
  const s = Date.now();
  await fn();
  console.log(`+${((Date.now() - t0) / 1000).toFixed(1)}s  ${label} (${((Date.now() - s) / 1000).toFixed(2)}s)`);
}

const FIRST = ["Aarav","Vivaan","Aditya","Ananya","Diya","Ishaan","Kavya","Rohan","Rahul","Priya","Neha","Arjun","Vikram","Sumit","Meera","Kiran","Suresh","Ramesh","Deepak","Anil","Sunil","Manoj","Nitin","Gaurav","Sahil","Tanvi","Sanya","Riya","Pooja","Nikita","Karan","Arun","Balan","Chandan","Dinesh","Emmanuel","Farhan","Ganesh","Harshal","Imran"];
const LAST = ["Kumar","Sharma","Verma","Singh","Gupta","Reddy","Nair","Iyer","Pillai","Das","Bose","Roy","Menon","Patel","Shah","Joshi","Kulkarni","Desai","Chauhan","Mishra","Tiwari","Pandey","Saxena","Agarwal","Choudhury","Mukherjee","Sen","Ghosh","Yadav","Thakur","Chandra","Bhatt","Malhotra","Kapoor","Rao","Naik","Nambiar","Kapoor","Bose","Verma","Naidu"];
// Stable pseudo-random array index from an id string; hashtext because text ids can't be cast.
// Returned as an unsafe fragment so it inlines as raw SQL (a bare string would be
// parameterized, and a parameter cannot serve as an array subscript).
const pick = (expr: string, n: number) =>
  sql.unsafe(`(abs(hashtext(${expr})) % ${Math.trunc(n)} + 1)`);
// Emit a real PG array literal wrapped in parens so `(ARRAY[...])[i]` indexing parses.
// Pool values here are quote-free, but escape anyway rather than trust that.
const textArr = (pool: string[]) =>
  sql.unsafe(`(ARRAY[${pool.map((p) => `'${p.replace(/'/g, "''")}'`).join(",")}])`);

async function main() {
  console.log("=== bulk stress seed: 50 schools x 500 students ===");

  const tables = await sql`select tablename from pg_tables where schemaname = 'public' and tablename not like 'drizzle%' and tablename not like 'tmp_%'`;
  await sql.unsafe(`TRUNCATE ${tables.map((r: { tablename: string }) => `"${r.tablename.replace(/"/g, '""')}"`).join(", ")} RESTART IDENTITY CASCADE`);
  console.log(`wiped ${tables.length} tables`);

  const hash = await Bun.password.hash(PASSWORD);
  const F = textArr(FIRST), L = textArr(LAST);
  const PLANS = textArr(["basic", "standard", "enterprise"]);
  const GENDERED = textArr(["male", "female"]);
  const BLOOD = textArr(["A+", "B+", "O+", "AB+", "A-", "B-"]);
  const OCC = textArr(["Engineer", "Doctor", "Business", "Teacher", "Lawyer", "Farmer"]);
  const QUAL = textArr(["M.Ed", "B.Ed", "PhD", "MSc", "MA"]);
  const SUBJ = textArr(["Mathematics", "Science", "English", "History", "Geography"]);
  const FCAT = textArr(["Tuition", "Exam", "Transport", "Library", "Sports"]);
  const EXAMNM = textArr(["Unit Test 1", "Midterm", "Final"]);
  const EXAMTY = textArr(["unit_test", "midterm", "final"]);
  const ROLE4 = textArr(["all", "student", "teacher", "parent"]);
  const PRI3 = textArr(["normal", "high", "urgent"]);
  const PRIO4 = textArr(["low", "medium", "high", "urgent"]);
  const TICKSTAT = textArr(["open", "in_progress", "resolved"]);
  const TICKCAT = textArr(["general", "billing", "technical", "academics"]);
  const EVTYPE = textArr(["exam", "holiday", "event", "meeting", "sports"]);
  const SUBSTAT = textArr(["pending", "paid", "overdue"]);
  const CR3 = textArr(["Finance Manager", "Attendance Officer", "Exams Cell"]);
  const PR3 = textArr(["Support Agent", "Billing Admin", "Super Admin"]);
  const PLAN3 = textArr(["Basic", "Standard", "Premium"]);
  const GRADE5 = textArr(["A+", "A", "B+", "B", "C"]);
  const STAFFST = textArr(["present", "present", "present", "absent", "leave"]);
  const SUBMST = textArr(["submitted", "graded", "graded"]);
  const PRESENT5 = textArr(["present", "present", "present", "present", "absent"]);

  await step("dimensions", async () => {
    await sql`drop table if exists tmp_schools, tmp_sessions`;
    await sql`
      create unlogged table tmp_schools as
      select s as num, 'sch'||s as tid, 'au-'||s as adminid,
        ${F}[1 + (s % ${FIRST.length})] || ' ' || ${L}[1 + ((s*7) % ${LAST.length})] || ' Public School' as schoolname
      from generate_series(1,${SCHOOLS}) s`;
    await sql`create unlogged table tmp_sessions (slot int, name text, sd date, ed date, cur boolean)`;
    for (let y = 0; y < NSESSIONS; y++) {
      const [name, sd, ed] = SESSIONS[y]!;
      await sql`insert into tmp_sessions values (${y}, ${name}, ${sd}::date, ${ed}::date, ${y === CURRENT})`;
    }
  });

  await step(`tenants (${SCHOOLS})`, () => sql`
    insert into "Tenant"
      ("id","name","slug","plan","status","maxStudents","maxTeachers","maxParents","maxClasses","settings","startDate","endDate","address","phone","email","createdAt","updatedAt")
    select tid, schoolname, 'school-'||num, ${PLANS}[1 + (num % 3)], 'active',
      5000, 500, 5000, 100, '{"theme":"emerald","currency":"INR"}',
      '2020-04-01', '2030-03-31', 'Line '||num||', City '||num,
      '+91'||lpad((100000000+num)::text,10,'0'), 'admin'||num||'@school-'||num||'.example',
      now(), now()
    from tmp_schools`);

  await step(`academicYears (${SCHOOLS * NSESSIONS})`, () => sql`
    insert into "AcademicYear" ("id","tenantId","name","startDate","endDate","status","isCurrent","createdAt","updatedAt")
    select 'ay-'||sc.num||'-'||se.slot, sc.tid, se.name, se.sd::text, se.ed::text, 'active', se.cur, now(), now()
    from tmp_schools sc cross join tmp_sessions se`);

  await step(`users (${SCHOOLS * (PER * 3 + TEACHERS + 1) + 1})`, async () => {
    await sql`
      insert into "User" ("id","tenantId","email","name","password","role","isActive","createdAt","updatedAt")
      values ('super-0', null, 'superadmin@inkwelly.com', 'Super Admin', ${hash}, 'super_admin', true, now(), now())
      on conflict (email) do nothing`;
    await sql`
      insert into "User" ("id","tenantId","email","name","password","role","isActive","username","createdAt","updatedAt")
      select adminid, tid, 'admin-'||num||'@ex.com', 'Admin '||schoolname, ${hash}, 'admin', true, 'admin'||num, now(), now()
      from tmp_schools`;
    await sql`
      insert into "User" ("id","tenantId","email","name","password","role","isActive","username","createdAt","updatedAt")
      select 'su-'||sc.num||'-'||i, sc.tid, 's'||sc.num||'.'||i||'@ex.com',
        ${F}[${pick("sc.num||'-s-'||i", FIRST.length)}] || ' ' || ${L}[${pick("sc.num||'-sl'||i", LAST.length)}] || ' ' || i,
        ${hash}, 'student', true, 'stud'||sc.num||'.'||i, now(), now()
      from tmp_schools sc, generate_series(1,${PER}) i`;
    await sql`
      insert into "User" ("id","tenantId","email","name","password","role","isActive","username","createdAt","updatedAt")
      select 'pu-'||sc.num||'-'||i, sc.tid, 'p'||sc.num||'.'||i||'@ex.com',
        'Mr. ' || ${F}[${pick("sc.num||'-p-'||i", FIRST.length)}] || ' ' || ${L}[${pick("sc.num||'-pl'||i", LAST.length)}],
        ${hash}, 'parent', true, 'par'||sc.num||'.'||i, now(), now()
      from tmp_schools sc, generate_series(1,${PER}) i`;
    await sql`
      insert into "User" ("id","tenantId","email","name","password","role","isActive","username","createdAt","updatedAt")
      select 'fu-'||sc.num||'-'||i, sc.tid, 'f'||sc.num||'.'||i||'@ex.com',
        ${F}[${pick("sc.num||'-f-'||i", FIRST.length)}] || ' ' || ${L}[${pick("sc.num||'-fl'||i", LAST.length)}],
        ${hash}, 'staff', true, 'staff'||sc.num||'.'||i, now(), now()
      from tmp_schools sc, generate_series(1,${PER}) i`;
    await sql`
      insert into "User" ("id","tenantId","email","name","password","role","isActive","username","createdAt","updatedAt")
      select 'tu-'||sc.num||'-'||t, sc.tid, 't'||sc.num||'.'||t||'@ex.com',
        'Prof. ' || ${F}[${pick("sc.num||'-t-'||t", FIRST.length)}] || ' ' || ${L}[${pick("sc.num||'-tl'||t", LAST.length)}],
        ${hash}, 'teacher', true, 'teach'||sc.num||'.'||t, now(), now()
      from tmp_schools sc, generate_series(1,${TEACHERS}) t`;
  });

  await step(`teachers + parents profiles`, async () => {
    await sql`
      insert into "Teacher" ("id","userId","qualification","experience","joiningDate","createdAt","updatedAt")
      select 'tp-'||sc.num||'-'||t, 'tu-'||sc.num||'-'||t,
        ${QUAL}[1 + (t % 5)], ((t % 12) + 1) || ' years', '2019-04-01', now(), now()
      from tmp_schools sc, generate_series(1,${TEACHERS}) t`;
    await sql`
      insert into "Parent" ("id","userId","occupation","createdAt","updatedAt")
      select 'pp-'||sc.num||'-'||i, 'pu-'||sc.num||'-'||i, ${OCC}[1 + (i % 6)], now(), now()
      from tmp_schools sc, generate_series(1,${PER}) i`;
  });

  await step(`classes (${SCHOOLS * NSESSIONS * CLASSES})`, () => sql`
    insert into "Class"
      ("id","tenantId","name","slug","section","classLevel","medium","isVocational","isActive","capacity","academicYear","createdAt","updatedAt")
    select 'cls-'||sc.num||'-'||se.slot||'-'||c, sc.tid, 'Class '||c,
      'class-'||sc.num||'-'||c||'-'||se.slot, 'A', c::text, 'English', false, se.cur, 60, se.name, now(), now()
    from tmp_schools sc cross join tmp_sessions se cross join generate_series(1,${CLASSES}) c`);

  await step(`students (${SCHOOLS * PER})`, () => sql`
    insert into "Student"
      ("id","userId","rollNumber","classId","parentId","academicYear","dateOfBirth","gender","bloodGroup","admissionDate","status","createdAt","updatedAt")
    select 'st-'||sc.num||'-'||i, 'su-'||sc.num||'-'||i,
      lpad(sc.num::text,2,'0') || '-' || se.slot || '-' || lpad(i::text,4,'0'),
      'cls-'||sc.num||'-'||se.slot||'-'||(1 + (i % ${CLASSES})),
      'pp-'||sc.num||'-'||i, se.name,
      (date '2005-01-01' + (i % 3650) * interval '1 day')::text,
      ${GENDERED}[1 + (i % 2)], ${BLOOD}[1 + (i % 6)],
      se.sd::text, 'active', (se.sd + interval '1 day'), now()
    from tmp_schools sc
    cross join generate_series(1,${PER}) i
    join tmp_sessions se on se.slot = (i % ${NSESSIONS})`);

  await step(`subjects (${SCHOOLS * NSESSIONS * CLASSES * 5})`, () => sql`
    insert into "Subject" ("id","name","code","classId","teacherId","tenantId","createdAt","updatedAt")
    select 'sub-'||cl.id||'-'||k, ${SUBJ}[k],
      substr(${SUBJ}[k],1,3)||'-'||cl.num||'-'||cl.slot||'-'||cl.lvl||'-'||k,
      cl.id, 'tp-'||cl.num||'-'||(1 + ((cl.lvl + k) % ${TEACHERS})),
      cl."tenantId", now(), now()
    from (
      select id, "tenantId",
        (substring(id from '^cls-([0-9]+)-'))::int as num,
        (substring(id from '^[^-]+-[0-9]+-([0-9]+)-'))::int as slot,
        (substring(id from '-([0-9]+)$'))::int as lvl
      from "Class"
    ) cl
    cross join generate_series(1,5) k`);

  await step("classTeachers", () => sql`
    insert into "ClassTeacher" ("id","classId","teacherId","isClassTeacher","createdAt")
    select 'ct-'||cl.id, cl.id, 'tp-'||cl.num||'-'||(1 + (cl.lvl % ${TEACHERS})), true, now()
    from (
      select id,
        (substring(id from '^cls-([0-9]+)-'))::int as num,
        (substring(id from '-([0-9]+)$'))::int as lvl
      from "Class"
    ) cl`);

  await step(`attendance (~${(SCHOOLS * PER * 120 / 1e6).toFixed(1)}M)`, () => sql`
    insert into "Attendance" ("id","tenantId","studentId","classId","academicYear","date","month","status","createdAt")
    select 'at-'||st.id||'-'||d, u."tenantId", st.id, st."classId", st."academicYear",
      to_char(se.sd + (d || ' days')::interval, 'YYYY-MM-DD'),
      to_char(se.sd + (d || ' days')::interval, 'YYYY-MM'),
      ${PRESENT5}[${pick("st.id||d::text", 5)}],
      (se.sd + (d || ' days')::interval) + time '09:15'
    from "Student" st
    join "User" u on u.id = st."userId"
    join tmp_sessions se on se.name = st."academicYear"
    cross join generate_series(0,119) d`);

  await step(`staffAttendance (~${(SCHOOLS * (TEACHERS + PER) * 60 / 1e6).toFixed(1)}M)`, () => sql`
    insert into "StaffAttendance" ("id","userId","tenantId","date","month","status","createdAt")
    select 'sa-'||u.id||'-'||d, u.id, u."tenantId",
      to_char(date '2025-04-01' + (d || ' days')::interval, 'YYYY-MM-DD'),
      to_char(date '2025-04-01' + (d || ' days')::interval, 'YYYY-MM'),
      ${STAFFST}[${pick("u.id||d::text", 5)}],
      (date '2025-04-01' + (d || ' days')::interval) + time '09:00'
    from "User" u
    cross join generate_series(0,59) d
    where u.role in ('teacher','staff') and extract(dow from date '2025-04-01' + d) <> 0`);

  await step(`feeCategories (${SCHOOLS * 5})`, () => sql`
    insert into "FeeCategory" ("id","tenantId","name","code","frequency","status","createdAt","updatedAt")
    select 'fc-'||sc.tid||'-'||k, sc.tid, ${FCAT}[k], substr(${FCAT}[k],1,3)||sc.num||k,
      case when k=1 then 'monthly' else 'yearly' end, 'active', now(), now()
    from tmp_schools sc cross join generate_series(1,5) k`);

  await step(`fees (${SCHOOLS * PER * 5 / 1e3}k)`, () => sql`
    insert into "Fee"
      ("id","tenantId","studentId","academicYear","feeCategoryId","amount","type","status","dueDate","paidAmount","createdAt","updatedAt")
    select 'fee-'||st.id||'-'||k, u."tenantId", st.id, st."academicYear",
      'fc-'||u."tenantId"||'-'||k,
      (case when k=1 then 5000 else 1000 end)::numeric,
      ${FCAT}[k], ${SUBSTAT}[${pick("st.id||k::text", 3)}],
      (se.sd + 15)::text,
      case when ${SUBSTAT}[${pick("st.id||k::text", 3)}] = 'paid'
           then (case when k=1 then 5000 else 1000 end)::numeric else 0::numeric end,
      (se.sd + interval '1 day'), now()
    from "Student" st
    join "User" u on u.id = st."userId"
    join tmp_sessions se on se.name = st."academicYear"
    cross join generate_series(1,5) k`);

  await step(`exams + results`, () => sql`
    insert into "Exam"
      ("id","tenantId","classId","subjectId","name","examType","academicYear","date","totalMarks","passingMarks","status","createdAt","updatedAt")
    select 'ex-'||sub.id||'-'||k, cl."tenantId", cl.id, sub.id,
      ${EXAMNM}[k], ${EXAMTY}[k], se.name,
      to_char(se.sd + (k*30) * interval '1 day', 'YYYY-MM-DD'),
      (array[25.0,50.0,100.0])[k], (array[9.0,20.0,40.0])[k],
      'published', now(), now()
    from "Class" cl
    join "Subject" sub on sub."classId" = cl.id
    join tmp_sessions se on se.name = cl."academicYear"
    cross join generate_series(1,3) k`)
    .then(async () => step("examResults", () => sql`
      insert into "ExamResult" ("id","examId","studentId","marksObtained","status","createdAt","updatedAt")
      select 'er-'||ex.id||'-'||st.id, ex.id, st.id,
        round((ex."totalMarks" * (0.4 + (${pick("st.id||ex.id", 55)})/100.0))::numeric, 2),
        'published', now(), now()
      from "Exam" ex
      join "Student" st on st."classId" = ex."classId"
      on conflict ("examId","studentId") do nothing`));

  await step(`grades`, () => sql`
    insert into "Grade"
      ("id","tenantId","studentId","subjectId","teacherId","academicYear","examType","marks","maxMarks","grade","createdAt","updatedAt")
    select 'gr-'||st.id||'-'||sub.id||'-'||mk.k, u."tenantId", st.id, sub.id, sub."teacherId", st."academicYear",
      ${EXAMTY}[mk.k],
      round(mk.mv * (0.5 + (${pick("st.id||sub.id||mk.k::text", 45)})/100.0), 2), mk.mv,
      ${GRADE5}[${pick("st.id||sub.id||mk.k::text", 5)}],
      now(), now()
    from "Student" st
    join "User" u on u.id = st."userId"
    join "Subject" sub on sub."classId" = st."classId"
    cross join (values (1,25.0),(2,50.0),(3,100.0)) as mk(k,mv)
    on conflict ("studentId","subjectId","examType") do nothing`);

  await step(`assignments + submissions`, () => sql`
    insert into "Assignment"
      ("id","tenantId","subjectId","classId","teacherId","academicYear","title","description","dueDate","status","mode","createdAt","updatedAt")
    select 'as-'||sub.id||'-'||k, sub."tenantId", sub.id, sub."classId", sub."teacherId", cl."academicYear",
      'Homework '||k, 'Chapter '||k||' exercises',
      to_char(se.sd + (k*10) * interval '1 day', 'YYYY-MM-DD'), 'active', 'offline',
      (se.sd + interval '2 day'), now()
    from "Subject" sub
    join "Class" cl on cl.id = sub."classId"
    join tmp_sessions se on se.name = cl."academicYear"
    cross join generate_series(1,4) k`)
    .then(async () => step("submissions", () => sql`
      insert into "Submission" ("id","tenantId","assignmentId","studentId","academicYear","content","status","submittedAt")
      select 'sb-'||a.id||'-'||st.id, a."tenantId", a.id, st.id, a."academicYear",
        'Submitted for '||a.title, ${SUBMST}[${pick("a.id||st.id", 3)}], a."createdAt"
      from "Assignment" a
      join "Student" st on st."classId" = a."classId"
      where ${pick("a.id||st.id", 100)} > 30`));

  await step("notices/events/tickets", async () => {
    await sql`
      insert into "Notice" ("id","tenantId","title","content","authorId","targetRole","priority","createdAt","updatedAt")
      select 'no-'||sc.tid||'-'||k, sc.tid, 'Notice '||k||' – '||sc.schoolname,
        'Announcement '||k||' content for '||sc.schoolname, sc.adminid,
        ${ROLE4}[1 + (k % 4)], ${PRI3}[1 + (k % 3)],
        now() - (k * interval '2 day'), now()
      from tmp_schools sc cross join generate_series(1,20) k`;
    await sql`
      insert into "Event" ("id","tenantId","title","description","date","type","targetRole","color","allDay","createdAt")
      select 'ev-'||sc.tid||'-'||k, sc.tid, 'Event '||k, 'School event '||k,
        to_char(date '2025-04-01' + (k*9 || ' days')::interval, 'YYYY-MM-DD'),
        ${EVTYPE}[1 + (k % 5)], 'all', '#10b981', (k % 2 = 0), now()
      from tmp_schools sc cross join generate_series(1,15) k`;
    await sql`
      insert into "Ticket" ("id","tenantId","title","description","status","priority","category","createdBy","assignedTo","createdAt","updatedAt")
      select 'ti-'||sc.tid||'-'||k, sc.tid, 'Ticket '||k, 'Issue '||k,
        ${TICKSTAT}[1 + (k % 3)], ${PRIO4}[1 + (k % 4)], ${TICKCAT}[1 + (k % 4)],
        sc.adminid, null, now() - (k * interval '1 day'), now()
      from tmp_schools sc cross join generate_series(1,25) k`;
    await sql`
      insert into "TicketMessage" ("id","ticketId","userId","message","createdAt")
      select 'tm-'||ti.id||'-'||k, ti.id, ti."createdBy", 'Reply '||k, now()
      from "Ticket" ti cross join generate_series(1,3) k`;
  });

  await step("misc settings + subscriptions", async () => {
    await sql`
      insert into "Subscription"
        ("id","tenantId","parentId","planName","planId","amount","period","status","paymentMethod","startDate","endDate","autoRenew","createdAt","updatedAt")
      select 'sub-'||pp.id, u."tenantId", pp.id,
        ${PLAN3}[${pick("pp.id", 3)}], 'plan-'||(${pick("pp.id", 3)} - 1),
        (array[999.0,1999.0,2999.0])[${pick("pp.id", 3)}],
        'yearly','active','card','2025-04-01','2026-03-31',true, now(), now()
      from "Parent" pp join "User" u on u.id = pp."userId"`;
    await sql`
      insert into "CustomRole" ("id","tenantId","name","color","permissions","createdAt","updatedAt")
      select 'cr-'||sc.tid||'-'||k, sc.tid, ${CR3}[k], '#10b981', '{"fees":["view","edit"]}', now(), now()
      from tmp_schools sc cross join generate_series(1,3) k`;
    await sql`
      insert into "StudentIdSetting" ("id","tenantId","schoolCode","rollNumberEnabled","rollNumberStartingNumber","createdAt","updatedAt")
      select 'sis-'||sc.tid, sc.tid, 'SCH'||lpad(sc.num::text,3,'0'), true, 1, now(), now() from tmp_schools sc`;
    await sql`
      insert into "AttendanceSetting" ("id","tenantId","cutoffTime","targetRate","createdAt","updatedAt")
      select 'aset-'||sc.tid, sc.tid, '09:30', 92, now(), now() from tmp_schools sc`;
    await sql`
      insert into "PlatformRole" ("id","name","description","color","permissions","createdAt","updatedAt")
      select 'pr-'||k, ${PR3}[k], 'platform role', '#6366f1', '{"tickets":["view"]}', now(), now()
      from generate_series(1,3) k`;
  });

  await step("rebuild trgm indexes after load", async () => {
    // GIN trigram indexes bloat under a bulk load; rebuilding after keeps them compact.
    // Only if 0027 was applied to this database — the seed works without it too.
    const idx = await sql`select indexname from pg_indexes where schemaname='public' and indexname like '%trgm%'`;
    for (const row of idx) await sql.unsafe(`REINDEX INDEX "${row.indexname}"`);
    if (idx.length) console.log(`  reindexed ${idx.length} trgm indexes`);
  });

  await step("analyze", () => sql`analyze`);
  await step("drop temp dims", () => sql`drop table if exists tmp_schools, tmp_sessions`);

  console.log("\n=== row counts ===");
  let total = 0;
  for (const t of ["Tenant","AcademicYear","User","Teacher","Parent","Class","Student","Subject","Attendance","StaffAttendance","Fee","Exam","ExamResult","Grade","Assignment","Submission","Notice","Event","Ticket","Subscription"]) {
    const r = await sql`select count(*)::int as n from ${sql(t)}`;
    total += r[0].n;
    console.log(`  ${t.padEnd(16)} ${r[0].n.toLocaleString()}`);
  }
  console.log(`  ${'TOTAL'.padEnd(16)} ${total.toLocaleString()}`);
  console.log(`\nSeeded in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log(`Login: admin-1@ex.com .. admin-50@ex.com / password '${PASSWORD}' (also any s/p/f/t user)`);
  await sql.end();
}

main().catch((e) => { console.error("FAILED:", e); process.exit(1); });
