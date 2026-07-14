/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Menu, X, Landmark, LogOut, ChevronRight, LayoutDashboard, 
  Users, Wallet, Coins, Percent, FileBarChart, Upload, ClipboardList, UserCog, User 
} from 'lucide-react';
import { UserRole } from '../types';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  userName: string;
  currentGoldPrice: number;
  onLogout: () => void;
}

export function Sidebar({ activeTab, setActiveTab, userRole }: { 
  activeTab: string; 
  setActiveTab: (tab: string) => void; 
  userRole: UserRole;
}) {
  const isOwner = userRole === UserRole.OWNER;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.OWNER, UserRole.ADMIN] },
    { id: 'customers', label: 'Daftar Nasabah', icon: Users, roles: [UserRole.OWNER, UserRole.ADMIN] },
    { id: 'money-tx', label: 'Tabungan Uang', icon: Wallet, roles: [UserRole.OWNER, UserRole.ADMIN] },
    { id: 'gold-tx', label: 'Tabungan Emas', icon: Coins, roles: [UserRole.OWNER, UserRole.ADMIN] },
    { id: 'loans', label: 'Pinjaman', icon: Percent, roles: [UserRole.OWNER, UserRole.ADMIN] },
    { id: 'gold-price', label: 'Harga Emas', icon: Coins, roles: [UserRole.OWNER], badge: 'OWNER' },
    { id: 'reports', label: 'Laporan', icon: FileBarChart, roles: [UserRole.OWNER, UserRole.ADMIN] },
    { id: 'import', label: 'Import Excel', icon: Upload, roles: [UserRole.OWNER], badge: 'OWNER' },
    { id: 'audit-trail', label: 'Audit Trail', icon: ClipboardList, roles: [UserRole.OWNER], badge: 'OWNER' },
    { id: 'profile', label: 'Profil Saya', icon: UserCog, roles: [UserRole.OWNER, UserRole.ADMIN] },
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 z-20">
      {/* Brand */}
      <div className="p-5 border-b border-slate-200 flex items-center">
        <Logo size="md" />
      </div>

      {/* Nav Link Items */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto no-scrollbar">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 group ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 duration-200 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary'
                }`} />
                <span>{item.label}</span>
              </div>
              {item.badge ? (
                <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded leading-none ${
                  isActive ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {item.badge}
                </span>
              ) : (
                <ChevronRight className={`w-3.5 h-3.5 transition-transform opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 ${
                  isActive ? 'text-white/70' : 'text-slate-400'
                }`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Session Footer Card */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-light to-primary-light/80 flex items-center justify-center border border-primary-light/40 text-primary font-bold text-xs uppercase">
            {userRole === UserRole.OWNER ? 'O' : 'A'}
          </div>
          <div className="truncate">
            <h4 className="text-[11px] font-bold text-slate-900 leading-tight">Admin Operasional</h4>
            <span className="text-[9px] text-slate-400 font-semibold bg-slate-200/60 px-1.5 py-0.5 rounded block w-max uppercase mt-1 leading-none">
              {userRole}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function Layout({ 
  children, 
  activeTab, 
  setActiveTab, 
  userRole, 
  userName, 
  currentGoldPrice, 
  onLogout 
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isOwner = userRole === UserRole.OWNER;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.OWNER, UserRole.ADMIN] },
    { id: 'customers', label: 'Daftar Nasabah', icon: Users, roles: [UserRole.OWNER, UserRole.ADMIN] },
    { id: 'money-tx', label: 'Tabungan Uang', icon: Wallet, roles: [UserRole.OWNER, UserRole.ADMIN] },
    { id: 'gold-tx', label: 'Tabungan Emas', icon: Coins, roles: [UserRole.OWNER, UserRole.ADMIN] },
    { id: 'loans', label: 'Pinjaman', icon: Percent, roles: [UserRole.OWNER, UserRole.ADMIN] },
    { id: 'gold-price', label: 'Harga Emas', icon: Coins, roles: [UserRole.OWNER] },
    { id: 'reports', label: 'Laporan', icon: FileBarChart, roles: [UserRole.OWNER, UserRole.ADMIN] },
    { id: 'import', label: 'Import Excel', icon: Upload, roles: [UserRole.OWNER] },
    { id: 'audit-trail', label: 'Audit Trail', icon: ClipboardList, roles: [UserRole.OWNER] },
    { id: 'profile', label: 'Profil Saya', icon: UserCog, roles: [UserRole.OWNER, UserRole.ADMIN] },
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      
      {/* Sidebar for Desktop */}
      <div className="hidden lg:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />
      </div>

      {/* Main Body Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-10">
          
          {/* Hamburger (Mobile) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Desktop Quick Indicator Info */}
            <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-2 bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-[11px]">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span>Audit Status:</span>
                <span className="text-green-600 font-bold">Healthy</span>
              </span>
              <span className="flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-[11px]">
                <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Harga Emas Aktif: <b className="text-amber-900">Rp {currentGoldPrice.toLocaleString('id-ID')} / g</b>
              </span>
            </div>

            {/* Mobile Logo Fallback */}
            <div className="flex items-center lg:hidden">
              <Logo size="sm" />
            </div>
          </div>

          {/* Action Area */}
          <div className="flex items-center gap-4">
            
            {/* Active Gold Price for Mobile */}
            <div className="sm:hidden flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-100 text-[10px] font-bold">
              <Coins className="w-3 h-3 text-amber-600" />
              Rp {currentGoldPrice.toLocaleString('id-ID')}
            </div>

            {/* User Session Info */}
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200 text-right">
              <div>
                <p className="text-xs font-bold leading-none text-slate-800">{userName}</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">{userRole} Access</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 uppercase text-xs">
                {userName.charAt(0)}
              </div>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar Sesi</span>
            </button>
          </div>
        </header>

        {/* Scrollable Main Content Container */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer Navigation Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer Panel */}
      <div className={`fixed top-0 bottom-0 left-0 w-64 bg-white z-40 shadow-2xl border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <Logo size="sm" />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-2">
          <div className="text-[10px] text-slate-400 font-semibold text-center uppercase tracking-wider">
            Login Sesi: {userName}
          </div>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onLogout();
            }}
            className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 border border-red-100"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar Aplikasi
          </button>
        </div>
      </div>

    </div>
  );
}
