/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, Wallet, Coins, Percent, ArrowUpCircle, ArrowDownCircle, RefreshCw, Landmark,
  X, Check, AlertCircle, PlusCircle, Calendar, MessageSquare, ClipboardList, RefreshCcw, HelpCircle, Eye
} from 'lucide-react';
import { Customer, MoneyTransaction, GoldTransaction, Loan, LoanPayment, UserRole } from '../types';
import { getCustomerMoneyBalance, getCustomerGoldBalance, getCustomerLoans, getActiveLoanOutstanding } from '../data';

interface CustomerDetailProps {
  customer: Customer;
  moneyTransactions: MoneyTransaction[];
  goldTransactions: GoldTransaction[];
  loans: Loan[];
  loanPayments: LoanPayment[];
  currentGoldPrice: number;
  userRole: UserRole;
  onBackToList: () => void;
  onExecuteMoneyTx: (type: 'DEPOSIT' | 'WITHDRAWAL', amount: number, note: string) => void;
  onExecuteGoldTx: (type: 'GOLD_DEPOSIT' | 'GOLD_WITHDRAWAL' | 'GOLD_SELL', weight: number, note: string) => void;
  onExecuteLoanDisbursement: (amount: number, note: string) => void;
  onExecuteLoanPayment: (loanId: string, amount: number, note: string) => void;
  onExecuteReversal: (genre: 'MONEY' | 'GOLD', id: string, reason: string) => void;
}

export default function CustomerDetail({
  customer,
  moneyTransactions,
  goldTransactions,
  loans,
  loanPayments,
  currentGoldPrice,
  userRole,
  onBackToList,
  onExecuteMoneyTx,
  onExecuteGoldTx,
  onExecuteLoanDisbursement,
  onExecuteLoanPayment,
  onExecuteReversal,
}: CustomerDetailProps) {
  
  // Tabs navigation
  const [activeTab, setActiveTab] = useState<'money' | 'gold' | 'loans' | 'profile'>('money');

  // Dynamic balances
  const moneyBalance = getCustomerMoneyBalance(customer.id, moneyTransactions);
  const goldBalance = getCustomerGoldBalance(customer.id, goldTransactions);
  const goldValueRupiah = goldBalance * currentGoldPrice;

  const customerLoans = getCustomerLoans(customer.id, loans);
  const activeLoans = customerLoans.filter(l => l.status === 'ACTIVE');
  const activeOutstanding = getActiveLoanOutstanding(customer.id, loans);
  const hasActiveLoan = activeLoans.length > 0;

  // Modals state
  const [activeModal, setActiveModal] = useState<'NONE' | 'DEPOSIT' | 'WITHDRAWAL' | 'GOLD_DEPOSIT' | 'GOLD_WITHDRAWAL' | 'GOLD_SELL' | 'LOAN_NEW' | 'LOAN_PAY' | 'REVERSAL'>('NONE');
  
  // Reversal specific states
  const [reversalGenre, setReversalGenre] = useState<'MONEY' | 'GOLD'>('MONEY');
  const [reversalTargetId, setReversalTargetId] = useState('');

  // Form states
  const [txAmount, setTxAmount] = useState('');
  const [txWeight, setTxWeight] = useState('');
  const [txNote, setTxNote] = useState('');
  const [targetLoanId, setTargetLoanId] = useState('');
  const [reversalReason, setReversalReason] = useState('');
  const [modalError, setModalError] = useState('');

  // Mutasi filters
  const myMoneyTx = moneyTransactions.filter(tx => tx.customerId === customer.id);
  const myGoldTx = goldTransactions.filter(tx => tx.customerId === customer.id);

  // Helpers
  const formatIDR = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const openTxModal = (modalType: typeof activeModal) => {
    setModalError('');
    setTxAmount('');
    setTxWeight('');
    setTxNote('');
    if (modalType === 'LOAN_PAY' && activeLoans.length > 0) {
      setTargetLoanId(activeLoans[0].id);
    }
    setActiveModal(modalType);
  };

  const openReversalModal = (genre: 'MONEY' | 'GOLD', id: string) => {
    setModalError('');
    setReversalReason('');
    setReversalGenre(genre);
    setReversalTargetId(id);
    setActiveModal('REVERSAL');
  };

  // Submit operations
  const handleSubmitTx = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (activeModal === 'DEPOSIT' || activeModal === 'WITHDRAWAL') {
      const amount = Number(txAmount.replace(/\./g, ''));
      if (isNaN(amount) || amount <= 0) {
        setModalError('Nominal transaksi harus berupa angka positif lebih besar dari nol.');
        return;
      }
      
      if (activeModal === 'WITHDRAWAL') {
        // Savings cash penarikan validation (BR-304: can go negative for loans, but standard penarikan checks balance unless note allows)
        if (amount > moneyBalance && !txNote.toLowerCase().includes('pinjaman') && !txNote.toLowerCase().includes('kredit')) {
          setModalError('Saldo tunai tabungan tidak mencukupi untuk melakukan penarikan mandiri.');
          return;
        }
      }

      onExecuteMoneyTx(activeModal, amount, txNote.trim() || `${activeModal === 'DEPOSIT' ? 'Setoran' : 'Penarikan'} Tunai`);
      setActiveModal('NONE');
    }

    else if (activeModal === 'GOLD_DEPOSIT' || activeModal === 'GOLD_WITHDRAWAL' || activeModal === 'GOLD_SELL') {
      const weight = Number(txWeight);
      if (isNaN(weight) || weight <= 0) {
        setModalError('Berat emas harus berupa angka gramasi positif lebih besar dari nol.');
        return;
      }

      if (activeModal === 'GOLD_WITHDRAWAL' && weight > goldBalance) {
        setModalError(`Saldo emas tidak mencukupi. Maksimal penarikan: ${goldBalance.toFixed(4)} gram.`);
        return;
      }

      if (activeModal === 'GOLD_SELL' && weight > goldBalance) {
        setModalError(`Saldo emas tidak mencukupi untuk dijual. Maksimal penjualan: ${goldBalance.toFixed(4)} gram.`);
        return;
      }

      onExecuteGoldTx(activeModal, weight, txNote.trim() || `${activeModal === 'GOLD_DEPOSIT' ? 'Setoran' : activeModal === 'GOLD_WITHDRAWAL' ? 'Penarikan' : 'Penjualan'} Emas`);
      setActiveModal('NONE');
    }

    else if (activeModal === 'LOAN_NEW') {
      const amount = Number(txAmount.replace(/\./g, ''));
      if (isNaN(amount) || amount <= 0) {
        setModalError('Nominal kontrak pinjaman harus berupa angka positif lebih besar dari nol.');
        return;
      }

      onExecuteLoanDisbursement(amount, txNote.trim() || 'Pinjaman Kontrak Modal Tunai');
      setActiveModal('NONE');
    }

    else if (activeModal === 'LOAN_PAY') {
      const amount = Number(txAmount.replace(/\./g, ''));
      if (isNaN(amount) || amount <= 0) {
        setModalError('Nominal cicilan pinjaman harus berupa angka positif lebih besar dari nol.');
        return;
      }
      if (!targetLoanId) {
        setModalError('Pilih kontrak pinjaman yang akan dicicil.');
        return;
      }

      const activeLoan = loans.find(l => l.id === targetLoanId);
      if (activeLoan && amount > activeLoan.outstanding) {
        setModalError(`Pembayaran tidak boleh melebihi sisa outstanding kontrak: ${formatIDR(activeLoan.outstanding)}.`);
        return;
      }

      onExecuteLoanPayment(targetLoanId, amount, txNote.trim() || 'Bayar Cicilan Pinjaman BKS');
      setActiveModal('NONE');
    }

    else if (activeModal === 'REVERSAL') {
      if (!reversalReason.trim()) {
        setModalError('Tuliskan alasan koreksi/reversal transaksi untuk dicatat pada audit trail.');
        return;
      }

      onExecuteReversal(reversalGenre, reversalTargetId, reversalReason.trim());
      setActiveModal('NONE');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Detail Header Banner */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <button
          onClick={onBackToList}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 bg-white border border-gray-200 px-3 py-2 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Nasabah
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Status Akun:</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
            customer.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {customer.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
      </div>

      {/* Customer Hero Card */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
        
        {/* Profile Card Left */}
        <div className="flex gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-[#7a1223] to-[#540813] rounded-2xl flex items-center justify-center text-white font-black text-xl font-display shrink-0 select-none shadow-md shadow-primary/10">
            {customer.name.charAt(0)}
          </div>
          <div>
            <span className="text-[9px] font-bold text-primary bg-red-50 border border-red-100 px-1.5 py-0.5 rounded uppercase">
              {customer.memberNumber}
            </span>
            <h2 className="text-lg font-black text-gray-900 mt-1 leading-tight">{customer.name}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400 font-semibold font-mono mt-1">
              <span>NIK: {customer.nik}</span>
              <span>HP: {customer.phone}</span>
            </div>
          </div>
        </div>

        {/* Profiles right details info */}
        <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 text-xs flex-1 max-w-xl">
          <div>
            <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Saldo Tunai</span>
            <span className={`font-black text-sm block ${moneyBalance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatIDR(moneyBalance)}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Saldo Emas</span>
            <span className="font-black text-sm text-amber-600 block font-display leading-none">
              {goldBalance.toFixed(4)} <span className="text-[10px] font-medium text-gray-400">g</span>
            </span>
            <span className="text-[9px] text-gray-400 font-medium block mt-1.5 leading-none">
              ≈ {formatIDR(goldValueRupiah)}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Outstanding Pinjaman</span>
            <span className="font-black text-sm text-red-600 block leading-none">
              {formatIDR(activeOutstanding)}
            </span>
            <span className={`text-[9px] font-extrabold px-1 py-0.5 rounded block mt-1.5 leading-none w-max ${
              hasActiveLoan ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {hasActiveLoan ? 'Kontrak Aktif' : 'Bersih'}
            </span>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS BOARD (TELLER PANEL STYLE) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3.5 flex items-center gap-1">
          <Landmark className="w-4 h-4 text-primary shrink-0" />
          Panel Operasional Setor, Tarik & Pinjaman
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
          <button
            onClick={() => openTxModal('DEPOSIT')}
            className="p-3 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100/60 hover:border-emerald-300 text-emerald-800 rounded-xl font-bold transition-all flex flex-col items-center gap-1.5 text-center active:scale-95"
          >
            <ArrowUpCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Setoran Uang</span>
          </button>

          <button
            onClick={() => openTxModal('WITHDRAWAL')}
            className="p-3 bg-red-50/40 hover:bg-red-50 border border-red-100/60 hover:border-red-300 text-red-800 rounded-xl font-bold transition-all flex flex-col items-center gap-1.5 text-center active:scale-95"
          >
            <ArrowDownCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>Penarikan Uang</span>
          </button>

          <button
            onClick={() => openTxModal('GOLD_DEPOSIT')}
            className="p-3 bg-amber-50/40 hover:bg-amber-50 border border-amber-200/50 hover:border-amber-400 text-amber-800 rounded-xl font-bold transition-all flex flex-col items-center gap-1.5 text-center active:scale-95"
          >
            <Coins className="w-5 h-5 text-amber-500 shrink-0" />
            <span>Setor Emas</span>
          </button>

          <button
            onClick={() => openTxModal('GOLD_WITHDRAWAL')}
            className="p-3 bg-amber-950/5 hover:bg-amber-950/10 border border-amber-900/10 hover:border-amber-900/30 text-amber-950 rounded-xl font-bold transition-all flex flex-col items-center gap-1.5 text-center active:scale-95"
          >
            <RefreshCw className="w-5 h-5 text-amber-800 shrink-0" />
            <span>Tarik Emas</span>
          </button>

          <button
            onClick={() => openTxModal('GOLD_SELL')}
            className="p-3 bg-yellow-50/50 hover:bg-yellow-50 border border-yellow-200/50 hover:border-yellow-400 text-yellow-800 rounded-xl font-bold transition-all flex flex-col items-center gap-1.5 text-center active:scale-95"
          >
            <PlusCircle className="w-5 h-5 text-yellow-600 shrink-0" />
            <span>Jual Emas</span>
          </button>

          <button
            onClick={() => openTxModal('LOAN_NEW')}
            className="p-3 bg-blue-50/40 hover:bg-blue-50 border border-blue-100/60 hover:border-blue-300 text-blue-800 rounded-xl font-bold transition-all flex flex-col items-center gap-1.5 text-center active:scale-95"
          >
            <Percent className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Kontrak Pinjaman</span>
          </button>

          <button
            onClick={() => openTxModal('LOAN_PAY')}
            disabled={!hasActiveLoan}
            className={`p-3 rounded-xl font-bold transition-all flex flex-col items-center gap-1.5 text-center shrink-0 ${
              hasActiveLoan 
                ? 'bg-purple-50/50 hover:bg-purple-50 border border-purple-100/60 hover:border-purple-300 text-purple-800 cursor-pointer active:scale-95' 
                : 'bg-gray-50 border border-gray-100 text-gray-400 opacity-55 cursor-not-allowed'
            }`}
          >
            <Check className="w-5 h-5 text-purple-600 shrink-0" />
            <span>Bayar Pinjaman</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation sheets */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        
        {/* Tabs Bar */}
        <div className="flex border-b border-gray-100 bg-gray-50/40 p-1">
          <button
            onClick={() => setActiveTab('money')}
            className={`flex-1 py-3 text-center text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'money'
                ? 'border-primary text-primary font-black bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Riwayat Uang ({myMoneyTx.length})
          </button>

          <button
            onClick={() => setActiveTab('gold')}
            className={`flex-1 py-3 text-center text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'gold'
                ? 'border-primary text-primary font-black bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Coins className="w-4 h-4" />
            Riwayat Emas ({myGoldTx.length})
          </button>

          <button
            onClick={() => setActiveTab('loans')}
            className={`flex-1 py-3 text-center text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'loans'
                ? 'border-primary text-primary font-black bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Percent className="w-4 h-4" />
            Kontrak Pinjaman ({customerLoans.length})
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-center text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'profile'
                ? 'border-primary text-primary font-black bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Profil & Catatan
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5">

          {/* TAB 1: MONEY TX TABLE WITH REVERSAL PROTOCOL (BR-003) */}
          {activeTab === 'money' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-extrabold uppercase">
                      <th className="p-3">Tanggal Jurnal</th>
                      <th className="p-3">No. Transaksi</th>
                      <th className="p-3">Jenis</th>
                      <th className="p-3">Nominal</th>
                      <th className="p-3">Catatan / Referensi Reversal</th>
                      <th className="p-3 text-center">Petugas</th>
                      <th className="p-3 text-right">Koreksi (Reversal)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myMoneyTx.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-400 font-semibold">
                          Belum ada transaksi uang tercatat untuk nasabah ini.
                        </td>
                      </tr>
                    ) : (
                      myMoneyTx.map((tx) => (
                        <tr key={tx.id} className={`hover:bg-gray-50/50 transition-colors ${tx.isReversaled ? 'bg-red-50/30 opacity-75' : ''}`}>
                          <td className="p-3 font-semibold font-mono whitespace-nowrap">
                            {new Date(tx.date).toLocaleDateString('id-ID')} {new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3 font-mono font-bold text-gray-500">{tx.transactionNumber}</td>
                          <td className="p-3">
                            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded leading-none ${
                              tx.type === 'DEPOSIT' || tx.type === 'GOLD_SALE_PROCEEDS' 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : tx.type === 'WITHDRAWAL' 
                                ? 'bg-red-50 text-red-700'
                                : tx.type === 'LOAN_DISBURSEMENT'
                                ? 'bg-blue-50 text-blue-700'
                                : tx.type === 'LOAN_PAYMENT'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="p-3 font-extrabold">
                            Rp {tx.amount.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-gray-500 max-w-xs truncate">
                            {tx.isReversaled && (
                              <span className="text-[10px] text-red-600 font-bold bg-red-100 px-1 py-0.5 rounded mr-1">REVERSE</span>
                            )}
                            {tx.reversalOf && (
                              <span className="text-[10px] text-gray-500 font-semibold bg-gray-200 px-1 py-0.5 rounded mr-1">REVERSAL OF {tx.reversalOf}</span>
                            )}
                            {tx.note}
                          </td>
                          <td className="p-3 text-center text-gray-500 font-medium">{tx.createdBy}</td>
                          <td className="p-3 text-right">
                            {tx.isReversaled || tx.type === 'REVERSAL' ? (
                              <span className="text-[10px] text-gray-400 font-semibold">Telah Dikoreksi</span>
                            ) : (
                              <button
                                onClick={() => openReversalModal('MONEY', tx.id)}
                                className="px-2.5 py-1 border border-red-200 hover:bg-red-50 text-red-600 text-[10px] font-bold rounded-lg transition-all"
                              >
                                Reversal
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: GOLD TX TABLE WITH IMMUTABLE SNAPSHOT PRICE RECORDING */}
          {activeTab === 'gold' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-extrabold uppercase">
                      <th className="p-3">Tanggal Jurnal</th>
                      <th className="p-3">No. Transaksi</th>
                      <th className="p-3">Jenis</th>
                      <th className="p-3">Berat Emas</th>
                      <th className="p-3">Snapshot Kurs</th>
                      <th className="p-3">Konversi Rupiah</th>
                      <th className="p-3">Catatan</th>
                      <th className="p-3 text-right">Koreksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myGoldTx.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-400 font-semibold">
                          Belum ada transaksi tabungan emas untuk nasabah ini.
                        </td>
                      </tr>
                    ) : (
                      myGoldTx.map((tx) => (
                        <tr key={tx.id} className={`hover:bg-gray-50/50 transition-colors ${tx.isReversaled ? 'bg-red-50/30 opacity-75' : ''}`}>
                          <td className="p-3 font-semibold font-mono whitespace-nowrap">
                            {new Date(tx.date).toLocaleDateString('id-ID')}
                          </td>
                          <td className="p-3 font-mono font-bold text-gray-500">{tx.transactionNumber}</td>
                          <td className="p-3">
                            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded leading-none ${
                              tx.type === 'GOLD_DEPOSIT' 
                                ? 'bg-amber-50 text-amber-700' 
                                : tx.type === 'GOLD_WITHDRAWAL' 
                                ? 'bg-[#FFF3F3] text-amber-950'
                                : tx.type === 'GOLD_SELL'
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="p-3 font-extrabold font-display text-amber-700">
                            {tx.weight.toFixed(4)} gram
                          </td>
                          <td className="p-3 font-semibold">
                            Rp {tx.goldPriceSnapshot.toLocaleString('id-ID')} / g
                          </td>
                          <td className="p-3 font-mono font-bold">
                            Rp {tx.amountRupiah.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-gray-500">
                            {tx.isReversaled && (
                              <span className="text-[10px] text-red-600 font-bold bg-red-100 px-1 py-0.5 rounded mr-1">REVISED</span>
                            )}
                            {tx.note}
                          </td>
                          <td className="p-3 text-right">
                            {tx.isReversaled || tx.type === 'REVERSAL' ? (
                              <span className="text-[10px] text-gray-400 font-semibold">Telah Dikoreksi</span>
                            ) : (
                              <button
                                onClick={() => openReversalModal('GOLD', tx.id)}
                                className="px-2.5 py-1 border border-red-200 hover:bg-red-50 text-red-600 text-[10px] font-bold rounded-lg transition-all"
                              >
                                Reversal
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: LOAN CONTRACTS AND AMORTIZATION TIMELINE (BR-505) */}
          {activeTab === 'loans' && (
            <div className="space-y-6">
              
              {customerLoans.length === 0 ? (
                <div className="p-10 text-center text-gray-400 font-semibold bg-gray-50/50 rounded-xl">
                  Belum ada kontrak pinjaman tercatat untuk nasabah ini.
                </div>
              ) : (
                customerLoans.map((loan) => {
                  const payments = loanPayments.filter(p => p.loanId === loan.id);
                  
                  return (
                    <div key={loan.id} className="border border-gray-100 rounded-2xl p-5 shadow-inner bg-gray-50/30 space-y-4">
                      
                      {/* Contract Header */}
                      <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-gray-900">{loan.note}</h4>
                            <span className="text-[10px] text-gray-400 font-mono font-bold bg-gray-100 px-1.5 py-0.5 rounded">
                              {loan.loanNumber}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Disalurkan pada {new Date(loan.date).toLocaleDateString('id-ID')}</p>
                        </div>
                        <span className={`text-[9.5px] font-black px-2 py-0.5 rounded uppercase ${
                          loan.status === 'ACTIVE' 
                            ? 'bg-red-50 text-red-600 border border-red-100' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {loan.status === 'ACTIVE' ? 'Aktif' : 'Lunas (PAID)'}
                        </span>
                      </div>

                      {/* Contract Stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                          <span className="text-gray-400 block font-medium mb-1">Nominal Pokok</span>
                          <span className="font-extrabold text-gray-900">{formatIDR(loan.amount)}</span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                          <span className="text-gray-400 block font-medium mb-1">Total Terbayar</span>
                          <span className="font-extrabold text-emerald-600">
                            {formatIDR(loan.amount - loan.outstanding)}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                          <span className="text-gray-400 block font-medium mb-1">Sisa Outstanding (Hutang)</span>
                          <span className="font-black text-red-600">{formatIDR(loan.outstanding)}</span>
                        </div>
                      </div>

                      {/* Contract payments list */}
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Histori Pembayaran Cicilan Kontrak</h5>
                        
                        {payments.length === 0 ? (
                          <p className="text-[11px] text-gray-400 py-3 text-center bg-white border border-gray-100 rounded-xl">
                            Belum ada catatan cicilan pembayaran pinjaman untuk kontrak ini.
                          </p>
                        ) : (
                          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 shadow-2xs">
                            {payments.map((pay) => (
                              <div key={pay.id} className="p-3 flex justify-between items-center text-[11px]">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-gray-900 block">{pay.note}</span>
                                  <span className="text-[9px] text-gray-400 font-semibold block">
                                    Dicatat {new Date(pay.date).toLocaleDateString('id-ID')} oleh {pay.createdBy}
                                  </span>
                                </div>
                                <span className="font-black text-emerald-600">
                                  -{formatIDR(pay.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })
              )}

            </div>
          )}

          {/* TAB 4: PROFILE METADATA */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-gray-900 border-b border-gray-200 pb-2.5 uppercase tracking-wider text-[10px]">Informasi Keanggotaan BKS</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400 font-bold uppercase text-[9px] block">No. Induk Kependudukan (NIK)</span>
                    <span className="font-bold text-gray-800 text-sm mt-0.5 block font-mono">{customer.nik}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold uppercase text-[9px] block">Tanggal Lahir Nasabah</span>
                    <span className="font-bold text-gray-800 text-sm mt-0.5 block">{customer.birthDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold uppercase text-[9px] block">Nomor HP Aktif</span>
                    <span className="font-bold text-gray-800 text-sm mt-0.5 block">{customer.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold uppercase text-[9px] block">Alamat Domisili</span>
                    <span className="font-bold text-gray-800 mt-0.5 block">{customer.address}</span>
                  </div>
                </div>

                {customer.notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-400 font-bold uppercase text-[9px] block">Catatan Tambahan Petugas</span>
                    <p className="font-semibold text-gray-700 italic mt-1 bg-white p-2.5 border border-gray-100 rounded-lg">{customer.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* OPERATIONS TRANSACTION MODALS SHEET (CONTAINS ALL MODALS FOR SPEED & SIMPLICITY) */}
      {activeModal !== 'NONE' && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 animate-scaleIn">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#7a1223] to-[#540813] text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Landmark className="w-4.5 h-4.5 text-amber-300 shrink-0" />
                <h3 className="text-xs font-bold font-display uppercase tracking-wider">
                  {activeModal === 'DEPOSIT' && 'Form Setoran Tunai'}
                  {activeModal === 'WITHDRAWAL' && 'Form Penarikan Tunai'}
                  {activeModal === 'GOLD_DEPOSIT' && 'Form Setor Emas Fisik'}
                  {activeModal === 'GOLD_WITHDRAWAL' && 'Form Tarik Emas Fisik'}
                  {activeModal === 'GOLD_SELL' && 'Form Jual Emas Tabungan'}
                  {activeModal === 'LOAN_NEW' && 'Form Pembuatan Kontrak Pinjaman'}
                  {activeModal === 'LOAN_PAY' && 'Form Cicilan Pinjaman'}
                  {activeModal === 'REVERSAL' && 'Form Koreksi / Reversal Jurnal'}
                </h3>
              </div>
              <button onClick={() => setActiveModal('NONE')} className="text-white/80 hover:text-white p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form body */}
            <form onSubmit={handleSubmitTx} className="p-5 space-y-4">
              
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Form Input fields depending on type */}
              {(activeModal === 'DEPOSIT' || activeModal === 'WITHDRAWAL' || activeModal === 'LOAN_NEW') && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Nominal Uang (Rupiah)</label>
                    {(activeModal === 'DEPOSIT' || activeModal === 'WITHDRAWAL') && (
                      <span className="text-[9.5px] text-gray-400 font-semibold">
                        Saldo Tunai Aktif: {formatIDR(moneyBalance)}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={txAmount}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      setTxAmount(clean === '' ? '' : Number(clean).toLocaleString('id-ID'));
                    }}
                    placeholder="Contoh: 500.000"
                    className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900"
                    autoFocus
                  />
                </div>
              )}

              {(activeModal === 'GOLD_DEPOSIT' || activeModal === 'GOLD_WITHDRAWAL' || activeModal === 'GOLD_SELL') && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Berat Emas (Gram)</label>
                      <span className="text-[9.5px] text-gray-400 font-semibold">
                        Saldo Emas Aktif: {goldBalance.toFixed(4)} g
                      </span>
                    </div>
                    <input
                      type="text"
                      value={txWeight}
                      onChange={(e) => setTxWeight(e.target.value)}
                      placeholder="Contoh: 1.2500 atau 0.2500"
                      className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900"
                      autoFocus
                    />
                  </div>

                  {/* Inform active price conversions */}
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10.5px] text-amber-900 font-medium space-y-1">
                    <p className="font-extrabold uppercase text-amber-950 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      Konversi Emas Gerai BKS:
                    </p>
                    <p>• Kurs Aktif Hari Ini: <b>Rp {currentGoldPrice.toLocaleString('id-ID')} / g</b></p>
                    {txWeight && !isNaN(Number(txWeight)) && (
                      <p>• Estimasi Nilai Rupiah: <b className="text-red-700">Rp {(Number(txWeight) * currentGoldPrice).toLocaleString('id-ID')}</b></p>
                    )}
                  </div>
                </div>
              )}

              {activeModal === 'LOAN_PAY' && (
                <div className="space-y-3">
                  {/* Select loan */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block">Pilih Kontrak Pinjaman Aktif</label>
                    <select
                      value={targetLoanId}
                      onChange={(e) => setTargetLoanId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-gray-900"
                    >
                      {activeLoans.map(loan => (
                        <option key={loan.id} value={loan.id}>
                          {loan.note} (Sisa Outstanding: {formatIDR(loan.outstanding)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block">Nominal Pembayaran Cicilan</label>
                    <input
                      type="text"
                      value={txAmount}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '');
                        setTxAmount(clean === '' ? '' : Number(clean).toLocaleString('id-ID'));
                      }}
                      placeholder="Masukkan nominal pembayaran cash..."
                      className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900"
                    />
                  </div>
                </div>
              )}

              {activeModal === 'REVERSAL' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Alasan Koreksi / Reversal Jurnal</label>
                  <textarea
                    value={reversalReason}
                    onChange={(e) => setReversalReason(e.target.value)}
                    rows={3}
                    placeholder="Tuliskan alasan perbaikan (Contoh: Salah ketik angka nominal, salah input jenis tabungan...)"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900 resize-none"
                    autoFocus
                  />
                </div>
              )}

              {/* Note field for all except reversal */}
              {activeModal !== 'REVERSAL' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase block">Catatan / Keterangan Tambahan</label>
                  <input
                    type="text"
                    value={txNote}
                    onChange={(e) => setTxNote(e.target.value)}
                    placeholder="Contoh: Setor langsung loket, pelunasan darurat, dsb."
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2.5 justify-end pt-2 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setActiveModal('NONE')}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-600 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-[#8A151C] text-white text-xs font-bold rounded-xl shadow-md shadow-primary/10 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Konfirmasi Selesai
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
