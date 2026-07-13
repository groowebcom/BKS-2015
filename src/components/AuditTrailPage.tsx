/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ClipboardList, ShieldAlert, Search, Calendar, User, Eye, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditTrailPageProps {
  auditLogs: AuditLog[];
}

export default function AuditTrailPage({ auditLogs }: AuditTrailPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'TRANSACTION' | 'REVERSAL' | 'PRICE_UPDATE' | 'EXPORT' | 'IMPORT'>('ALL');

  // Filter logs
  const filteredLogs = auditLogs
    .filter(log => {
      // Search matches user or object
      const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            log.object.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            log.activity.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category matches
      if (activeCategory === 'ALL') return matchesSearch;
      if (activeCategory === 'TRANSACTION') return matchesSearch && log.activity.includes('TRANSACTION');
      if (activeCategory === 'REVERSAL') return matchesSearch && log.activity.includes('REVERSAL');
      if (activeCategory === 'PRICE_UPDATE') return matchesSearch && log.activity.includes('PRICE_UPDATE') || log.activity.includes('GOLD_PRICE');
      if (activeCategory === 'EXPORT') return matchesSearch && log.activity.includes('EXPORT');
      if (activeCategory === 'IMPORT') return matchesSearch && log.activity.includes('IMPORT');

      return matchesSearch;
    })
    // Sort descending (latest logs first)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold font-display text-gray-900">
          Audit Trail Log Aktivitas Keamanan
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Log pencatatan aktivitas operasional harian staff Teller, Admin, dan Owner. Arsip dijamin bersifat immutable / hanya-baca (BR-603).
        </p>
      </div>

      {/* Cybersecurity Notice Warning Banner */}
      <div className="p-4 bg-gray-900 border border-gray-800 text-xs text-gray-400 rounded-2xl shadow-md flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold text-white uppercase tracking-wider text-[10px]">Pemberitahuan Enkripsi Immutable Ledger</p>
          <p className="leading-relaxed">
            Sesuai protokol audit perbankan syariah mikro <b>BR-603</b>, seluruh baris riwayat di bawah telah dikunci secara kriptografis lokal. Petugas ataupun developer **TIDAK MEMILIKI** tombol edit atau hapus pada database Audit Log ini untuk menjamin orisinalitas kepatuhan OJK.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs flex flex-col md:flex-row gap-3 justify-between items-center text-xs">
        
        {/* Search input */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama petugas, nomor anggota, dsb..."
            className="w-full pl-9.5 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Categories Tab Pill */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeCategory === 'ALL' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-500 hover:text-gray-900'
            }`}
          >
            Semua Log
          </button>
          
          <button
            onClick={() => setActiveCategory('TRANSACTION')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeCategory === 'TRANSACTION' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-500 hover:text-gray-900'
            }`}
          >
            Transaksi
          </button>

          <button
            onClick={() => setActiveCategory('REVERSAL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeCategory === 'REVERSAL' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-500 hover:text-gray-900'
            }`}
          >
            Reversal (Koreksi)
          </button>

          <button
            onClick={() => setActiveCategory('PRICE_UPDATE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeCategory === 'PRICE_UPDATE' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-500 hover:text-gray-900'
            }`}
          >
            Kurs Emas
          </button>

          <button
            onClick={() => setActiveCategory('EXPORT')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeCategory === 'EXPORT' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-500 hover:text-gray-900'
            }`}
          >
            Ekspor Excel
          </button>
        </div>

      </div>

      {/* Logs Timelines List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-extrabold uppercase">
                <th className="p-3.5 pl-6">Waktu Kejadian (WIB)</th>
                <th className="p-3.5">Nama Petugas</th>
                <th className="p-3.5">Kategori Aktivitas</th>
                <th className="p-3.5">Deskripsi Audit Trail</th>
                <th className="p-3.5 text-center">Status Enkripsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400 font-semibold">
                    Tidak ditemukan catatan audit log yang cocok dengan kriteria filter Anda.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isReversal = log.activity.includes('REVERSAL');
                  const isImport = log.activity.includes('IMPORT');
                  const isPrice = log.activity.includes('PRICE') || log.activity.includes('GOLD');
                  const isExport = log.activity.includes('EXPORT');

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Date */}
                      <td className="p-3.5 pl-6 font-semibold font-mono whitespace-nowrap text-gray-600">
                        {new Date(log.date).toLocaleDateString('id-ID')} {new Date(log.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      
                      {/* Actor */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <User className="w-3 h-3 text-gray-500" />
                          </div>
                          <span className="font-bold text-gray-900">{log.user}</span>
                        </div>
                      </td>

                      {/* Action category */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded leading-none uppercase ${
                          isReversal 
                            ? 'bg-red-50 text-red-700 border border-red-100/60' 
                            : isPrice 
                            ? 'bg-amber-50 text-amber-700 border border-amber-100/60'
                            : isExport 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/60'
                            : isImport 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100/60'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {log.activity}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="p-3.5 text-gray-700 font-medium">
                        {log.object}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-[9.5px] text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Immutable Log
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
