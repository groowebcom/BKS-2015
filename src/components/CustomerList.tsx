/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, UserPlus, SlidersHorizontal, ChevronLeft, ChevronRight, Eye, Edit, UserX, UserCheck, 
  X, HelpCircle, Landmark, Check, AlertCircle, Phone, MapPin, Calendar, CreditCard
} from 'lucide-react';
import { Customer, MoneyTransaction, GoldTransaction, UserRole } from '../types';
import { getCustomerMoneyBalance, getCustomerGoldBalance } from '../data';

interface CustomerListProps {
  customers: Customer[];
  moneyTransactions: MoneyTransaction[];
  goldTransactions: GoldTransaction[];
  userRole: UserRole;
  onSelectCustomer: (id: string) => void;
  onAddCustomer: (customerData: Omit<Customer, 'id' | 'passwordHash' | 'isFirstLogin' | 'memberNumber'>) => void;
  onToggleCustomerStatus: (id: string) => void;
  onEditCustomer: (id: string, updatedData: Partial<Customer>) => void;
  forcedActionLabel?: string;
}

export default function CustomerList({
  customers,
  moneyTransactions,
  goldTransactions,
  userRole,
  onSelectCustomer,
  onAddCustomer,
  onToggleCustomerStatus,
  onEditCustomer,
  forcedActionLabel,
}: CustomerListProps) {
  const isOwner = userRole === UserRole.OWNER;

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'memberNumber'>('name');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustId, setEditingCustId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [nik, setNik] = useState('');
  const [birthDate, setBirthDate] = useState(''); // DD-MM-YYYY
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Edit states
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Search, Filter & Sort Customers
  const filteredCustomers = customers
    .filter(c => {
      const matchesSearch = 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.memberNumber.toLowerCase().includes(search.toLowerCase()) ||
        c.nik.includes(search);
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return a.memberNumber.localeCompare(b.memberNumber);
    });

  // Paginated chunk
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustId(cust.id);
    setEditName(cust.name);
    setEditPhone(cust.phone);
    setEditAddress(cust.address);
    setEditNotes(cust.notes || '');
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validations (e.g., BR-103 NIK must be 16 digits)
    if (!name.trim() || !nik.trim() || !birthDate.trim()) {
      setFormError('Nama Lengkap, NIK, dan Tanggal Lahir wajib diisi.');
      return;
    }
    if (nik.trim().length !== 16 || isNaN(Number(nik.trim()))) {
      setFormError('NIK harus berupa angka 16 digit sesuai aturan KTP.');
      return;
    }

    // Check duplicate NIK (BR-103)
    const duplicateNik = customers.find(c => c.nik === nik.trim());
    if (duplicateNik) {
      setFormError('NIK sudah terdaftar oleh nasabah lain.');
      return;
    }

    // Check custom date format DD-MM-YYYY
    const datePattern = /^\d{2}-\d{2}-\d{4}$/;
    if (!datePattern.test(birthDate.trim())) {
      setFormError('Format tanggal lahir salah. Gunakan DD-MM-YYYY (Contoh: 15-08-1992).');
      return;
    }

    onAddCustomer({
      name: name.trim(),
      nik: nik.trim(),
      birthDate: birthDate.trim(),
      phone: phone.trim() || '-',
      address: address.trim() || 'Desa BKS',
      status: 'ACTIVE',
      notes: notes.trim() || undefined
    });

    // Reset Form
    setName('');
    setNik('');
    setBirthDate('');
    setPhone('');
    setAddress('');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustId) return;

    onEditCustomer(editingCustId, {
      name: editName.trim(),
      phone: editPhone.trim(),
      address: editAddress.trim(),
      notes: editNotes.trim() || undefined
    });

    setIsEditModalOpen(false);
    setEditingCustId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-display text-gray-900">
            Pusat Data Nasabah BKS
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Kelola data pribadi, status keanggotaan aktif, dan buka rincian mutasi tabungan kas serta emas.
          </p>
        </div>

        {/* Add Customer Button (Only for Owner) */}
        {isOwner && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-[#8A151C] text-white text-xs font-bold rounded-xl shadow-md shadow-primary/10 transition-all active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            Pendaftaran Nasabah Baru
          </button>
        )}
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Ketik Nama, No. Anggota, atau NIK Nasabah..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900"
          />
        </div>

        {/* Sorting and Filters Group */}
        <div className="flex flex-wrap gap-2 items-center">
          
          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                statusFilter === 'ALL' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Semua ({customers.length})
            </button>
            <button
              onClick={() => { setStatusFilter('ACTIVE'); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                statusFilter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => { setStatusFilter('INACTIVE'); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                statusFilter === 'INACTIVE' ? 'bg-white text-red-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Nonaktif
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 text-[10px] font-bold bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none"
          >
            <option value="name">Urut: Nama</option>
            <option value="memberNumber">Urut: No Anggota</option>
          </select>
        </div>
      </div>

      {/* Grid of Customer Cards for Desktop/Mobile responsive layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedCustomers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 col-span-full">
            <UserX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-800">Tidak ada nasabah yang cocok</p>
            <p className="text-xs text-gray-500 mt-1">Sesuaikan query pencarian atau status filter Anda.</p>
          </div>
        ) : (
          paginatedCustomers.map((cust) => {
            const moneyBalance = getCustomerMoneyBalance(cust.id, moneyTransactions);
            const goldBalance = getCustomerGoldBalance(cust.id, goldTransactions);
            const isSuspended = cust.status === 'INACTIVE';
            
            return (
              <div 
                key={cust.id} 
                className={`bg-white rounded-2xl border transition-all duration-200 p-5 shadow-xs flex flex-col justify-between h-[215px] hover:shadow-md relative overflow-hidden ${
                  isSuspended ? 'border-red-100 bg-red-50/5' : 'border-gray-200/60 hover:border-primary-light'
                }`}
              >
                {/* Suspended Red Watermark */}
                {isSuspended && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 uppercase tracking-wider">
                    Suspended
                  </div>
                )}
                
                {/* Customer Card Header */}
                <div className="flex gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm uppercase shrink-0 select-none ${
                    isSuspended ? 'bg-red-100 text-red-700' : 'bg-primary-light text-primary'
                  }`}>
                    {cust.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <h3 className="text-xs font-black text-gray-900 truncate leading-none mb-1.5">{cust.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-bold font-mono bg-gray-50 border border-gray-100 px-1 rounded">
                        {cust.memberNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Balances Grid */}
                <div className="grid grid-cols-2 gap-2 border-y border-gray-50 py-3 text-xs">
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase block leading-none mb-1">Saldo Tunai</span>
                    <span className={`font-extrabold ${moneyBalance < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                      Rp {moneyBalance.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-gray-400 font-bold uppercase block leading-none mb-1">Saldo Emas</span>
                    <span className="font-extrabold text-amber-600 font-display">
                      {goldBalance.toFixed(4)} <span className="text-[10px] font-medium text-gray-400">g</span>
                    </span>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="flex items-center justify-between gap-1.5 pt-1.5">
                  <button
                    onClick={() => onSelectCustomer(cust.id)}
                    className="flex-1 py-2 bg-gradient-to-r from-[#7a1223] to-[#540813] hover:from-[#540813] hover:to-[#7a1223] text-white text-[10px] font-bold rounded-xl transition-all shadow-sm shadow-primary/5 flex items-center justify-center gap-1 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {forcedActionLabel || 'Buka Detail Mutasi'}
                  </button>

                  {/* Owner Controls */}
                  {isOwner && (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(cust)}
                        className="p-2 border border-gray-200 hover:border-primary-light text-gray-500 hover:text-primary rounded-xl hover:bg-gray-50 transition-all"
                        title="Edit Profil"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => {
                          if(confirm(`Apakah Anda yakin ingin mengubah status keaktifan nasabah ${cust.name}?`)) {
                            onToggleCustomerStatus(cust.id);
                          }
                        }}
                        className={`p-2 border rounded-xl transition-all ${
                          isSuspended 
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                            : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                        title={isSuspended ? 'Aktifkan Kembali' : 'Nonaktifkan Nasabah (Soft Delete)'}
                      >
                        {isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs font-bold text-gray-500">
          <span>
            Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} dari {filteredCustomers.length} Nasabah
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-gray-100 rounded-lg text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW CUSTOMER MODAL (OWNER ONLY) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-100 animate-scaleIn">
            <div className="bg-gradient-to-r from-[#7a1223] to-[#540813] text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-bold font-display uppercase tracking-wide">Pendaftaran Nasabah BKS Baru</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
              
              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Nama Lengkap (Sesuai KTP)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900"
                  />
                </div>

                {/* NIK */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">No. Induk Kependudukan (NIK)</label>
                  <input
                    type="text"
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    maxLength={16}
                    placeholder="16 Digit Angka"
                    className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900"
                  />
                </div>

                {/* Birthdate (DD-MM-YYYY) */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Tanggal Lahir</label>
                    <span className="text-[8.5px] text-gray-400">format: DD-MM-YYYY</span>
                  </div>
                  <input
                    type="text"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    placeholder="Contoh: 15-08-1992"
                    className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Nomor HP Aktif</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900"
                  />
                </div>

              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Alamat Rumah Lengkap</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder="Isi RT/RW, Dusun, Desa, Kecamatan..."
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900 resize-none"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Catatan Internal Petugas (Opsional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Pemilik toko, petani padi, dsb."
                  className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-800 space-y-1 leading-normal">
                <p className="font-bold flex items-center gap-1 text-amber-900">
                  <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                  PROSES GENERATOR KREDENSIAL OTOMATIS:
                </p>
                <p>1. Nomor Anggota baru akan dibuat secara otomatis dengan format: <b>BKS-2026-XXX</b>.</p>
                <p>2. Password login default nasabah diatur ke Tanggal Lahir tanpa tanda strip (format: <b>DDMMYYYY</b>) sesuai BR-203.</p>
              </div>

              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-600 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-[#8A151C] text-white text-xs font-bold rounded-xl shadow-md shadow-primary/10 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Daftarkan Nasabah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT CUSTOMER MODAL (OWNER ONLY) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 animate-scaleIn">
            <div className="bg-gray-900 text-white p-5 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider">Perbarui Informasi Nasabah</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Nama Lengkap</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">No. Telepon HP</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Alamat Rumah Lengkap</label>
                <textarea
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Catatan Internal Petugas</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-2 border border-gray-200 text-xs font-bold text-gray-500 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
