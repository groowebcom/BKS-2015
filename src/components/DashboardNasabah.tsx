/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Landmark, Wallet, Coins, Percent, User, LogOut, ArrowUpRight, ArrowDownRight, 
  ChevronRight, RefreshCw, KeyRound, CheckCircle, Smartphone, Award, Calendar, Phone, MapPin, Eye, EyeOff
} from 'lucide-react';
import { Customer, MoneyTransaction, GoldTransaction, Loan, LoanPayment } from '../types';
import { getCustomerMoneyBalance, getCustomerGoldBalance, getCustomerLoans, getActiveLoanOutstanding } from '../data';

interface DashboardNasabahProps {
  customer: Customer;
  moneyTransactions: MoneyTransaction[];
  goldTransactions: GoldTransaction[];
  loans: Loan[];
  loanPayments: LoanPayment[];
  currentGoldPrice: number;
  onLogout: () => void;
  onUpdatePassword: (newPass: string) => void;
}

export default function DashboardNasabah({
  customer,
  moneyTransactions,
  goldTransactions,
  loans,
  loanPayments,
  currentGoldPrice,
  onLogout,
  onUpdatePassword,
}: DashboardNasabahProps) {
  
  // Mobile app active state navigation
  const [activeTab, setActiveTab] = useState<'home' | 'money' | 'gold' | 'loans' | 'profile'>('home');
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Calculate dynamic balances as per business rules
  const moneyBalance = getCustomerMoneyBalance(customer.id, moneyTransactions);
  const goldBalance = getCustomerGoldBalance(customer.id, goldTransactions);
  const goldValueRupiah = goldBalance * currentGoldPrice;

  // Loan state
  const customerLoans = getCustomerLoans(customer.id, loans);
  const activeLoans = customerLoans.filter(l => l.status === 'ACTIVE');
  const hasActiveLoan = activeLoans.length > 0;
  const activeOutstanding = getActiveLoanOutstanding(customer.id, loans);

  // Format currencies
  const formatIDR = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // Combine & sort transactions for this customer (limit 5 for home)
  const myMoneyTx = moneyTransactions.filter(tx => tx.customerId === customer.id && !tx.isReversaled);
  const myGoldTx = goldTransactions.filter(tx => tx.customerId === customer.id && !tx.isReversaled);

  const combinedRecentTransactions = [
    ...myMoneyTx.map(tx => ({ ...tx, genre: 'MONEY' as const })),
    ...myGoldTx.map(tx => ({ ...tx, genre: 'GOLD' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const homeTransactions = combinedRecentTransactions.slice(0, 5);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Masukkan password saat ini');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password baru minimal harus 8 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password baru tidak cocok');
      return;
    }

    onUpdatePassword(newPassword);
    setPasswordSuccess('Password Anda berhasil diperbarui!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-md mx-auto bg-[#F8F9FA] min-h-screen flex flex-col relative text-gray-900 shadow-2xl rounded-3xl border border-gray-100 overflow-hidden font-sans">
      
      {/* Phone Header Indicator Bar */}
      <div className="bg-white px-6 pt-3 pb-2 flex justify-between items-center text-slate-500 text-[11px] font-bold tracking-tight shrink-0 relative z-10 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
          <span>BKS Mobile Banking</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-mono text-emerald-600 font-extrabold uppercase">Sesi Aman</span>
        </div>
      </div>

      {/* App Main Header Bar */}
      <div className="bg-white px-6 pb-6 pt-4 text-slate-800 shrink-0 relative border-b border-slate-100 shadow-xs">
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center font-bold font-display text-slate-700 text-sm">
              {customer.name.charAt(0)}
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-semibold leading-none">Selamat pagi,</span>
              <h2 className="text-lg font-black tracking-tight text-slate-900 leading-normal mt-1">{customer.name}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsBalanceVisible(!isBalanceVisible)}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-all"
              title={isBalanceVisible ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
            >
              {isBalanceVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            
            {/* Bell icon like in the screenshot */}
            <div className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full relative cursor-pointer">
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.3} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>
          </div>
        </div>

        {/* Brand Display Card */}
        <div className="flex justify-between items-center text-slate-500 text-xs relative z-10 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
          <div className="text-[10px] font-mono tracking-wider bg-white border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded font-bold">
            ID: {customer.memberNumber}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-600">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            Emas: Rp {currentGoldPrice.toLocaleString('id-ID')} / g
          </div>
        </div>
      </div>

      {/* Main Responsive Body Viewport */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 no-scrollbar pb-24">
        
        {/* FIRST LOGIN WARNING ENFORCEMENT (BR-204) */}
        {customer.isFirstLogin && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm text-xs text-amber-800 space-y-2.5 animate-pulse">
            <h4 className="font-extrabold flex items-center gap-1.5 text-amber-900">
              <Award className="w-4 h-4 text-amber-600 shrink-0" />
              Sesi Login Pertama Dideteksi!
            </h4>
            <p className="leading-relaxed">
              Sesuai aturan keamanan <b>BKS 2015 (BR-204)</b>, Anda diwajibkan untuk segera mengubah password default Anda sebelum dapat beraktivitas penuh.
            </p>
            <button
              onClick={() => setActiveTab('profile')}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm hover:shadow transition-all text-center"
            >
              Ubah Password Sekarang
            </button>
          </div>
        )}

        {/* 1. HOME TAB */}
        {activeTab === 'home' && (
          <>
            {/* Primary Cash Balance Card (Styled like BRImo/Livin' top cards but with red gradient) */}
            <div className="bg-gradient-to-br from-[#cb356b] via-[#d6477b] to-[#bd3f32] rounded-3xl p-5 text-white shadow-lg relative overflow-hidden flex flex-col justify-between h-40 border border-white/10">
              {/* Glassmorphism background glow */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-amber-400/10 rounded-full blur-3xl"></div>
              </div>
              
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold bg-white/15 px-2.5 py-1 rounded-lg border border-white/10 text-white flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-white" />
                    Tabungan Tunai
                  </span>
                </div>
                <span className="text-[10px] text-white/70 font-mono tracking-wider bg-white/10 px-2 py-0.5 rounded border border-white/5 uppercase font-bold">
                  IDR
                </span>
              </div>

              <div className="relative z-10 mt-1">
                <span className="text-[11px] text-white/70 font-semibold block uppercase tracking-wide">Saldo Anda:</span>
                <span className="text-3xl font-black font-display text-white tracking-tight block mt-1 leading-none">
                  {isBalanceVisible ? formatIDR(moneyBalance) : '••••••••'}
                </span>
              </div>

              <div className="text-[10px] text-white/60 pt-2 border-t border-white/10 flex justify-between items-center relative z-10">
                <span>Pembaruan otomatis</span>
                <span className="text-white hover:text-amber-200 transition-colors font-bold flex items-center gap-0.5 cursor-pointer" onClick={() => setActiveTab('money')}>
                  Detail Mutasi <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Gold Balance Card (Antam Gold theme styling) */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden flex flex-col justify-between h-40 border border-slate-700/30">
              {/* Modern ambient gold backlighting gradient */}
              <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-gradient-to-br from-amber-500/15 to-transparent rounded-full blur-2xl pointer-events-none"></div>
              {/* Luxury Gold Mesh */}
              <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-gold/15 to-transparent blur-xl pointer-events-none"></div>
              
              <div className="flex justify-between items-center text-xs relative z-10">
                <span className="text-amber-200/80 font-bold tracking-wide uppercase flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                  Tabungan Emas Fisik
                </span>
                <span className="text-[9px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded font-extrabold border border-amber-500/20">
                  ANTAM
                </span>
              </div>

              <div className="relative z-10">
                <span className="text-[10px] text-amber-200/50 font-bold block uppercase leading-none">Berat Bersih</span>
                <div className="flex items-baseline gap-1 mt-1 leading-none">
                  <span className="text-2xl font-black font-display text-amber-400">
                    {isBalanceVisible ? goldBalance.toFixed(4) : '••••'}
                  </span>
                  <span className="text-xs font-bold text-gray-400">gram</span>
                </div>
              </div>

              <div className="border-t border-white/5 pt-2.5 flex justify-between items-center relative z-10">
                <div>
                  <span className="text-[9px] text-gray-500 font-bold block uppercase leading-none">Nilai Kurs Rupiah Aktif</span>
                  <span className="text-xs font-extrabold text-amber-400 mt-1 block">
                    {isBalanceVisible ? formatIDR(goldValueRupiah) : '••••••••'}
                  </span>
                </div>
                <span className="text-amber-400 text-xs font-bold hover:underline cursor-pointer flex items-center shrink-0" onClick={() => setActiveTab('gold')}>
                  Kurs <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Loan Summary Card (If they have a loan) */}
            {hasActiveLoan && (
              <div className="bg-gradient-to-r from-red-50 to-[#FFF3F3] border border-red-100 rounded-2xl p-4 shadow-xs flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Outstanding Pinjaman Aktif</span>
                  <span className="text-base font-extrabold text-slate-900 leading-tight block">
                    {isBalanceVisible ? formatIDR(activeOutstanding) : '••••••••'}
                  </span>
                  <span className="text-[9.5px] text-slate-500 font-medium block">
                    Silakan lakukan cicilan tunai langsung di kantor BKS
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('loans')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all flex items-center shrink-0"
                >
                  Bayar
                </button>
              </div>
            )}

            {/* Quick Navigation Panel */}
            <div className="grid grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <button onClick={() => setActiveTab('money')} className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-xs">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-700">Tabungan</span>
              </button>
              <button onClick={() => setActiveTab('gold')} className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-xs">
                  <Coins className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-[10px] font-bold text-slate-700">Tab. Emas</span>
              </button>
              <button onClick={() => setActiveTab('loans')} className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-xs">
                  <Percent className="w-5 h-5 text-indigo-500" />
                </div>
                <span className="text-[10px] font-bold text-slate-700">Pinjaman</span>
              </button>
              <button onClick={() => setActiveTab('profile')} className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center shadow-xs">
                  <User className="w-5 h-5 text-slate-600" />
                </div>
                <span className="text-[10px] font-bold text-slate-700">Profil Saya</span>
              </button>
            </div>

            {/* Recent Ledger Statements (Home) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Mutasi Rekening Terakhir</h3>
                <span className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer" onClick={() => setActiveTab('money')}>
                  Lihat Semua
                </span>
              </div>

              <div className="divide-y divide-gray-50">
                {homeTransactions.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center font-semibold">Belum ada transaksi di akun Anda</p>
                ) : (
                  homeTransactions.map((tx) => {
                    const isMoney = tx.genre === 'MONEY';
                    const isIncoming = tx.type === 'DEPOSIT' || tx.type === 'GOLD_SALE_PROCEEDS' || tx.type === 'GOLD_DEPOSIT' || tx.type === 'LOAN_DISBURSEMENT';
                    
                    return (
                      <div key={tx.id} className="py-2.5 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-900 leading-tight block">
                            {tx.type === 'DEPOSIT' ? 'Setoran Tunai' :
                             tx.type === 'WITHDRAWAL' ? 'Penarikan Tunai' :
                             tx.type === 'GOLD_SALE_PROCEEDS' ? 'Hasil Jual Emas' :
                             tx.type === 'GOLD_DEPOSIT' ? 'Setor Emas Antam' :
                             tx.type === 'GOLD_WITHDRAWAL' ? 'Tarik Emas Fisik' :
                             tx.type === 'GOLD_SELL' ? 'Jual Emas Tabungan' :
                             tx.type === 'LOAN_DISBURSEMENT' ? 'Pencairan Kredit' :
                             tx.type === 'LOAN_PAYMENT' ? 'Bayar Cicilan' : 'Reversal Koreksi'}
                          </span>
                          <span className="text-[9px] text-gray-400 font-semibold font-mono block">
                            {new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} • {tx.transactionNumber}
                          </span>
                        </div>
                        
                        <div className="text-right">
                          <span className={`font-extrabold ${isIncoming ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isIncoming ? '+' : '-'} {isMoney ? formatIDR(tx.amount) : `${tx.weight.toFixed(4)} g`}
                          </span>
                          <span className="text-[9px] text-gray-400 block font-medium font-mono leading-none mt-0.5">
                            {new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* 2. TABUNGAN UANG LEDGER TAB */}
        {activeTab === 'money' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#cb356b] via-[#d6477b] to-[#bd3f32] rounded-3xl p-5 text-white shadow-lg relative overflow-hidden flex justify-between items-center border border-white/10">
              {/* Glassmorphism background glow */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              </div>
              <div className="relative z-10">
                <span className="text-[10px] text-white/70 uppercase font-extrabold tracking-wider bg-white/10 px-2.5 py-1 rounded-lg border border-white/5">Saldo Tabungan Tunai</span>
                <span className="text-2xl font-black font-display block mt-2 text-white">
                  {isBalanceVisible ? formatIDR(moneyBalance) : '••••••••'}
                </span>
              </div>
              <Wallet className="w-8 h-8 text-white/30 shrink-0 relative z-10" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-gray-900 uppercase border-b border-gray-50 pb-2.5">Histori Transaksi Uang</h3>
              
              <div className="divide-y divide-gray-50">
                {myMoneyTx.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center font-semibold">Belum ada riwayat transaksi tabungan uang</p>
                ) : (
                  myMoneyTx.map((tx) => {
                    const isDeposit = tx.type === 'DEPOSIT' || tx.type === 'GOLD_SALE_PROCEEDS' || tx.type === 'LOAN_DISBURSEMENT';
                    return (
                      <div key={tx.id} className="py-3 flex justify-between items-start text-xs hover:bg-gray-50/50 rounded px-1 transition-all">
                        <div className="space-y-1">
                          <span className="font-extrabold text-gray-900 block leading-none">
                            {tx.type === 'DEPOSIT' ? 'Setoran Tunai' :
                             tx.type === 'WITHDRAWAL' ? 'Penarikan Tunai' :
                             tx.type === 'GOLD_SALE_PROCEEDS' ? 'Hasil Penjualan Emas' :
                             tx.type === 'LOAN_DISBURSEMENT' ? 'Pencairan Pinjaman' :
                             tx.type === 'LOAN_PAYMENT' ? 'Pembayaran Pinjaman' : 'Reversal'}
                          </span>
                          <span className="text-[9.5px] text-gray-500 block">
                            {tx.note}
                          </span>
                          <span className="text-[9px] text-gray-400 font-semibold font-mono block">
                            {new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} • {tx.transactionNumber}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`font-black ${isDeposit ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isDeposit ? '+' : '-'} {formatIDR(tx.amount)}
                          </span>
                          <span className="block text-[8px] text-gray-400 font-mono mt-1">
                            Petugas: {tx.createdBy}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. TABUNGAN EMAS LEDGER TAB */}
        {activeTab === 'gold' && (
          <div className="space-y-4">
            
            {/* Gold Assets Cards */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-5 rounded-2xl shadow-lg space-y-4 relative overflow-hidden border border-slate-700/30">
              {/* Subtle gold glow instead of waves */}
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute right-0 bottom-0 top-0 w-1/4 bg-radial from-gold/10 to-transparent blur-xl pointer-events-none"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <span className="text-[10px] text-amber-200/60 uppercase font-extrabold">Saldo Emas Fisik</span>
                  <div className="flex items-baseline gap-1 mt-1 leading-none">
                    <span className="text-2xl font-black font-display text-gold">
                      {isBalanceVisible ? goldBalance.toFixed(4) : '••••'}
                    </span>
                    <span className="text-xs font-bold text-gray-400">gram</span>
                  </div>
                </div>
                <Coins className="w-8 h-8 text-gold/30 shrink-0" />
              </div>

              <div className="border-t border-white/10 pt-3 flex justify-between items-center text-xs relative z-10">
                <div>
                  <span className="text-[9px] text-gray-500 font-bold block uppercase leading-none">Kurs Antam Hari Ini</span>
                  <span className="text-xs font-black text-amber-400 leading-none mt-1 block">
                    Rp {currentGoldPrice.toLocaleString('id-ID')} / g
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-gray-500 font-bold block uppercase leading-none">Estimasi IDR Aktif</span>
                  <span className="text-xs font-black text-white leading-none mt-1 block">
                    {isBalanceVisible ? formatIDR(goldValueRupiah) : '••••••••'}
                  </span>
                </div>
              </div>
            </div>

            {/* Gold transaction list */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-gray-900 uppercase border-b border-gray-50 pb-2.5">Histori Transaksi Emas</h3>

              <div className="divide-y divide-gray-50">
                {myGoldTx.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center font-semibold">Belum ada riwayat transaksi tabungan emas</p>
                ) : (
                  myGoldTx.map((tx) => {
                    const isDeposit = tx.type === 'GOLD_DEPOSIT';
                    return (
                      <div key={tx.id} className="py-3 flex justify-between items-start text-xs hover:bg-gray-50/50 rounded px-1 transition-all">
                        <div className="space-y-1">
                          <span className="font-extrabold text-gray-900 block leading-none">
                            {tx.type === 'GOLD_DEPOSIT' ? 'Setor Emas Fisik' :
                             tx.type === 'GOLD_WITHDRAWAL' ? 'Tarik Emas Fisik' :
                             tx.type === 'GOLD_SELL' ? 'Jual Emas Tabungan' : 'Reversal'}
                          </span>
                          <span className="text-[9.5px] text-gray-500 block leading-tight">
                            {tx.note} • Kurs Snapshot: Rp {tx.goldPriceSnapshot.toLocaleString('id-ID')}/g
                          </span>
                          <span className="text-[9px] text-gray-400 font-semibold font-mono block">
                            {new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} • {tx.transactionNumber}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`font-black ${isDeposit ? 'text-amber-600' : 'text-red-600'}`}>
                            {isDeposit ? '+' : '-'} {tx.weight.toFixed(4)} g
                          </span>
                          <span className="block text-[8.5px] text-gray-400 font-semibold mt-1">
                            {formatIDR(tx.amountRupiah)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. LOANS TAB */}
        {activeTab === 'loans' && (
          <div className="space-y-4">
            
            {/* Loans active outstanding overview */}
            <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white p-5 rounded-2xl shadow-lg space-y-4 relative overflow-hidden border border-slate-700/30">
              {/* Subtle ambient glow instead of waves */}
              <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-red-500/5 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold">Outstanding Pinjaman</span>
                  <span className="text-xl font-extrabold font-display block mt-1 text-red-400">
                    {isBalanceVisible ? formatIDR(activeOutstanding) : '••••••••'}
                  </span>
                </div>
                <Percent className="w-8 h-8 text-slate-600 shrink-0" />
              </div>

              <div className="border-t border-slate-700/60 pt-3 flex justify-between text-xs text-slate-300">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Status Kontrak</span>
                  <span className="font-extrabold text-white mt-0.5 block">
                    {hasActiveLoan ? 'Kontrak Aktif' : 'Tidak Ada Hutang Aktif'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Total Pinjaman Historis</span>
                  <span className="font-extrabold text-white mt-0.5 block">
                    {formatIDR(customerLoans.reduce((sum, l) => sum + l.amount, 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* List of active/inactive loan accounts */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-400 uppercase px-1">Kontrak Pinjaman Anggota</h3>

              {customerLoans.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 shadow-xs">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-bold text-gray-800">Akun Bersih dari Pinjaman</p>
                  <p className="text-[10px] text-gray-400 mt-1">Anda tidak memiliki tunggakan kontrak pinjaman aktif di Gerai BKS.</p>
                </div>
              ) : (
                customerLoans.map((loan) => {
                  // Get payments for this loan
                  const payments = loanPayments.filter(p => p.loanId === loan.id);
                  
                  return (
                    <div key={loan.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
                      <div className="flex justify-between items-start border-b border-gray-50 pb-2.5">
                        <div>
                          <span className="text-xs font-bold text-gray-900 block">{loan.note}</span>
                          <span className="text-[9.5px] text-gray-400 font-semibold font-mono">{loan.loanNumber} • {new Date(loan.date).toLocaleDateString('id-ID')}</span>
                        </div>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                          loan.status === 'ACTIVE' 
                            ? 'bg-red-50 text-red-600 border border-red-100' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {loan.status === 'ACTIVE' ? 'Aktif' : 'Lunas (PAID)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[9.5px] text-gray-400 font-medium block">Nominal Pinjaman</span>
                          <span className="font-bold text-gray-800">{formatIDR(loan.amount)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9.5px] text-gray-400 font-medium block">Sisa Hutang (Outstanding)</span>
                          <span className="font-black text-red-600">{formatIDR(loan.outstanding)}</span>
                        </div>
                      </div>

                      {/* Repayment statement */}
                      {payments.length > 0 && (
                        <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-2.5 space-y-1.5">
                          <span className="text-[9px] text-gray-400 font-extrabold uppercase block tracking-wider">Histori Jurnal Pembayaran</span>
                          {payments.map(pay => (
                            <div key={pay.id} className="flex justify-between items-center text-[10px]">
                              <span className="text-gray-500 font-medium truncate max-w-[200px]">{pay.note}</span>
                              <div className="text-right shrink-0">
                                <span className="font-bold text-emerald-600">-{formatIDR(pay.amount)}</span>
                                <span className="block text-[8px] text-gray-400 font-mono leading-none">{new Date(pay.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* 5. PROFIL & DIGITAL MEMBER CARD TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            
            {/* LUXURY GOLD-TEXTURED BKS DIGITAL MEMBERSHIP CARD (CRAFTSMANSHIP POINT) */}
            <div className="bg-gradient-to-br from-[#cb356b] via-[#d6477b] to-[#bd3f32] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden border border-amber-500/20 flex flex-col justify-between h-48 select-none">
              {/* Elegant dual-tone background gold glows instead of waves */}
              <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -left-12 -top-12 w-44 h-44 bg-gradient-to-br from-rose-400/10 to-transparent rounded-full blur-2xl pointer-events-none"></div>
              {/* Luxury Gold Accents & Background watermark */}
              <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-[#D4AF37]/10 to-transparent pointer-events-none"></div>
              <div className="absolute top-4 right-4 flex items-center justify-center relative z-10">
                <div className="border border-gold/30 bg-gold/10 px-2 py-0.5 rounded text-[8px] text-gold font-extrabold uppercase tracking-widest leading-none shadow-sm animate-pulse">
                  PRIORITAS
                </div>
              </div>

              <div className="flex items-center gap-2 relative z-10">
                <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center text-primary shadow-sm shadow-[#D4AF37]/20">
                  <Landmark className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-tight font-display text-white">BKS 2015</h3>
                  <span className="text-[8px] text-amber-200/50 block font-semibold leading-none uppercase tracking-widest">Sistem Anggota Mandiri</span>
                </div>
              </div>

              <div className="my-1 relative z-10">
                <span className="text-[9px] text-amber-200/50 block uppercase font-mono tracking-wider">Nomor ID Anggota</span>
                <span className="text-base font-black tracking-widest font-mono text-amber-100">
                  {customer.memberNumber}
                </span>
              </div>

              <div className="border-t border-white/10 pt-2 flex justify-between items-end relative z-10">
                <div>
                  <span className="text-[8px] text-amber-200/50 block uppercase font-mono">Nama Pemegang</span>
                  <span className="text-xs font-extrabold tracking-wide uppercase block text-white mt-0.5 leading-none">
                    {customer.name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-amber-200/50 block uppercase font-mono">NIK NASABAH</span>
                  <span className="text-[10px] font-bold text-amber-100 mt-0.5 block leading-none font-mono">
                    {customer.nik}
                  </span>
                </div>
              </div>
            </div>

            {/* General metadata profile */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3 text-xs">
              <h3 className="text-xs font-black text-gray-900 uppercase border-b border-gray-50 pb-2.5">Data Profil Personal</h3>
              
              <div className="space-y-2.5">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-gray-500 font-medium">Tanggal Lahir:</span>
                  <span className="font-bold text-gray-800 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    {customer.birthDate}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-gray-500 font-medium">No. Telepon HP:</span>
                  <span className="font-bold text-gray-800 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    {customer.phone}
                  </span>
                </div>
                <div className="flex justify-between items-start py-0.5">
                  <span className="text-gray-500 font-medium">Alamat Domisili:</span>
                  <span className="font-bold text-gray-800 flex items-start gap-1 text-right max-w-[200px] leading-tight">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    {customer.address}
                  </span>
                </div>
              </div>
            </div>

            {/* Change Password Form (Enforcing BR-204) */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-black text-gray-900 uppercase">Ubah Password Keanggotaan</h3>
                <p className="text-[10px] text-gray-400">Pastikan password baru Anda minimal terdiri dari 8 karakter huruf dan angka.</p>
              </div>

              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-600 font-medium">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  {passwordSuccess}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Password Saat Ini</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Password saat ini / tanggal lahir DDMMYYYY"
                    className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Password Baru</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Password baru (Min. 8 karakter)"
                    className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password baru"
                    className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-[#cb356b] to-[#bd3f32] hover:from-[#bd3f32] hover:to-[#cb356b] text-white text-xs font-bold rounded-xl shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  SIMPAN PASSWORD BARU
                </button>
              </form>
            </div>

            {/* Log out Account Section */}
            <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-xs flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-red-600 uppercase">Keluar Aplikasi</h3>
                <p className="text-[10px] text-gray-400">Tutup sesi aman perbankan Anda sekarang.</p>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>

          </div>
        )}

      </div>

      {/* STICKY BOTTOM NAVIGATION BAR FOR MOBILE NASABAH (UX REQUIREMENT) */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-20 bg-white border-t border-slate-100 flex items-center justify-around px-2 pb-4 pt-2 shrink-0 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 px-3.5 py-1 rounded-xl transition-all ${
            activeTab === 'home' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Landmark className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-black uppercase tracking-tight">Beranda</span>
        </button>

        <button
          onClick={() => setActiveTab('money')}
          className={`flex flex-col items-center gap-1 px-3.5 py-1 rounded-xl transition-all ${
            activeTab === 'money' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Wallet className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-black uppercase tracking-tight">Tabungan</span>
        </button>

        <button
          onClick={() => setActiveTab('gold')}
          className={`flex flex-col items-center gap-1 px-3.5 py-1 rounded-xl transition-all ${
            activeTab === 'gold' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Coins className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-black uppercase tracking-tight">Emas</span>
        </button>

        <button
          onClick={() => setActiveTab('loans')}
          className={`flex flex-col items-center gap-1 px-3.5 py-1 rounded-xl transition-all ${
            activeTab === 'loans' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Percent className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-black uppercase tracking-tight">Kredit</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 px-3.5 py-1 rounded-xl transition-all ${
            activeTab === 'profile' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <User className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-black uppercase tracking-tight">Profil</span>
        </button>
      </div>

    </div>
  );
}
