/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Upload, FileSpreadsheet, AlertCircle, CheckCircle, SlidersHorizontal, ArrowRight,
  Database, RefreshCcw, HelpCircle, FileCheck, FileX, Info, Landmark
} from 'lucide-react';
import { UserRole } from '../types';

interface ImportPageProps {
  userRole: UserRole;
  currentGoldPrice: number;
  onImportCustomers: (newCustomers: any[]) => void;
  onImportMoneyTx: (newMoneyTx: any[]) => void;
  onImportGoldTx: (newGoldTx: any[]) => void;
}

export default function ImportPage({
  userRole,
  currentGoldPrice,
  onImportCustomers,
  onImportMoneyTx,
  onImportGoldTx,
}: ImportPageProps) {
  const isOwner = userRole === UserRole.OWNER;
  
  // Selection
  const [importType, setImportType] = useState<'CUSTOMERS' | 'MONEY_TX' | 'GOLD_TX'>('CUSTOMERS');
  const [fileUploaded, setFileUploaded] = useState<string | null>(null);
  const [previewActive, setPreviewActive] = useState(false);
  const [importReport, setImportReport] = useState<{
    total: number;
    success: number;
    failed: number;
    errors: { row: number; field: string; reason: string }[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Mock excel data rows to preview for validation
  const mockCustomerRows = [
    { row: 2, num: 'BKS-2026-045', name: 'Zulkifli Lubis', nik: '3201234567890010', phone: '081234560010', birthDate: '05-05-1988', status: 'VALID' },
    { row: 3, num: 'BKS-2026-046', name: 'Dewi Lestari', nik: '3201234567890011', phone: '081234560011', birthDate: '10-12-1994', status: 'VALID' },
    { row: 4, num: 'BKS-2026-047', name: 'Agus Salim', nik: '32012345', phone: '081234560012', birthDate: '15-02-1970', status: 'INVALID', reason: 'NIK harus terdiri dari 16 digit (BR-103)' },
    { row: 5, num: 'BKS-2015-001', name: 'Rahmat Kartolo', nik: '3201234567890001', phone: '081234560013', birthDate: '01-01-1980', status: 'INVALID', reason: 'Nomor Anggota atau NIK ganda terdeteksi (BR-102 / BR-103)' },
  ];

  const mockMoneyRows = [
    { row: 2, num: 'TXM-2026-050', name: 'H. Ahmad Subarjo', type: 'DEPOSIT', amount: 5000000, note: 'Setoran hasil sewa ruko', status: 'VALID' },
    { row: 3, num: 'TXM-2026-051', name: 'Ibu Aminah', type: 'WITHDRAWAL', amount: 1000000, note: 'Penarikan belanja harian', status: 'VALID' },
    { row: 4, num: 'TXM-2026-052', name: 'Sri Wahyuni', type: 'WITHDRAWAL', amount: -250000, note: 'Penarikan minus', status: 'INVALID', reason: 'Nominal transaksi harus lebih besar dari nol (BR-303)' },
  ];

  const mockGoldRows = [
    { row: 2, num: 'TXG-2026-015', name: 'Sri Wahyuni', type: 'GOLD_DEPOSIT', weight: 2.5000, note: 'Setor fisik MiniGold', status: 'VALID' },
    { row: 3, num: 'TXG-2026-016', name: 'H. Ahmad Subarjo', type: 'GOLD_SELL', weight: 50.0000, note: 'Jual emas seberat 50g', status: 'INVALID', reason: 'Penjualan emas melebihi saldo aktif nasabah (BR-406)' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileUploaded(e.target.files[0].name);
      setPreviewActive(true);
      setImportReport(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFileUploaded(e.dataTransfer.files[0].name);
      setPreviewActive(true);
      setImportReport(null);
    }
  };

  const handleProcessImport = () => {
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setPreviewActive(false);

      if (importType === 'CUSTOMERS') {
        // Execute import of valid records
        onImportCustomers([
          {
            id: 'CUST-MIG-1',
            memberNumber: 'BKS-2026-045',
            name: 'Zulkifli Lubis',
            nik: '3201234567890010',
            birthDate: '05-05-1988',
            phone: '081234560010',
            address: 'Dusun Sukajadi No. 9, BKS',
            status: 'ACTIVE',
            passwordHash: '05051988',
            isFirstLogin: true,
          },
          {
            id: 'CUST-MIG-2',
            memberNumber: 'BKS-2026-046',
            name: 'Dewi Lestari',
            nik: '3201234567890011',
            birthDate: '10-12-1994',
            phone: '081234560011',
            address: 'Kp. Sindang RT 02/RW 03, BKS',
            status: 'ACTIVE',
            passwordHash: '10121994',
            isFirstLogin: true,
          }
        ]);

        setImportReport({
          total: 4,
          success: 2,
          failed: 2,
          errors: [
            { row: 4, field: 'nik', reason: 'NIK harus terdiri dari 16 digit (BR-103)' },
            { row: 5, field: 'memberNumber', reason: 'Nomor Anggota atau NIK ganda terdeteksi (BR-102 / BR-103)' }
          ]
        });
      } else if (importType === 'MONEY_TX') {
        onImportMoneyTx([
          {
            id: 'MT-MIG-1',
            transactionNumber: 'TXM-2026-050',
            customerId: 'CUST-001', // Ahmad subarjo
            type: 'DEPOSIT',
            amount: 5000000,
            date: '2026-07-12T10:10:00+07:00',
            note: 'MIGRASI: Setoran hasil sewa ruko',
            createdBy: 'Pak Dedek',
          },
          {
            id: 'MT-MIG-2',
            transactionNumber: 'TXM-2026-051',
            customerId: 'CUST-002', // Ibu aminah
            type: 'WITHDRAWAL',
            amount: 1000000,
            date: '2026-07-12T10:11:00+07:00',
            note: 'MIGRASI: Penarikan belanja harian',
            createdBy: 'Pak Dedek',
          }
        ]);

        setImportReport({
          total: 3,
          success: 2,
          failed: 1,
          errors: [
            { row: 4, field: 'amount', reason: 'Nominal transaksi penarikan harus lebih besar dari nol (BR-303)' }
          ]
        });
      } else {
        onImportGoldTx([
          {
            id: 'GT-MIG-1',
            transactionNumber: 'TXG-2026-015',
            customerId: 'CUST-004', // Sri wahyuni
            type: 'GOLD_DEPOSIT',
            weight: 2.5000,
            goldPriceSnapshot: currentGoldPrice,
            amountRupiah: 2.5 * currentGoldPrice,
            date: '2026-07-12T10:12:00+07:00',
            note: 'MIGRASI: Setor fisik MiniGold',
            createdBy: 'Pak Dedek',
          }
        ]);

        setImportReport({
          total: 2,
          success: 1,
          failed: 1,
          errors: [
            { row: 3, field: 'weight', reason: 'Penjualan emas seberat 50g melebihi saldo aktif nasabah (BR-406)' }
          ]
        });
      }
    }, 2000);
  };

  const handleResetImport = () => {
    setFileUploaded(null);
    setPreviewActive(false);
    setImportReport(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold font-display text-gray-900">
          Migrasi Data & Impor excel Master Jurnal
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Migrasikan pembukuan lama tahun 2015-2026 dari Excel langsung ke database sistem digital. Didukung penyaringan baris error otomatis (BR-803).
        </p>
      </div>

      {/* Rules Notice */}
      <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 shadow-xs text-xs text-amber-800 space-y-1">
        <h4 className="font-extrabold text-amber-950 flex items-center gap-1.5 leading-none">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          Protokol Keamanan Migrasi Data (Bab 13)
        </h4>
        <p>• <b>BR-801:</b> Hanya Owner yang berhak melakukan pemicuan migrasi data massal ke dalam database sistem.</p>
        <p>• <b>BR-803:</b> Baris data yang gagal divalidasi tidak akan membatalkan seluruh proses impor baris data yang valid.</p>
        <p>• Seluruh kegagalan validasi baris akan diisolasi dan dirangkum ke dalam rekapitulasi laporan detail di bawah.</p>
      </div>

      {/* Importer Core Panels */}
      {isOwner ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* File Drag and Drop Uploader Column */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4 h-max">
            <div>
              <h3 className="text-xs font-black text-gray-900 uppercase">1. Pengaturan File Migrasi</h3>
              <p className="text-[10px] text-gray-400">Pilih jenis data yang akan dimasukkan ke tabel master</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Jenis Data Impor</label>
              <select
                value={importType}
                onChange={(e) => { setImportType(e.target.value as any); handleResetImport(); }}
                disabled={previewActive || isLoading}
                className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900"
              >
                <option value="CUSTOMERS">Data Profil Master Nasabah (.xlsx)</option>
                <option value="MONEY_TX">Histori Mutasi Tabungan Uang (.xlsx)</option>
                <option value="GOLD_TX">Histori Mutasi Tabungan Emas (.xlsx)</option>
              </select>
            </div>

            {/* Drag & Drop uploader frame */}
            {!fileUploaded ? (
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-200 hover:border-primary rounded-2xl p-6 text-center bg-gray-50/40 hover:bg-red-50/10 cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
              >
                <input 
                  type="file" 
                  id="excel-uploader" 
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <label htmlFor="excel-uploader" className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-10 h-10 text-gray-400 group-hover:text-primary group-hover:scale-105 transition-all mb-2" />
                  <span className="text-xs font-bold text-gray-700 block">Tarik & Letakkan File Excel</span>
                  <span className="text-[10px] text-gray-400 font-medium block mt-1">atau klik untuk telusuri folder</span>
                </label>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-2 relative overflow-hidden shadow-xs">
                <FileCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                <div>
                  <span className="text-xs font-black text-gray-900 block truncate">{fileUploaded}</span>
                  <span className="text-[9.5px] text-gray-400 font-semibold uppercase font-mono block mt-0.5">TERBACA VALID (.XLSX)</span>
                </div>
                {!previewActive && !importReport && (
                  <button
                    onClick={handleResetImport}
                    className="text-[10px] font-bold text-red-600 hover:underline block mx-auto pt-1"
                  >
                    Batal & Reset File
                  </button>
                )}
              </div>
            )}
            
            {/* Template Downloader Help */}
            <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-xl flex items-start gap-2 text-[10.5px] text-gray-500">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-800 block">Butuh Template Excel?</span>
                <span className="leading-normal mt-0.5 block">Sistem mengharuskan format header kolom Excel yang baku agar database dapat menerjemahkan kolom dengan aman.</span>
                <a href="#download" onClick={(e) => { e.preventDefault(); alert('Template Excel berhasil diunduh ke folder Downloads Anda.'); }} className="text-primary hover:underline font-bold block mt-1.5">
                  Unduh File Contoh Template (.xlsx)
                </a>
              </div>
            </div>

          </div>

          {/* Validation Table Preview & Results Log Column */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 overflow-hidden flex flex-col justify-between">
            
            {/* Sheet Title */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/20">
              <div>
                <h3 className="text-xs font-black text-gray-900 uppercase">2. Panel Evaluasi Validasi Jurnal</h3>
                <p className="text-[10.5px] text-gray-400">Pemeriksaan integritas referensial dan duplikasi sebelum disimpan harian</p>
              </div>
              {previewActive && (
                <button
                  onClick={handleResetImport}
                  className="px-2.5 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 border border-red-100 rounded-lg transition-all"
                >
                  Reset
                </button>
              )}
            </div>

            {/* PREVIEW STAGE (Active when file uploaded but not committed) */}
            {previewActive && (
              <div className="p-5 flex-1 space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-800 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-blue-900 block">Pemeriksaan Baris Jurnal Spreadsheet Aktif</span>
                    <span className="leading-normal mt-0.5 block">Harap tinjau status validasi baris di bawah. Klik tombol "Proses Komit" di bagian bawah untuk menyimpan seluruh baris yang berstatus <b>VALID</b> ke database.</span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  {importType === 'CUSTOMERS' && (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-extrabold uppercase">
                          <th className="p-2.5 text-center">Row</th>
                          <th className="p-2.5">No Anggota</th>
                          <th className="p-2.5">Nama</th>
                          <th className="p-2.5">NIK (KTP)</th>
                          <th className="p-2.5">Tgl Lahir</th>
                          <th className="p-2.5">Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {mockCustomerRows.map(row => (
                          <tr key={row.row} className={row.status === 'INVALID' ? 'bg-red-50/20' : 'bg-emerald-50/10'}>
                            <td className="p-2.5 text-center font-mono font-bold text-gray-400">{row.row}</td>
                            <td className="p-2.5 font-mono font-semibold">{row.num}</td>
                            <td className="p-2.5 font-bold text-gray-900">{row.name}</td>
                            <td className="p-2.5 font-mono">{row.nik}</td>
                            <td className="p-2.5">{row.birthDate}</td>
                            <td className="p-2.5">
                              {row.status === 'VALID' ? (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 uppercase">Valid</span>
                              ) : (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-50 text-red-600 uppercase block max-w-[150px] truncate" title={row.reason}>
                                  Err: {row.reason}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {importType === 'MONEY_TX' && (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-extrabold uppercase">
                          <th className="p-2.5 text-center">Row</th>
                          <th className="p-2.5">No Transaksi</th>
                          <th className="p-2.5">Nasabah</th>
                          <th className="p-2.5">Tipe</th>
                          <th className="p-2.5">Nominal</th>
                          <th className="p-2.5">Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {mockMoneyRows.map(row => (
                          <tr key={row.row} className={row.status === 'INVALID' ? 'bg-red-50/20' : 'bg-emerald-50/10'}>
                            <td className="p-2.5 text-center font-mono font-bold text-gray-400">{row.row}</td>
                            <td className="p-2.5 font-mono font-semibold">{row.num}</td>
                            <td className="p-2.5 font-bold text-gray-900">{row.name}</td>
                            <td className="p-2.5">{row.type}</td>
                            <td className="p-2.5 font-extrabold">{row.amount.toLocaleString('id-ID')}</td>
                            <td className="p-2.5">
                              {row.status === 'VALID' ? (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 uppercase">Valid</span>
                              ) : (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-50 text-red-600 uppercase block max-w-[150px] truncate" title={row.reason}>
                                  Err: {row.reason}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {importType === 'GOLD_TX' && (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-extrabold uppercase">
                          <th className="p-2.5 text-center">Row</th>
                          <th className="p-2.5">No Transaksi</th>
                          <th className="p-2.5">Nasabah</th>
                          <th className="p-2.5">Tipe</th>
                          <th className="p-2.5">Berat Emas</th>
                          <th className="p-2.5">Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {mockGoldRows.map(row => (
                          <tr key={row.row} className={row.status === 'INVALID' ? 'bg-red-50/20' : 'bg-emerald-50/10'}>
                            <td className="p-2.5 text-center font-mono font-bold text-gray-400">{row.row}</td>
                            <td className="p-2.5 font-mono font-semibold">{row.num}</td>
                            <td className="p-2.5 font-bold text-gray-900">{row.name}</td>
                            <td className="p-2.5">{row.type}</td>
                            <td className="p-2.5 font-extrabold">{row.weight.toFixed(4)} g</td>
                            <td className="p-2.5">
                              {row.status === 'VALID' ? (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 uppercase">Valid</span>
                              ) : (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-50 text-red-600 uppercase block max-w-[150px] truncate" title={row.reason}>
                                  Err: {row.reason}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleProcessImport}
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Database className="w-4 h-4" />
                  )}
                  {isLoading ? 'Menganalisis Kolom & Mengimpor...' : 'PROSES KOMIT MIGRASI BARIS VALID'}
                </button>
              </div>
            )}

            {/* REPORT SUMMARY STAGE (Active after import committed) */}
            {importReport && (
              <div className="p-5 flex-1 space-y-5 animate-scaleIn">
                
                {/* Stats row overview */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block leading-none">Total Baris</span>
                    <span className="text-xl font-black text-gray-900 mt-1 block">{importReport.total}</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-emerald-800">
                    <span className="text-[10px] text-emerald-600/70 font-bold uppercase block leading-none">Berhasil Komit</span>
                    <span className="text-xl font-black mt-1 block">{importReport.success}</span>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-800">
                    <span className="text-[10px] text-red-600/70 font-bold uppercase block leading-none">Gagal Dibuang</span>
                    <span className="text-xl font-black mt-1 block">{importReport.failed}</span>
                  </div>
                </div>

                {/* Validation errors lists (BR-804) */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Laporan Detail Row Gagal (BR-804)</h4>
                  <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50 shadow-2xs">
                    {importReport.errors.map((err, index) => (
                      <div key={index} className="p-3 flex items-start gap-2.5 text-xs">
                        <FileX className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-red-700">Baris Excel {err.row}:</span> <span className="font-semibold text-gray-500">Kolom [{err.field}]</span>
                          <p className="text-[10.5px] text-gray-400 mt-0.5 leading-normal italic font-medium">Keterangan: {err.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-[11px] text-emerald-800 flex items-start gap-2 leading-relaxed">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-emerald-950 block">Migrasi Batch Jurnal Selesai!</span>
                    <span>Database berhasil menyerap {importReport.success} baris data ke dalam log ledger utama. Catatan audit migrasi massal diarsipkan pada Audit Trail sistem.</span>
                  </div>
                </div>

                <button
                  onClick={handleResetImport}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
                >
                  Impor File Lainnya
                </button>

              </div>
            )}

            {/* EMPTY STATE (Default) */}
            {!previewActive && !importReport && (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center flex-1 h-full min-h-[300px]">
                <FileSpreadsheet className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm font-bold text-gray-800">Menunggu File Diupload</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">Tarik dan letakkan file Excel format template Anda ke panel kiri untuk memulai proses analisis validitas kolom.</p>
              </div>
            )}

          </div>

        </div>
      ) : (
        <div className="p-10 bg-white rounded-2xl border border-gray-100 shadow-sm text-center text-gray-400">
          <SlidersHorizontal className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-800">Akses Terbatas</p>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            Halaman migrasi pembukuan Excel adalah area sensitif level tinggi. Hanya akun dengan hak akses **OWNER** yang diizinkan mengimpor data (BR-810).
          </p>
        </div>
      )}

    </div>
  );
}
