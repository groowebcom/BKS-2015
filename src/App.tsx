/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserRole, Customer, MoneyTransaction, GoldTransaction, Loan, LoanPayment, GoldPrice, AuditLog, User } from './types';
import { supabase } from './lib/supabase';
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_MONEY_TRANSACTIONS, 
  INITIAL_GOLD_TRANSACTIONS, 
  INITIAL_LOANS, 
  INITIAL_LOAN_PAYMENTS, 
  INITIAL_GOLD_PRICES, 
  INITIAL_AUDIT_LOGS,
  INITIAL_USERS,
  getCustomerMoneyBalance,
  getCustomerGoldBalance,
  getActiveLoanOutstanding
} from './data';

import Login from './components/Login';
import Layout from './components/Layout';
import DashboardOwner from './components/DashboardOwner';
import DashboardAdmin from './components/DashboardAdmin';
import DashboardNasabah from './components/DashboardNasabah';
import CustomerList from './components/CustomerList';
import CustomerDetail from './components/CustomerDetail';
import Reports from './components/Reports';
import GoldPricePage from './components/GoldPricePage';
import ImportPage from './components/ImportPage';
import AuditTrailPage from './components/AuditTrailPage';

export default function App() {
  
  // App Session state
  const [currentUser, setCurrentUser] = useState<User | Customer | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [currentUserName, setCurrentUserName] = useState('');

  // Central databases fetched from Cloud SQL backend
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [moneyTransactions, setMoneyTransactions] = useState<MoneyTransaction[]>(INITIAL_MONEY_TRANSACTIONS);
  const [goldTransactions, setGoldTransactions] = useState<GoldTransaction[]>(INITIAL_GOLD_TRANSACTIONS);
  const [loans, setLoans] = useState<Loan[]>(INITIAL_LOANS);
  const [loanPayments, setLoanPayments] = useState<LoanPayment[]>(INITIAL_LOAN_PAYMENTS);
  const [goldPrices, setGoldPrices] = useState<GoldPrice[]>(INITIAL_GOLD_PRICES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Layout Nav States (for Admin/Owner staff)
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [dbError, setDbError] = useState<{ error: string; message: string; suggestion: string } | null>(null);

  // Fetch all initial values from DB and restore Supabase session
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const fetchJson = async (url: string) => {
          try {
            const r = await fetch(url);
            if (!r.ok) {
              const text = await r.text();
              try {
                const parsed = JSON.parse(text);
                if (parsed && parsed.missingConfig) {
                  setDbError({
                    error: parsed.error,
                    message: parsed.message,
                    suggestion: parsed.suggestion
                  });
                }
                return parsed;
              } catch (e) {
                console.warn(`HTML error response received for ${url}:`, text.substring(0, 100));
                return null;
              }
            }
            return await r.json();
          } catch (e) {
            console.error(`Fetch error for ${url}:`, e);
            return null;
          }
        };

        const [
          resCustomers,
          resMoneyTx,
          resGoldTx,
          resLoans,
          resLoanPayments,
          resGoldPrices,
          resAuditLogs
        ] = await Promise.all([
          fetchJson('/api/customers'),
          fetchJson('/api/money-transactions'),
          fetchJson('/api/gold-transactions'),
          fetchJson('/api/loans'),
          fetchJson('/api/loan-payments'),
          fetchJson('/api/gold-prices'),
          fetchJson('/api/audit-logs'),
        ]);

        let activeCustomers = INITIAL_CUSTOMERS;
        if (Array.isArray(resCustomers) && resCustomers.length > 0) {
          setCustomers(resCustomers);
          activeCustomers = resCustomers;
        }
        if (Array.isArray(resMoneyTx) && resMoneyTx.length > 0) setMoneyTransactions(resMoneyTx);
        if (Array.isArray(resGoldTx) && resGoldTx.length > 0) setGoldTransactions(resGoldTx);
        if (Array.isArray(resLoans) && resLoans.length > 0) setLoans(resLoans);
        if (Array.isArray(resLoanPayments) && resLoanPayments.length > 0) setLoanPayments(resLoanPayments);
        if (Array.isArray(resGoldPrices) && resGoldPrices.length > 0) setGoldPrices(resGoldPrices);
        if (Array.isArray(resAuditLogs) && resAuditLogs.length > 0) setAuditLogs(resAuditLogs);

        // Check active Supabase Auth session
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const metadata = session.user.user_metadata;
          const role = metadata.role as UserRole;
          const name = metadata.name;

          if (role === UserRole.CUSTOMER) {
            const memberNo = metadata.memberNumber;
            const found = activeCustomers.find(c => c.memberNumber === memberNo);
            if (found) {
              setCurrentUser(found);
              setCurrentRole(UserRole.CUSTOMER);
              setCurrentUserName(found.name);
            }
          } else {
            setCurrentRole(role);
            setCurrentUserName(name);
            setCurrentUser({
              id: session.user.id,
              username: metadata.username || (role === UserRole.OWNER ? 'owner' : 'admin'),
              name: name,
              role: role,
              status: 'ACTIVE' as const
            });
          }
        }
      } catch (err) {
        console.error('Error loading data from database API:', err);
      }
    };
    loadAllData();

    // Listen to Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCurrentRole(null);
        setCurrentUserName('');
        setViewingCustomer(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Latest Commodity Price Snapshot (with safe fallback)
  const currentGoldPrice = goldPrices.length > 0 ? goldPrices[goldPrices.length - 1].price : 1400000;

  // Logging Helper for Cyber Security Compliance (BR-602)
  const logSystemActivity = async (activity: string, object: string) => {
    const newLogId = 'AL-' + (auditLogs.length + 1).toString().padStart(3, '0');
    const newLog: AuditLog = {
      id: newLogId,
      date: new Date().toISOString(),
      user: currentUserName || 'Sistem BKS',
      role: currentRole || UserRole.ADMIN,
      activity: activity,
      object: object,
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 80 + 10)
    };

    try {
      const saved = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      }).then(r => r.json());

      setAuditLogs(prev => [saved, ...prev]);
    } catch (err) {
      console.error('Error logging activity to database:', err);
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  // Auth Operations
  const handleLoginSuccess = (
    role: UserRole,
    userData: { id: string; name: string; username?: string; memberNumber?: string; customerData?: Customer }
  ) => {
    setCurrentRole(role);
    setCurrentUserName(userData.name);
    
    if (role === UserRole.CUSTOMER && userData.customerData) {
      setCurrentUser(userData.customerData);
    } else {
      // Find staff info from Initial lists
      const staff = INITIAL_USERS.find(u => u.username === userData.username) || {
        id: userData.id,
        username: userData.username || 'staff',
        name: userData.name,
        role: role,
        status: 'ACTIVE' as const
      };
      setCurrentUser(staff);
    }

    // Set layout nav defaults
    setActiveTab('dashboard');
    setViewingCustomer(null);

    // Logging Session Start
    const label = role === UserRole.CUSTOMER ? `Nasabah ${userData.memberNumber}` : `Staff ${role}`;
    logSystemActivity('LOGIN_SESSION_START', `Sesi login berhasil masuk sebagai ${label}`);
  };

  const handleLogout = async () => {
    logSystemActivity('LOGOUT_SESSION_END', `Sesi operasional ${currentUserName} ditutup aman.`);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out of Supabase:', err);
    }
    setCurrentUser(null);
    setCurrentRole(null);
    setCurrentUserName('');
    setViewingCustomer(null);
  };

  const handleUpdatePassword = async (newPass: string) => {
    if (!currentUser || currentRole !== UserRole.CUSTOMER) return;

    const updatedCust = { ...currentUser, passwordHash: newPass, isFirstLogin: false } as Customer;

    try {
      const saved = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCust)
      }).then(r => r.json());

      setCustomers(prev => prev.map(c => c.id === currentUser.id ? saved : c));
      setCurrentUser(saved);
      logSystemActivity('UPDATE_PASSWORD', `Nasabah ${currentUser.name} mengubah password login mandiri (Enforce BR-204)`);
    } catch (err) {
      console.error('Error updating password:', err);
    }
  };

  // Master Directory Operations (Admin & Owner)
  const handleCreateCustomer = async (newCust: Omit<Customer, 'id' | 'memberNumber' | 'passwordHash' | 'isFirstLogin'>) => {
    const nextCount = customers.length + 1;
    const memberNum = 'BKS-2026-' + nextCount.toString().padStart(3, '0');
    
    // Default password as DDMMYYYY from birth date without dashes (e.g., 25-04-1978 becomes 25041978)
    const passHash = newCust.birthDate.replace(/-/g, '');

    const finalCustomer: Customer = {
      ...newCust,
      id: 'CUST-' + nextCount.toString().padStart(3, '0'),
      memberNumber: memberNum,
      passwordHash: passHash,
      isFirstLogin: true,
    };

    try {
      const saved = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalCustomer)
      }).then(r => r.json());

      setCustomers(prev => [...prev, saved]);
      logSystemActivity('CREATE_CUSTOMER_PROFILE', `Membuat profil nasabah baru: ${saved.name} dengan ID ${memberNum}`);
    } catch (err) {
      console.error('Error creating customer:', err);
    }
  };

  const handleUpdateCustomer = async (updatedCust: Customer) => {
    try {
      const saved = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCust)
      }).then(r => r.json());

      setCustomers(prev => prev.map(c => c.id === saved.id ? saved : c));
      
      if (viewingCustomer && viewingCustomer.id === saved.id) {
        setViewingCustomer(saved);
      }

      logSystemActivity('UPDATE_CUSTOMER_PROFILE', `Memperbarui profil keanggotaan nasabah: ${saved.name} (${saved.memberNumber})`);
    } catch (err) {
      console.error('Error updating customer:', err);
    }
  };

  const handleSuspendCustomer = async (id: string, newStatus: 'ACTIVE' | 'INACTIVE') => {
    const targetCust = customers.find(c => c.id === id);
    if (!targetCust) return;

    const updatedCust = { ...targetCust, status: newStatus };

    try {
      const saved = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCust)
      }).then(r => r.json());

      setCustomers(prev => prev.map(c => c.id === id ? saved : c));
      
      const actionLabel = newStatus === 'ACTIVE' ? 'Aktivasi' : 'Suspensasi/Penonaktifan';
      logSystemActivity('SUSPEND_CUSTOMER_TOGGLE', `${actionLabel} keanggotaan nasabah ${saved.name} (${saved.memberNumber})`);
    } catch (err) {
      console.error('Error toggling customer status:', err);
    }
  };

  // Core Money Jurnal (Teller Desk)
  const handleExecuteMoneyTx = async (type: 'DEPOSIT' | 'WITHDRAWAL', amount: number, note: string) => {
    if (!viewingCustomer) return;

    const nextCount = moneyTransactions.length + 1;
    const txNumber = 'TXM-2026-' + nextCount.toString().padStart(4, '0');

    const newTx: MoneyTransaction = {
      id: 'MT-' + nextCount.toString().padStart(3, '0'),
      transactionNumber: txNumber,
      customerId: viewingCustomer.id,
      type: type,
      amount: amount,
      date: new Date().toISOString(),
      note: note,
      createdBy: currentUserName,
    };

    try {
      const saved = await fetch('/api/money-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx)
      }).then(r => r.json());

      setMoneyTransactions(prev => [...prev, saved]);
      logSystemActivity('MONEY_TRANSACTION', `Input Jurnal ${type} nominal ${amount.toLocaleString('id-ID')} untuk ${viewingCustomer.name} (${txNumber})`);
    } catch (err) {
      console.error('Error executing money transaction:', err);
    }
  };

  // Core Gold Jurnal (Teller Desk)
  const handleExecuteGoldTx = async (type: 'GOLD_DEPOSIT' | 'GOLD_WITHDRAWAL' | 'GOLD_SELL', weight: number, note: string) => {
    if (!viewingCustomer) return;

    const nextCount = goldTransactions.length + 1;
    const txNumber = 'TXG-2026-' + nextCount.toString().padStart(4, '0');
    const amountRupiah = weight * currentGoldPrice;

    const newTx: GoldTransaction = {
      id: 'GT-' + nextCount.toString().padStart(3, '0'),
      transactionNumber: txNumber,
      customerId: viewingCustomer.id,
      type: type,
      weight: weight,
      goldPriceSnapshot: currentGoldPrice,
      amountRupiah: amountRupiah,
      date: new Date().toISOString(),
      note: note,
      createdBy: currentUserName,
    };

    try {
      const saved = await fetch('/api/gold-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx)
      }).then(r => r.json());

      setGoldTransactions(prev => [...prev, saved]);
      logSystemActivity('GOLD_TRANSACTION', `Input Jurnal ${type} seberat ${weight.toFixed(4)} gram (Snapshot Rp ${currentGoldPrice.toLocaleString('id-ID')}/g) untuk ${viewingCustomer.name} (${txNumber})`);

      // BR-406: If selling gold, system automatically triggers a savings cash deposit (GOLD_SALE_PROCEEDS)
      if (type === 'GOLD_SELL') {
        const moneyCount = moneyTransactions.length + 2; // Increment for secondary deposit
        const mTxNumber = 'TXM-2026-' + moneyCount.toString().padStart(4, '0');
        
        const newMoneyTx: MoneyTransaction = {
          id: 'MT-' + moneyCount.toString().padStart(3, '0'),
          transactionNumber: mTxNumber,
          customerId: viewingCustomer.id,
          type: 'GOLD_SALE_PROCEEDS',
          amount: amountRupiah,
          date: new Date().toISOString(),
          note: `Proceeds: Hasil penjualan emas tabungan seberat ${weight.toFixed(4)} gram`,
          createdBy: currentUserName,
        };

        const savedMoney = await fetch('/api/money-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMoneyTx)
        }).then(r => r.json());

        setMoneyTransactions(prev => [...prev, savedMoney]);
        logSystemActivity('GOLD_SELL_CASH_DISBURSEMENT', `Sistem otomatis mengkreditkan Kas Tabungan Uang sebesar ${amountRupiah.toLocaleString('id-ID')} hasil pencairan penjualan emas (${mTxNumber})`);
      }
    } catch (err) {
      console.error('Error executing gold transaction:', err);
    }
  };

  // Loan contract & disbursement (BR-501 / BR-505)
  const handleExecuteLoanDisbursement = async (amount: number, note: string) => {
    if (!viewingCustomer) return;

    const nextLoanCount = loans.length + 1;
    const loanNum = 'LOAN-2026-' + nextLoanCount.toString().padStart(4, '0');

    // Create contract
    const newLoan: Loan = {
      id: 'LN-' + nextLoanCount.toString().padStart(3, '0'),
      loanNumber: loanNum,
      customerId: viewingCustomer.id,
      amount: amount,
      outstanding: amount,
      date: new Date().toISOString(),
      status: 'ACTIVE',
      note: note,
    };

    // Auto-Disburse loan proceeds to cash balance (LOAN_DISBURSEMENT)
    const nextMoneyCount = moneyTransactions.length + 1;
    const mTxNumber = 'TXM-2026-' + nextMoneyCount.toString().padStart(4, '0');

    const newMoneyTx: MoneyTransaction = {
      id: 'MT-' + nextMoneyCount.toString().padStart(3, '0'),
      transactionNumber: mTxNumber,
      customerId: viewingCustomer.id,
      type: 'LOAN_DISBURSEMENT',
      amount: amount,
      date: new Date().toISOString(),
      note: `Pencairan modal tunai dari Kontrak Pinjaman ${loanNum}`,
      createdBy: currentUserName,
    };

    try {
      const [savedLoan, savedMoney] = await Promise.all([
        fetch('/api/loans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLoan)
         }).then(r => r.json()),
        fetch('/api/money-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMoneyTx)
         }).then(r => r.json())
      ]);

      setLoans(prev => [...prev, savedLoan]);
      setMoneyTransactions(prev => [...prev, savedMoney]);

      logSystemActivity('LOAN_CONTRACT_DISBURSEMENT', `Pencairan kontrak pinjaman baru ${loanNum} nominal ${amount.toLocaleString('id-ID')} disalurkan langsung ke kas nasabah.`);
    } catch (err) {
      console.error('Error executing loan disbursement:', err);
    }
  };

  // Loan payback execution (BR-505)
  const handleExecuteLoanPayment = async (loanId: string, amount: number, note: string) => {
    if (!viewingCustomer) return;

    // Check sisa outstanding
    const targetLoan = loans.find(l => l.id === loanId);
    if (!targetLoan) return;

    const nextPaymentCount = loanPayments.length + 1;
    const newPayment: LoanPayment = {
      id: 'LP-' + nextPaymentCount.toString().padStart(3, '0'),
      loanId: loanId,
      customerId: viewingCustomer.id,
      amount: amount,
      date: new Date().toISOString(),
      note: note,
      createdBy: currentUserName,
    };

    // Update Loan status and outstanding balance
    const updatedOutstanding = targetLoan.outstanding - amount;
    const isPaid = updatedOutstanding <= 0;

    // Input corresponding MONEY_TX of type LOAN_PAYMENT
    const nextMoneyCount = moneyTransactions.length + 1;
    const mTxNumber = 'TXM-2026-' + nextMoneyCount.toString().padStart(4, '0');

    const newMoneyTx: MoneyTransaction = {
      id: 'MT-' + nextMoneyCount.toString().padStart(3, '0'),
      transactionNumber: mTxNumber,
      customerId: viewingCustomer.id,
      type: 'LOAN_PAYMENT',
      amount: amount,
      date: new Date().toISOString(),
      note: `Setoran cicilan kontrak kredit ${targetLoan.loanNumber}`,
      createdBy: currentUserName,
    };

    try {
      const [savedPayment, savedMoney, savedLoan] = await Promise.all([
        fetch('/api/loan-payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPayment)
        }).then(r => r.json()),
        fetch('/api/money-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMoneyTx)
        }).then(r => r.json()),
        fetch(`/api/loans/${loanId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outstanding: Math.max(0, updatedOutstanding),
            status: isPaid ? 'PAID' : 'ACTIVE'
          })
        }).then(r => r.json())
      ]);

      setLoans(prev => prev.map(l => l.id === loanId ? savedLoan : l));
      setLoanPayments(prev => [...prev, savedPayment]);
      setMoneyTransactions(prev => [...prev, savedMoney]);

      logSystemActivity('LOAN_CONTRACT_PAYMENT', `Cicilan pembayaran diterima untuk kontrak ${targetLoan.loanNumber} sebesar ${amount.toLocaleString('id-ID')}. Sisa outstanding: ${updatedOutstanding.toLocaleString('id-ID')}`);
    } catch (err) {
      console.error('Error executing loan payment:', err);
    }
  };

  // Immutable Reversal Protocol (BR-003 / BR-604)
  const handleExecuteReversal = async (genre: 'MONEY' | 'GOLD', txId: string, reason: string) => {
    if (!viewingCustomer) return;

    if (genre === 'MONEY') {
      const original = moneyTransactions.find(t => t.id === txId);
      if (!original) return;

      // Append new REVERSAL row log
      const nextCount = moneyTransactions.length + 2; // offset increment
      const txNumber = 'TXM-2026-' + nextCount.toString().padStart(4, '0');

      const reversalTx: MoneyTransaction = {
        id: 'MT-' + nextCount.toString().padStart(3, '0'),
        transactionNumber: txNumber,
        customerId: viewingCustomer.id,
        type: 'REVERSAL',
        amount: original.amount, // stored for visual re-calculation reference
        date: new Date().toISOString(),
        note: `KOREKSI REVERSAL: ${reason} (Ref: ${original.transactionNumber})`,
        createdBy: currentUserName,
        reversalOf: original.id,
      };

      try {
        const [updatedOriginal, savedReversal] = await Promise.all([
          fetch(`/api/money-transactions/${txId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isReversaled: true, reversalOf: original.id })
          }).then(r => r.json()),
          fetch('/api/money-transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reversalTx)
          }).then(r => r.json())
        ]);

        setMoneyTransactions(prev => prev.map(t => t.id === txId ? updatedOriginal : t).concat(savedReversal));
        logSystemActivity('REVERSAL_MONEY_TX', `Koreksi jurnal reversal uang tunai (Ref: ${original.transactionNumber}) alasan: ${reason}`);
      } catch (err) {
        console.error('Error executing money reversal:', err);
      }
    } 
    
    else {
      const original = goldTransactions.find(t => t.id === txId);
      if (!original) return;

      // Append gold reversal log
      const nextCount = goldTransactions.length + 2;
      const txNumber = 'TXG-2026-' + nextCount.toString().padStart(4, '0');

      const reversalTx: GoldTransaction = {
        id: 'GT-' + nextCount.toString().padStart(3, '0'),
        transactionNumber: txNumber,
        customerId: viewingCustomer.id,
        type: 'REVERSAL',
        weight: original.weight,
        goldPriceSnapshot: original.goldPriceSnapshot,
        amountRupiah: original.amountRupiah,
        date: new Date().toISOString(),
        note: `KOREKSI REVERSAL: ${reason} (Ref: ${original.transactionNumber})`,
        createdBy: currentUserName,
        reversalOf: original.id,
      };

      try {
        const [updatedOriginal, savedReversal] = await Promise.all([
          fetch(`/api/gold-transactions/${txId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isReversaled: true, reversalOf: original.id })
          }).then(r => r.json()),
          fetch('/api/gold-transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reversalTx)
          }).then(r => r.json())
        ]);

        setGoldTransactions(prev => prev.map(t => t.id === txId ? updatedOriginal : t).concat(savedReversal));
        logSystemActivity('REVERSAL_GOLD_TX', `Koreksi jurnal reversal tabungan emas (Ref: ${original.transactionNumber}) alasan: ${reason}`);
      } catch (err) {
        console.error('Error executing gold reversal:', err);
      }
    }
  };

  // Commodity Price updating (BR-407)
  const handleUpdateGoldPrice = async (price: number) => {
    const maxId = goldPrices.reduce((max, item) => {
      const match = item.id.match(/^GP-(\d+)$/);
      if (match) {
        return Math.max(max, parseInt(match[1], 10));
      }
      return max;
    }, 0);
    const nextCount = Math.max(goldPrices.length, maxId) + 1;
    const newPriceRecord: GoldPrice = {
      id: 'GP-' + nextCount.toString().padStart(3, '0'),
      price: price,
      date: new Date().toISOString(),
      updatedBy: currentUserName,
    };

    try {
      const res = await fetch('/api/gold-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPriceRecord)
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${res.status}`);
      }

      const saved = await res.json();
      if (saved.error) {
        throw new Error(saved.error);
      }

      setGoldPrices(prev => [...prev, saved]);
      logSystemActivity('GOLD_PRICE_UPDATE', `Owner mengubah harga acuan emas aktif menjadi Rp ${price.toLocaleString('id-ID')} / gram`);
    } catch (err) {
      console.error('Error updating gold price:', err);
      throw err;
    }
  };

  // Excel Importer actions (BR-803 / BR-804)
  const handleImportCustomers = async (newCustList: any[]) => {
    try {
      const savedList = await Promise.all(
        newCustList.map(cust =>
          fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cust)
          }).then(r => r.json())
        )
      );
      setCustomers(prev => [...prev, ...savedList]);
      logSystemActivity('IMPORT_EXCEL_CUSTOMERS', `Batch migrasi data profil master nasabah selesai: ${newCustList.length} akun berhasil diserap.`);
    } catch (err) {
      console.error('Error importing customers:', err);
    }
  };

  const handleImportMoneyTx = async (newMoneyList: any[]) => {
    try {
      const savedList = await Promise.all(
        newMoneyList.map(tx =>
          fetch('/api/money-transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tx)
          }).then(r => r.json())
        )
      );
      setMoneyTransactions(prev => [...prev, ...savedList]);
      logSystemActivity('IMPORT_EXCEL_MONEY_TX', `Batch migrasi data jurnal tabungan uang selesai: ${newMoneyList.length} row berhasil diserap.`);
    } catch (err) {
      console.error('Error importing money transactions:', err);
    }
  };

  const handleImportGoldTx = async (newGoldList: any[]) => {
    try {
      const savedList = await Promise.all(
        newGoldList.map(tx =>
          fetch('/api/gold-transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tx)
          }).then(r => r.json())
        )
      );
      setGoldTransactions(prev => [...prev, ...savedList]);
      logSystemActivity('IMPORT_EXCEL_GOLD_TX', `Batch migrasi data jurnal tabungan emas selesai: ${newGoldList.length} row berhasil diserap.`);
    } catch (err) {
      console.error('Error importing gold transactions:', err);
    }
  };

  const handleLogExportAction = (reportName: string) => {
    logSystemActivity('EXPORT_EXCEL_REPORT', `Laporan Konsolidasian [${reportName}] berhasil diekspor ke format Excel (.xlsx) oleh Owner.`);
  };

  // RENDER SELECTION ROUTER
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} customers={customers} />;
  }

  // NASABAH RENDERING DIRECT (MOBILE CONTAINER)
  if (currentRole === UserRole.CUSTOMER) {
    return (
      <DashboardNasabah 
        customer={currentUser as Customer}
        moneyTransactions={moneyTransactions}
        goldTransactions={goldTransactions}
        loans={loans}
        loanPayments={loanPayments}
        currentGoldPrice={currentGoldPrice}
        onLogout={handleLogout}
        onUpdatePassword={handleUpdatePassword}
      />
    );
  }

  // STAFF RENDERING (OWNER / ADMIN IN DESKTOP SHELL WITH SIDEBAR AND TABS)
  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={(tab) => {
        setActiveTab(tab);
        setViewingCustomer(null); // Clear active customer focus if swapping layouts
      }}
      userRole={currentRole as UserRole}
      userName={currentUserName}
      currentGoldPrice={currentGoldPrice}
      onLogout={handleLogout}
      dbError={dbError}
    >
      
      {/* If viewing a customer details, override activeTab rendering */}
      {viewingCustomer ? (
        <CustomerDetail
          customer={viewingCustomer}
          moneyTransactions={moneyTransactions}
          goldTransactions={goldTransactions}
          loans={loans}
          loanPayments={loanPayments}
          currentGoldPrice={currentGoldPrice}
          userRole={currentRole as UserRole}
          onBackToList={() => setViewingCustomer(null)}
          onExecuteMoneyTx={handleExecuteMoneyTx}
          onExecuteGoldTx={handleExecuteGoldTx}
          onExecuteLoanDisbursement={handleExecuteLoanDisbursement}
          onExecuteLoanPayment={handleExecuteLoanPayment}
          onExecuteReversal={handleExecuteReversal}
        />
      ) : (
        <>
          {/* TAB 1: DASHBOARD STAFF */}
          {activeTab === 'dashboard' && (
            currentRole === UserRole.OWNER ? (
              <DashboardOwner
                customers={customers}
                moneyTransactions={moneyTransactions}
                goldTransactions={goldTransactions}
                loans={loans}
                currentGoldPrice={currentGoldPrice}
                setActiveTab={setActiveTab}
                onQuickAction={(action) => {
                  if (action === 'add-customer') {
                    setActiveTab('customers');
                  }
                }}
              />
            ) : (
              <DashboardAdmin
                customers={customers}
                moneyTransactions={moneyTransactions}
                goldTransactions={goldTransactions}
                setActiveTab={setActiveTab}
                onSelectCustomer={(customerId) => {
                  setViewingCustomer(customers.find(c => c.id === customerId) || null);
                }}
              />
            )
          )}

          {/* TAB 2: MASTER DIRECTORY */}
          {activeTab === 'customers' && (
            <CustomerList
              customers={customers}
              moneyTransactions={moneyTransactions}
              goldTransactions={goldTransactions}
              userRole={currentRole as UserRole}
              onSelectCustomer={(id) => {
                setViewingCustomer(customers.find(c => c.id === id) || null);
              }}
              onAddCustomer={handleCreateCustomer}
              onToggleCustomerStatus={(id) => {
                const target = customers.find(c => c.id === id);
                if (target) {
                  const newStatus = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                  handleSuspendCustomer(id, newStatus);
                }
              }}
              onEditCustomer={(id, data) => {
                const target = customers.find(c => c.id === id);
                if (target) {
                  handleUpdateCustomer({ ...target, ...data });
                }
              }}
            />
          )}

          {/* TAB 3: MONEY TX LEDGER DIRECT DIRECTORY */}
          {activeTab === 'money-tx' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-black text-gray-900 uppercase">Aktivitas Penyetoran & Penarikan Uang Tunai</h2>
                <span className="text-[10px] text-gray-400 font-bold bg-white px-2.5 py-1 rounded border border-gray-200">GERAI BKS</span>
              </div>
              <CustomerList
                customers={customers}
                moneyTransactions={moneyTransactions}
                goldTransactions={goldTransactions}
                userRole={currentRole as UserRole}
                onSelectCustomer={(id) => {
                  setViewingCustomer(customers.find(c => c.id === id) || null);
                }}
                onAddCustomer={handleCreateCustomer}
                onToggleCustomerStatus={(id) => {
                  const target = customers.find(c => c.id === id);
                  if (target) {
                    const newStatus = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                    handleSuspendCustomer(id, newStatus);
                  }
                }}
                onEditCustomer={(id, data) => {
                  const target = customers.find(c => c.id === id);
                  if (target) {
                    handleUpdateCustomer({ ...target, ...data });
                  }
                }}
                forcedActionLabel="Input Setor/Tarik Uang"
              />
            </div>
          )}

          {/* TAB 4: GOLD TX LEDGER DIRECT DIRECTORY */}
          {activeTab === 'gold-tx' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-black text-gray-900 uppercase">Aktivitas Tabungan Logam Mulia Emas Antam</h2>
                <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded border border-amber-200">KURS: Rp {currentGoldPrice.toLocaleString('id-ID')}/G</span>
              </div>
              <CustomerList
                customers={customers}
                moneyTransactions={moneyTransactions}
                goldTransactions={goldTransactions}
                userRole={currentRole as UserRole}
                onSelectCustomer={(id) => {
                  setViewingCustomer(customers.find(c => c.id === id) || null);
                }}
                onAddCustomer={handleCreateCustomer}
                onToggleCustomerStatus={(id) => {
                  const target = customers.find(c => c.id === id);
                  if (target) {
                    const newStatus = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                    handleSuspendCustomer(id, newStatus);
                  }
                }}
                onEditCustomer={(id, data) => {
                  const target = customers.find(c => c.id === id);
                  if (target) {
                    handleUpdateCustomer({ ...target, ...data });
                  }
                }}
                forcedActionLabel="Operasikan Tabungan Emas"
              />
            </div>
          )}

          {/* TAB 5: CREDIT/LOANS MANAGEMENT */}
          {activeTab === 'loans' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-black text-gray-900 uppercase">Aktivitas Kontrak Pinjaman & Pembiayaan</h2>
                <span className="text-[10px] text-red-800 font-bold bg-red-50 px-2.5 py-1 rounded border border-red-200">CONTROLLER KREDIT</span>
              </div>
              <CustomerList
                customers={customers}
                moneyTransactions={moneyTransactions}
                goldTransactions={goldTransactions}
                userRole={currentRole as UserRole}
                onSelectCustomer={(id) => {
                  setViewingCustomer(customers.find(c => c.id === id) || null);
                }}
                onAddCustomer={handleCreateCustomer}
                onToggleCustomerStatus={(id) => {
                  const target = customers.find(c => c.id === id);
                  if (target) {
                    const newStatus = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                    handleSuspendCustomer(id, newStatus);
                  }
                }}
                onEditCustomer={(id, data) => {
                  const target = customers.find(c => c.id === id);
                  if (target) {
                    handleUpdateCustomer({ ...target, ...data });
                  }
                }}
                forcedActionLabel="Kelola Kontrak Pinjaman"
              />
            </div>
          )}

          {/* TAB 6: COMMODITY TRADING PRICES (OWNER ONLY) */}
          {activeTab === 'gold-price' && (
            <GoldPricePage
              goldPrices={goldPrices}
              userRole={currentRole as UserRole}
              onUpdateGoldPrice={handleUpdateGoldPrice}
            />
          )}

          {/* TAB 7: REPORTS CONSOLIDATION */}
          {activeTab === 'reports' && (
            <Reports
              customers={customers}
              moneyTransactions={moneyTransactions}
              goldTransactions={goldTransactions}
              loans={loans}
              currentGoldPrice={currentGoldPrice}
              userRole={currentRole as UserRole}
              onLogExportAction={handleLogExportAction}
            />
          )}

          {/* TAB 8: MIGRATION DATA EXCEL EXPORTER (OWNER ONLY) */}
          {activeTab === 'import' && (
            <ImportPage
              userRole={currentRole as UserRole}
              currentGoldPrice={currentGoldPrice}
              onImportCustomers={handleImportCustomers}
              onImportMoneyTx={handleImportMoneyTx}
              onImportGoldTx={handleImportGoldTx}
            />
          )}

          {/* TAB 9: CYBER SECURITY TELEMETRY AUDIT TRAIL */}
          {activeTab === 'audit-trail' && (
            <AuditTrailPage
              auditLogs={auditLogs}
            />
          )}

          {/* TAB 10: STAFF PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 max-w-xl text-xs animate-fadeIn">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-display text-base">
                  {currentRole === UserRole.OWNER ? 'O' : 'A'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 leading-none">{currentUserName}</h3>
                  <span className="text-[10px] text-gray-400 font-semibold block mt-1.5 uppercase bg-gray-100 px-1.5 py-0.5 rounded w-max">{currentRole} STATUS: ACTIVE</span>
                </div>
              </div>

              <div className="border-t border-gray-50 pt-4 space-y-3 leading-relaxed text-gray-600">
                <p>• Akun Anda terdaftar sebagai otoritas pengawas tingkat <b>{currentRole}</b> di BKS 2015.</p>
                <p>• Seluruh aksi finansial yang Anda rekam seperti setoran, penarikan, koreksi (reversal), ekspor berkas Excel, ataupun pengubahan harga acuan emas secara harian akan langsung distreaming dan dicatat secara otomatis dalam data log audit sistem yang bersifat immutable.</p>
                <p>• Harap jaga kerahasiaan password Anda dan biasakan selalu menekan tombol <b>Keluar Sesi</b> jika meninggalkan komputer loket teller BKS.</p>
              </div>
            </div>
          )}
        </>
      )}

    </Layout>
  );
}
