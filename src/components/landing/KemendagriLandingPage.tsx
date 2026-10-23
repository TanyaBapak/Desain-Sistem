import React, { useState } from 'react';
import {
  useAppStore
} from '../../store/useAppStore';
import { mockNews, mockRoles } from '../../data';
import { UserRole } from '../../types';
import { LOGO_URL } from '@/lib/assets';
import {
  ShieldCheck,
  Building2,
  Users,
  GraduationCap,
  Globe2,
  Workflow,
  Search,
  ArrowRight,
  ExternalLink,
  Calendar,
  Volume2,
  ChevronRight,
  Sparkles,
  FileText,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  Layers,
  Award,
  Compass
} from 'lucide-react';

export const KemendagriLandingPage: React.FC = () => {
  const {
    candidates,
    programs,
    providers,
    demands,
    allocations,
    openLoginPage,
    setViewMode,
  } = useAppStore();

  const [activeSlide, setActiveSlide] = useState(0);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const slides = [
    {
      badge: 'PROGRAM PRIORITAS NASIONAL 2026-2029',
      title: 'Pemberdayaan & Penempatan 50.000 Lulusan Vokasi ke Industri Global',
      subtitle: 'Integrasi terpadu pemetaan kurikulum SMK/Politeknik, verifikasi e-Vokasi, dan pemenuhan demand kerja resmi di Jepang, Jerman, Korea Selatan, dan Taiwan.',
      ctaText: 'Masuk ke Sistem Aplikasi',
      tag: 'Kementerian P2MI RI'
    },
    {
      badge: 'STANDARDISASI KOMPETENSI INTERNASIONAL',
      title: 'Penyelarasan Kurikulum Vokasi Sesuai Standar SSW Kaigo & Welder JIS',
      subtitle: 'Memastikan seluruh calon pekerja migran lulusan vokasi memiliki sertifikasi BNSP terlisensi dan kemahiran bahasa kerja sebelum penempatan.',
      ctaText: 'Pelajari 4 Modul Intelijen',
      tag: 'Kerja Sama Bilateral'
    }
  ];

  const totalDemandQuota = demands.reduce((acc, d) => acc + d.requiredQuota, 0);
  const totalVerifiedCandidates = candidates.filter((c) => c.verificationStatus === 'Verified').length;

  const handleSelectRole = (roleId: UserRole) => {
    void roleId;
    setRoleModalOpen(false);
    openLoginPage();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-red-600 selection:text-white">
      {/* 1. TOP UTILITY GOVERNMENT BAR (Ala Kemendagri / Portal Resmi RI) */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-300 text-xs py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Tanggal & Hari Resmi */}
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-red-500" />
              <span>Jumat, 23 Oktober 2026 | 11:30 WIB</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="hidden md:inline text-slate-400 font-medium">
              Republik Indonesia — Portal Resmi Terintegrasi
            </span>
          </div>

          {/* Aksesibilitas & Link Instansi */}
          <div className="flex items-center gap-4 text-xs">
            <a
              href="https://siskop2mi.bp2mi.go.id"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition flex items-center gap-1"
            >
              <span>SISKOP2MI</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
            <span className="text-slate-700">|</span>
            <a
              href="https://vokasi.kemdikbud.go.id"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition flex items-center gap-1"
            >
              <span>Portal e-Vokasi</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
            <span className="text-slate-700">|</span>
            <a
              href="https://kemnaker.go.id"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition flex items-center gap-1"
            >
              <span>SIAPKerja</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1 text-slate-400">
              <PhoneCall className="w-3 h-3 text-emerald-400" />
              <span>Call Center 1500-262</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. OFFICIAL GOVERNMENT HEADER & LOGO BRAND */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Logo Garuda / Lambang RI + Nama Kementerian */}
          <div
            onClick={() => setViewMode('landing')}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            {/* Logo Resmi Kemnaker / Vokasi Indonesia */}
            <img
              src={LOGO_URL}
              alt="Logo Resmi Kemnaker & Vokasi Indonesia"
              className="w-12 h-12 object-contain drop-shadow-sm group-hover:scale-105 transition-transform shrink-0"
            />

            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-red-600">
                KEMENTERIAN PELINDUNGAN PEKERJA MIGRAN INDONESIA
              </p>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none group-hover:text-blue-900 transition">
                SMK GO GLOBAL
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Sistem Intelijen Penempatan PMI Terpadu Berbasis Pendidikan Vokasi
              </p>
            </div>
          </div>

          {/* Quick Action Button: Masuk SSO */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => openLoginPage()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition"
              title="Masuk Sistem Terpadu (SSO)"
            >
              <Compass className="w-4 h-4" />
              <span>Masuk Sistem Terpadu (SSO)</span>
            </button>
          </div>
        </div>

        {/* Primary Navbar Menu (Ala Kemendagri) */}
        <nav className="bg-slate-900 border-t border-slate-800 text-white text-xs font-bold">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center space-x-1 sm:space-x-2 py-1">
              <button
                onClick={() => setViewMode('landing')}
                className="px-3.5 py-2 rounded-lg bg-red-600 text-white"
              >
                Beranda Utama
              </button>
              <a
                href="#profil-kementerian"
                className="px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition whitespace-nowrap"
              >
                Profil & Mandat
              </a>
              <a
                href="#modul-intelijen"
                className="px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition whitespace-nowrap"
              >
                5 Modul Utama SGG-CC
              </a>
              <a
                href="#alur-tahapan"
                className="px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition whitespace-nowrap"
              >
                6 Tahapan Alur Kerja
              </a>
              <a
                href="#portal-role"
                className="px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition whitespace-nowrap"
              >
                Akses Peran Pengguna
              </a>
              <a
                href="#siaran-pers"
                className="px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition whitespace-nowrap"
              >
                Berita & Siaran Pers
              </a>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-slate-400">
              <span className="text-[11px] font-normal">Status Sistem:</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Aktif & Terintegrasi
              </span>
            </div>
          </div>
        </nav>
      </header>

      {/* 3. RUNNING ANNOUNCEMENT TICKER (Kemendagri Headline News Ticker) */}
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-slate-900 text-white text-xs py-2 px-4 border-b border-red-800 shadow-inner overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-red-950/80 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider shrink-0 border border-red-400/30">
            <Volume2 className="w-3.5 h-3.5 text-amber-300" />
            <span>PENGUMUMAN RESMI</span>
          </div>
          <div className="truncate text-xs font-medium text-slate-100">
            Pendaftaran Batch I Tahun 2027 Pelatihan Terpadu SSW Kaigo Jepang & Ausbildung Jerman telah dibuka melalui Sistem SMK Go Global • Verifikasi NIK & Ijazah Terhubung Langsung dengan Dukcapil & Kemendikbudristek.
          </div>
        </div>
      </div>

      {/* 4. HERO SHOWCASE & SEARCH (Banner Kenegaraan) */}
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white py-12 lg:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 overflow-hidden">
        {/* Subtle decorative crest overlay */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Presentation */}
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-red-400" />
              <span>{slides[activeSlide].badge}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
              {slides[activeSlide].title}
            </h2>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              {slides[activeSlide].subtitle}
            </p>

            {/* Quick Action Button Group: SSO */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={() => openLoginPage()}
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Masuk Sistem Terpadu (SSO)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Live Statistics Card */}
          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                STATISTIK NASIONAL TERPADU
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Capaian Penempatan Vokasi Global
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Calon Peserta Siap Latih</span>
                    <span className="text-base font-extrabold text-white">2.440 Orang</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-400">Supply Vokasi</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Kapasitas Pelatihan</span>
                    <span className="text-base font-extrabold text-white">1.920 Kursi</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-400">e-Vokasi</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <Globe2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Demand Luar Negeri</span>
                    <span className="text-base font-extrabold text-white">1.330 Lowongan</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-400">SISKOP2MI</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Workflow className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Potensi Smart Matching</span>
                    <span className="text-base font-extrabold text-white">1.330 Terpenuhi</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-indigo-400">100% Demand</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 text-center pt-1">
              Data Simulasi Operasional • Target Nasional 2026: 40.000 Peserta
            </p>
          </div>
        </div>
      </section>

      {/* 5. ROLE-BASED ACCESS SELECTOR SECTION (PILIH ROLE PENGGUNA) */}
      <section id="portal-role" className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 block mb-1">
              PORTAL LAYANAN MULTI-STAKEHOLDER
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Pilih Peran Pengguna untuk Masuk ke Sistem
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Sistem SMK Go Global menyajikan fitur dan hak akses yang disesuaikan secara khusus bagi setiap pemangku kepentingan dalam ekosistem ketenagakerjaan migran vokasi.
            </p>
          </div>

          {/* 8 Core User Role Cards Grid (4x2 on desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {mockRoles.map((role) => (
              <div
                key={role.id}
                onClick={() => handleSelectRole(role.id)}
                className="p-5 rounded-2xl border border-slate-200 hover:border-red-500 bg-slate-50/60 hover:bg-white shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center transition-colors mb-3">
                    {role.id === 'superadmin' && <ShieldCheck className="w-6 h-6" />}
                    {role.id === 'pimpinan' && <Award className="w-6 h-6" />}
                    {role.id === 'taskforce' && <Workflow className="w-6 h-6" />}
                    {role.id === 'disnaker' && <Users className="w-6 h-6" />}
                    {role.id === 'vokasi' && <Building2 className="w-6 h-6" />}
                    {role.id === 'demand' && <Globe2 className="w-6 h-6" />}
                    {role.id === 'verifikator' && <CheckCircle2 className="w-6 h-6" />}
                    {role.id === 'matching' && <Layers className="w-6 h-6" />}
                  </div>

                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 text-[10px] flex items-center justify-center font-bold">
                      {role.number}
                    </span>
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">
                      {role.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-red-700 transition leading-snug">
                    {role.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed line-clamp-3">
                    {role.description}
                  </p>
                  <span className="text-[10px] text-slate-400 block font-mono mt-2 truncate">
                    Scope: {role.defaultScope.name}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-red-600 group-hover:text-red-700">
                  <span>Masuk Portal</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. 5 MODUL UTAMA APLIKASI SGG-CC */}
      <section id="modul-intelijen" className="py-14 bg-slate-100/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
                5 MODUL UTAMA APLIKASI TERPADU (SGG-CC)
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Arsitektur Modul Penempatan PMI Vokasi
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                Lima modul utama yang saling mengalirkan data secara berkesinambungan: Supply, Program Pelatihan, Kesiapan Lembaga, Demand Pasar Kerja Luar Negeri, serta Smart Matching & Executive Monitoring.
              </p>
            </div>

            <button
              onClick={() => openLoginPage()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <span>Buka Seluruh Modul (Login)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            {/* Modul A */}
            <div
              onClick={() => openLoginPage()}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm mb-3 group-hover:bg-blue-600 group-hover:text-white transition">
                  A
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-1 group-hover:text-blue-700 transition">
                  Supply Intelligence
                </h3>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-2">
                  Bank Calon Peserta
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Menghimpun data pencari kerja dari Disnaker kab/kota, provinsi, BP3MI, SMK, perguruan tinggi, BLK, LPK, dan LKP. Mencakup data domisili, pendidikan, jurusan, kompetensi, bahasa, serta status verifikasi NIK.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-blue-600 flex items-center justify-between">
                <span>{candidates.length} Calon Terdata</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Modul B */}
            <div
              onClick={() => openLoginPage()}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm mb-3 group-hover:bg-indigo-600 group-hover:text-white transition">
                  B
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-1 group-hover:text-indigo-700 transition">
                  Training Program Intelligence
                </h3>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-2">
                  Bank Program & Kurikulum
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bank program pelatihan berdasarkan sektor, jabatan, negara tujuan, kurikulum, jumlah jam pelajaran (JP), sertifikasi BNSP/JIS, jadwal, kuota, biaya, serta membedakan pelatihan upskilling, reskilling, dan bahasa.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-indigo-600 flex items-center justify-between">
                <span>{programs.length} Program Tersedia</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Modul C */}
            <div
              onClick={() => openLoginPage()}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
                  C
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-1 group-hover:text-emerald-700 transition">
                  Vocational Provider Readiness
                </h3>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-2">
                  Direktori Lembaga Vokasi
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Direktori lembaga pemerintah dan nonpemerintah (SMK, Politeknik, BLK, Balai Vokasi, LPK/LKP). Terhubung dengan e-Vokasi untuk status verifikasi fasilitas, ketersediaan instruktur, dan kapasitas kelas.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-emerald-600 flex items-center justify-between">
                <span>{providers.length} Lembaga Siap</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Modul D */}
            <div
              onClick={() => openLoginPage()}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-500 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm mb-3 group-hover:bg-amber-600 group-hover:text-white transition">
                  D
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-1 group-hover:text-amber-700 transition">
                  Global Demand Intelligence
                </h3>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-2">
                  Permintaan Kerja Global
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mengelola kebutuhan tenaga kerja per negara, sektor, jabatan, kuota, persyaratan pendidikan, skill teknis, bahasa, batas waktu rekrutmen, status validasi, dan jalur penempatan resmi (G to G, P to P, Mandiri).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-amber-600 flex items-center justify-between">
                <span>{totalDemandQuota} Kuota Lowongan</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Modul E */}
            <div
              onClick={() => openLoginPage()}
              className="bg-gradient-to-br from-blue-900 to-slate-900 p-5 rounded-2xl border border-blue-700 hover:border-blue-400 shadow-md hover:shadow-xl transition cursor-pointer flex flex-col justify-between group text-white"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm mb-3 group-hover:scale-105 transition">
                  E
                </div>
                <h3 className="font-extrabold text-sm text-white mb-1 group-hover:text-blue-200 transition">
                  Matching & Executive Monitoring
                </h3>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
                  Command Center & Matching
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Menghubungkan supply, program, lembaga, dan demand. Menghasilkan rekomendasi kandidat, analisis gap, penetapan kuota, kendali 3 level pimpinan, dan pelacakan hambatan real-time.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-bold text-amber-400 flex items-center justify-between">
                <span>SGG Command Center</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. ALUR 6 TAHAPAN PROSES BISNIS DARI HULU HINGGA HILIR */}
      <section id="alur-tahapan" className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 block mb-1">
              PROSES BISNIS TERINTEGRASI DARI HULU HINGGA HILIR
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              6 Tahapan Siklus Penyiapan & Penempatan PMI
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Setiap tahapan memiliki PIC penanggung jawab, batas waktu (tenggat), status verifikasi, dan pencatatan hambatan sehingga Task Force dapat mendeteksi bottle-neck operasional sedini mungkin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Tahap 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase">
                  Tahap 1
                </span>
                <h4 className="font-extrabold text-slate-900 text-xs">Pengumpulan Data</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Disnaker, BP3MI, lembaga vokasi, demand luar negeri & sistem eksisting mengumpulkan profil calon dan kebutuhan pasar.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-400 font-semibold">
                PIC: Disnaker & BP3MI
              </div>
            </div>

            {/* Tahap 2 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-emerald-400 hover:shadow-md transition">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase">
                  Tahap 2
                </span>
                <h4 className="font-extrabold text-slate-900 text-xs">Validasi & Standardisasi</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Deduplikasi data peserta via NIK Dukcapil, verifikasi kesiapan lembaga via e-Vokasi, dan klasifikasi jabatan.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-400 font-semibold">
                PIC: Pusdatin & BP3MI
              </div>
            </div>

            {/* Tahap 3 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-indigo-400 hover:shadow-md transition">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase">
                  Tahap 3
                </span>
                <h4 className="font-extrabold text-slate-900 text-xs">Analisis Gap & Matching</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Demand dibandingkan supply, kompetensi teknis, kapasitas kelas lembaga, dan durasi jam pelajaran (Smart Matching).
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-400 font-semibold">
                PIC: Task Force Nasional
              </div>
            </div>

            {/* Tahap 4 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-purple-400 hover:shadow-md transition">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 uppercase">
                  Tahap 4
                </span>
                <h4 className="font-extrabold text-slate-900 text-xs">Penetapan Program & Lembaga</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Penentuan kuota kelas, wilayah prioritas, penyelenggara pelatihan, alokasi anggaran, dan jadwal batch (SK Penetapan).
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-400 font-semibold">
                PIC: Dit. PKV PMI
              </div>
            </div>

            {/* Tahap 5 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase">
                  Tahap 5
                </span>
                <h4 className="font-extrabold text-slate-900 text-xs">Pelaksanaan & Monitoring</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pembukaan kelas, pencatatan kehadiran harian, progres Jam Pelajaran (JP), asesmen berkala, dan sertifikasi BNSP/JIS.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-400 font-semibold">
                PIC: Balai / SMK Penyelenggara
              </div>
            </div>

            {/* Tahap 6 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-red-400 hover:shadow-md transition">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase">
                  Tahap 6
                </span>
                <h4 className="font-extrabold text-slate-900 text-xs">Job Matching & Penempatan</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Wawancara pemberi kerja, pemenuhan visa & kontrak kerja resmi, serta finalisasi penempatan ke SISKOP2MI.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-400 font-semibold">
                PIC: SISKOP2MI & Ditjen P3KLN
              </div>
            </div>
          </div>

          {/* Executive Command Center Integration Callout Card */}
          <div className="mt-8 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>EXECUTIVE COMMAND CENTER (SGG-CC)</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Satu Data, Satu Proses Pemantauan, Satu Dashboard Pengambilan Keputusan
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                Menghubungkan 3 tingkat pimpinan (Menteri/Wamen, Dirjen/Task Force Nasional, BP3MI/Pemda/Lembaga) dengan fitur <strong>drill-down wilayah</strong> (Provinsi → Kab/Kota → Sektor → Lembaga & PIC) serta <strong>matching agregat & individual</strong>. SGG-CC mengorkestrasi sistem e-Vokasi, SMART PMI, dan SISKOP2MI secara transparan dan akuntabel.
              </p>
            </div>

            <button
              onClick={() => openLoginPage()}
              className="shrink-0 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Masuk Sistem Terpadu (SSO)</span>
            </button>
          </div>
        </div>
      </section>

      {/* 8. BERITA & SIARAN PERS KEMENTERIAN (Kemendagri News Section) */}
      <section id="siaran-pers" className="py-14 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 block mb-1">
                PUBLIKASI & INFORMASI RESMI
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Siaran Pers & Berita Terkini Kementerian
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Diperbarui secara berkala oleh Biro Humas P2MI
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockNews.map((news) => (
              <div
                key={news.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      {news.category}
                    </span>
                    <span className="text-slate-400">{news.readTime}</span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 leading-snug hover:text-red-600 transition">
                    {news.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    {news.excerpt}
                  </p>
                </div>

                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{news.date}</span>
                  <span className="font-semibold text-slate-600 hover:text-red-600 cursor-pointer">
                    Baca Rilis →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. MODAL SELECTOR PERAN PENGGUNA */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                  AUTENTIKASI & AKSES SISTEM TERPADU
                </span>
                <h3 className="text-lg font-bold">Pilih Peran Pengguna untuk Masuk</h3>
              </div>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              {mockRoles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => handleSelectRole(role.id)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-red-500 hover:bg-red-50/30 transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-red-600 group-hover:text-white text-slate-700 flex items-center justify-center transition-colors">
                      {role.id === 'superadmin' && <ShieldCheck className="w-5 h-5" />}
                      {role.id === 'pimpinan' && <Award className="w-5 h-5" />}
                      {role.id === 'taskforce' && <Workflow className="w-5 h-5" />}
                      {role.id === 'disnaker' && <Users className="w-5 h-5" />}
                      {role.id === 'vokasi' && <Building2 className="w-5 h-5" />}
                      {role.id === 'demand' && <Globe2 className="w-5 h-5" />}
                      {role.id === 'verifikator' && <CheckCircle2 className="w-5 h-5" />}
                      {role.id === 'matching' && <Layers className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-red-600 uppercase block">
                        No. {role.number} — {role.badge}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{role.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{role.organization}</p>
                    </div>
                  </div>

                  <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white group-hover:bg-red-600 transition">
                    Pilih Peran
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
              Setiap role memiliki dasbor khusus dengan pembatasan hak akses yang sesuai.
            </div>
          </div>
        </div>
      )}

      {/* 10. FOOTER RESMI PEMERINTAHAN (Kemendagri / Kementerian RI) */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
            {/* Kolom 1: Profil Instansi */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={LOGO_URL}
                  alt="Logo Resmi Kemnaker & Vokasi Indonesia"
                  className="w-8 h-8 object-contain shrink-0"
                />
                <div>
                  <span className="font-extrabold text-white text-sm block">
                    KEMENTERIAN PELINDUNGAN PEKERJA MIGRAN INDONESIA
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Platform Intelijen Penempatan Vokasi SMK Go Global
                  </span>
                </div>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
                Gedung Kementerian P2MI, Jl. MT Haryono Kav. 52, Pancoran, Jakarta Selatan 12770.<br />
                Call Center 24 Jam: <strong>1500-262</strong> | Email: <strong>humas@p2mi.go.id</strong>
              </p>
            </div>

            {/* Kolom 2: Layanan Publik & e-Government */}
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                Kanal Layanan Terintegrasi
              </h4>
              <ul className="space-y-2 text-xs">
                <li><a href="https://gardata.sippmi.com" target="_blank" rel="noreferrer" className="hover:text-white font-semibold text-amber-300">Pelaporan Diklat CPMI (gardata.sippmi.com)</a></li>
                <li><a href="https://siskop2mi.bp2mi.go.id" target="_blank" rel="noreferrer" className="hover:text-white">SISKOP2MI Online</a></li>
                <li><a href="https://vokasi.kemdikbud.go.id" target="_blank" rel="noreferrer" className="hover:text-white">Portal e-Vokasi Kemendikbud</a></li>
                <li><a href="https://siapkerja.kemnaker.go.id" target="_blank" rel="noreferrer" className="hover:text-white">SIAPKerja Kemnaker</a></li>
                <li><a href="https://lapor.go.id" target="_blank" rel="noreferrer" className="hover:text-white">SP4N-LAPOR!</a></li>
              </ul>
            </div>

            {/* Kolom 3: Regulasi & Akses Sistem */}
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                Akses Peran Sistem
              </h4>
              <ul className="space-y-2 text-xs">
                <li onClick={() => handleSelectRole('admin')} className="hover:text-red-400 cursor-pointer">Admin Kementerian (Pusat)</li>
                <li onClick={() => handleSelectRole('vokasi')} className="hover:text-red-400 cursor-pointer">Lembaga Vokasi (SMK/LPK)</li>
                <li onClick={() => handleSelectRole('kandidat')} className="hover:text-red-400 cursor-pointer">Calon Peserta Vokasi</li>
                <li onClick={() => handleSelectRole('disnaker')} className="hover:text-red-400 cursor-pointer">Dinas Tenaga Kerja Daerah</li>
                <li onClick={() => handleSelectRole('employer')} className="hover:text-red-400 cursor-pointer">Employer Luar Negeri</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <p>© 2026 Kementerian Pelindungan Pekerja Migran Indonesia (P2MI). Hak Cipta Dilindungi Undang-Undang.</p>
            <p>Standar Antarmuka Portal Publik Pemerintahan Republik Indonesia</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
