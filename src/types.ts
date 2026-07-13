/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Customer {
  id: string;
  memberNumber: string;
  name: string;
  nik: string;
  birthDate: string; // DD-MM-YYYY format or DDMMYYYY for password
  phone: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE';
  passwordHash: string; // simple plain-text check in dummy code but named passwordHash
  isFirstLogin: boolean;
  notes?: string;
}

export type MoneyTxType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'LOAN_DISBURSEMENT'
  | 'LOAN_PAYMENT'
  | 'GOLD_SALE_PROCEEDS'
  | 'REVERSAL';

export interface MoneyTransaction {
  id: string;
  transactionNumber: string;
  customerId: string;
  type: MoneyTxType;
  amount: number;
  date: string; // ISO String or YYYY-MM-DD HH:mm
  note: string;
  createdBy: string;
  isReversaled?: boolean;
  reversalOf?: string; // ID of the reversed transaction
}

export type GoldTxType =
  | 'GOLD_DEPOSIT'
  | 'GOLD_WITHDRAWAL'
  | 'GOLD_SELL'
  | 'REVERSAL';

export interface GoldTransaction {
  id: string;
  transactionNumber: string;
  customerId: string;
  type: GoldTxType;
  weight: number; // in grams with 4 decimal places
  goldPriceSnapshot: number; // price per gram at transaction time
  amountRupiah: number; // weight * snapshot
  date: string;
  note: string;
  createdBy: string;
  isReversaled?: boolean;
  reversalOf?: string;
}

export interface Loan {
  id: string;
  loanNumber: string;
  customerId: string;
  amount: number;
  outstanding: number;
  date: string;
  status: 'ACTIVE' | 'PAID';
  note: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  customerId: string;
  amount: number;
  date: string;
  note: string;
  createdBy: string;
}

export interface GoldPrice {
  id: string;
  price: number;
  date: string;
  updatedBy: string;
}

export interface AuditLog {
  id: string;
  date: string;
  user: string;
  role: UserRole;
  activity: string;
  object: string;
  ipAddress: string;
}
