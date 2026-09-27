import { commonTypeDefs } from './common.typeDefs'
import { platformTypeDefs } from './platform.typeDefs'
import { dashboardTypeDefs } from './dashboard.typeDefs'
import { academicTypeDefs } from './academic.typeDefs'
import { financeTypeDefs } from './finance.typeDefs'
import { responseTypeDefs } from './responses.typeDefs'
import { inputTypeDefs } from './inputs.typeDefs'
import { rootTypeDefs } from './root.typeDefs'
import { notificationTypeDefs } from './notification.typeDefs'

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
