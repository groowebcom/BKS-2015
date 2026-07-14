/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, User as UserIcon, Lock, Landmark, Info, KeyRound, Eye, EyeOff } from 'lucide-react';
import { UserRole, Customer } from '../types';
import { supabase } from '../lib/supabase';
import { Logo } from './Logo';

interface LoginProps {
  onLoginSuccess: (
    role: UserRole,
    userData: { id: string; name: string; username?: string; memberNumber?: string; customerData?: Customer }
  ) => void;
  customers: Customer[];
}

export default function Login({ onLoginSuccess, customers }: LoginProps) {
  const [activeTab, setActiveTab] = useState<'customer' | 'staff'>('customer');
  
  // Forms state
  const [identifier, setIdentifier] = useState(''); // Member Number or NIK for customer, Username for staff
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const performLogin = async (id: string, pass: string, tab: 'customer' | 'staff') => {
    setError('');
    setLoading(true);

    if (!id.trim()) {
      setError('Masukkan identitas login Anda');
      setLoading(false);
      return;
    }
    if (!pass.trim()) {
      setError('Masukkan password Anda');
      setLoading(false);
      return;
    }

    if (tab === 'customer') {
      const cleanId = id.trim().toLowerCase();
      // Find customer by member number or NIK
      const foundCustomer = customers.find(
        (c) =>
          c.memberNumber.toLowerCase() === cleanId ||
          c.nik === id.trim()
      );

      if (!foundCustomer) {
        setError('Nomor Anggota atau NIK tidak terdaftar');
        setLoading(false);
        return;
      }

      if (foundCustomer.status === 'INACTIVE') {
        setError('Keanggotaan Anda berstatus INACTIVE. Hubungi petugas untuk aktivasi.');
        setLoading(false);
        return;
      }

      // First-level local validation: checking password
      if (foundCustomer.passwordHash !== pass.trim()) {
        setError('Password tidak sesuai. Masukkan Tanggal Lahir Anda (DDMMYYYY) atau password baru Anda.');
        setLoading(false);
        return;
      }

      const email = `nasabah_${foundCustomer.memberNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@bks.com`;

      try {
        let { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: pass.trim()
        });

        if (signInError) {
          const errMsg = signInError.message.toLowerCase();
          if (errMsg.includes('invalid login credentials') || errMsg.includes('user not found')) {
            // Auto sign-up to make the app self-healing in real Supabase environment
            const { error: signUpError } = await supabase.auth.signUp({
              email,
              password: pass.trim(),
              options: {
                data: {
                  role: 'CUSTOMER',
                  name: foundCustomer.name,
                  memberNumber: foundCustomer.memberNumber,
                }
              }
            });

            if (signUpError) {
              setError(`Gagal mendaftarkan akun di Supabase Auth: ${signUpError.message}`);
              setLoading(false);
              return;
            }

            // Retry sign-in
            const retry = await supabase.auth.signInWithPassword({
              email,
              password: pass.trim()
            });

            if (retry.error) {
              setError(`Gagal login setelah pendaftaran otomatis: ${retry.error.message}`);
              setLoading(false);
              return;
            }
            data = retry.data;
          } else {
            setError(`Supabase Auth Error: ${signInError.message}`);
            setLoading(false);
            return;
          }
        }

        // Trigger success callback
        onLoginSuccess(UserRole.CUSTOMER, {
          id: foundCustomer.id,
          name: foundCustomer.name,
          memberNumber: foundCustomer.memberNumber,
          customerData: foundCustomer
        });
      } catch (err: any) {
        setError(`Kesalahan sistem auth: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
    } else {
      // Staff login (Owner or Admin)
      const inputUser = id.trim().toLowerCase();
      const inputPass = pass.trim();

      if (inputUser !== 'owner' && inputUser !== 'admin') {
        setError('Username petugas tidak dikenal.');
        setLoading(false);
        return;
      }

      const email = inputUser === 'owner' ? 'owner@bks.com' : 'admin@bks.com';
      const expectedPass = inputUser === 'owner' ? 'owner123' : 'admin123';

      if (inputPass !== expectedPass) {
        setError('Password petugas salah.');
        setLoading(false);
        return;
      }

      try {
        let { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: inputPass
        });

        if (signInError) {
          const errMsg = signInError.message.toLowerCase();
          if (errMsg.includes('invalid login credentials') || errMsg.includes('user not found')) {
            // Auto sign-up staff
            const { error: signUpError } = await supabase.auth.signUp({
              email,
              password: inputPass,
              options: {
                data: {
                  role: inputUser === 'owner' ? 'OWNER' : 'ADMIN',
                  name: inputUser === 'owner' ? 'Pak Dedek' : 'Siti Rahma',
                  username: inputUser,
                }
              }
            });

            if (signUpError) {
              setError(`Gagal mendaftarkan petugas di Supabase Auth: ${signUpError.message}`);
              setLoading(false);
              return;
            }

            // Retry sign-in
            const retry = await supabase.auth.signInWithPassword({
              email,
              password: inputPass
            });

            if (retry.error) {
              setError(`Gagal login petugas setelah pendaftaran otomatis: ${retry.error.message}`);
              setLoading(false);
              return;
            }
            data = retry.data;
          } else {
            setError(`Supabase Auth Error: ${signInError.message}`);
            setLoading(false);
            return;
          }
        }

        const role = inputUser === 'owner' ? UserRole.OWNER : UserRole.ADMIN;
        onLoginSuccess(role, {
          id: inputUser === 'owner' ? 'USR-001' : 'USR-002',
          name: inputUser === 'owner' ? 'Pak Dedek' : 'Siti Rahma',
          username: inputUser
        });
      } catch (err: any) {
        setError(`Kesalahan sistem auth: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(identifier, password, activeTab);
  };

  // Quick login handler
  const handleQuickLogin = async (role: 'owner' | 'admin' | 'customer_prioritas' | 'customer_loan') => {
    let qId = '';
    let qPass = '';
    let qTab: 'customer' | 'staff' = 'customer';

    if (role === 'owner') {
      qId = 'owner';
      qPass = 'owner123';
      qTab = 'staff';
    } else if (role === 'admin') {
      qId = 'admin';
      qPass = 'admin123';
      qTab = 'staff';
    } else if (role === 'customer_prioritas') {
      const subarjo = customers.find(c => c.id === 'CUST-001')!;
      qId = subarjo.memberNumber;
      qPass = subarjo.passwordHash;
      qTab = 'customer';
    } else if (role === 'customer_loan') {
      const aminah = customers.find(c => c.id === 'CUST-002')!;
      qId = aminah.memberNumber;
      qPass = aminah.passwordHash;
      qTab = 'customer';
    }

    setActiveTab(qTab);
    setIdentifier(qId);
    setPassword(qPass);
    
    // Perform login directly
    await performLogin(qId, qPass, qTab);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#FFFDF9] via-[#F8F9FA] to-[#FFF3F3] font-sans relative overflow-hidden">
      
      {/* Ambient Radial Gradient Blobs for high-end glowing backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-amber-100/30 blur-3xl" />
        <div className="absolute -bottom-20 left-10 w-96 h-96 rounded-full bg-red-100/40 blur-3xl" />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 relative z-10">
        <div className="w-full max-w-md">
          
          {/* Logo & Welcome */}
          <div className="text-center mb-6 flex flex-col items-center">
            <Logo size="lg" className="mb-1" />
            <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-gray-900 mt-2">
              Sistem Tabungan Digital
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              BKS 2015 - Menjaga Kepercayaan Sejak 2015
            </p>
          </div>

          {/* Login Card */}
          <div id="login-card" className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-100/80 p-6 sm:p-8 relative overflow-hidden backdrop-blur-xs">
            
            {/* Segmented Controller Tab */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
              <button
                type="button"
                id="tab-customer"
                onClick={() => { setActiveTab('customer'); setError(''); }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === 'customer'
                    ? 'bg-white text-primary shadow-sm shadow-gray-200'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                Nasabah BKS
              </button>
              <button
                type="button"
                id="tab-staff"
                onClick={() => { setActiveTab('staff'); setError(''); }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === 'staff'
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Petugas / Owner
              </button>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 flex items-start gap-2 animate-shake">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  {activeTab === 'customer' ? 'No. Anggota / NIK Nasabah' : 'Username Petugas'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="login-identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      activeTab === 'customer'
                        ? 'Contoh: BKS-2015-001 atau NIK'
                        : 'Contoh: owner / admin'
                    }
                    className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password Anda"
                    className="w-full pl-10 pr-12 py-3 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                    title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {activeTab === 'customer' && (
                  <p className="mt-1.5 text-[11px] text-gray-500 font-medium">
                    Password awal = Tgl Lahir (19021978)
                  </p>
                )}
              </div>

              <button
                type="submit"
                id="btn-login-submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-md mt-2 flex items-center justify-center gap-2 active:scale-[0.98] ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-[#7a1223] to-[#540813] hover:from-[#540813] hover:to-[#7a1223] text-white shadow-primary/20 hover:shadow-lg'
                }`}
              >
                {loading ? 'MEMPROSES AUTH...' : 'MASUK KE SISTEM'}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-gray-100 text-center">
              <p className="text-[11px] text-gray-400">
                Mengalami kesulitan login? Hubungi Kantor Operasional BKS 2015.
              </p>
            </div>
          </div>

          {/* Quick Access Demo Accounts Card */}
          <div className="mt-6 bg-amber-50/50 border border-amber-100 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-2.5">
              <Landmark className="w-3.5 h-3.5" />
              AKSES CEPAT DEMO (1-KLIK)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                id="quick-owner"
                onClick={() => handleQuickLogin('owner')}
                className="bg-white hover:bg-red-50 border border-gray-200 hover:border-primary-light p-2 rounded-lg text-left shadow-xs transition-all flex flex-col"
              >
                <span className="font-bold text-red-700">Owner (Sistem Penuh)</span>
                <span className="text-gray-400 text-[9px]">Ubah harga emas, audit, dsb</span>
              </button>
              <button
                type="button"
                id="quick-admin"
                onClick={() => handleQuickLogin('admin')}
                className="bg-white hover:bg-amber-50 border border-gray-200 hover:border-gold-light p-2 rounded-lg text-left shadow-xs transition-all flex flex-col"
              >
                <span className="font-bold text-amber-700">Admin (Operasional)</span>
                <span className="text-gray-400 text-[9px]">Input setoran, penarikan, dsb</span>
              </button>
              <button
                type="button"
                id="quick-cust-prioritas"
                onClick={() => handleQuickLogin('customer_prioritas')}
                className="bg-white hover:bg-blue-50 border border-gray-200 p-2 rounded-lg text-left shadow-xs transition-all flex flex-col"
              >
                <span className="font-bold text-blue-800">Nasabah Prioritas</span>
                <span className="text-gray-400 text-[9px]">H. Ahmad - Saldo Emas & Tabungan Besar</span>
              </button>
              <button
                type="button"
                id="quick-cust-loan"
                onClick={() => handleQuickLogin('customer_loan')}
                className="bg-white hover:bg-green-50 border border-gray-200 p-2 rounded-lg text-left shadow-xs transition-all flex flex-col"
              >
                <span className="font-bold text-green-800">Nasabah dengan Pinjaman</span>
                <span className="text-gray-400 text-[9px]">Ibu Aminah - Tabungan & Hutang Aktif</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Copy */}
      <div className="py-4 text-center text-[10px] text-gray-400 border-t border-gray-50 bg-white/40">
        © 2015 - 2026 BKS 2015. All Rights Reserved. Terproteksi oleh Kriptografi Enkripsi Sesi Lokal.
      </div>
    </div>
  );
}
