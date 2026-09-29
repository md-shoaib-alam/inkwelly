import { commonTypeDefs } from '../../modules/support/common.typeDefs'
import { platformTypeDefs } from '../../modules/platform/platform.typeDefs'
import { dashboardTypeDefs } from '../../modules/dashboard/dashboard.typeDefs'
import { academicTypeDefs } from '../../modules/academics/academic.typeDefs'
import { studentsDashboardTypeDefs } from '../../modules/students/students-dashboard.typeDefs'
import { financeTypeDefs } from '../../modules/money-book/finance.typeDefs'
import { responseTypeDefs } from './responses.typeDefs'
import { inputTypeDefs } from './inputs.typeDefs'
import { rootTypeDefs } from './root.typeDefs'
import { notificationTypeDefs } from '../../modules/communication/notification.typeDefs'

export const typeDefs = [
  commonTypeDefs,
  platformTypeDefs,
  dashboardTypeDefs,
  academicTypeDefs,
  studentsDashboardTypeDefs,
  financeTypeDefs,
  responseTypeDefs,
  inputTypeDefs,
  rootTypeDefs,
  notificationTypeDefs
].join('\n');
