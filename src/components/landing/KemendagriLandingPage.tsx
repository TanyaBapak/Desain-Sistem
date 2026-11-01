import React, { useEffect, useState } from 'react';
import {
  useAppStore,
} from '../../store/useAppStore';
import { LandingProjectionDashboard, LandingProjectionData } from "@/components/landing/LandingProjectionDashboard";
import { PublicCommandCenterSection } from "@/components/landing/PublicCommandCenterSection";
import { PublicCommandCenterData, TrainingSectorCatalogItem } from '../../types';
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
  publicCommandCenter?: PublicCommandCenterData;
  trainingSectors: TrainingSectorCatalogItem[];
}

const TRAINING_SECTORS = ["Hospitality", "Kesehatan", "Manufaktur", "Konstruksi", "Fisherman"];
const DEMAND_COUNTRIES = ["Turki", "Jepang", "Malaysia", "Korea Selatan"];

interface ProgramTrackItem {
  type: 'teknis' | 'bahasa';
  title: string;
  jp: number;
  startDate: string;
  finishDate: string;
}

interface SectorProgramItem {
  sector: string;
  tracks: ProgramTrackItem[];
}

interface CountryProgramPillar {
  country: string;
  sectors: SectorProgramItem[];
}

const PILLAR_COUNTRY_PROGRAMS: CountryProgramPillar[] = [
  {
    country: "Turki",
    sectors: [
      {
        sector: "Hospitality",
        tracks: [
          {
            type: "teknis",
            title: "Housekeeping",
            jp: 360,
            startDate: "07 Nov 2026",
            finishDate: "24 Des 2026",
          },
          {
            type: "bahasa",
            title: "Bahasa Inggris (Housekeeping)",
            jp: 200,
            startDate: "07 Nov 2026",
            finishDate: "15 Des 2026",
          },
        ],
      },
      {
        sector: "Manufaktur",
        tracks: [
          {
            type: "teknis",
            title: "Welder (SMAW 3G/4G)",
            jp: 400,
            startDate: "10 Nov 2026",
            finishDate: "30 Des 2026",
          },
          {
            type: "bahasa",
            title: "Bahasa Turki Dasar",
            jp: 160,
            startDate: "10 Nov 2026",
            finishDate: "10 Des 2026",
          },
        ],
      },
    ],
  },
  {
    country: "Malaysia",
    sectors: [
      {
        sector: "Konstruksi",
        tracks: [
          {
            type: "teknis",
            title: "Civil Infrastructure Worker",
            jp: 360,
            startDate: "05 Nov 2026",
            finishDate: "20 Des 2026",
          },
          {
            type: "bahasa",
            title: "Bahasa Melayu & Regulasi Kerja",
            jp: 120,
            startDate: "05 Nov 2026",
            finishDate: "30 Nov 2026",
          },
        ],
      },
      {
        sector: "Perkebunan",
        tracks: [
          {
            type: "teknis",
            title: "Plantation Mechanization",
            jp: 320,
            startDate: "08 Nov 2026",
            finishDate: "18 Des 2026",
          },
          {
            type: "bahasa",
            title: "K3 & Budaya Kerja Industri",
            jp: 100,
            startDate: "08 Nov 2026",
            finishDate: "25 Nov 2026",
          },
        ],
      },
    ],
  },
  {
    country: "Korea Selatan",
    sectors: [
      {
        sector: "Fisherman",
        tracks: [
          {
            type: "teknis",
            title: "Offshore Fishery Operations",
            jp: 420,
            startDate: "03 Nov 2026",
            finishDate: "05 Jan 2027",
          },
          {
            type: "bahasa",
            title: "Bahasa Korea (EPS-TOPIK)",
            jp: 240,
            startDate: "03 Nov 2026",
            finishDate: "20 Des 2026",
          },
        ],
      },
      {
        sector: "Manufaktur",
        tracks: [
          {
            type: "teknis",
            title: "Ship Hull Assembly & Fabrication",
            jp: 450,
            startDate: "05 Nov 2026",
            finishDate: "10 Jan 2027",
          },
          {
            type: "bahasa",
            title: "Bahasa Korea Industri Terapan",
            jp: 240,
            startDate: "05 Nov 2026",
            finishDate: "22 Des 2026",
          },
        ],
      },
    ],
  },
  {
    country: "Jepang",
    sectors: [
      {
        sector: "Kesehatan",
        tracks: [
          {
            type: "teknis",
            title: "Kaigo (Perawat Lansia)",
            jp: 480,
            startDate: "01 Nov 2026",
            finishDate: "15 Jan 2027",
          },
          {
            type: "bahasa",
            title: "Bahasa Jepang (JLPT N4 / JFT-Basic)",
            jp: 320,
            startDate: "01 Nov 2026",
            finishDate: "31 Des 2026",
          },
        ],
      },
      {
        sector: "Pertanian",
        tracks: [
          {
            type: "teknis",
            title: "Smart Agriculture & Food Packaging",
            jp: 360,
            startDate: "04 Nov 2026",
            finishDate: "24 Des 2026",
          },
          {
            type: "bahasa",
            title: "Bahasa Jepang Praktis Kerja",
            jp: 200,
            startDate: "04 Nov 2026",
            finishDate: "12 Des 2026",
          },
        ],
      },
    ],
  },
];

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

function normalizeCatalogValue(value: string): string {
  return value.trim().toLocaleLowerCase("id-ID");
}

export const KemendagriLandingPage: React.FC<KemendagriLandingPageProps> = ({
  kpiSummary,
  projection,
  publicCommandCenter,
  trainingSectors,
}) => {
  const {
    openLoginPage,
    setViewMode,
  } = useAppStore();

  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    updateTime();
    const intervalId = window.setInterval(updateTime, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const vocationalCount = kpiSummary.metrics.find(
    (metric) => metric.key === "activeVocationalInstitutions",
  )?.value;
  const candidateCount =
    kpiSummary.metrics.find((metric) => metric.key === "registeredJobSeekers")?.value ??
    publicCommandCenter?.national?.candidatesCount ??
    563;
  const supplyTarget = 12600;
  const formattedTarget = supplyTarget.toLocaleString("id-ID");
  const sectorOccupations = Object.fromEntries(trainingSectors.map((sector) => {
    if (sector.occupations && sector.occupations.length > 0) {
      return [sector.name, sector.occupations.map((occupation) => occupation.title)];
    }
    const sectorNames = [sector.name, ...sector.aliases].map(normalizeCatalogValue);
    const occupationNames = (sector.occupations ?? []).flatMap((occupation) => [
      occupation.title,
      ...occupation.aliases,
    ]).map(normalizeCatalogValue);
    const targets = projection.placementTargets
      .filter((target) => sectorNames.includes(normalizeCatalogValue(target.sectorName))
        || occupationNames.includes(normalizeCatalogValue(target.occupationName)))
      .map((target) => target.occupationName.trim())
      .filter(Boolean);

    return [sector.name, Array.from(new Set(targets))];
  }));

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
                Task force SMK Go Global 2026
              </p>
            </div>
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
                href="#dashboard-command-center"
                className="px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition whitespace-nowrap"
              >
                Dashboard Command Center
              </a>
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
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-red-400" />
              <span>PROGRAM PRIORITAS NASIONAL</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
              SMK GO GLOBAL
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Task force SMK Go Global 2026. Ekosistem terpadu akselerasi dan pemantauan penyiapan tenaga kerja terampil internasional lulusan SMK dan vokasi Indonesia.
            </p>

            {/* Quick Action Button Group: SSO */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => openLoginPage()}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Masuk Sistem Terpadu (SSO)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <a
                href="/lembaga/daftar"
                className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-900/70 px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:border-blue-400 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Building2 className="h-4 w-4" aria-hidden="true" />
                <span>Daftar SMK Go Internasional</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>

            {/* Indikator Pilar Cepat */}
            <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Integrasi Dukcapil & Kemendikbud
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Kurikulum Standar Industri Global
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Monitoring 38 Provinsi
              </span>
            </div>
          </div>

          {/* Right program overview card */}
          <div className="lg:col-span-7 bg-slate-900/95 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                  INFORMASI PROGRAM
                </span>
                <h3 className="text-base font-bold text-white">
                  Alur 4 Pilar: Siap Latih hingga Siap Permintaan
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                Rantai Kesiapan Terpadu
              </span>
            </div>

            {/* Alur 4 Pilar Terhubung dengan Garis Data */}
            <div className="relative">
              {/* Desktop Connecting Line di latar belakang */}
              <div className="hidden xl:block absolute top-1/2 left-4 right-4 h-0.5 -translate-y-1/2 bg-gradient-to-r from-emerald-500/40 via-blue-500/50 via-amber-500/40 to-cyan-500/40 pointer-events-none z-0" />

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 relative z-10">
                {/* Pilar 1 */}
                <article className="group relative rounded-xl border border-slate-700/80 bg-slate-800/90 p-3.5 flex flex-col justify-between hover:border-emerald-500/50 hover:bg-slate-800 transition shadow-sm">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">
                        Pilar 1
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white">
                      1. Siap Latih
                    </h4>
                    <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                      Calon Peserta Siap Latih
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                      Target: 12.600:
                    </span>
                    <span className="text-xs font-black text-emerald-400 tabular-nums mt-0.5 block">
                      12.600 Peserta
                    </span>
                  </div>
                  {/* Panah alur desktop */}
                  <div className="hidden xl:flex absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 items-center justify-center text-[10px] text-slate-400 z-20">
                    →
                  </div>
                </article>

                {/* Pilar 2 */}
                <article className="group relative rounded-xl border border-slate-700/80 bg-slate-800/90 p-3.5 flex flex-col justify-between hover:border-blue-500/50 hover:bg-slate-800 transition shadow-sm">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Standardisasi
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white">
                      2. Siap Program
                    </h4>
                    <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                      Bahasa · Teknis · Sertifikasi
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                      Target: 630 Kelas:
                    </span>
                    <span className="text-xs font-black text-blue-300 tabular-nums mt-0.5 block">
                      630 Kelas (5 Sektor)
                    </span>
                  </div>
                  {/* Panah alur desktop */}
                  <div className="hidden xl:flex absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 items-center justify-center text-[10px] text-slate-400 z-20">
                    →
                  </div>
                </article>

                {/* Pilar 3 */}
                <article className="group relative rounded-xl border border-slate-700/80 bg-slate-800/90 p-3.5 flex flex-col justify-between hover:border-amber-500/50 hover:bg-slate-800 transition shadow-sm">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Fasilitas
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white">
                      3. Siap Vokasi
                    </h4>
                    <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                      Sesuai Vokasi Ber-Suplai
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                      Vokasi Ber-Suplai:
                    </span>
                    <span className="text-xs font-black text-amber-300 tabular-nums mt-0.5 block">
                      {vocationalCount?.toLocaleString("id-ID") ?? "8"} Vokasi Ber-Suplai
                    </span>
                  </div>
                  {/* Panah alur desktop */}
                  <div className="hidden xl:flex absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 items-center justify-center text-[10px] text-slate-400 z-20">
                    →
                  </div>
                </article>

                {/* Pilar 4 */}
                <article className="group relative rounded-xl border border-slate-700/80 bg-slate-800/90 p-3.5 flex flex-col justify-between hover:border-cyan-500/50 hover:bg-slate-800 transition shadow-sm">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Order Kerja
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white">
                      4. Siap Permintaan
                    </h4>
                    <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                      Permintaan Luar Negeri
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                      Target: 4 Negara:
                    </span>
                    <span className="text-xs font-black text-cyan-300 tabular-nums mt-0.5 block">
                      4 Negara (Turki, Jepang...)
                    </span>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PUBLIC COMMAND CENTER DASHBOARD & SEBARAN WILAYAH */}
      <PublicCommandCenterSection
        initialData={publicCommandCenter}
        programsCount={trainingSectors.length}
        sectorOccupations={sectorOccupations}
        trainingSectors={trainingSectors}
      />

      <LandingProjectionDashboard projection={projection} />
    </div>
  );
};
