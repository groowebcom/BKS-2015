/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Users, UserCheck, Wallet, Coins, Landmark, Percent, TrendingUp, ArrowUpRight, ArrowDownRight, ArrowRight,
  UserPlus, FileBarChart, Upload, ArrowUpCircle, ArrowDownCircle, RefreshCcw, ClipboardList
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Customer, MoneyTransaction, GoldTransaction, Loan, UserRole } from '../types';
import { getCustomerMoneyBalance, getCustomerGoldBalance } from '../data';

interface DashboardOwnerProps {
  customers: Customer[];
  moneyTransactions: MoneyTransaction[];
  goldTransactions: GoldTransaction[];
  loans: Loan[];
  currentGoldPrice: number;
  setActiveTab: (tab: string) => void;
  onQuickAction: (action: string) => void;
}

export default function DashboardOwner({
  customers,
  moneyTransactions,
  goldTransactions,
  loans,
  currentGoldPrice,
  setActiveTab,
  onQuickAction,
}: DashboardOwnerProps) {
  
  // Calculate stats dynamically
  const activeCustomers = customers.filter(c => c.status === 'ACTIVE');
  const totalCustomers = customers.length;
  const totalAdmins = 1; // siti rahma

  // Cash reserves (Total Deposits - Total Withdrawals + Total Loans - Total Loan Payments + Total Gold Sell proceeds)
  // Let's compute this sum for ALL customers
  let totalCashSavings = 0;
  customers.forEach(cust => {
    totalCashSavings += getCustomerMoneyBalance(cust.id, moneyTransactions);
  });

  // Total Gold reserves
  let totalGoldGrams = 0;
  customers.forEach(cust => {
    totalGoldGrams += getCustomerGoldBalance(cust.id, goldTransactions);
  });

  const estimatedGoldRupiah = totalGoldGrams * currentGoldPrice;

  // Active outstanding loans
  const totalOutstanding = loans
    .filter(l => l.status === 'ACTIVE')
    .reduce((sum, l) => sum + l.outstanding, 0);

  // Growth rates (mocked or derived)
  const customerGrowth = '+12% bulan ini';
  const goldGrowth = '+8.4% minggu ini';

  // Chart data: transaction breakdown over last 7 days
  const chartData = [
    { name: '06 Jul', Setoran: 8500000, Penarikan: 2000000, Pinjaman: 0 },
    { name: '07 Jul', Setoran: 1500000, Penarikan: 1000000, Pinjaman: 1500000 },
    { name: '08 Jul', Setoran: 2000000, Penarikan: 500000, Pinjaman: 0 },
    { name: '09 Jul', Setoran: 4000000, Penarikan: 1200000, Pinjaman: 3000000 },
    { name: '10 Jul', Setoran: 13800000, Penarikan: 2000000, Pinjaman: 0 },
    { name: '11 Jul', Setoran: 5000000, Penarikan: 1500000, Pinjaman: 1500000 },
    { name: '12 Jul', Setoran: 0, Penarikan: 0, Pinjaman: 0 }, // Hari ini
  ];

  // Asset allocation pie chart data
  const pieData = [
    { name: 'Kas Tabungan Uang', value: totalCashSavings, color: '#2563eb' },
    { name: 'Tabungan Emas (IDR)', value: estimatedGoldRupiah, color: '#d97706' },
    { name: 'Outstanding Pinjaman', value: totalOutstanding, color: '#475569' },
  ];

  // Format IDR helper
  const formatIDR = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // Get recent 4 overall transactions (Money + Gold sorted by date)
  const recentAllTx = [
    ...moneyTransactions.map(tx => ({ ...tx, txGenre: 'MONEY' as const })),
    ...goldTransactions.map(tx => ({ ...tx, txGenre: 'GOLD' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);

  return (
    <div className="space-y-6">
      
      {/* Welcome Card & Header Banner */}
      <div className="bg-gradient-to-br from-[#7a1223] via-[#650f1d] to-[#540813] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        {/* Subtle background graphic design */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
          <Landmark className="w-64 h-64 text-white" />
        </div>
        
        <div className="relative z-10">
          <span className="text-xs uppercase tracking-wider font-extrabold text-red-200">Panel Pengawas Owner</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display mt-1">Selamat Datang, Pak Dedek</h1>
          <p className="text-sm text-red-100/90 mt-1 max-w-xl">
            Sistem Tabungan Digital berjalan stabil. Seluruh saldo dihitung secara real-time berdasarkan riwayat transaksi yang permanen.
          </p>
          
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-4 text-xs font-semibold">
            <div>
              <span className="text-red-200">Waktu Server:</span> <span className="font-mono">12 Jul 2026, 10:15 WIB</span>
            </div>
            <div className="hidden sm:block text-white/20">|</div>
            <div>
              <span className="text-red-200">Database Status:</span> <span className="text-emerald-300">● Tersinkronisasi (OK)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Menu / Actions */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Menu Aksi Cepat Owner</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => onQuickAction('add-customer')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-gray-100 hover:border-primary-light bg-gray-50/50 hover:bg-primary-light text-gray-700 hover:text-primary transition-all duration-200 group text-center"
          >
            <UserPlus className="w-5 h-5 text-gray-500 group-hover:text-primary mb-2 transition-transform group-hover:scale-110" />
            <span className="text-xs font-bold">Tambah Nasabah</span>
          </button>
          
          <button
            onClick={() => setActiveTab('gold-price')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-gray-100 hover:border-gold-light bg-gray-50/50 hover:bg-gold-light text-gray-700 hover:text-gold-hover transition-all duration-200 group text-center"
          >
            <Coins className="w-5 h-5 text-gray-500 group-hover:text-gold mb-2 transition-transform group-hover:scale-110" />
            <span className="text-xs font-bold">Ubah Harga Emas</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-gray-100 hover:border-primary-light bg-gray-50/50 hover:bg-primary-light text-gray-700 hover:text-primary transition-all duration-200 group text-center"
          >
            <Upload className="w-5 h-5 text-gray-500 group-hover:text-primary mb-2 transition-transform group-hover:scale-110" />
            <span className="text-xs font-bold">Import Data Excel</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-gray-100 hover:border-emerald-50 bg-gray-50/50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 transition-all duration-200 group text-center"
          >
            <FileBarChart className="w-5 h-5 text-gray-500 group-hover:text-emerald-600 mb-2 transition-transform group-hover:scale-110" />
            <span className="text-xs font-bold">Unduh Laporan</span>
          </button>

          <button
            onClick={() => setActiveTab('audit-trail')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-gray-100 hover:border-purple-50 bg-gray-50/50 hover:bg-purple-50 text-gray-700 hover:text-purple-700 transition-all duration-200 group text-center"
          >
            <ClipboardList className="w-5 h-5 text-gray-500 group-hover:text-purple-600 mb-2 transition-transform group-hover:scale-110" />
            <span className="text-xs font-bold">Buka Audit Log</span>
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Customers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Nasabah</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight font-display text-slate-900">{totalCustomers}</span>
              <span className="text-[10px] text-slate-400 font-medium">Orang</span>
            </div>
            <span className="text-[10px] text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded font-bold block w-max mt-1">
              {customerGrowth}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Cash Savings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Reserve Uang (Kas)</span>
            <span className="text-lg font-black tracking-tight text-slate-900 block truncate leading-none">
              {formatIDR(totalCashSavings)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block pt-1">
              Total tabungan uang masyarakat
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Total Gold Savings Weight */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Reserve Emas Fisik</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black tracking-tight font-display text-slate-900">
                {totalGoldGrams.toFixed(4)}
              </span>
              <span className="text-xs font-bold text-slate-400">gram</span>
            </div>
            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold block w-max mt-1">
              ≈ {formatIDR(estimatedGoldRupiah)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Loan Outstanding */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Outstanding Pinjaman</span>
            <span className="text-lg font-black tracking-tight text-slate-900 block truncate leading-none">
              {formatIDR(totalOutstanding)}
            </span>
            <span className="text-[10px] text-primary bg-primary-light border border-primary-light/50 px-1.5 py-0.5 rounded font-bold block w-max mt-1">
              Peminjam Aktif
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Percent className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Transaction Flow Column */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Alur Transaksi Mingguan</h3>
              <p className="text-[11px] text-slate-400">Grafik perbandingan Setoran, Penarikan, dan Pembayaran Pinjaman harian</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                7 Hari Terakhir
              </span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                <Bar dataKey="Setoran" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="Penarikan" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Assets Breakdown Pie Chart Column */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Rasio Alokasi Aset</h3>
            <p className="text-[11px] text-slate-400">Distribusi nilai finansial yang dikelola dalam sistem BKS</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatIDR(value as number)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase leading-none">Total Kelolaan</span>
              <span className="text-xs font-black text-slate-800 mt-1">
                {formatIDR(totalCashSavings + estimatedGoldRupiah)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
            {pieData.map((asset, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.color }}></div>
                  <span className="text-slate-500 font-medium">{asset.name}</span>
                </div>
                <span className="font-bold text-slate-900">{formatIDR(asset.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Activity of Admins and Global logs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Aktivitas & Log Transaksi Terbaru</h3>
            <p className="text-[11px] text-slate-400">Pencatatan real-time perubahan data, setoran, dan penarikan harian</p>
          </div>
          <button
            onClick={() => setActiveTab('audit-trail')}
            className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 group transition-colors"
          >
            Buka Semua Log
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {recentAllTx.map((tx) => {
            const isMoney = tx.txGenre === 'MONEY';
            
            return (
              <div key={tx.id} className="p-4 sm:px-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isMoney
                      ? tx.type === 'DEPOSIT' || tx.type === 'GOLD_SALE_PROCEEDS' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      : tx.type === 'GOLD_DEPOSIT' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isMoney ? (
                      tx.type === 'DEPOSIT' || tx.type === 'GOLD_SALE_PROCEEDS' ? (
                        <ArrowUpCircle className="w-5 h-5" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5" />
                      )
                    ) : (
                      tx.type === 'GOLD_DEPOSIT' ? (
                        <Coins className="w-5 h-5 text-amber-500" />
                      ) : (
                        <RefreshCcw className="w-5 h-5 text-gray-500" />
                      )
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-900">
                        {customers.find(c => c.id === tx.customerId)?.name || 'Nasabah BKS'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1 rounded">
                        {tx.transactionNumber}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-normal mt-0.5">
                      {tx.note} • Oleh {tx.createdBy}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-extrabold ${
                    isMoney
                      ? tx.type === 'DEPOSIT' || tx.type === 'GOLD_SALE_PROCEEDS' || tx.type === 'LOAN_DISBURSEMENT' ? 'text-emerald-600' : 'text-red-600'
                      : tx.type === 'GOLD_DEPOSIT' ? 'text-amber-600' : 'text-gray-700'
                  }`}>
                    {isMoney ? (
                      `${tx.type === 'DEPOSIT' || tx.type === 'GOLD_SALE_PROCEEDS' || tx.type === 'LOAN_DISBURSEMENT' ? '+' : '-'} Rp ${tx.amount.toLocaleString('id-ID')}`
                    ) : (
                      `${tx.type === 'GOLD_DEPOSIT' ? '+' : '-'} ${tx.weight.toFixed(4)} gram`
                    )}
                  </span>
                  <span className="block text-[9px] text-gray-400 font-semibold font-mono mt-0.5">
                    {new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
