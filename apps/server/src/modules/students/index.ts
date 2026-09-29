export { studentsRoutes } from './students.routes';
export { admissionsRoutes } from './admissions.routes';
export { bulkUpdateRoutes } from './bulk-update.routes';
export { rosterRoutes } from './roster.routes';
export { StudentService } from './student.service';
export type { StudentListParams, StudentListItem, StudentListResult } from './student.service';
export { promotionsRoutes } from './promotions.routes';
// The roster's per-class Completion bar scores the same four fields this module's
// dashboard does, and the two must not drift. Academics reads the rule through here.
export { profileFieldCount } from './students-dashboard.service';
