# Schema Optimization for Million-User Scale

**Goal:** Optimize database schema and query patterns to handle 1M+ students across multiple tenants efficiently.

**Architecture:** Multi-tenant SaaS with academic year partitioning, composite indexes, and cursor-based pagination.

**Tech Stack:** PostgreSQL 15+, Drizzle ORM, React Query (web), TanStack Query (mobile)

---

## Current Critical Issues

### 1. Parents Table: 18 Inline Columns (Lines 186-207)

**Problem:** The `parents` table stores both father and mother details inline:
- 9 columns for father (title, firstName, middleName, lastName, mobile, education, workAddress)
- 9 columns for mother (same structure)
- Total width: 20 columns per row

**Impact at scale:**
- Every parent query fetches 18 mostly-empty columns (single-parent households leave half NULL)
- Index bloat: wider rows = fewer rows per page = more I/O
- Cannot search "all parents where mother's occupation is X" without full table scan

**Solution: Normalize into `parentContacts`**

```typescript
// Core parent info only
export const parents = pgTable('Parent', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull().unique(),
  occupation: text('occupation'), // primary guardian's occupation
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Separate contact records for each parent
export const parentContacts = pgTable('ParentContact', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  parentId: text('parentId').notNull().references(() => parents.id, { onDelete: 'cascade' }),
  relationship: text('relationship').notNull(), // 'father' | 'mother' | 'guardian'
  title: text('title'),
  firstName: text('firstName').notNull(),
  middleName: text('middleName'),
  lastName: text('lastName'),
  mobile: text('mobile'),
  education: text('education'),
  workAddress: text('workAddress'),
  isPrimary: boolean('isPrimary').default(false).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  parentIdIdx: index('ParentContact_parentId_idx').on(table.parentId),
  relationshipIdx: index('ParentContact_relationship_idx').on(table.relationship),
  mobileIdx: index('ParentContact_mobile_idx').on(table.mobile),
}));
```

**Migration strategy:**
1. Create `ParentContact` table
2. For each existing parent row, insert up to 2 contact rows (father + mother if populated)
3. Drop the 18 inline columns from `parents`
4. Update application queries to JOIN when needed

**Benefit:** Reduces parent table width by ~60%, enables efficient contact searches.

---

### 2. Attendance Table: Missing Academic Year Partitioning (Lines 259-278)

**Problem:** The `attendance` table has 7 indexes but NO `academicYear` column. At 1M students × 200 days/year = 200M rows/year.

**Current indexes:**
- `tenantId_month` (good for monthly reports within a year)
- `classId_date_status` (good for daily register)
- `tenantId_date_studentId` (good for date-range queries)

**Missing:** Any way to quickly isolate one academic year's data.

**Solution A: Add academicYear column + composite index**

```typescript
export const attendance = pgTable('Attendance', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').default('master').notNull(),
  studentId: text('studentId').notNull(),
  classId: text('classId').notNull(),
  academicYear: text('academicYear').notNull(), // ADD THIS
  date: text('date').notNull(),
  month: text('month').default('').notNull(),
  status: text('status').default('present').notNull(),
  remarks: text('remarks'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  studentClassDateUnique: uniqueIndex('Attendance_studentId_classId_date_unique').on(table.studentId, table.classId, table.date),
  // NEW COMPOSITE INDEXES:
  tenantYearMonthIdx: index('Attendance_tenantId_academicYear_month_idx').on(table.tenantId, table.academicYear, table.month),
  tenantYearDateIdx: index('Attendance_tenantId_academicYear_date_idx').on(table.tenantId, table.academicYear, table.date),
  tenantClassYearDateIdx: index('Attendance_tenantId_classId_academicYear_date_idx').on(table.tenantId, table.classId, table.academicYear, table.date),
  // Keep existing high-value indexes:
  classDateStatusIdx: index('Attendance_classId_date_status_idx').on(table.classId, table.date, table.status),
  tenantDateStudentIdx: index('Attendance_tenantId_date_studentId_idx').on(table.tenantId, table.date, table.studentId),
}));
```

**Solution B: Table partitioning (PostgreSQL native)**

For >50M rows/year, use declarative partitioning:

```sql
CREATE TABLE Attendance (
  id TEXT NOT NULL,
  tenantId TEXT NOT NULL DEFAULT 'master',
  studentId TEXT NOT NULL,
  classId TEXT NOT NULL,
  academicYear TEXT NOT NULL,
  date TEXT NOT NULL,
  month TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'present',
  remarks TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW()
) PARTITION BY LIST (academicYear);

-- One partition per year
CREATE TABLE Attendance_2024_2025 PARTITION OF Attendance
  FOR VALUES IN ('2024-2025');
CREATE TABLE Attendance_2025_2026 PARTITION OF Attendance
  FOR VALUES IN ('2025-2026');
```

**Benefit:** Queries filtering by `(tenantId, academicYear)` skip 99% of partitions. A 200M-row table becomes twenty 10M-row tables.

**Recommendation:** Start with Solution A (add column + indexes). Migrate to Solution B when a single tenant exceeds 10M attendance rows.

---

### 3. Students Table: Missing Composite Index for Roster Queries (Lines 100-141)

**Problem:** The most common query is "show me all active students in class X for academic year Y":

```sql
SELECT * FROM Student 
WHERE tenantId = ? AND classId = ? AND academicYear = ? AND status = 'active';
```

But there's NO index covering `(tenantId, classId, academicYear, status)`.

**Current indexes:**
- `classId` (single column — helps but not enough)
- `classId_status` (better, but still missing academicYear)

**Solution:**

```typescript
}, (table) => ({
  classIdIdx: index('Student_classId_idx').on(table.classId),
  parentIdIdx: index('Student_parentId_idx').on(table.parentId),
  genderIdx: index('Student_gender_idx').on(table.gender),
  rollNumberIdx: index('Student_rollNumber_idx').on(table.rollNumber),
  statusIdx: index('Student_status_idx').on(table.status),
  classStatusIdx: index('Student_classId_status_idx').on(table.classId, table.status),
  // NEW CRITICAL INDEX:
  tenantClassYearStatusIdx: index('Student_tenantId_classId_academicYear_status_idx')
    .on(table.tenantId, table.classId, table.academicYear, table.status),
  // Also useful for student list pages:
  tenantYearCreatedIdx: index('Student_tenantId_academicYear_createdAt_idx')
    .on(table.tenantId, table.academicYear, table.createdAt),
}));
```

**Benefit:** Roster queries go from scanning all students in a class (potentially 10K+) to direct index lookup (<100 rows).

---

### 4. Grades Table: Missing Academic Year (Lines 304-328)

**Problem:** Similar to attendance, grades accumulate indefinitely. No way to isolate "this year's results".

**Solution:**

```typescript
export const grades = pgTable('Grade', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').default('master').notNull(),
  studentId: text('studentId').notNull(),
  subjectId: text('subjectId').notNull(),
  teacherId: text('teacherId').notNull(),
  academicYear: text('academicYear').notNull(), // ADD THIS
  examType: text('examType').notNull(),
  marks: doublePrecision('marks').notNull(),
  maxMarks: doublePrecision('maxMarks').notNull(),
  grade: text('grade'),
  remarks: text('remarks'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  studentSubjectExamUnique: uniqueIndex('Grade_studentId_subjectId_examType_unique').on(table.studentId, table.subjectId, table.examType),
  tenantIdIdx: index('Grade_tenantId_idx').on(table.tenantId),
  tenantExamTypeIdx: index('Grade_tenantId_examType_idx').on(table.tenantId, table.examType),
  studentIdIdx: index('Grade_studentId_idx').on(table.studentId),
  subjectIdIdx: index('Grade_subjectId_idx').on(table.subjectId),
  teacherIdIdx: index('Grade_teacherId_idx').on(table.teacherId),
  examTypeIdx: index('Grade_examType_idx').on(table.examType),
  tenantCreatedAtIdx: index('Grade_tenantId_createdAt_idx').on(table.tenantId, table.createdAt),
  studentExamTypeIdx: index('Grade_studentId_examType_idx').on(table.studentId, table.examType),
  tenantStudentIdx: index('Grade_tenantId_studentId_idx').on(table.tenantId, table.studentId),
  // NEW:
  tenantYearIdx: index('Grade_tenantId_academicYear_idx').on(table.tenantId, table.academicYear),
  studentYearIdx: index('Grade_studentId_academicYear_idx').on(table.studentId, table.academicYear),
}));
```

---

## Pagination Strategy

### Problem: OFFSET/LIMIT Degrades at Scale

Current pattern (likely):
```sql
SELECT * FROM Student WHERE tenantId = ? OFFSET 10000 LIMIT 50;
```

At offset 10,000, PostgreSQL must scan and discard 10,000 rows. This gets slower linearly.

### Solution: Cursor-Based Pagination

**Backend API pattern:**

```typescript
// GET /api/students?cursor=<last_id>&limit=50&classId=X&academicYear=Y
const students = await db
  .select()
  .from(students)
  .where(and(
    eq(students.tenantId, tenantId),
    eq(students.classId, classId),
    eq(students.academicYear, academicYear),
    gt(students.id, cursor || '0'), // cursor is last seen ID
  ))
  .orderBy(asc(students.id))
  .limit(limit + 1); // Fetch one extra to check if more exist

const hasNextPage = students.length > limit;
if (hasNextPage) students.pop(); // Remove the extra item

return {
  data: students,
  nextCursor: hasNextPage ? students[students.length - 1].id : null,
};
```

**Frontend React Query integration:**

```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['students', tenantId, classId, academicYear],
  queryFn: ({ pageParam }) => 
    api.getStudents({ cursor: pageParam, limit: 50, classId, academicYear }),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  initialPageParam: undefined,
});
```

**Benefit:** Constant-time pagination regardless of dataset size. Page 200 is as fast as page 1.

---

## Materialized Views for Expensive Aggregations

### Problem: Attendance Statistics Require Full Table Scans

Dashboard query: "What % of students were present this month?" requires counting all attendance rows for a tenant × month.

At 1M students × 20 days = 20M rows scanned per dashboard load.

### Solution: Pre-compute with materialized views

```sql
CREATE MATERIALIZED VIEW MonthlyAttendanceStats AS
SELECT 
  tenantId,
  academicYear,
  month,
  COUNT(*) FILTER (WHERE status = 'present') as presentCount,
  COUNT(*) FILTER (WHERE status = 'absent') as absentCount,
  COUNT(*) as totalCount,
  ROUND(COUNT(*) FILTER (WHERE status = 'present') * 100.0 / COUNT(*), 2) as attendanceRate
FROM Attendance
GROUP BY tenantId, academicYear, month;

-- Refresh daily or after bulk attendance entry
REFRESH MATERIALIZED VIEW CONCURRENTLY MonthlyAttendanceStats;
```

**Application query:**

```typescript
// Instead of scanning Attendance table:
const stats = await db
  .select()
  .from(monthlyAttendanceStats)
  .where(and(
    eq(monthlyAttendanceStats.tenantId, tenantId),
    eq(monthlyAttendanceStats.academicYear, academicYear),
    eq(monthlyAttendanceStats.month, month),
  ));
```

**Benefit:** Dashboard loads in <10ms instead of seconds. Trade-off: slight staleness (refreshed hourly/daily).

---

## Query Pattern Enforcement

### Rule: Always Filter by (tenantId, academicYear) First

**Bad query (scans all years):**
```typescript
await db.select().from(students).where(eq(students.classId, classId));
```

**Good query (index-localized):**
```typescript
await db.select().from(students).where(and(
  eq(students.tenantId, tenantId),
  eq(students.academicYear, academicYear),
  eq(students.classId, classId),
));
```

**Enforcement via middleware:**

```typescript
// apps/server/src/middleware/enforce-tenant-year.ts
export function enforceTenantYear(ctx: Context) {
  const { tenantId, academicYear } = ctx.get('auth');
  if (!tenantId || !academicYear) {
    throw new Error('Missing tenantId or academicYear in auth context');
  }
  // Inject into query builder automatically
  ctx.set('queryDefaults', { tenantId, academicYear });
}
```

---

## Summary of Changes

| Priority | Change | Impact | Effort |
|----------|--------|--------|--------|
| **P0** | Add `academicYear` to Attendance + composite indexes | 10-100x faster year-scoped queries | Medium (data migration) |
| **P0** | Add `Student_tenantId_classId_academicYear_status_idx` | 10x faster roster queries | Low (index only) |
| **P1** | Normalize `parents` → `ParentContact` | 60% smaller parent rows, better searchability | Medium (schema + migration) |
| **P1** | Add `academicYear` to Grades + indexes | Consistent year-scoping across modules | Medium |
| **P2** | Implement cursor-based pagination | Constant-time pagination at any scale | Medium (API refactor) |
| **P2** | Create materialized views for dashboard stats | Sub-10ms dashboard loads | Low (SQL only) |
| **P3** | Native PostgreSQL partitioning for Attendance | Handles 500M+ rows efficiently | High (DBA involvement) |

---

## Migration Order

1. **Add missing columns first** (non-breaking):
   - `Attendance.academicYear`
   - `Grades.academicYear`
   - Backfill from related tables (students.academicYear, classes.academicYear)

2. **Create new indexes** (online, no downtime):
   - All composite indexes listed above
   - Monitor index creation time on production-sized datasets

3. **Normalize parents table** (requires maintenance window):
   - Create `ParentContact` table
   - Migrate data in batches
   - Switch application queries
   - Drop old columns

4. **Implement cursor pagination** (gradual rollout):
   - Start with highest-traffic endpoints (students list, attendance list)
   - Update frontend to use infinite queries
   - Deprecate OFFSET/LIMIT endpoints

5. **Add materialized views** (zero downtime):
   - Create views alongside existing queries
   - Set up refresh cron jobs
   - Switch dashboard queries to use views

6. **Evaluate partitioning** (when needed):
   - Monitor table sizes quarterly
   - Partition when single table exceeds 50M rows
   - Requires PostgreSQL expertise

---

## Monitoring Metrics

Track these to validate optimizations:

1. **Query latency p95** (before/after indexes):
   - Student roster queries: target <50ms
   - Attendance monthly report: target <200ms
   - Parent contact search: target <100ms

2. **Table sizes** (monthly review):
   - `pg_total_relation_size('Attendance')` — alert if >10GB
   - `pg_total_relation_size('Student')` — alert if >5GB

3. **Index usage** (quarterly audit):
   ```sql
   SELECT schemaname, relname, indexrelname, idx_scan, idx_tup_read
   FROM pg_stat_user_indexes
   WHERE schemaname = 'public'
   ORDER BY idx_scan ASC; -- Find unused indexes to drop
   ```

4. **Pagination depth** (weekly review):
   - Track max OFFSET values in slow query log
   - If any query uses OFFSET >1000, convert to cursor pagination

---

## Implementation Notes

**Drizzle ORM considerations:**
- Use `db.execute(sql.raw(...))` for creating materialized views (Drizzle doesn't support them natively)
- Index creation is online by default in PostgreSQL 15+ (no table lock)
- Test migrations on a copy of production data before running live

**React Query cache invalidation:**
- When using cursor pagination, invalidate by exact query key: `['students', tenantId, classId, academicYear]`
- Don't invalidate entire query root — only the specific page params that changed

**Academic year transitions:**
- When a new academic year starts, pre-create empty partitions (if using partitioning)
- Run `ANALYZE` on all major tables after bulk data loads to update query planner statistics
