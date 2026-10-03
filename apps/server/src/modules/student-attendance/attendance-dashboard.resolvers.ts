import { requireModule, tenantFromArg } from '../../graphql/resolvers/helpers';
import { AttendanceDashboardService } from './attendance-dashboard.service';

export const attendanceDashboardQueries = {
  attendanceCommandCenter: async (
    _: unknown,
    args: { tenantId?: string; academicYear?: string; month?: string; date?: string },
    context: any,
  ) => {
    const { user } = await requireModule(context, 'attendance', 'view');
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');

    return AttendanceDashboardService.commandCenter(tenantId, args.academicYear, args.month, args.date);
  },
};
