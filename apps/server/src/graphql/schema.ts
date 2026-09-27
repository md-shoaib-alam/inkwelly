import { createSchema } from 'graphql-yoga'
import { resolvers } from './resolvers/index'
import { typeDefs } from './typeDefs/index'

export const schema = createSchema({
  typeDefs,
  resolvers,
})

export { resolvers }
