import React, { useEffect, useState } from 'react';
import {
  useAppStore,
} from '../../store/useAppStore';
import { LandingProjectionDashboard, LandingProjectionData } from "@/components/landing/LandingProjectionDashboard";
import { UserRole } from '../../types';
import { LOGO_URL } from '@/lib/assets';
import {
  ShieldCheck,
  Building2,
  ExternalLink,
  Calendar,
  Volume2,
  ChevronRight,
  PhoneCall,
  Compass,
} from 'lucide-react';

interface KemendagriLandingPageProps {
  kpiSummary: {
    year: number;
    metrics: {
      key: string;
      value: number;
      target: number | null;
    }[];
  };
  projection: LandingProjectionData;
}

const LANDING_KPI_FIELDS = [
  { key: "readyForPlacement", label: "Suplai tersedia" },
  { key: "activeTrainingPrograms", label: "Program pelatihan" },
  { key: "activeVocationalInstitutions", label: "Vokasi tersedia" },
  { key: "validatedDemandCount", label: "Demand" },
] as const;

const WIB_DATE_TIME_FORMAT = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Jakarta",
});

export const KemendagriLandingPage: React.FC<KemendagriLandingPageProps> = ({ kpiSummary, projection }) => {
  const {
    openLoginPage,
    setViewMode,
  } = useAppStore();

  const [activeSlide, setActiveSlide] = useState(0);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    updateTime();
    const intervalId = window.setInterval(updateTime, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const slides = [
    {
      badge: 'PROGRAM PRIORITAS NASIONAL 2026-2029',
      title: 'TASK FORCE PERCEPATAN SMK GO GLOBAL 2026',
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

  const validatedDemands = kpiSummary.metrics.find((metric) => metric.key === "validatedDemandCount");

  const handleSelectRole = (roleId: UserRole) => {
    void roleId;
    openLoginPage();
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-red-600 selection:text-white">
      {/* 1. TOP UTILITY GOVERNMENT BAR (Ala Kemendagri / Portal Resmi RI) */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-300 text-xs py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Tanggal & Hari Resmi */}
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-red-500" />
              <time dateTime={currentTime?.toISOString()}>
                {currentTime ? `${WIB_DATE_TIME_FORMAT.format(currentTime)} WIB` : "Memuat waktu WIB…"}
              </time>
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
      <header className="bg-background border-b border-border shadow-sm sticky top-0 z-40">
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
              <h1 className="text-lg sm:text-xl font-black text-foreground tracking-tight leading-none group-hover:text-primary transition">
                SMK GO GLOBAL
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Sistem Intelijen Penempatan PMI Terpadu Berbasis Pendidikan Vokasi
              </p>
            </div>
          </div>

          {/* Quick Action Button: Masuk SSO */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/lembaga/daftar"
              title="Pendaftaran lembaga SMK Go Internasional - AC"
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-bold text-primary transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4"
            >
              <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Daftar SMK Go Internasional - AC</span>
              <span className="sm:hidden">Daftar Lembaga</span>
            </a>
            <button
              onClick={() => openLoginPage()}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-500 sm:px-5"
              title="Masuk Sistem Terpadu (SSO)"
            >
              <Compass className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Masuk Sistem Terpadu (SSO)</span>
              <span className="sm:hidden">Masuk</span>
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
                href="#proyeksi-penempatan"
                className="px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition whitespace-nowrap"
              >
                Proyeksi Penempatan
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
              <a
                href="/lembaga/daftar"
                className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-900/70 px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white transition hover:border-blue-400 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Building2 className="h-4 w-4" aria-hidden="true" />
                <span>Daftar SMK Go Internasional - AC</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </a>
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
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {LANDING_KPI_FIELDS.map(({ key, label }) => {
                  const metric = kpiSummary.metrics.find((item) => item.key === key);
                  if (!metric) {
                    return null;
                  }

                  const achievement = metric.target
                    ? Math.round((metric.value / metric.target) * 100)
                    : null;

                  return (
                    <article
                      key={metric.key}
                      className="min-w-0 rounded-xl border border-slate-700/60 bg-slate-800/80 p-3"
                    >
                      <span className="block text-xs font-bold uppercase leading-relaxed text-slate-400">
                        {label} {metric.key === "validatedDemandCount" ? kpiSummary.year : ""}
                      </span>
                      <p className="mt-1 text-base font-extrabold tabular-nums text-white">
                        {metric.value.toLocaleString("id-ID")} / {metric.target?.toLocaleString("id-ID") ?? "—"}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-300">
                        {achievement === null
                          ? "Target belum diatur"
                          : `Tercapai ${achievement.toLocaleString("id-ID")}% dari target`}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>

            <p className="text-[10px] text-slate-500 text-center pt-1">
              Target tahunan dikelola superadmin. Permintaan tervalidasi dihitung dari demand berstatus disetujui pada tahun berjalan.
            </p>
          </div>
        </div>
      </section>

      <LandingProjectionDashboard projection={projection} />


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
