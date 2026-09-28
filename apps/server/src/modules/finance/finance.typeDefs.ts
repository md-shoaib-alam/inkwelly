export const financeTypeDefs = `#graphql
  type ExpenseCategory {
    id: String!
    name: String!
    description: String
    createdAt: String!
  }

  type Expense {
    id: String!
    categoryId: String!
    category: ExpenseCategory!
    amount: Float!
    date: String!
    description: String
    paymentMethod: String!
    referenceNo: String
    status: String!
    receipt: String
    createdAt: String!
  }

  input CreateExpenseCategoryInput {
    name: String!
    description: String
  }

  input CreateExpenseInput {
    categoryId: String!
    amount: Float!
    date: String!
    description: String
    paymentMethod: String
    referenceNo: String
    status: String
    receipt: String
  }

  extend type Query {
    expenseCategories: [ExpenseCategory!]!
    expenses(categoryId: String, status: String, page: Int, limit: Int): ExpenseResponse!
    expenseStats: ExpenseStats!
  }

  type ExpenseResponse {
    items: [Expense!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type ExpenseStats {
    totalExpenses: Float!
    thisMonthExpenses: Float!
    prevMonthExpenses: Float!
    categoryWiseExpenses: [CategoryExpenseStat!]!
  }

  type CategoryExpenseStat {
    categoryId: String!
    categoryName: String!
    amount: Float!
  }

  extend type Mutation {
    createExpenseCategory(input: CreateExpenseCategoryInput!): ExpenseCategory!
    createExpense(input: CreateExpenseInput!): Expense!
    updateExpense(id: String!, input: CreateExpenseInput!): Expense!
    deleteExpense(id: String!): Boolean!
  }
`;
