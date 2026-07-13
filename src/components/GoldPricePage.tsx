/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Coins, TrendingUp, Calendar, User, ArrowUpRight, ArrowDownRight, Check, AlertCircle, Info } from 'lucide-react';
import { GoldPrice, UserRole } from '../types';

interface GoldPricePageProps {
  goldPrices: GoldPrice[];
  userRole: UserRole;
  onUpdateGoldPrice: (price: number) => void;
}

export default function GoldPricePage({
  goldPrices,
  userRole,
  onUpdateGoldPrice,
}: GoldPricePageProps) {
  const isOwner = userRole === UserRole.OWNER;
  const [newPrice, setNewPrice] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Latest active price is the first one since we sort or the last element
  const activeGoldPrice = goldPrices[goldPrices.length - 1];
  const previousGoldPrice = goldPrices[goldPrices.length - 2] || activeGoldPrice;
  const priceDiff = activeGoldPrice.price - previousGoldPrice.price;
  const pricePercent = ((priceDiff / previousGoldPrice.price) * 100).toFixed(2);

  // Format currencies
  const formatIDR = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isOwner) {
      setError('Hanya Owner yang diizinkan mengubah harga emas harian BKS (BR-407).');
      return;
    }

    const price = Number(newPrice);
    if (isNaN(price) || price <= 0) {
      setError('Masukkan nominal harga emas yang valid (angka positif di atas nol).');
      return;
    }

    onUpdateGoldPrice(price);
    setSuccess(`Harga emas aktif berhasil diperbarui menjadi ${formatIDR(price)} / gram!`);
    setNewPrice('');
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold font-display text-gray-900">
          Kelola Harga Acuan Emas Antam harian
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Atur harga acuan gramasi jual emas. Seluruh nilai aset konversi rupiah nasabah akan mengikuti harga aktif terbaru (BR-408).
        </p>
      </div>

      {/* Commodity Ticker Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Active Price Box */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 text-white rounded-2xl p-5 shadow-md border border-amber-500/15 relative overflow-hidden flex flex-col justify-between h-36">
          <div className="absolute right-0 bottom-0 top-0 w-1/4 bg-radial from-gold/10 to-transparent blur-xl pointer-events-none"></div>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-amber-200/80 font-bold uppercase tracking-wider flex items-center gap-1.5 leading-none">
              <Coins className="w-4 h-4 text-gold shrink-0" />
              Kurs Acuan Emas Aktif
            </span>
            <span className="text-[8.5px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-extrabold uppercase border border-emerald-500/20">
              Active
            </span>
          </div>

          <div>
            <span className="text-2xl font-black text-gold font-display block leading-none">
              {formatIDR(activeGoldPrice.price)} <span className="text-xs text-gray-400 font-bold">/ gram</span>
            </span>
          </div>

          <div className="text-[10px] text-gray-400 font-semibold border-t border-white/5 pt-2 flex justify-between items-center leading-none">
            <span>Diupdate oleh: {activeGoldPrice.updatedBy}</span>
            <span className="font-mono text-[9px] text-gray-500">
              {new Date(activeGoldPrice.date).toLocaleDateString('id-ID')}
            </span>
          </div>
        </div>

        {/* Market Trend Box */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between h-36">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Tren Fluktuasi Terakhir</span>
            <div className="flex items-baseline gap-1.5 pt-1.5">
              <span className={`text-xl font-black font-display flex items-center gap-1 leading-none ${
                priceDiff >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {priceDiff >= 0 ? '+' : ''} {formatIDR(priceDiff)}
              </span>
              <span className={`text-xs font-extrabold ${priceDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ({priceDiff >= 0 ? '+' : ''}{pricePercent}%)
              </span>
            </div>
          </div>

          <div className="text-[10.5px] text-gray-400 font-medium leading-relaxed">
            Perbandingan selisih harga acuan aktif dengan update harga sebelumnya ({formatIDR(previousGoldPrice.price)}).
          </div>
        </div>

        {/* Rules Reminder Box */}
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between h-36">
          <h4 className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-amber-600" />
            Aturan Sistem Gerai BKS
          </h4>
          <p className="text-[10.5px] text-amber-800 leading-relaxed pt-1.5">
            <b>BR-409:</b> Transaksi emas yang sudah dibuat di masa lalu tetap aman menyimpan snapshot harga saat itu dan tidak akan terpengaruh oleh update hari ini.
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Column */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm h-max">
          <h3 className="text-xs font-black text-gray-900 uppercase border-b border-gray-50 pb-2.5 mb-4">Update Harga Emas Hari Ini</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-xl font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-xs text-emerald-700 rounded-xl font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {isOwner ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Harga Per Gram (Rupiah)</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Contoh: 1420000 (Tanpa titik/koma)"
                  className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#cb356b] to-[#bd3f32] hover:from-[#bd3f32] hover:to-[#cb356b] text-white text-xs font-bold rounded-xl shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                Daftarkan Harga Baru
              </button>
            </form>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl text-xs text-gray-400 leading-relaxed">
              Akun Anda login sebagai <b>ADMIN OPERASIONAL</b>. Anda tidak diizinkan melakukan pengubahan harga acuan emas Gerai BKS.
            </div>
          )}
        </div>

        {/* History Logs Column */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-xs font-black text-gray-900 uppercase">Jurnal Perubahan Harga Emas Historis</h3>
            <p className="text-[10.5px] text-gray-400">Daftar rekapitulasi penyesuaian harga emas harian yang dicatat oleh Owner</p>
          </div>

          <div className="divide-y divide-gray-50 flex-1">
            {/* Sort price logs descending by date */}
            {[...goldPrices]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((price) => (
                <div key={price.id} className="p-4 px-5 flex items-center justify-between hover:bg-gray-50/30 transition-colors text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <span className="font-extrabold text-gray-900 block leading-none">
                        {formatIDR(price.price)} / gram
                      </span>
                      <span className="text-[9px] text-gray-400 font-semibold mt-1 block">
                        Diubah oleh {price.updatedBy}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-semibold text-gray-700 block font-mono">
                      {new Date(price.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                    <span className="text-[8.5px] text-gray-400 font-semibold font-mono block">
                      {new Date(price.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

      </div>

    </div>
  );
}
