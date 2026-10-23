import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Users,
  GraduationCap,
  Building2,
  Globe2,
  Workflow,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface ExecutiveOverviewProps {
  onNavigate: (tab: string) => void;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({ onNavigate }) => {
  const { candidates, programs, providers, demands, allocations, setActiveStage } = useAppStore();

  const totalDemandQuota = demands.reduce((acc, d) => acc + d.requiredQuota, 0);
  const totalVerifiedCandidates = candidates.filter((c) => c.verificationStatus === 'Verified').length;
  const readyCandidates = candidates.filter((c) => c.readinessStatus === 'Ready for Placement').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Banner Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-6 sm:p-10 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Ambient lighting effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Platform Intelijen Penempatan PMI Terpadu Berbasis Vokasi</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Menghubungkan Lulusan Vokasi Indonesia ke Peluang Kerja Global
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Sistem terintegrasi Kementerian Pelindungan Pekerja Migran Indonesia (P2MI) untuk memetakan calon talenta terampil (Modul A), standardisasi pelatihan kurikulum (Modul B), kesiapan fasilitas e-Vokasi (Modul C), serta pemenuhan permintaan pasar internasional (Modul D).
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                setActiveStage(3);
                onNavigate('matching');
              }}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2"
            >
              <Workflow className="w-4 h-4" />
              <span>Mulai Simulasi Matching & Alokasi (Tahap 1-4)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('modul-a')}
              className="px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition"
            >
              Eksplorasi Bank Data Supply Vokasi
            </button>
          </div>
        </div>

        {/* 4 Bottom Micro-Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-bold block">Pasokan Vokasi Terdata</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-white">{candidates.length}</span>
              <span className="text-xs text-blue-400 font-semibold">Peserta</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 uppercase font-bold block">Siap Penempatan</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-emerald-400">{readyCandidates}</span>
              <span className="text-xs text-emerald-400 font-semibold">Tersertifikasi</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 uppercase font-bold block">Kuota Demand Global</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-amber-400">{totalDemandQuota}</span>
              <span className="text-xs text-amber-400 font-semibold">Lowongan</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 uppercase font-bold block">Alokasi Batch Terbit</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-indigo-400">{allocations.length}</span>
              <span className="text-xs text-indigo-400 font-semibold">Keputusan</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Intelijen Modules Interactive Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
              Empat Fitur Utama
            </span>
            <h2 className="text-xl font-extrabold text-slate-900">
              Akses Langsung ke Fitur Utama
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pencari Kerja */}
          <div
            onClick={() => onNavigate('modul-a')}
            className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-lg transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors mb-4">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                Pencari Kerja
              </span>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Data Pencari Kerja
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Agregasi data profil calon PMI vokasi dari SMK, D3, Politeknik, status kesiapan teknis, dan kemahiran bahasa asing.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>Buka Pencari Kerja</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Program Pelatihan */}
          <div
            onClick={() => onNavigate('modul-b')}
            className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-lg transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-colors mb-4">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                Program Pelatihan
              </span>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Program Pelatihan
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Katalog kurikulum terstandar (Upskilling, Reskilling, Bahasa, Teknis Terpadu) untuk sertifikasi BNSP & negara tujuan.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
              <span>Buka Program Pelatihan</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Lembaga Vokasi */}
          <div
            onClick={() => onNavigate('modul-c')}
            className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-lg transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center transition-colors mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                Lembaga Vokasi
              </span>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Kesiapan Lembaga Vokasi
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Pemetaan kesiapan sarana bengkel kerja, instruktur bersertifikat, dan verifikasi e-Vokasi dari SMK, BLK, LPK, dan Politeknik.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
              <span>Buka Lembaga Vokasi</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Permintaan Tenaga Kerja */}
          <div
            onClick={() => onNavigate('modul-d')}
            className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 shadow-xs hover:shadow-lg transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 group-hover:bg-amber-600 text-amber-600 group-hover:text-white flex items-center justify-center transition-colors mb-4">
                <Globe2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
                Permintaan Tenaga Kerja
              </span>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                Permintaan Tenaga Kerja Luar Negeri
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Pemetaan lowongan kerja luar negeri resmi via SISKOP2MI di Jepang, Jerman, Korea Selatan, dan Taiwan beserta persyaratannya.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600">
              <span>Buka Permintaan Tenaga Kerja</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stages Workflow Preview Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Workflow className="w-4 h-4" />
            <span>Alur Kerja Otomatis 4 Tahapan Sistem</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Simulasikan Pengambilan Keputusan Alokasi Program & Pagu Anggaran
          </h3>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Pergerakan data transparan dari <strong>Tahap 1 (Pengumpulan)</strong>, <strong>Tahap 2 (Validasi NIK Dukcapil & e-Vokasi)</strong>, <strong>Tahap 3 (Matching Engine & Gap Analysis)</strong>, hingga <strong>Tahap 4 (Penetapan Surat Keputusan Alokasi Batch)</strong>.
          </p>
        </div>

        <button
          onClick={() => {
            setActiveStage(1);
            onNavigate('matching');
          }}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 whitespace-nowrap transition"
        >
          Buka Engine Tahap 1-4
        </button>
      </div>
    </div>
  );
};
