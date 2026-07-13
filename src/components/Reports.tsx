/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileBarChart, Download, FileSpreadsheet, Calendar, Wallet, Coins, Percent, 
  Search, SlidersHorizontal, ArrowUpRight, ArrowDownRight, Check, CheckCircle
} from 'lucide-react';
import { Customer, MoneyTransaction, GoldTransaction, Loan, UserRole } from '../types';
import { getCustomerMoneyBalance, getCustomerGoldBalance } from '../data';

interface ReportsProps {
  customers: Customer[];
  moneyTransactions: MoneyTransaction[];
  goldTransactions: GoldTransaction[];
  loans: Loan[];
  currentGoldPrice: number;
  userRole: UserRole;
  onLogExportAction: (reportName: string) => void;
}

export default function Reports({
  customers,
  moneyTransactions,
  goldTransactions,
  loans,
  currentGoldPrice,
  userRole,
  onLogExportAction,
}: ReportsProps) {
  const isOwner = userRole === UserRole.OWNER;
  const [activeReportTab, setActiveReportTab] = useState<'savings' | 'gold' | 'loans' | 'transactions'>('savings');
  const [filterPeriod, setFilterPeriod] = useState<'ALL' | 'JULY_2026'>('ALL');
  
  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState('');

  // Helpers
  const formatIDR = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // Derive reports data
  const totalCashSavings = customers.reduce((sum, c) => sum + getCustomerMoneyBalance(c.id, moneyTransactions), 0);
  const totalGoldWeight = customers.reduce((sum, c) => sum + getCustomerGoldBalance(c.id, goldTransactions), 0);
  const totalGoldValueIDR = totalGoldWeight * currentGoldPrice;
  const totalOutstandingLoan = loans.filter(l => l.status === 'ACTIVE').reduce((sum, l) => sum + l.outstanding, 0);

  // Filtered transactions for the transactions report
  const filteredMoneyTx = moneyTransactions.filter(tx => !tx.isReversaled);
  const filteredGoldTx = goldTransactions.filter(tx => !tx.isReversaled);

  // Simulate Excel Export
  const handleExport = (reportName: string) => {
    if (!isOwner) {
      alert('Hanya Owner yang memiliki izin akses melakukan ekspor laporan ke Excel (BR-902).');
      return;
    }

    setIsExporting(true);
    setExportSuccessMessage('');
    
    setTimeout(() => {
      setIsExporting(false);
      onLogExportAction(reportName);
      setExportSuccessMessage(`Laporan ${reportName} berhasil diekspor ke format Excel (Laporan_BKS_2026.xlsx). Riwayat pencatatan aman disimpan di Audit Trail.`);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-display text-gray-900">
            Jurnal & Laporan Konsolidasian BKS
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Laporan otomatis yang disinkronisasi harian untuk melacak peredaran uang tunai, stok fisik emas, dan tingkat kolektibilitas kredit.
          </p>
        </div>

        {isOwner ? (
          <button
            onClick={() => handleExport(activeReportTab.toUpperCase())}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
          >
            {isExporting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? 'Mengekspor ke Excel...' : 'Ekspor Laporan Aktif (.xlsx)'}
          </button>
        ) : (
          <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl font-bold max-w-xs">
            Hanya Akun Owner yang berhak melakukan ekspor data (BR-902). Akun Admin dibatasi hak akses cetak dokumen.
          </div>
        )}
      </div>

      {/* Export Success Banner */}
      {exportSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 rounded-2xl shadow-sm flex items-start gap-2.5 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold text-emerald-950">Ekspor Excel Berhasil!</p>
            <p className="mt-1 leading-normal">{exportSuccessMessage}</p>
          </div>
        </div>
      )}

      {/* Consolidated Financial Summary Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Money Stat */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Tabungan Uang</span>
            <span className="text-lg font-black text-gray-900 mt-1 block">{formatIDR(totalCashSavings)}</span>
            <span className="text-[9.5px] text-gray-400 block mt-1">Akumulasi bersih dari setoran-tarik tunai</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-primary flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Gold Stat */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Nilai Emas (IDR)</span>
            <span className="text-lg font-black text-amber-600 mt-1 block">{formatIDR(totalGoldValueIDR)}</span>
            <span className="text-[9.5px] text-gray-400 block mt-1">Konversi {totalGoldWeight.toFixed(4)} g emas aktif</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-gold-hover flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Loans Stat */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Outstanding Kredit</span>
            <span className="text-lg font-black text-gray-900 mt-1 block">{formatIDR(totalOutstandingLoan)}</span>
            <span className="text-[9.5px] text-gray-400 block mt-1">Kontrak pinjaman yang belum lunas</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Report Section Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        
        {/* Report Selector Header */}
        <div className="flex flex-wrap border-b border-gray-100 bg-gray-50/45 p-1">
          <button
            onClick={() => { setActiveReportTab('savings'); setExportSuccessMessage(''); }}
            className={`flex-1 min-w-[120px] py-3 text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-b-2 ${
              activeReportTab === 'savings' ? 'border-primary text-primary bg-white font-black' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Laporan Tabungan Uang
          </button>
          
          <button
            onClick={() => { setActiveReportTab('gold'); setExportSuccessMessage(''); }}
            className={`flex-1 min-w-[120px] py-3 text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-b-2 ${
              activeReportTab === 'gold' ? 'border-primary text-primary bg-white font-black' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Coins className="w-4 h-4" />
            Laporan Tabungan Emas
          </button>

          <button
            onClick={() => { setActiveReportTab('loans'); setExportSuccessMessage(''); }}
            className={`flex-1 min-w-[120px] py-3 text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-b-2 ${
              activeReportTab === 'loans' ? 'border-primary text-primary bg-white font-black' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Percent className="w-4 h-4" />
            Laporan Pinjaman
          </button>

          <button
            onClick={() => { setActiveReportTab('transactions'); setExportSuccessMessage(''); }}
            className={`flex-1 min-w-[120px] py-3 text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-b-2 ${
              activeReportTab === 'transactions' ? 'border-primary text-primary bg-white font-black' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Jurnal Transaksi Harian
          </button>
        </div>

        {/* Report Content Body Sheet */}
        <div className="p-6">
          
          {/* 1. SAVINGS REPORT TAB */}
          {activeReportTab === 'savings' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-xs font-extrabold text-gray-800">Daftar Rekap Saldo Tunai Tabungan Anggota</span>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-bold font-mono">TIPE: AUDITED MONEY SAVINGS</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-extrabold uppercase">
                      <th className="p-3">No. Anggota</th>
                      <th className="p-3">Nama Lengkap</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Total Setoran Tunai</th>
                      <th className="p-3 text-right">Total Penarikan Tunai</th>
                      <th className="p-3 text-right">Saldo Bersih (IDR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {customers.map((c) => {
                      const balance = getCustomerMoneyBalance(c.id, moneyTransactions);
                      const myMoney = moneyTransactions.filter(tx => tx.customerId === c.id && !tx.isReversaled);
                      const deposits = myMoney.filter(tx => tx.type === 'DEPOSIT' || tx.type === 'GOLD_SALE_PROCEEDS').reduce((sum, tx) => sum + tx.amount, 0);
                      const withdrawals = myMoney.filter(tx => tx.type === 'WITHDRAWAL').reduce((sum, tx) => sum + tx.amount, 0);
                      
                      return (
                        <tr key={c.id} className="hover:bg-gray-50/40 transition-colors">
                          <td className="p-3 font-mono font-bold text-gray-500">{c.memberNumber}</td>
                          <td className="p-3 font-bold text-gray-900">{c.name}</td>
                          <td className="p-3">
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-3 text-right text-emerald-600 font-bold">{formatIDR(deposits)}</td>
                          <td className="p-3 text-right text-red-600 font-semibold">{formatIDR(withdrawals)}</td>
                          <td className={`p-3 text-right font-black ${balance < 0 ? 'text-red-700' : 'text-gray-900'}`}>
                            {formatIDR(balance)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-50/70 border-t border-gray-200 font-black">
                      <td colSpan={5} className="p-3 text-gray-800 text-right uppercase tracking-wider text-[10px]">Grand Total Kas Tabungan:</td>
                      <td className="p-3 text-right text-primary text-xs">{formatIDR(totalCashSavings)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. GOLD ASSETS REPORT TAB */}
          {activeReportTab === 'gold' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-xs font-extrabold text-gray-800">Daftar Rekap Simpanan Logam Mulia (Emas) Anggota</span>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold font-mono">KURS AKTIF: RP {currentGoldPrice.toLocaleString('id-ID')}/G</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-extrabold uppercase">
                      <th className="p-3">No. Anggota</th>
                      <th className="p-3">Nama Lengkap</th>
                      <th className="p-3 text-right">Total Setor Emas</th>
                      <th className="p-3 text-right">Total Tarik/Jual</th>
                      <th className="p-3 text-right">Berat Emas Bersih (gram)</th>
                      <th className="p-3 text-right">Konversi Nilai Rupiah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {customers.map((c) => {
                      const goldWeight = getCustomerGoldBalance(c.id, goldTransactions);
                      const myGold = goldTransactions.filter(tx => tx.customerId === c.id && !tx.isReversaled);
                      const totalIn = myGold.filter(tx => tx.type === 'GOLD_DEPOSIT').reduce((sum, tx) => sum + tx.weight, 0);
                      const totalOut = myGold.filter(tx => tx.type === 'GOLD_WITHDRAWAL' || tx.type === 'GOLD_SELL').reduce((sum, tx) => sum + tx.weight, 0);
                      
                      return (
                        <tr key={c.id} className="hover:bg-gray-50/40 transition-colors">
                          <td className="p-3 font-mono font-bold text-gray-500">{c.memberNumber}</td>
                          <td className="p-3 font-bold text-gray-900">{c.name}</td>
                          <td className="p-3 text-right text-emerald-600 font-medium">{totalIn.toFixed(4)} g</td>
                          <td className="p-3 text-right text-red-600 font-medium">{totalOut.toFixed(4)} g</td>
                          <td className="p-3 text-right text-amber-700 font-extrabold font-display">{goldWeight.toFixed(4)} g</td>
                          <td className="p-3 text-right font-black text-gray-900">
                            {formatIDR(goldWeight * currentGoldPrice)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-50/70 border-t border-gray-200 font-black">
                      <td colSpan={4} className="p-3 text-gray-800 text-right uppercase tracking-wider text-[10px]">Grand Total Berat & Rupiah:</td>
                      <td className="p-3 text-right text-amber-700 text-xs font-display">{totalGoldWeight.toFixed(4)} gram</td>
                      <td className="p-3 text-right text-primary text-xs">{formatIDR(totalGoldValueIDR)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. LOANS REPORT TAB */}
          {activeReportTab === 'loans' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-xs font-extrabold text-gray-800">Daftar Rekap Kontrak Pinjaman & Kolektibilitas Outstanding</span>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-bold font-mono">TIPE: CREDIT AUDITED CONTROLLER</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-extrabold uppercase">
                      <th className="p-3">No. Kontrak</th>
                      <th className="p-3">Nama Anggota</th>
                      <th className="p-3">Tgl Kontrak</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Nilai Kontrak Pinjaman</th>
                      <th className="p-3 text-right">Sisa Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loans.map((loan) => {
                      const member = customers.find(c => c.id === loan.customerId);
                      return (
                        <tr key={loan.id} className="hover:bg-gray-50/40 transition-colors">
                          <td className="p-3 font-mono font-bold text-gray-500">{loan.loanNumber}</td>
                          <td className="p-3 font-bold text-gray-900">{member?.name || 'Nasabah BKS'}</td>
                          <td className="p-3 font-mono">{new Date(loan.date).toLocaleDateString('id-ID')}</td>
                          <td className="p-3">
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              loan.status === 'ACTIVE' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {loan.status === 'ACTIVE' ? 'Aktif' : 'Lunas (PAID)'}
                            </span>
                          </td>
                          <td className="p-3 text-right font-semibold">{formatIDR(loan.amount)}</td>
                          <td className="p-3 text-right font-extrabold text-red-600">{formatIDR(loan.outstanding)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-50/70 border-t border-gray-200 font-black">
                      <td colSpan={5} className="p-3 text-gray-800 text-right uppercase tracking-wider text-[10px]">Grand Total Outstanding Kredit:</td>
                      <td className="p-3 text-right text-red-600 text-xs">{formatIDR(totalOutstandingLoan)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. DAILY GLOBAL LEDGER JOURNAL TAB */}
          {activeReportTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-xs font-extrabold text-gray-800">Jurnal Pengisian Mutasi Harian Kas & Jurnal Emas</span>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-bold font-mono">TIPE: HISTORIC GLOBAL LEDGER JOURNAL</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-extrabold uppercase">
                      <th className="p-3">Waktu Input</th>
                      <th className="p-3">No Transaksi</th>
                      <th className="p-3">Nasabah</th>
                      <th className="p-3">Jenis Jurnal</th>
                      <th className="p-3">Volume Finansial</th>
                      <th className="p-3 text-center">Petugas</th>
                      <th className="p-3">Keterangan / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {/* Interleave and sort money and gold transactions */}
                    {[
                      ...filteredMoneyTx.map(tx => ({ ...tx, genre: 'MONEY' as const })),
                      ...filteredGoldTx.map(tx => ({ ...tx, genre: 'GOLD' as const }))
                    ]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((tx) => {
                        const isMoney = tx.genre === 'MONEY';
                        const isIncoming = tx.type === 'DEPOSIT' || tx.type === 'GOLD_DEPOSIT' || tx.type === 'GOLD_SALE_PROCEEDS' || tx.type === 'LOAN_DISBURSEMENT';
                        const cust = customers.find(c => c.id === tx.customerId);
                        
                        return (
                          <tr key={tx.id} className="hover:bg-gray-50/40 transition-colors">
                            <td className="p-3 font-mono font-semibold whitespace-nowrap">
                              {new Date(tx.date).toLocaleDateString('id-ID')} {new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-3 font-mono font-bold text-gray-500">{tx.transactionNumber}</td>
                            <td className="p-3">
                              <span className="font-bold text-gray-900">{cust?.name || 'Nasabah BKS'}</span>
                              <span className="block text-[9px] text-gray-400 font-mono font-semibold">{cust?.memberNumber}</span>
                            </td>
                            <td className="p-3">
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded leading-none uppercase ${
                                isIncoming ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className={`p-3 font-extrabold ${isIncoming ? 'text-emerald-700' : 'text-red-700'}`}>
                              {isMoney ? formatIDR(tx.amount) : `${tx.weight.toFixed(4)} gram`}
                            </td>
                            <td className="p-3 text-center text-gray-500 font-semibold">{tx.createdBy}</td>
                            <td className="p-3 text-gray-500 max-w-xs truncate">{tx.note}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SIMULATED SPREADSHEETS PREVIEW DESIGN DETAIL (CRAFTSMANSHIP POINT) */}
          <div className="mt-8 pt-6 border-t border-gray-100 bg-gray-50/50 p-4 rounded-xl border border-gray-200/50 space-y-3">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Simulasi Spreadsheet Microsoft Excel Workbook Preview (.xlsx)
            </h4>
            
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden text-[10px] font-mono shadow-inner select-none">
              {/* Excel Sheets Tab bar */}
              <div className="bg-gray-100 border-b border-gray-200 px-3 py-1 flex items-center gap-1.5 text-gray-500 font-sans text-[9px] font-bold">
                <span className="text-gray-400 bg-white border-x border-t border-gray-200 px-2 py-0.5 rounded-t font-black text-emerald-800">Sheet1 - Rekap Jurnal BKS</span>
                <span className="opacity-55 hover:opacity-100 cursor-pointer">Sheet2 - Summary</span>
                <span className="opacity-55 hover:opacity-100 cursor-pointer">Sheet3 - Audit logs</span>
              </div>

              {/* Spreadsheets Column/Row Headers */}
              <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-center text-gray-400 font-bold border-r">
                <div className="border-r border-gray-200 py-0.5 bg-gray-100/50">Row</div>
                <div className="border-r border-gray-200 py-0.5 col-span-3">A [No. Anggota]</div>
                <div className="border-r border-gray-200 py-0.5 col-span-4">B [Nama Nasabah]</div>
                <div className="border-r border-gray-200 py-0.5 col-span-2">C [Saldo Tunai]</div>
                <div className="col-span-2">D [Saldo Emas]</div>
              </div>

              {/* Rows */}
              <div className="grid grid-cols-12 border-b border-gray-100 hover:bg-gray-50/40">
                <div className="text-center bg-gray-50 border-r border-gray-200 py-1 text-gray-400 font-bold">1</div>
                <div className="col-span-3 border-r border-gray-100 py-1 px-2 font-bold text-gray-600">BKS-2015-001</div>
                <div className="col-span-4 border-r border-gray-100 py-1 px-2 truncate">H. Ahmad Subarjo</div>
                <div className="col-span-2 border-r border-gray-100 py-1 px-2 text-right font-bold text-emerald-600">Rp 26.300.000</div>
                <div className="col-span-2 py-1 px-2 text-right font-bold text-amber-600">30.5000 g</div>
              </div>

              <div className="grid grid-cols-12 border-b border-gray-100 hover:bg-gray-50/40">
                <div className="text-center bg-gray-50 border-r border-gray-200 py-1 text-gray-400 font-bold">2</div>
                <div className="col-span-3 border-r border-gray-100 py-1 px-2 font-bold text-gray-600">BKS-2015-002</div>
                <div className="col-span-4 border-r border-gray-100 py-1 px-2 truncate">Ibu Aminah</div>
                <div className="col-span-2 border-r border-gray-100 py-1 px-2 text-right font-bold text-red-600">-Rp 2.000.000</div>
                <div className="col-span-2 py-1 px-2 text-right font-bold text-amber-600">0.0000 g</div>
              </div>

              <div className="grid grid-cols-12 hover:bg-gray-50/40">
                <div className="text-center bg-gray-50 border-r border-gray-200 py-1 text-gray-400 font-bold">3</div>
                <div className="col-span-3 border-r border-gray-100 py-1 px-2 font-bold text-gray-600">BKS-2018-089</div>
                <div className="col-span-4 border-r border-gray-100 py-1 px-2 truncate">Sri Wahyuni</div>
                <div className="col-span-2 border-r border-gray-100 py-1 px-2 text-right font-bold">Rp 0</div>
                <div className="col-span-2 py-1 px-2 text-right font-bold text-amber-600">4.0000 g</div>
              </div>
            </div>

            <p className="text-[9.5px] text-gray-400 text-center leading-normal">
              Workbook Excel BKS 2015 mencakup layout audit formula matematika dinamis sehingga mempermudah pembukuan saat diimpor kembali.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
