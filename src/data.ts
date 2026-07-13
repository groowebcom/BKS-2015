/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer, MoneyTransaction, GoldTransaction, Loan, LoanPayment, GoldPrice, AuditLog, User, UserRole } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-001',
    username: 'owner',
    name: 'Pak Dedek',
    role: UserRole.OWNER,
    status: 'ACTIVE',
  },
  {
    id: 'USR-002',
    username: 'admin',
    name: 'Siti Rahma',
    role: UserRole.ADMIN,
    status: 'ACTIVE',
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-001',
    memberNumber: 'BKS-2015-001',
    name: 'H. Ahmad Subarjo',
    nik: '3201234567890001',
    birthDate: '12-08-1965', // DD-MM-YYYY
    phone: '081234567890',
    address: 'Jl. Raya Desa Bojong Gede No. 45, BKS',
    status: 'ACTIVE',
    passwordHash: '12081965', // Default password DDMMYYYY
    isFirstLogin: false,
    notes: 'Nasabah prioritas sejak awal gerai berdiri.'
  },
  {
    id: 'CUST-002',
    memberNumber: 'BKS-2015-002',
    name: 'Ibu Aminah',
    nik: '3201234567890002',
    birthDate: '25-04-1978',
    phone: '085678901234',
    address: 'Kampung Rawa Indah RT 03/RW 04, BKS',
    status: 'ACTIVE',
    passwordHash: '25041978',
    isFirstLogin: false,
    notes: 'Pemilik warung kelontong makmur.'
  },
  {
    id: 'CUST-003',
    memberNumber: 'BKS-2016-015',
    name: 'Budi Santoso',
    nik: '3201234567890003',
    birthDate: '15-08-1992',
    phone: '087890123456',
    address: 'Perum Gading BKS Blok C5 No. 12',
    status: 'ACTIVE',
    passwordHash: '15081992', // birthDate without dash for first login test
    isFirstLogin: true,
    notes: 'Petani padi modern BKS.'
  },
  {
    id: 'CUST-004',
    memberNumber: 'BKS-2018-089',
    name: 'Sri Wahyuni',
    nik: '3201234567890004',
    birthDate: '03-11-1985',
    phone: '081398765432',
    address: 'Dusun Sukamaju RT 01/RW 02, Desa BKS',
    status: 'ACTIVE',
    passwordHash: '03111985',
    isFirstLogin: false,
  },
  {
    id: 'CUST-005',
    memberNumber: 'BKS-2020-120',
    name: 'Joko Widodo',
    nik: '3201234567890005',
    birthDate: '21-06-1961',
    phone: '081200000000',
    address: 'Jl. Merdeka No. 1, Kota BKS',
    status: 'INACTIVE',
    passwordHash: '21061961',
    isFirstLogin: false,
    notes: 'Keanggotaan dinonaktifkan sementara karena domisili pindah.'
  },
  {
    id: 'CUST-006',
    memberNumber: 'BKS-2022-250',
    name: 'Siti Nurbaya',
    nik: '3201234567890006',
    birthDate: '09-10-1995',
    phone: '081233445566',
    address: 'Kp. Baru RT 04/RW 01, BKS',
    status: 'ACTIVE',
    passwordHash: '09101995',
    isFirstLogin: false,
  },
  {
    id: 'CUST-007',
    memberNumber: 'BKS-2024-380',
    name: 'Eko Prasetyo',
    nik: '3201234567890007',
    birthDate: '30-12-1989',
    phone: '085299887766',
    address: 'Dusun Makmur RT 02/RW 03, BKS',
    status: 'ACTIVE',
    passwordHash: '30121989',
    isFirstLogin: false,
  }
];

export const INITIAL_GOLD_PRICES: GoldPrice[] = [
  { id: 'GP-001', price: 1350000, date: '2026-07-01T08:00:00+07:00', updatedBy: 'Pak Dedek' },
  { id: 'GP-002', price: 1360000, date: '2026-07-05T08:00:00+07:00', updatedBy: 'Pak Dedek' },
  { id: 'GP-003', price: 1380000, date: '2026-07-10T08:00:00+07:00', updatedBy: 'Pak Dedek' },
  { id: 'GP-004', price: 1400000, date: '2026-07-12T08:00:00+07:00', updatedBy: 'Pak Dedek' }, // Active price
];

export const INITIAL_MONEY_TRANSACTIONS: MoneyTransaction[] = [
  // CUST-001
  {
    id: 'MT-001',
    transactionNumber: 'TXM-2026-0001',
    customerId: 'CUST-001',
    type: 'DEPOSIT',
    amount: 15000000,
    date: '2026-07-01T09:30:00+07:00',
    note: 'Setoran Tunai Awal Semester',
    createdBy: 'Siti Rahma',
  },
  {
    id: 'MT-002',
    transactionNumber: 'TXM-2026-0002',
    customerId: 'CUST-001',
    type: 'WITHDRAWAL',
    amount: 2500000,
    date: '2026-07-05T14:15:00+07:00',
    note: 'Penarikan Tunai Keperluan Sekolah',
    createdBy: 'Siti Rahma',
  },
  // CUST-002
  {
    id: 'MT-003',
    transactionNumber: 'TXM-2026-0003',
    customerId: 'CUST-002',
    type: 'DEPOSIT',
    amount: 5000000,
    date: '2026-07-02T10:00:00+07:00',
    note: 'Setoran Tunai Hasil Dagang',
    createdBy: 'Siti Rahma',
  },
  {
    id: 'MT-004',
    transactionNumber: 'TXM-2026-0004',
    customerId: 'CUST-002',
    type: 'LOAN_DISBURSEMENT',
    amount: 5000000,
    date: '2026-07-03T11:00:00+07:00',
    note: 'Pencairan Pinjaman Modal Usaha',
    createdBy: 'Pak Dedek',
  },
  {
    id: 'MT-005',
    transactionNumber: 'TXM-2026-0005',
    customerId: 'CUST-002',
    type: 'LOAN_PAYMENT',
    amount: 1500000,
    date: '2026-07-08T13:00:00+07:00',
    note: 'Pembayaran Cicilan Pinjaman Ke-1',
    createdBy: 'Siti Rahma',
  },
  {
    id: 'MT-006',
    transactionNumber: 'TXM-2026-0006',
    customerId: 'CUST-002',
    type: 'LOAN_PAYMENT',
    amount: 1500000,
    date: '2026-07-11T10:30:00+07:00',
    note: 'Pembayaran Cicilan Pinjaman Ke-2',
    createdBy: 'Siti Rahma',
  },
  // CUST-006 (Fully paid loan)
  {
    id: 'MT-007',
    transactionNumber: 'TXM-2026-0007',
    customerId: 'CUST-006',
    type: 'DEPOSIT',
    amount: 1000000,
    date: '2026-07-01T15:00:00+07:00',
    note: 'Setoran Tabungan',
    createdBy: 'Siti Rahma',
  },
  {
    id: 'MT-008',
    transactionNumber: 'TXM-2026-0008',
    customerId: 'CUST-006',
    type: 'LOAN_DISBURSEMENT',
    amount: 2000000,
    date: '2026-07-02T09:00:00+07:00',
    note: 'Pencairan Pinjaman Kebutuhan Mendesak',
    createdBy: 'Pak Dedek',
  },
  {
    id: 'MT-009',
    transactionNumber: 'TXM-2026-0009',
    customerId: 'CUST-006',
    type: 'LOAN_PAYMENT',
    amount: 2000000,
    date: '2026-07-10T11:00:00+07:00',
    note: 'Pelunasan Pinjaman',
    createdBy: 'Siti Rahma',
  },
  // CUST-007
  {
    id: 'MT-010',
    transactionNumber: 'TXM-2026-0010',
    customerId: 'CUST-007',
    type: 'DEPOSIT',
    amount: 8500000,
    date: '2026-07-04T09:45:00+07:00',
    note: 'Setoran Tunai Hasil Panen',
    createdBy: 'Siti Rahma',
  },
  {
    id: 'MT-011',
    transactionNumber: 'TXM-2026-0011',
    customerId: 'CUST-007',
    type: 'WITHDRAWAL',
    amount: 2000000,
    date: '2026-07-08T10:00:00+07:00',
    note: 'Penarikan Tunai Beli Pupuk',
    createdBy: 'Siti Rahma',
  },
  // Gold sell proceeds
  {
    id: 'MT-012',
    transactionNumber: 'TXM-2026-0012',
    customerId: 'CUST-001',
    type: 'GOLD_SALE_PROCEEDS',
    amount: 13800000, // 10 grams * 1,380,000
    date: '2026-07-10T10:00:00+07:00',
    note: 'Penjualan Emas Tabungan 10.0000 gram',
    createdBy: 'Siti Rahma',
  },
];

export const INITIAL_GOLD_TRANSACTIONS: GoldTransaction[] = [
  // CUST-001
  {
    id: 'GT-001',
    transactionNumber: 'TXG-2026-0001',
    customerId: 'CUST-001',
    type: 'GOLD_DEPOSIT',
    weight: 25.5000,
    goldPriceSnapshot: 1350000,
    amountRupiah: 34425000,
    date: '2026-07-02T10:30:00+07:00',
    note: 'Setor Emas Antam Logam Mulia',
    createdBy: 'Siti Rahma',
  },
  {
    id: 'GT-002',
    transactionNumber: 'TXG-2026-0002',
    customerId: 'CUST-001',
    type: 'GOLD_DEPOSIT',
    weight: 15.0000,
    goldPriceSnapshot: 1360000,
    amountRupiah: 20400000,
    date: '2026-07-06T11:00:00+07:00',
    note: 'Setoran Emas Fisik 15 Gram',
    createdBy: 'Siti Rahma',
  },
  {
    id: 'GT-003',
    transactionNumber: 'TXG-2026-0003',
    customerId: 'CUST-001',
    type: 'GOLD_SELL',
    weight: 10.0000,
    goldPriceSnapshot: 1380000,
    amountRupiah: 13800000,
    date: '2026-07-10T10:00:00+07:00',
    note: 'Jual Emas Tabungan 10 Gram',
    createdBy: 'Siti Rahma',
  },
  // CUST-004
  {
    id: 'GT-004',
    transactionNumber: 'TXG-2026-0004',
    customerId: 'CUST-004',
    type: 'GOLD_DEPOSIT',
    weight: 5.0000,
    goldPriceSnapshot: 1350000,
    amountRupiah: 6750000,
    date: '2026-07-03T14:00:00+07:00',
    note: 'Setor Emas LM Mini',
    createdBy: 'Siti Rahma',
  },
  {
    id: 'GT-005',
    transactionNumber: 'TXG-2026-0005',
    customerId: 'CUST-004',
    type: 'GOLD_WITHDRAWAL',
    weight: 1.0000,
    goldPriceSnapshot: 1380000,
    amountRupiah: 13800000,
    date: '2026-07-11T09:00:00+07:00',
    note: 'Tarik Emas Fisik 1 Gram',
    createdBy: 'Siti Rahma',
  }
];

export const INITIAL_LOANS: Loan[] = [
  // CUST-002
  {
    id: 'LN-001',
    loanNumber: 'LOAN-2026-0001',
    customerId: 'CUST-002',
    amount: 5000000,
    outstanding: 2000000, // 5,000,000 - 1,500,000 - 1,500,000
    date: '2026-07-03T11:00:00+07:00',
    status: 'ACTIVE',
    note: 'Pinjaman Modal Warung Kelontong',
  },
  // CUST-006
  {
    id: 'LN-002',
    loanNumber: 'LOAN-2026-0002',
    customerId: 'CUST-006',
    amount: 2000000,
    outstanding: 0,
    date: '2026-07-02T09:00:00+07:00',
    status: 'PAID',
    note: 'Pinjaman Kebutuhan Mendesak',
  }
];

export const INITIAL_LOAN_PAYMENTS: LoanPayment[] = [
  // LN-001
  {
    id: 'LP-001',
    loanId: 'LN-001',
    customerId: 'CUST-002',
    amount: 1500000,
    date: '2026-07-08T13:00:00+07:00',
    note: 'Cicilan Ke-1 Pinjaman Modal Usaha',
    createdBy: 'Siti Rahma',
  },
  {
    id: 'LP-002',
    loanId: 'LN-001',
    customerId: 'CUST-002',
    amount: 1500000,
    date: '2026-07-11T10:30:00+07:00',
    note: 'Cicilan Ke-2 Pinjaman Modal Usaha',
    createdBy: 'Siti Rahma',
  },
  // LN-002
  {
    id: 'LP-003',
    loanId: 'LN-002',
    customerId: 'CUST-006',
    amount: 2000000,
    date: '2026-07-10T11:00:00+07:00',
    note: 'Pelunasan Pinjaman',
    createdBy: 'Siti Rahma',
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AL-001',
    date: '2026-07-12T08:00:00+07:00',
    user: 'Pak Dedek',
    role: UserRole.OWNER,
    activity: 'UPDATE_GOLD_PRICE',
    object: 'Harga Emas diperbarui menjadi Rp 1.400.000 / gram',
    ipAddress: '192.168.1.10',
  },
  {
    id: 'AL-002',
    date: '2026-07-11T10:30:00+07:00',
    user: 'Siti Rahma',
    role: UserRole.ADMIN,
    activity: 'LOAN_PAYMENT',
    object: 'Pembayaran Pinjaman Ibu Aminah Rp 1.500.000',
    ipAddress: '192.168.1.11',
  },
  {
    id: 'AL-003',
    date: '2026-07-10T11:00:00+07:00',
    user: 'Siti Rahma',
    role: UserRole.ADMIN,
    activity: 'LOAN_PAYMENT',
    object: 'Pelunasan Pinjaman Siti Nurbaya Rp 2.000.000',
    ipAddress: '192.168.1.11',
  },
  {
    id: 'AL-004',
    date: '2026-07-10T10:00:00+07:00',
    user: 'Siti Rahma',
    role: UserRole.ADMIN,
    activity: 'GOLD_SELL',
    object: 'Penjualan Emas H. Ahmad Subarjo 10.0000 gram (Rp 13.800.000)',
    ipAddress: '192.168.1.11',
  },
  {
    id: 'AL-005',
    date: '2026-07-03T11:00:00+07:00',
    user: 'Pak Dedek',
    role: UserRole.OWNER,
    activity: 'CREATE_LOAN',
    object: 'Pencairan Pinjaman Ibu Aminah Rp 5.000.000',
    ipAddress: '192.168.1.10',
  },
];

// Helper functions for dynamic balance calculations as per BR-301, BR-402, and BR-505
export function getCustomerMoneyBalance(
  customerId: string,
  moneyTx: MoneyTransaction[]
): number {
  // Saldo = Total Setoran - Total Penarikan + Total Pinjaman - Total Pembayaran Pinjaman
  // Note: Tabungan emas jual proceeds are type GOLD_SALE_PROCEEDS (which is logically a Deposit from sale of gold)
  let totalSetoran = 0;
  let totalPenarikan = 0;
  let totalPinjaman = 0;
  let totalPembayaran = 0;

  moneyTx
    .filter((tx) => tx.customerId === customerId && !tx.isReversaled)
    .forEach((tx) => {
      if (tx.type === 'DEPOSIT' || tx.type === 'GOLD_SALE_PROCEEDS') {
        totalSetoran += tx.amount;
      } else if (tx.type === 'WITHDRAWAL') {
        totalPenarikan += tx.amount;
      } else if (tx.type === 'LOAN_DISBURSEMENT') {
        totalPinjaman += tx.amount;
      } else if (tx.type === 'LOAN_PAYMENT') {
        totalPembayaran += tx.amount;
      }
    });

  return totalSetoran - totalPenarikan + totalPinjaman - totalPembayaran;
}

export function getCustomerGoldBalance(
  customerId: string,
  goldTx: GoldTransaction[]
): number {
  // Saldo Gram = Total Setor - Total Tarik - Total Jual
  let totalSetor = 0;
  let totalTarik = 0;
  let totalJual = 0;

  goldTx
    .filter((tx) => tx.customerId === customerId && !tx.isReversaled)
    .forEach((tx) => {
      if (tx.type === 'GOLD_DEPOSIT') {
        totalSetor += tx.weight;
      } else if (tx.type === 'GOLD_WITHDRAWAL') {
        totalTarik += tx.weight;
      } else if (tx.type === 'GOLD_SELL') {
        totalJual += tx.weight;
      }
    });

  return totalSetor - totalTarik - totalJual;
}

export function getCustomerLoans(
  customerId: string,
  loans: Loan[]
): Loan[] {
  return loans.filter((ln) => ln.customerId === customerId);
}

export function getActiveLoanOutstanding(
  customerId: string,
  loans: Loan[]
): number {
  return loans
    .filter((ln) => ln.customerId === customerId && ln.status === 'ACTIVE')
    .reduce((sum, ln) => sum + ln.outstanding, 0);
}
