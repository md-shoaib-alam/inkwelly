// Throwaway capacity-test seeder. Writes ONLY to the `loadtest` database.
import postgres from 'postgres';

const url = (process.env.DATABASE_URL ?? '').replace(/^["']|["']$/g, '');
if (!/\/loadtest\?|\/loadtest$/.test(url)) {
  console.error('REFUSING TO RUN: DATABASE_URL does not point at the loadtest database.');
  console.error('Got: ' + url.replace(/:[^:@/]*@/, ':***@'));
  process.exit(1);
}

const PASSWORD = 'test@123';
const STUDENTS = 5000;
const CLASSES = 40;
const TEACHERS = 50;
const STAFF = 20;
const SCHOOL_DAYS = 200;
const FEES_PER_STUDENT = 12;
const TENANT = 'lttenant000000000000000001';

const sql = postgres(url, { max: 1 });
const t0 = Date.now();
const step = async (label: string, text: string) => {
  const s = Date.now();
  await sql.unsafe(text);
  console.log(`${label.padEnd(26)} done in ${String(Date.now() - s).padStart(6)}ms`);
};

console.log('hashing password (argon2, same verifier the API uses)...');
const hash = await Bun.password.hash(PASSWORD);

await sql.unsafe('TRUNCATE "Attendance","Fee","FeeCategory","Notification","Notice","Subject","Student","Parent","Teacher","Class","User","Tenant" RESTART IDENTITY CASCADE');

// School-day list: 200 Mon-Fri dates from the start of the academic year, as TEXT.
const dayList = await sql`
  select to_char(d::date,'YYYY-MM-DD') as date, to_char(d::date,'YYYY-MM') as month
  from (select ('2025-04-01'::date + g) as d from generate_series(0, 400) g) x
  where extract(isodow from d) <= 5 order by d limit ${SCHOOL_DAYS}`;

await step('tenant', `
  insert into "Tenant" ("id","name","slug","plan","status","maxStudents","maxTeachers","maxParents","maxClasses","settings","startDate","createdAt","updatedAt")
  values ('${TENANT}','Loadtest Academy','loadtest-academy','premium','active',10000,200,10000,200,'{}','2025-04-01',now(),now())`);

await step('classes', `
  insert into "Class" ("id","tenantId","name","section","grade","capacity","createdAt","updatedAt")
  select 'ltcls'||c,'${TENANT}','Grade '||(1+((c-1)/4)),
         (array['A','B','C','D']::text[])[1+((c-1)%4)],
         (1+((c-1)/4))::text, 50, now(), now()
  from generate_series(1,${CLASSES}) c`);

await step('users: root super admin', `
  -- Root = role super_admin with platformRoleId NULL (src/lib/permissions.ts:161).
  -- Seeded so the dataset can be opened from the normal login screen.
  insert into "User" ("id","tenantId","email","name","role","password","isActive","createdAt","updatedAt")
  values ('ltsa01', null, 'shoaibalamcse0786@gmail.com', 'Shoaib Alam', 'super_admin', '${hash}', true, now(), now())`);

await step('users: staff+admin', `
  insert into "User" ("id","tenantId","email","name","role","password","isActive","createdAt","updatedAt")
  select 'ltadm'||c,'${TENANT}',concat('ltadmin',c,'@loadtest.local'),'LT Admin '||c,'admin','${hash}',true,now(),now()
  from generate_series(1,5) c`);

await step('users: staff', `
  insert into "User" ("id","tenantId","email","name","role","password","isActive","createdAt","updatedAt")
  select 'ltstf'||c,'${TENANT}',concat('ltstaff',c,'@loadtest.local'),'LT Staff '||c,'staff','${hash}',true,now(),now()
  from generate_series(1,${STAFF}) c`);

await step('users: teachers', `
  insert into "User" ("id","tenantId","email","name","role","password","isActive","createdAt","updatedAt")
  select 'lttch'||c,'${TENANT}',concat('ltteacher',c,'@loadtest.local'),'LT Teacher '||c,'teacher','${hash}',true,now(),now()
  from generate_series(1,${TEACHERS}) c`);

await step('teachers', `
  insert into "Teacher" ("id","userId","qualification","experience","joiningDate","createdAt","updatedAt")
  select 'lttr'||c,'lttch'||c,'M.Ed','5 years','2025-04-01',now(),now()
  from generate_series(1,${TEACHERS}) c`);

await step('users: parents', `
  insert into "User" ("id","tenantId","email","name","role","password","isActive","createdAt","updatedAt")
  select 'ltpar'||c,'${TENANT}',concat('ltparent',c,'@loadtest.local'),'LT Parent '||c,'parent','${hash}',true,now(),now()
  from generate_series(1,${STUDENTS}) c`);

await step('parents', `
  insert into "Parent" ("id","userId","occupation","createdAt","updatedAt")
  select 'ltp'||c,'ltpar'||c,'Service',now(),now()
  from generate_series(1,${STUDENTS}) c`);

await step('users: students', `
  insert into "User" ("id","tenantId","email","name","role","password","isActive","createdAt","updatedAt")
  select 'ltstu'||c,'${TENANT}',concat('ltstudent',c,'@loadtest.local'),'LT Student '||c,'student','${hash}',true,now(),now()
  from generate_series(1,${STUDENTS}) c`);

await step('students', `
  insert into "Student" ("id","userId","rollNumber","classId","parentId","academicYear","gender","status","admissionDate","dateOfBirth","createdAt","updatedAt")
  select 'lts'||g,'ltstu'||g,'LT'||g,'ltcls'||(1+((g-1)%${CLASSES})),'ltp'||g,'2025-2026',
         case when g%2=0 then 'male' else 'female' end,'active','2025-04-01','2012-01-01',now(),now()
  from generate_series(1,${STUDENTS}) g`);

await step('subjects', `
  insert into "Subject" ("id","tenantId","name","code","classId","teacherId","createdAt","updatedAt")
  select 'ltsub'||c||i,'${TENANT}',(array['Math','Science','English','History','Physics']::text[])[i],
         (array['Math','Science','English','History','Physics']::text[])[i]||c::text,
         'ltcls'||c,'lttr'||(1+(((c*5+i)-1)%${TEACHERS})),now(),now()
  from generate_series(1,${CLASSES}) c cross join generate_series(1,5) i`);

await step('notices', `
  insert into "Notice" ("id","tenantId","title","content","authorId","targetRole","priority","createdAt","updatedAt")
  select 'ltnot'||g,'${TENANT}','Loadtest notice '||g,repeat('Body text for the notice. ',20),
         'ltadm1','all','normal', now() - (g||' hours')::interval, now()
  from generate_series(1,200) g`);

await step('notifications', `
  insert into "Notification" ("id","tenantId","userId","title","content","isRead","type","createdAt")
  select 'ltmsg'||g,'${TENANT}','ltpar'||(1+((g-1)%${STUDENTS})),'Notice published','A new notice was published for your ward.',
         (g%5=0),'notice', now() - ((g%2000)||' minutes')::interval
  from generate_series(1,10000) g`);

await step('fee categories', `
  insert into "FeeCategory" ("id","tenantId","name","code","frequency","status","createdAt","updatedAt")
  select 'ltfc'||g,'${TENANT}',(array['Tuition','Exam','Transport','Library']::text[])[g],
         'FC'||(array['Tuition','Exam','Transport','Library']::text[])[g],'monthly','active',now(),now()
  from generate_series(1,4) g`);

// Fees: 12 per student spread across the year, mixed statuses.
await step('fees', `
  insert into "Fee" ("id","tenantId","studentId","feeCategoryId","type","amount","status","dueDate","paidDate","paidAmount","createdAt","updatedAt")
  select 'ltfee'||g||'-'||i,'${TENANT}','lts'||g,'ltfc'||(1+(i%4)),
         (array['Tuition','Exam','Transport','Library']::text[])[1+(i%4)],
         (500 + (i*100))::numeric,
         (case when i%7=0 then 'pending' when i%11=0 then 'overdue' else 'paid' end),
         to_char(('2025-04-01'::date + (i*30)), 'YYYY-MM-DD'),
         case when i%7=0 or i%11=0 then null else '2025-04-05' end,
         case when i%7=0 or i%11=0 then 0 else (500 + (i*100)) end,
         now(), now()
  from generate_series(1,${STUDENTS}) g cross join generate_series(1,${FEES_PER_STUDENT}) i`);

// Attendance is the bulk: every student x every school day, inserted Postgres-side.
const dayValues = dayList.map((d, i) => `('${d.date}','${d.month}',${i + 1})`).join(',');
const CHUNK = 100;
let done = 0;
for (let start = 1; start <= STUDENTS; start += CHUNK) {
  const end = Math.min(start + CHUNK - 1, STUDENTS);
  await sql.unsafe(`
    insert into "Attendance" ("id","tenantId","studentId","classId","date","month","status","createdAt")
    select 'ltatt'||g||'-'||v.idx,'${TENANT}','lts'||g,'ltcls'||(1+((g-1)%${CLASSES})),v.date,v.month,
           (case when random() < 0.92 then 'present' when random() < 0.6 then 'absent' else 'leave' end),now()
    from generate_series(${start},${end}) g
    cross join (values ${dayValues}) as v(date,month,idx)`);
  done = end;
  process.stdout.write(`  attendance ${done}/${STUDENTS} students (~${(done * dayList.length / 1000).toFixed(0)}k rows) ${Date.now() - t0}ms\n`);
}

const counts = await sql`
  select (select count(*) from "User") u, (select count(*) from "Student") s,
         (select count(*) from "Attendance") a, (select count(*) from "Fee") f,
         (select count(*) from "Notification") n`;
console.log('\nfinal counts:', JSON.stringify(counts[0]));
console.log('elapsed', ((Date.now() - t0) / 1000).toFixed(0), 's');
await sql.end();
