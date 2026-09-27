import { ClassOption } from './types';

export function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  if (month >= 6) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

export function getNumericGrade(gradeStr: string): number {
  if (!gradeStr) return 0;
  const cleaned = String(gradeStr).replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function getNextClass(fromClassId: string, classes: ClassOption[]): ClassOption | null {
  const currentClass = classes.find(c => c.id === fromClassId);
  if (!currentClass) return null;

  const currentGradeNum = getNumericGrade(currentClass.grade);
  const targetGradeNum = currentGradeNum + 1;

  // Find classes matching target grade and same section
  const nextClasses = classes.filter(c => getNumericGrade(c.grade) === targetGradeNum);
  if (nextClasses.length === 0) return null;

  const sameSection = nextClasses.find(c => c.section.toLowerCase() === currentClass.section.toLowerCase());
  return sameSection || nextClasses[0];
}

export function isLastClass(classId: string, classes: ClassOption[]): boolean {
  const currentClass = classes.find(c => c.id === classId);
  if (!currentClass) return false;

  const currentGradeNum = getNumericGrade(currentClass.grade);
  const maxGradeNum = Math.max(...classes.map(c => getNumericGrade(c.grade)), 0);

  return currentGradeNum >= maxGradeNum && maxGradeNum > 0;
}

export const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: '#FF9500', bgColor: 'rgba(255, 149, 0, 0.12)' },
  approved: { label: 'Approved', color: '#34C759', bgColor: 'rgba(52, 199, 89, 0.12)' },
  rejected: { label: 'Rejected', color: '#FF3B30', bgColor: 'rgba(255, 59, 48, 0.12)' },
};
