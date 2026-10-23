import React from 'react';
import { ShieldCheck, Heart, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-10 mt-16 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Logo Resmi Kemnaker & Vokasi Indonesia"
                className="w-8 h-8 object-contain shrink-0"
              />
              <span className="font-extrabold text-white text-base">SMK GO GLOBAL</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Platform Intelijen Penempatan Calon Pekerja Migran Indonesia Berbasis Lulusan Vokasi SMK, D3, dan Politeknik. Mengintegrasikan pemetaan supply talenta, standardisasi program pelatihan terakreditasi, kesiapan sarana e-Vokasi, serta demand industri global secara terpadu.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Kementerian Pelindungan Pekerja Migran Indonesia (P2MI)</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">5 Modul Utama SGG-CC</h4>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-blue-400 cursor-pointer transition">Modul A: Supply Intelligence</li>
              <li className="hover:text-blue-400 cursor-pointer transition">Modul B: Training Program Intelligence</li>
              <li className="hover:text-blue-400 cursor-pointer transition">Modul C: Vocational Provider Readiness</li>
              <li className="hover:text-blue-400 cursor-pointer transition">Modul D: Global Demand Intelligence</li>
              <li className="hover:text-blue-400 cursor-pointer transition">Modul E: Matching & Executive Monitoring</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Integrasi Ekosistem</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="https://gardata.sippmi.com" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition font-medium text-slate-200">
                  Pelaporan Pelatihan CPMI (gardata.sippmi.com)
                </a>
              </li>
              <li>
                <a href="https://siskop2mi.bp2mi.go.id" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition">
                  Otoritas Penempatan (SISKOP2MI)
                </a>
              </li>
              <li>
                <a href="https://vokasi.kemdikbud.go.id" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition">
                  Platform e-Vokasi Kemendikbudristek
                </a>
              </li>
              <li>
                <a href="https://kemnaker.go.id" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition">
                  SIAPKerja Kemnaker RI
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© 2026 Kementerian Pelindungan Pekerja Migran Indonesia (P2MI). Seluruh Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-slate-400">
              Dibuat dengan <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> untuk Talenta Muda Vokasi Indonesia
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
