import DataLoader from 'dataloader';
import { db } from './db';
import * as schema from '../db/schema';
import { inArray, eq, sql, desc, and, gte, count, avg } from 'drizzle-orm';
import { formatDate } from './date-utils';

/**
 * Factory function to create new DataLoaders per request
 */
export const createLoaders = () => ({
  childGrades: new DataLoader<string, any[]>(async (studentIds) => {
    const rankedGrades = db.$with('ranked_grades').as(
      db.select({
        id: schema.grades.id,
        studentId: schema.grades.studentId,
        subjectId: schema.grades.subjectId,
        examType: schema.grades.examType,
        marks: schema.grades.marks,
        maxMarks: schema.grades.maxMarks,
        grade: schema.grades.grade,
        createdAt: schema.grades.createdAt,
        rowNumber: sql<number>`row_number() over (partition by ${schema.grades.studentId} order by ${schema.grades.createdAt} desc)`.as('row_number')
      })
      .from(schema.grades)
      .innerJoin(schema.students, eq(schema.grades.studentId, schema.students.id))
      .innerJoin(schema.subjects, eq(schema.grades.subjectId, schema.subjects.id))
      .where(
        and(
          inArray(schema.grades.studentId, studentIds as string[]),
          eq(schema.subjects.classId, schema.students.classId)
        )
      )
    );

    const allGrades = await db.with(rankedGrades)
      .select({
        id: rankedGrades.id,
        studentId: rankedGrades.studentId,
        examType: rankedGrades.examType,
        marks: rankedGrades.marks,
        maxMarks: rankedGrades.maxMarks,
        grade: rankedGrades.grade,
        createdAt: rankedGrades.createdAt,
        subjectName: schema.subjects.name,
        studentName: schema.users.name,
      })
      .from(rankedGrades)
      .innerJoin(schema.subjects, eq(rankedGrades.subjectId, schema.subjects.id))
      .innerJoin(schema.students, eq(rankedGrades.studentId, schema.students.id))
      .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
      .where(sql`${rankedGrades.rowNumber} <= 20`)
      .orderBy(desc(rankedGrades.createdAt));

    const gradesMap: Record<string, any[]> = {};
    studentIds.forEach(id => { gradesMap[id] = []; });
    
    allGrades.forEach(grade => {
      const studentGrades = gradesMap[grade.studentId];
      if (studentGrades) {
        studentGrades.push({
          id: grade.id,
          studentId: grade.studentId,
          studentName: grade.studentName || 'Unknown',
          subjectName: grade.subjectName,
          examType: grade.examType,
          marks: grade.marks || 0,
          maxMarks: grade.maxMarks || 100,
          grade: grade.grade,
          createdAt: grade.createdAt.toISOString()
        });
      }
    });

    return studentIds.map(id => gradesMap[id] || []);
  }),

  childAttendance: new DataLoader<string, any[]>(async (studentIds) => {
    const rankedAttendance = db.$with('ranked_attendance').as(
      db.select({
        id: schema.attendance.id,
        studentId: schema.attendance.studentId,
        classId: schema.attendance.classId,
        date: schema.attendance.date,
        status: schema.attendance.status,
        remarks: schema.attendance.remarks,
        rowNumber: sql<number>`row_number() over (partition by ${schema.attendance.studentId} order by ${schema.attendance.date} desc)`.as('row_number')
      })
      .from(schema.attendance)
      .where(inArray(schema.attendance.studentId, studentIds as string[]))
    );

    const allAttendance = await db.with(rankedAttendance)
      .select({
        id: rankedAttendance.id,
        studentId: rankedAttendance.studentId,
        date: rankedAttendance.date,
        status: rankedAttendance.status,
        remarks: rankedAttendance.remarks,
        className: schema.classes.name,
        classSection: schema.classes.section,
        studentName: schema.users.name,
      })
      .from(rankedAttendance)
      .innerJoin(schema.classes, eq(rankedAttendance.classId, schema.classes.id))
      .innerJoin(schema.students, eq(rankedAttendance.studentId, schema.students.id))
      .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
      .where(sql`${rankedAttendance.rowNumber} <= 50`)
      .orderBy(desc(rankedAttendance.date));

    const attendanceMap: Record<string, any[]> = {};
    studentIds.forEach(id => { attendanceMap[id] = []; });

    allAttendance.forEach(att => {
      const studentAttendance = attendanceMap[att.studentId];
      if (studentAttendance) {
        studentAttendance.push({
          id: att.id,
          studentId: att.studentId,
          studentName: att.studentName || 'Unknown',
          className: `${att.className}-${att.classSection}`,
          date: att.date,
          status: att.status,
          remarks: att.remarks || null
        });
      }
    });

    return studentIds.map(id => attendanceMap[id] || []);
  }),

  studentPerformance: new DataLoader<string, any>(async (studentIds) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const cutoffStr = formatDate(sixMonthsAgo);

    const [attendanceStats, gradeStats] = await Promise.all([
      db.select({ 
        studentId: schema.attendance.studentId, 
        status: schema.attendance.status, 
        count: count() 
      })
      .from(schema.attendance)
      .innerJoin(schema.students, eq(schema.attendance.studentId, schema.students.id))
      .where(
        and(
          inArray(schema.attendance.studentId, studentIds as string[]),
          eq(schema.attendance.classId, schema.students.classId)
        )
      )
      .groupBy(schema.attendance.studentId, schema.attendance.status),
      
      db.select({ 
        studentId: schema.grades.studentId, 
        avgMarks: avg(schema.grades.marks) 
      })
      .from(schema.grades)
      .innerJoin(schema.students, eq(schema.grades.studentId, schema.students.id))
      .innerJoin(schema.subjects, eq(schema.grades.subjectId, schema.subjects.id))
      .where(
        and(
          inArray(schema.grades.studentId, studentIds as string[]),
          eq(schema.subjects.classId, schema.students.classId)
        )
      )
      .groupBy(schema.grades.studentId)
    ]);

    const statsMap: Record<string, any> = {};
    studentIds.forEach(id => {
      statsMap[id] = { attendanceRate: 0, avgGrade: 0, totalAtt: 0, presentAtt: 0 };
    });

    attendanceStats.forEach(stat => {
      if (statsMap[stat.studentId]) {
        statsMap[stat.studentId].totalAtt += stat.count;
        if (stat.status === 'present' || stat.status === 'late') {
          statsMap[stat.studentId].presentAtt += stat.count;
        }
      }
    });

    gradeStats.forEach(stat => {
      if (statsMap[stat.studentId]) {
        statsMap[stat.studentId].avgGrade = Number(stat.avgMarks) || 0;
      }
    });

    return studentIds.map(id => {
      const s = statsMap[id];
      const rate = s.totalAtt > 0 ? Math.round((s.presentAtt / s.totalAtt) * 10000) / 100 : 0;
      const avgValue = s.avgGrade;
      return {
        attendanceRate: rate,
        avgGrade: Math.round(avgValue * 100) / 100,
        grade: avgValue >= 90 ? 'A+' : avgValue >= 80 ? 'A' : avgValue >= 70 ? 'B' : avgValue >= 60 ? 'C' : avgValue >= 50 ? 'D' : 'F'
      };
    });
  }),

  // --- Entity Loaders ---
  
  classes: new DataLoader<string, any>(async (ids) => {
    const items = await db.query.classes.findMany({ 
      where: inArray(schema.classes.id, ids as string[]) 
    });
    const map = items.reduce((acc, curr) => { acc[curr.id] = curr; return acc; }, {} as any);
    return ids.map(id => map[id] || null);
  }),

  users: new DataLoader<string, any>(async (ids) => {
    const items = await db.query.users.findMany({ 
      where: inArray(schema.users.id, ids as string[]) 
    });
    const map = items.reduce((acc, curr) => { acc[curr.id] = curr; return acc; }, {} as any);
    return ids.map(id => map[id] || null);
  }),

  parents: new DataLoader<string, any>(async (ids) => {
    const items = await db.query.parents.findMany({ 
      where: inArray(schema.parents.id, ids as string[]),
      with: { user: true }
    });
    const map = items.reduce((acc, curr) => { acc[curr.id] = curr; return acc; }, {} as any);
    return ids.map(id => map[id] || null);
  }),

  students: new DataLoader<string, any>(async (ids) => {
    const items = await db.query.students.findMany({ 
      where: inArray(schema.students.id, ids as string[]),
      with: { user: true, class: true }
    });
    const map = items.reduce((acc, curr) => { acc[curr.id] = curr; return acc; }, {} as any);
    return ids.map(id => map[id] || null);
  }),
});



