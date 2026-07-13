/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, Wallet, Coins, Percent, ArrowUpRight, ArrowDownRight, Search, Landmark,
  ArrowUpCircle, ArrowDownCircle, RefreshCcw, LandmarkIcon, UserPlus, UserCheck
} from 'lucide-react';
import { Customer, MoneyTransaction, GoldTransaction, UserRole } from '../types';

interface DashboardAdminProps {
  customers: Customer[];
  moneyTransactions: MoneyTransaction[];
  goldTransactions: GoldTransaction[];
  setActiveTab: (tab: string) => void;
  onSelectCustomer: (customerId: string) => void;
}

export default function DashboardAdmin({
  customers,
  moneyTransactions,
  goldTransactions,
  setActiveTab,
  onSelectCustomer,
}: DashboardAdminProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Today's transaction stats (mocking for today 12 July 2026)
  // Let's filter transactions with date starting with 2026-07-12 or just sum any transactions made by Siti Rahma on 12 Jul
  const todayMoneyTx = moneyTransactions.filter(tx => tx.date.startsWith('2026-07-12'));
  const todayGoldTx = goldTransactions.filter(tx => tx.date.startsWith('2026-07-12'));

  const todayDepositCount = todayMoneyTx.filter(tx => tx.type === 'DEPOSIT').length;
  const todayWithdrawalCount = todayMoneyTx.filter(tx => tx.type === 'WITHDRAWAL').length;
  const todayGoldCount = todayGoldTx.length;

  const totalTodayMoneyVolume = todayMoneyTx.reduce((sum, tx) => sum + tx.amount, 0);

  // Search filter for customers
  const filteredCustomers = customers
    .filter(cust => 
      cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.memberNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.nik.includes(searchQuery)
    )
    .slice(0, 4); // Show top 4 for quick dashboard indexing

  // Get recent 4 admin activities (made by 'Siti Rahma' or generic)
  const myActivities = [
    ...moneyTransactions.filter(tx => tx.createdBy === 'Siti Rahma').map(tx => ({ ...tx, txGenre: 'MONEY' as const })),
    ...goldTransactions.filter(tx => tx.createdBy === 'Siti Rahma').map(tx => ({ ...tx, txGenre: 'GOLD' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);

  return (
    <div className="space-y-6">
      
      {/* Welcome Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
            Petugas Loket Operasional
          </span>
          <h1 className="text-xl sm:text-2xl font-black font-display text-slate-900 mt-2">
            Selamat Bertugas, Ibu Siti Rahma
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gunakan kotak pencarian atau daftar nasabah di bawah untuk mencatat setoran, penarikan, transaksi emas, dan pinjaman.
          </p>
        </div>
        
        {/* Dynamic Clock Indicator */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl shrink-0">
          <Landmark className="w-5 h-5 text-blue-600" />
          <div className="text-left">
            <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">Gerai BKS</span>
            <span className="text-xs font-black text-slate-800 leading-none">12 Juli 2026</span>
          </div>
        </div>
      </div>

      {/* Quick Customer Search Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Cari Data Nasabah BKS</h3>
          <p className="text-[11px] text-slate-500">Ketik Nama, Nomor Anggota, atau NIK untuk memulai transaksi keuangan langsung</p>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Nasabah (Contoh: Ahmad, Aminah, Sri, atau NIK...)"
            className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Live Search Quick Results */}
        {searchQuery && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5 animate-fadeIn">
            {filteredCustomers.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center font-medium">
                Nasabah tidak ditemukan. Silakan periksa kembali Nama, No. Anggota, atau NIK.
              </p>
            ) : (
              filteredCustomers.map(cust => (
                <div 
                  key={cust.id} 
                  onClick={() => onSelectCustomer(cust.id)}
                  className="flex items-center justify-between p-3 bg-white hover:bg-blue-50/50 rounded-lg border border-slate-200 cursor-pointer transition-all hover:border-blue-300 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {cust.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{cust.name}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold font-mono block">
                        {cust.memberNumber} • NIK: {cust.nik}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      cust.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {cust.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <span className="text-[10px] font-extrabold text-blue-600 hover:underline flex items-center gap-0.5">
                      Pilih <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
            <div className="text-center pt-1.5 border-t border-slate-200">
              <button 
                onClick={() => setActiveTab('customers')} 
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                Buka Seluruh Daftar Nasabah ({customers.length} Orang)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shortcuts grid when there is no query */}
      {!searchQuery && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('customers')}
            className="p-5 bg-white border border-slate-200 hover:border-blue-300 rounded-2xl shadow-xs text-left transition-all group relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-extrabold text-slate-900">Catat Setoran Uang</h4>
            <span className="text-[10px] text-slate-400 block mt-1">Pilih nasabah & input nominal setoran cash</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className="p-5 bg-white border border-slate-200 hover:border-amber-300 rounded-2xl shadow-xs text-left transition-all group relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Coins className="w-5 h-5 text-amber-500" />
            </div>
            <h4 className="text-xs font-extrabold text-slate-900">Setor Emas Antam</h4>
            <span className="text-[10px] text-slate-400 block mt-1">Timbang emas fisik & catat gramasi nasabah</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className="p-5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-xs text-left transition-all group relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center mb-3">
              <Percent className="w-5 h-5 text-slate-600" />
            </div>
            <h4 className="text-xs font-extrabold text-slate-900">Pencairan Pinjaman</h4>
            <span className="text-[10px] text-slate-400 block mt-1">Buat kontrak pinjaman modal tunai baru</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className="p-5 bg-white border border-slate-200 hover:border-blue-300 rounded-2xl shadow-xs text-left transition-all group relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Search className="w-5 h-5 text-blue-500" />
            </div>
            <h4 className="text-xs font-extrabold text-slate-900">Cari Data & Cetak</h4>
            <span className="text-[10px] text-slate-400 block mt-1">Cek riwayat tabungan & pinjaman nasabah</span>
          </button>
        </div>
      )}

      {/* Admin stats today & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Transactions Volume Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Operasional Hari Ini</h3>
            <p className="text-[11px] text-slate-400">Ringkasan transaksi yang dilakukan melalui loket Anda hari ini</p>
          </div>

          <div className="py-4 my-2 border-y border-slate-100 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Setoran Tunai</span>
              <span className="font-bold text-slate-900">{todayDepositCount} transaksi</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Penarikan Tunai</span>
              <span className="font-bold text-slate-900">{todayWithdrawalCount} transaksi</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Transaksi Emas (Setor/Jual)</span>
              <span className="font-bold text-amber-600 font-display">{todayGoldCount} transaksi</span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Perputaran Loket Anda</span>
            <span className="text-lg font-black text-blue-600 font-display">
              Rp {totalTodayMoneyVolume > 0 ? totalTodayMoneyVolume.toLocaleString('id-ID') : '0'}
            </span>
          </div>
        </div>

        {/* My Activities Log */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Histori Transaksi Terakhir Loket Anda</h3>
            <p className="text-[11px] text-slate-400">Riwayat pengisian jurnal kas dan emas fisik yang baru saja Anda catat</p>
          </div>

          <div className="divide-y divide-gray-50 flex-1">
            {myActivities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-400">
                <LandmarkIcon className="w-10 h-10 mb-2 opacity-35 text-gray-400" />
                <p className="text-xs font-medium">Belum ada transaksi di loket Anda hari ini.</p>
              </div>
            ) : (
              myActivities.map((tx) => {
                const isMoney = tx.txGenre === 'MONEY';
                return (
                  <div key={tx.id} className="p-3.5 px-5 flex items-center justify-between hover:bg-gray-50/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isMoney
                          ? tx.type === 'DEPOSIT' || tx.type === 'GOLD_SALE_PROCEEDS' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {isMoney ? (
                          tx.type === 'DEPOSIT' || tx.type === 'GOLD_SALE_PROCEEDS' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />
                        ) : (
                          <Coins className="w-4 h-4 text-amber-500" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900">
                            {customers.find(c => c.id === tx.customerId)?.name || 'Nasabah BKS'}
                          </span>
                          <span className="text-[9px] text-gray-400 font-mono">
                            {tx.transactionNumber}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate max-w-xs">{tx.note}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs font-extrabold ${
                        isMoney
                          ? tx.type === 'DEPOSIT' || tx.type === 'GOLD_SALE_PROCEEDS' || tx.type === 'LOAN_DISBURSEMENT' ? 'text-emerald-600' : 'text-red-600'
                          : 'text-amber-600'
                      }`}>
                        {isMoney ? (
                          `${tx.type === 'DEPOSIT' || tx.type === 'GOLD_SALE_PROCEEDS' || tx.type === 'LOAN_DISBURSEMENT' ? '+' : '-'} Rp ${tx.amount.toLocaleString('id-ID')}`
                        ) : (
                          `+${tx.weight.toFixed(4)} g`
                        )}
                      </span>
                      <span className="block text-[8px] text-gray-400 font-semibold font-mono">
                        {new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
