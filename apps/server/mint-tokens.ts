// Throwaway: mints long-lived access tokens straight from JWT_SECRET so load
// runs never touch POST /auth/login (that route has a failed-attempt lockout
// which would otherwise ban the whole load generator).
import { SignJWT } from 'jose';
import postgres from 'postgres';
import { writeFileSync } from 'node:fs';

const url = process.env.DATABASE_URL ?? '';
if (!/\/loadtest(\?|$)/.test(url)) {
  console.error('REFUSING TO RUN: DATABASE_URL does not point at the loadtest database.');
  process.exit(1);
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
if (!secret) {
  console.error('REFUSING TO RUN: JWT_SECRET missing');
  process.exit(1);
}

const COUNTS: Record<string, number> = {
  parent: Number(process.env.N_PARENT ?? 500),
  teacher: Number(process.env.N_TEACHER ?? 100),
  admin: Number(process.env.N_ADMIN ?? 20),
  staff: Number(process.env.N_STAFF ?? 20),
  student: Number(process.env.N_STUDENT ?? 50),
};
const EXPIRY = process.env.EXPIRY ?? '6h';

const sql = postgres(url, { max: 5 });
const out: Record<string, { token: string; userId: string; email: string; role: string; tenantId: string }[]> = {};

// Teacher loops need classes the teacher actually owns, so carry them along.
const classByTeacher: Record<string, string[]> = {};
const rows = await sql`
  select "teacherId", array_agg(distinct "classId" order by "classId") as cls
  from "Subject" where "teacherId" like 'lttr%' group by "teacherId"`;
for (const r of rows) classByTeacher[r.teacherId] = r.cls;

for (const [role, n] of Object.entries(COUNTS)) {
  const rows = await sql`
    select id, email, "tenantId" from "User"
    where role = ${role} and "tenantId" = 'lttenant000000000000000001' and "isActive" = true
    order by id limit ${n}`;
  const list: any[] = [];
  for (const r of rows) {
    const token = await new SignJWT({
      id: r.id,
      email: r.email,
      role,
      tenantId: r.tenantId,
      typ: 'access',
      jti: `lt-${role}-${r.id}`,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(EXPIRY)
      .sign(secret);
    list.push({ token, userId: r.id, email: r.email, role, tenantId: r.tenantId, classIds: classByTeacher[r.id.replace('lttch', 'lttr')] ?? [] });
  }
  out[role] = list;
  console.log(`minted ${list.length} ${role} tokens`);
}

writeFileSync(new URL('./load/tokens.json', import.meta.url), JSON.stringify(out));
await sql.end();
console.log('wrote load/tokens.json');
