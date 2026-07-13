import { pgTable, text, boolean, doublePrecision, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (staff and Google-authenticated users)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // We can use Firebase UID or custom USR-XXX
  uid: text('uid').unique(), // Firebase Auth UID for Google Login
  username: text('username').unique(), // 'owner', 'admin'
  name: text('name').notNull(),
  email: text('email').unique(),
  role: text('role').notNull(), // 'OWNER', 'ADMIN', 'CUSTOMER'
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE', 'INACTIVE'
  createdAt: timestamp('created_at').defaultNow(),
});

// Customers table
export const customers = pgTable('customers', {
  id: text('id').primaryKey(), // 'CUST-XXX'
  memberNumber: text('member_number').notNull().unique(), // 'BKS-YYYY-XXX'
  name: text('name').notNull(),
  nik: text('nik').notNull(),
  birthDate: text('birth_date').notNull(), // 'DD-MM-YYYY'
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE', 'INACTIVE'
  passwordHash: text('password_hash').notNull(), // Simple plaintext check / birthDate
  isFirstLogin: boolean('is_first_login').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Gold Prices table
export const goldPrices = pgTable('gold_prices', {
  id: text('id').primaryKey(), // 'GP-XXX'
  price: doublePrecision('price').notNull(),
  date: text('date').notNull(), // ISO Date
  updatedBy: text('updated_by').notNull(),
});

// Money Transactions table
export const moneyTransactions = pgTable('money_transactions', {
  id: text('id').primaryKey(), // 'MT-XXX'
  transactionNumber: text('transaction_number').notNull().unique(), // 'TXM-YYYY-XXX'
  customerId: text('customer_id')
    .references(() => customers.id)
    .notNull(),
  type: text('type').notNull(), // 'DEPOSIT', 'WITHDRAWAL', etc.
  amount: doublePrecision('amount').notNull(),
  date: text('date').notNull(), // ISO Date
  note: text('note').notNull(),
  createdBy: text('created_by').notNull(),
  isReversaled: boolean('is_reversaled').default(false),
  reversalOf: text('reversal_of'),
});

// Gold Transactions table
export const goldTransactions = pgTable('gold_transactions', {
  id: text('id').primaryKey(), // 'GT-XXX'
  transactionNumber: text('transaction_number').notNull().unique(), // 'TXG-YYYY-XXX'
  customerId: text('customer_id')
    .references(() => customers.id)
    .notNull(),
  type: text('type').notNull(), // 'GOLD_DEPOSIT', etc.
  weight: doublePrecision('weight').notNull(),
  goldPriceSnapshot: doublePrecision('gold_price_snapshot').notNull(),
  amountRupiah: doublePrecision('amount_rupiah').notNull(),
  date: text('date').notNull(), // ISO Date
  note: text('note').notNull(),
  createdBy: text('created_by').notNull(),
  isReversaled: boolean('is_reversaled').default(false),
  reversalOf: text('reversal_of'),
});

// Loans table
export const loans = pgTable('loans', {
  id: text('id').primaryKey(), // 'LN-XXX'
  loanNumber: text('loan_number').notNull().unique(), // 'LOAN-YYYY-XXX'
  customerId: text('customer_id')
    .references(() => customers.id)
    .notNull(),
  amount: doublePrecision('amount').notNull(),
  outstanding: doublePrecision('outstanding').notNull(),
  date: text('date').notNull(), // ISO Date
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE', 'PAID'
  note: text('note').notNull(),
});

// Loan Payments table
export const loanPayments = pgTable('loan_payments', {
  id: text('id').primaryKey(), // 'LP-XXX'
  loanId: text('loan_id')
    .references(() => loans.id)
    .notNull(),
  customerId: text('customer_id')
    .references(() => customers.id)
    .notNull(),
  amount: doublePrecision('amount').notNull(),
  date: text('date').notNull(), // ISO Date
  note: text('note').notNull(),
  createdBy: text('created_by').notNull(),
});

// Audit Logs table
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(), // 'AL-XXX'
  date: text('date').notNull(), // ISO Date
  user: text('user').notNull(),
  role: text('role').notNull(),
  activity: text('activity').notNull(),
  object: text('object').notNull(),
  ipAddress: text('ip_address').notNull(),
});

// Relations definitions
export const customersRelations = relations(customers, ({ many }) => ({
  moneyTransactions: many(moneyTransactions),
  goldTransactions: many(goldTransactions),
  loans: many(loans),
  loanPayments: many(loanPayments),
}));

export const moneyTransactionsRelations = relations(moneyTransactions, ({ one }) => ({
  customer: one(customers, {
    fields: [moneyTransactions.customerId],
    references: [customers.id],
  }),
}));

export const goldTransactionsRelations = relations(goldTransactions, ({ one }) => ({
  customer: one(customers, {
    fields: [goldTransactions.customerId],
    references: [customers.id],
  }),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  customer: one(customers, {
    fields: [loans.customerId],
    references: [customers.id],
  }),
  payments: many(loanPayments),
}));

export const loanPaymentsRelations = relations(loanPayments, ({ one }) => ({
  loan: one(loans, {
    fields: [loanPayments.loanId],
    references: [loans.id],
  }),
  customer: one(customers, {
    fields: [loanPayments.customerId],
    references: [customers.id],
  }),
}));
