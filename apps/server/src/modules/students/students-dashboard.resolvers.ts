import { requireModule, tenantFromArg } from '../../graphql/resolvers/helpers';
import { StudentsDashboardService } from './students-dashboard.service';

export const studentsDashboardQueries = {
  studentsCommandCenter: async (
    _: unknown,
    args: { tenantId?: string; academicYear?: string },
    context: any,
  ) => {
    const { user } = await requireModule(context, 'students', 'view');
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');

    return StudentsDashboardService.commandCenter(tenantId, args.academicYear);
  },
};
