import { commonTypeDefs } from '../../modules/support/common.typeDefs'
import { platformTypeDefs } from '../../modules/platform/platform.typeDefs'
import { dashboardTypeDefs } from '../../modules/dashboard/dashboard.typeDefs'
import { academicTypeDefs } from '../../modules/academics/academic.typeDefs'
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
  financeTypeDefs,
  responseTypeDefs,
  inputTypeDefs,
  rootTypeDefs,
  notificationTypeDefs
].join('\n');
