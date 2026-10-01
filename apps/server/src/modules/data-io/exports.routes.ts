import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import { hashPassword } from '../../lib/passwords';
import * as schema from '../../db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { posthog, captureError } from '../../lib/monitoring/posthog';
import * as XLSX from 'xlsx';
import { formatDate } from '../../lib/date-utils';
import { resolveTenantId } from '../../lib/resolve-tenant';
import { dataCache } from '../../lib/cache';


export const exportsRoutes = new Elysia({ prefix: '/exports' })
  .use(requireAuth)
  .use(requirePermission('reports'))
  .get('/', async ({ query, tenantId, user, set }) => {
    try {
      if (!user || !['admin', 'super_admin', 'staff'].includes(user.role)) {
        set.status = 403;
        return { error: 'Access denied: insufficient permissions to export data' };
      }

      const type = (query as any).type;
      if (!type) { set.status = 400; return { error: 'Export type is required' }; }

      const isSuperAdmin = user.role === 'super_admin';
      const rawTenantId = (isSuperAdmin && (query as any).tenantId) ? (query as any).tenantId : tenantId;
      if (!rawTenantId) { set.status = 400; return { error: 'Tenant ID is required' }; }

      const targetTenantId = await resolveTenantId(rawTenantId);
      if (!targetTenantId) { set.status = 400; return { error: 'Invalid Tenant ID' }; }

      const data = await getExportData(type, targetTenantId, query);
      if ('error' in data) {
        set.status = 400;
        return data;
      }

      posthog.capture({
        distinctId: targetTenantId || 'system',
        event: 'data_exported',
        properties: { tenantId: targetTenantId, type, count: data.length, format: 'excel' }
      });

      return generateExcelResponse(data, type);
    } catch (error) {
      captureError(error, { method: 'GET', path: '/exports', tenantId });
      set.status = 500;
      return { error: 'Failed to load export' };
    }
  })
  .post('/', async ({ body, tenantId, user, set }) => {
    try {
      if (!user || !['admin', 'super_admin', 'staff'].includes(user.role)) {
        set.status = 403;
        return { error: 'Access denied: insufficient permissions to export data' };
      }

      const { dataType: type, tenantId: bodyTenantId } = body as any;
      // Only super admins may export another tenant's data; all other users are
      // locked to their own tenant regardless of what the body requests.
      const isSuperAdmin = user?.role === 'super_admin';
      const rawTenantId = (isSuperAdmin && bodyTenantId) ? bodyTenantId : tenantId;

      if (!type) { set.status = 400; return { error: 'Export type is required' }; }
      if (!rawTenantId) { set.status = 400; return { error: 'Tenant ID is required' }; }

      const targetTenantId = await resolveTenantId(rawTenantId);
      if (!targetTenantId) { set.status = 400; return { error: 'Invalid Tenant ID' }; }

      const data = await getExportData(type, targetTenantId, body);
      if ('error' in data) {
        set.status = 400;
        return data;
      }

      posthog.capture({
        distinctId: targetTenantId || 'system',
        event: 'data_exported_post',
        properties: { tenantId: targetTenantId, type, count: data.length, format: 'excel' }
      });

      return generateExcelResponse(data, type);
    } catch (error) {
      captureError(error, { method: 'POST', path: '/exports', tenantId });
      set.status = 500;
      return { error: 'Failed to save export' };
    }
  });

async function getExportData(type: string, tenantId: string, params: any): Promise<any[] | { error: string }> {
  switch (type) {
    case 'students': {
      const students = await db.query.students.findMany({
        where: (students, { exists }) => exists(
          db.select().from(schema.users).where(and(eq(schema.users.id, students.userId), eq(schema.users.tenantId, tenantId)))
        ),
        with: { user: { columns: { name: true, email: true, phone: true } }, class: { columns: { name: true, section: true } } }
      });
      return students.map(s => ({ 
        'Student Name': s.user.name, 
        'Email': s.user.email, 
        'Phone': s.user.phone, 
        'Roll Number': s.rollNumber, 
        'Class': s.class ? `${s.class.name}-${s.class.section}` : 'N/A', 
        'Gender': s.gender,
        'Status': s.status
      }));
    }
    case 'teachers': {
      const teachers = await db.query.teachers.findMany({
        where: (teachers, { exists }) => exists(
          db.select().from(schema.users).where(and(eq(schema.users.id, teachers.userId), eq(schema.users.tenantId, tenantId)))
        ),
        with: { user: { columns: { name: true, email: true, phone: true, isActive: true } } }
      });
      return teachers.map(t => ({ 
        'Teacher Name': t.user.name, 
        'Email': t.user.email, 
        'Phone': t.user.phone, 
        'Qualification': t.qualification, 
        'Experience': t.experience,
        'Status': t.user.isActive ? 'Active' : 'Inactive'
      }));
    }
    case 'parents': {
      const parents = await db.query.parents.findMany({
        where: (parents, { exists }) => exists(
          db.select().from(schema.users).where(and(eq(schema.users.id, parents.userId), eq(schema.users.tenantId, tenantId)))
        ),
        with: { user: { columns: { name: true, email: true, phone: true, isActive: true } } }
      });
      return parents.map(p => ({
        'Parent Name': p.user.name,
        'Email': p.user.email,
        'Phone': p.user.phone,
        'Occupation': p.occupation,
        'Status': p.user.isActive ? 'Active' : 'Inactive'
      }));
    }
    case 'attendance': {
      const classId = params.classId;
      const date = params.date;
      
      const attendance = await db.query.attendance.findMany({
        where: (attendance, { and, eq, exists }) => and(
          classId ? eq(attendance.classId, classId) : undefined,
          date ? eq(attendance.date, date) : undefined,
          exists(
            db.select().from(schema.classes).where(and(eq(schema.classes.id, attendance.classId), eq(schema.classes.tenantId, tenantId)))
          )
        ),
        with: { student: { with: { user: { columns: { name: true } } } }, class: { columns: { name: true, section: true } } },
        limit: 1000
      });

      return attendance.map(a => ({ 
        'Student': a.student.user.name, 
        'Class': `${a.class.name}-${a.class.section}`, 
        'Date': a.date, 
        'Status': a.status 
      }));
    }
    case 'fees': {
      const fees = await db.query.fees.findMany({
        where: (fees, { exists }) => exists(
          db.select().from(schema.students)
            .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
            .where(and(eq(schema.students.id, fees.studentId), eq(schema.users.tenantId, tenantId)))
        ),
        with: { student: { with: { user: { columns: { name: true } } } } }
      });
      return fees.map(f => ({ 
        'Student': f.student.user.name, 
        'Type': f.type, 
        'Amount': f.amount, 
        'Status': f.status, 
        'Due Date': f.dueDate, 
        'Paid Amount': f.paidAmount 
      }));
    }
    case 'classes': {
      const classes = await db.select({
        id: schema.classes.id,
        name: schema.classes.name,
        classLevel: schema.classes.classLevel,
        section: schema.classes.section,
        capacity: schema.classes.capacity,
        studentsCount: sql<number>`(select count(*) from ${schema.students} where ${schema.students.classId} = ${schema.classes.id})`.mapWith(Number)
      })
      .from(schema.classes)
      .where(eq(schema.classes.tenantId, tenantId));

      return classes.map(c => ({
        'Class Name': c.name,
        'Class Level': c.classLevel,
        'Section': c.section,
        'Students': c.studentsCount,
        'Capacity': c.capacity
      }));
    }
    case 'notices': {
      const notices = await db.query.notices.findMany({
        where: eq(schema.notices.tenantId, tenantId),
        with: { author: { columns: { name: true } } }
      });
      return notices.map(n => ({
        'Title': n.title,
        'Content': n.content,
        'Author': n.author?.name || 'System',
        'Target Role': n.targetRole,
        'Priority': n.priority,
        'Created At': n.createdAt
      }));
    }
    case 'expenses': {
      const expenses = await db.query.expenses.findMany({
        where: eq(schema.expenses.tenantId, tenantId),
        with: { category: { columns: { name: true } } }
      });
      return expenses.map(e => ({
        'Date': e.date,
        'Category': e.category.name,
        'Amount': e.amount,
        'Description': e.description,
        'Payment Method': e.paymentMethod,
        'Status': e.status,
        'Reference No': e.referenceNo
      }));
    }
    default:
      return { error: `Invalid export type: ${type}` };
  }
}

function generateExcelResponse(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Calculate column widths
  if (data.length > 0) {
    const keys = Object.keys(data[0]);
    const colWidths = keys.map(key => {
      // Find the maximum length of content in this column
      const maxLen = data.reduce((max, row) => {
        const value = row[key] ? String(row[key]) : "";
        return Math.max(max, value.length);
      }, key.length);
      
      // Set width with some padding (capped at 50 to prevent crazy wide columns)
      return { wch: Math.min(Math.max(maxLen, 10) + 2, 50) };
    });
    worksheet['!cols'] = colWidths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');
  
  // Create a buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}_${formatDate()}.xlsx"`,
    },
  });
}

// Helper to match column headers case-insensitively and space-insensitively
const getValue = (row: any, possibleKeys: string[]): any => {
  const keys = Object.keys(row);
  for (const pKey of possibleKeys) {
    const normalizedPKey = pKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const key of keys) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalizedKey === normalizedPKey) {
        return row[key];
      }
    }
  }
  return null;
};

export const importRoute = new Elysia({ prefix: '/import' })
  .use(requireAuth)
  .use(requirePermission('students'))
  .get('/status/:jobId', async ({ params: { jobId }, tenantId, user, set }) => {
    try {
      // Import job ids are "import-{tenantId}-{timestamp}". Non-super-admins may
      // only poll jobs that belong to their own tenant.
      if (user?.role !== 'super_admin') {
        if (!tenantId || !jobId.startsWith(`import-${tenantId}-`)) {
          set.status = 403;
          return { error: 'Forbidden' };
        }
      }

      const { generalQueue } = await import('../../lib/queue');
      const job = await generalQueue.getJob(jobId);
      if (!job) {
        set.status = 404;
        return { error: 'Import job not found or expired' };
      }
      
      const state = await job.getState();
      const progress = job.progress || 0;
      
      return {
        id: job.id,
        state,
        progress: typeof progress === 'number' ? progress : (progress as any).percent || 0,
        details: typeof progress === 'object' ? progress : null,
        result: job.returnvalue || null
      };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/imports/jobs/:id' });
      set.status = 500;
      return { error: 'Failed to load import job status' };
    }
  })
  .post('/', async ({ body, tenantId, user, set }) => {
    try {
      if (!user || !['admin', 'super_admin', 'staff'].includes(user.role)) {
        set.status = 403;
        return { error: 'Access denied: insufficient permissions to import data' };
      }

      const b = body as any;
      const file = b.file;
      const dataType = b.dataType || 'students';
      // Only super admins may import into another tenant; all other users are
      // locked to their own tenant regardless of what the body requests.
      const isSuperAdmin = user?.role === 'super_admin';
      const rawTenantId = (isSuperAdmin && b.tenantId) ? b.tenantId : tenantId;

      if (!file) {
        set.status = 400;
        return { error: 'File is required' };
      }
      if (!rawTenantId) {
        set.status = 400;
        return { error: 'Tenant ID is required' };
      }

      const targetTenantId = await resolveTenantId(rawTenantId);
      if (!targetTenantId) {
        set.status = 400;
        return { error: 'Invalid Tenant ID' };
      }

      // Parse spreadsheet using XLSX (SheetJS)
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        set.status = 400;
        return { error: 'The uploaded spreadsheet has no sheets.' };
      }
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        set.status = 400;
        return { error: 'The first sheet is invalid or empty.' };
      }
      const records = XLSX.utils.sheet_to_json(worksheet);

      if (!Array.isArray(records) || records.length === 0) {
        set.status = 400;
        return { error: 'The uploaded file is empty or invalid.' };
      }

      let imported = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      if (dataType === 'students') {
        const hashedPassword = await hashPassword('changeme123');
        
        // 1. Pre-fetch classes and transport routes for fast mapping
        const [allClasses, allRoutes] = await Promise.all([
          db.query.classes.findMany({ where: eq(schema.classes.tenantId, targetTenantId) }),
          db.query.transportRoutes.findMany({ where: eq(schema.transportRoutes.tenantId, targetTenantId) })
        ]);

        // Helper to parse class string
        const parseClassString = (classStr: string): { grade: string; section: string } => {
          const clean = classStr.trim();
          
          // Match standard formats like "5-B", "Class 5-B", "5 B", etc.
          const match = clean.match(/^(?:(?:class|grade)\s+)?(\d+|[a-zA-Z]+)(?:\s*[-/ ]\s*([a-zA-Z]))?$/i);
          if (match) {
            return {
              grade: match[1] || clean,
              section: match[2]?.toUpperCase() || 'A'
            };
          }
          
          // Match trailing letter: e.g. "5B", "Class 5B"
          const matchTrailing = clean.match(/^(?:(?:class|grade)\s+)?(\d+)([a-zA-Z])$/i);
          if (matchTrailing) {
            return {
              grade: matchTrailing[1] || clean,
              section: (matchTrailing[2] || 'A').toUpperCase()
            };
          }

          const parts = clean.split(/[-/ ]+/);
          if (parts.length > 1) {
            let namePart = parts[0] || clean;
            if ((namePart.toLowerCase() === 'class' || namePart.toLowerCase() === 'grade') && parts.length > 2) {
              namePart = parts[1] || clean;
              return {
                grade: namePart,
                section: (parts[2] || 'A').toUpperCase()
              };
            }
            return {
              grade: namePart,
              section: (parts[1] || 'A').toUpperCase()
            };
          }

          return {
            grade: clean,
            section: 'A'
          };
        };

        const getMappedGradeAndName = (gradeRaw: string) => {
          const normalized = gradeRaw.trim().toLowerCase();
          if (normalized === 'nursery') return { grade: 'Nursery', name: 'Nursery' };
          if (normalized === 'lkg') return { grade: 'LKG', name: 'LKG' };
          if (normalized === 'ukg') return { grade: 'UKG', name: 'UKG' };
          const numMatch = gradeRaw.match(/\d+/);
          const gradeVal = numMatch ? numMatch[0] : gradeRaw;
          const nameVal = numMatch ? `Class ${numMatch[0]}` : gradeRaw;
          return { grade: gradeVal, name: nameVal };
        };

        // Scan records for classes referenced in Excel
        const classesToCreate: Array<{ name: string; section: string; grade: string }> = [];
        const seenClassKeys = new Set<string>();

        for (const row of records) {
          const className = getValue(row, ['class', 'className', 'class_name', 'grade', 'section'])?.toString();
          if (className) {
            const { grade: gradeRaw, section } = parseClassString(className);
            const { grade, name: dbName } = getMappedGradeAndName(gradeRaw);
            const key = `${dbName.toLowerCase()}-${section.toLowerCase()}`;
            
            if (!seenClassKeys.has(key)) {
              seenClassKeys.add(key);
              
              const exists = allClasses.some(c => 
                c.name.toLowerCase() === dbName.toLowerCase() && 
                c.section.toLowerCase() === section.toLowerCase()
              );
              
              if (!exists) {
                classesToCreate.push({
                  name: dbName,
                  section,
                  grade
                });
              }
            }
          }
        }

        // Auto-create missing classes
        if (classesToCreate.length > 0) {
          try {
            const created = await db.insert(schema.classes).values(
              classesToCreate.map(c => ({
                tenantId: targetTenantId,
                name: c.name,
                section: c.section,
                classLevel: c.grade,
                capacity: 40
              }))
            ).returning();
            
            allClasses.push(...created);
          } catch (createErr) {
            console.error('Failed to auto-create missing classes:', createErr);
          }
        }

        const classMap = new Map<string, string>();
        allClasses.forEach(c => {
          const nameLower = c.name.toLowerCase();
          const secLower = c.section.toLowerCase();

          // Standard mapping: "Class 5-B" / "Class 5"
          classMap.set(`${c.name}-${c.section}`.toLowerCase(), c.id);
          classMap.set(nameLower, c.id);

          // Abbreviated fallback mapping (e.g. "5-b" / "5" for "Class 5" section "B")
          const cleanName = nameLower.replace(/^(class|grade)\s+/g, "").trim();
          classMap.set(`${cleanName}-${secLower}`, c.id);
          classMap.set(cleanName, c.id);
        });

        const routeMap = new Map<string, string>();
        allRoutes.forEach(r => {
          routeMap.set(r.name.toLowerCase(), r.id);
        });

        // 1.5 Fetch existing users with matching emails to check for cross-tenant conflicts
        const emailsToCheck = records
          .map((row: any) => getValue(row, ['email', 'email address', 'emailAddress'])?.toString()?.trim()?.toLowerCase())
          .filter(Boolean);

        const existingUserMap = new Map<string, { tenantId: string | null }>();
        if (emailsToCheck.length > 0) {
          const existingUsers = await db.select({
            email: schema.users.email,
            tenantId: schema.users.tenantId
          })
          .from(schema.users)
          .where(inArray(schema.users.email, emailsToCheck));

          existingUsers.forEach(u => {
            existingUserMap.set(u.email.toLowerCase(), { tenantId: u.tenantId });
          });
        }

        // 2. Validate and prepare records
        const validRows: any[] = [];
        const seenEmailsInSheet = new Set<string>();
        for (let i = 0; i < records.length; i++) {
          const row = records[i] as any;
          try {
            const name = getValue(row, ['name', 'student name', 'studentName']);
            const email = getValue(row, ['email', 'email address', 'emailAddress']);
            const className = getValue(row, ['class', 'className', 'class_name', 'grade', 'section'])?.toString();
            
            if (!name) throw new Error('Student name is required');
            if (!email || !email.includes('@')) throw new Error(`Invalid or missing email: ${email}`);
            
            const normalizedEmail = email.trim().toLowerCase();
            if (seenEmailsInSheet.has(normalizedEmail)) {
              skippedCount++;
              continue;
            }
            
            const existingUser = existingUserMap.get(normalizedEmail);
            if (existingUser) {
              if (existingUser.tenantId !== targetTenantId) {
                throw new Error(`Email "${email}" is already registered under another school`);
              } else {
                skippedCount++;
                continue;
              }
            }
            
            let classId = '';
            if (className) {
              const { grade: gradeRaw, section } = parseClassString(className);
              const { name: dbName } = getMappedGradeAndName(gradeRaw);
              classId = classMap.get(`${dbName}-${section}`.toLowerCase()) || 
                        classMap.get(className.toLowerCase()) || 
                        classMap.get(`${gradeRaw}-${section}`.toLowerCase()) || 
                        '';
            }

            if (!classId) throw new Error(`Class "${className || 'Unknown'}" not found`);

            seenEmailsInSheet.add(normalizedEmail);

            validRows.push({
              name,
              email,
              classId,
              phone: getValue(row, ['phone', 'phone number', 'phoneNumber', 'mobile', 'contact'])?.toString() || null,
              rollNumber: getValue(row, ['roll number', 'rollNumber', 'roll_number', 'rollno', 'roll'])?.toString() || '',
              gender: getValue(row, ['gender', 'sex'])?.toString().toLowerCase() === 'female' ? 'female' : 'male',
              dobRaw: getValue(row, ['date of birth', 'dateOfBirth', 'date_of_birth', 'dob', 'birthdate']),
              bloodGroup: getValue(row, ['blood group', 'bloodGroup', 'blood_group', 'bloodtype', 'blood'])?.toString() || null,
              admissionDateRaw: getValue(row, ['admission date', 'admissionDate', 'admission_date', 'date of admission']),
              transportRouteName: getValue(row, ['transport route', 'transportRoute', 'route', 'bus route'])?.toString()?.trim(),
              pickupPoint: getValue(row, ['pickup point', 'pickupPoint', 'pickup', 'bus stop', 'stop'])?.toString()?.trim()
            });
          } catch (err: any) {
            errors.push(`Row ${i + 1}: ${err.message}`);
          }
        }

        // If the upload size is large, process it asynchronously using BullMQ
        if (validRows.length > 200) {
          const { generalQueue } = await import('../../lib/queue');
          const routeMapObj = Object.fromEntries(routeMap);

          const job = await generalQueue.add(
            'student-import',
            {
              validRows,
              targetTenantId,
              hashedPassword,
              routeMap: routeMapObj,
              totalRows: records.length,
              skippedCount,
              preValidationErrors: errors
            },
            {
              jobId: `import-${targetTenantId}-${Date.now()}`,
              removeOnComplete: { age: 3600 },
              removeOnFail: { age: 86400 }
            }
          );

          posthog.capture({
            distinctId: targetTenantId || 'system',
            event: 'file_data_import_queued',
            properties: { tenantId: targetTenantId, dataType, count: validRows.length, jobId: job.id }
          });

          return {
            status: 'queued',
            jobId: job.id,
            total: records.length,
            skipped: skippedCount,
            errors: errors.length,
            errorDetails: errors
          };
        }

        // 3. Bulk Insert (Synchronous flow for smaller sheets <= 200 rows)
        if (validRows.length > 0) {
          try {
            await db.transaction(async (tx) => {
              const usersToInsert = validRows.map(v => ({
                email: v.email,
                name: v.name,
                role: 'student' as const,
                phone: v.phone,
                password: hashedPassword,
                tenantId: targetTenantId,
              }));

              const createdUsers = await tx.insert(schema.users)
                .values(usersToInsert)
                .onConflictDoUpdate({
                  target: schema.users.email,
                  set: {
                    name: sql`EXCLUDED.name`,
                    phone: sql`EXCLUDED.phone`,
                    tenantId: sql`EXCLUDED."tenantId"`
                  }
                })
                .returning();

              // Map back to validRows using email
              const userMap = new Map(createdUsers.map(u => [u.email.toLowerCase(), u.id]));

              const studentsToInsert: any[] = [];

              validRows.forEach(v => {
                const userId = userMap.get(v.email.toLowerCase());
                if (!userId) return;

                let formattedDob = v.dobRaw ? v.dobRaw.toString() : null;
                if (typeof v.dobRaw === 'number') {
                  const dateObj = XLSX.SSF.parse_date_code(v.dobRaw);
                  formattedDob = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
                }

                let formattedAdmission = formatDate();
                if (v.admissionDateRaw) {
                  if (typeof v.admissionDateRaw === 'number') {
                    const dateObj = XLSX.SSF.parse_date_code(v.admissionDateRaw);
                    formattedAdmission = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
                  } else {
                    formattedAdmission = v.admissionDateRaw.toString();
                  }
                }

                studentsToInsert.push({
                  userId,
                  rollNumber: v.rollNumber,
                  classId: v.classId,
                  gender: v.gender,
                  dateOfBirth: formattedDob,
                  bloodGroup: v.bloodGroup,
                  admissionDate: formattedAdmission,
                });
              });

              const createdStudents = await tx.insert(schema.students)
                .values(studentsToInsert)
                .onConflictDoUpdate({
                  target: schema.students.userId,
                  set: {
                    rollNumber: sql`EXCLUDED."rollNumber"`,
                    classId: sql`EXCLUDED."classId"`,
                    gender: sql`EXCLUDED.gender`,
                    dateOfBirth: sql`EXCLUDED."dateOfBirth"`,
                    bloodGroup: sql`EXCLUDED."bloodGroup"`,
                    admissionDate: sql`EXCLUDED."admissionDate"`,
                  }
                })
                .returning();
              
              const studentUserMap = new Map(createdStudents.map(s => [s.userId, s.id]));
              const realTransport: any[] = [];

              validRows.forEach(v => {
                const userId = userMap.get(v.email.toLowerCase());
                const studentId = userId ? studentUserMap.get(userId) : null;
                const routeId = v.transportRouteName ? routeMap.get(v.transportRouteName.toLowerCase()) : null;
                
                if (studentId && routeId) {
                  let formattedAdmission = formatDate();
                  if (v.admissionDateRaw) {
                    if (typeof v.admissionDateRaw === 'number') {
                      const dateObj = XLSX.SSF.parse_date_code(v.admissionDateRaw);
                      formattedAdmission = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
                    } else {
                      formattedAdmission = v.admissionDateRaw.toString();
                    }
                  }

                  realTransport.push({
                    studentId,
                    routeId,
                    pickupPoint: v.pickupPoint || 'Main Stop',
                    startDate: formattedAdmission
                  });
                }
              });

              if (realTransport.length > 0) {
                await tx.insert(schema.transportAssignments).values(realTransport);
              }

              imported = createdStudents.length;
            });
          } catch (err: any) {
            errors.push(`Bulk import failed: ${err.message}`);
          }
        }
      }

      if (imported > 0) {
        await dataCache.deleteMatch([
          `*students*${targetTenantId}*`,
          `dashboard:${targetTenantId}:*`
        ]);
      }


      posthog.capture({
        distinctId: targetTenantId || 'system',
        event: 'file_data_imported',
        properties: { tenantId: targetTenantId, dataType, imported, errorCount: errors.length }
      });

      return {
        success: errors.length === 0,
        imported,
        skipped: skippedCount,
        errors: errors.length,
        total: records.length,
        errorDetails: errors
      };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/import', tenantId });
      set.status = 500;
      return { error: 'Failed to start import' };
    }
  });


