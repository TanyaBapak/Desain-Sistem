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
  Users,
  GraduationCap,
  Globe2,
  Sparkles,
} from 'lucide-react';

interface KemendagriLandingPageProps {
  kpiSummary: {
    year: number;
    metrics: {
      key: string;
      value: number;
      target: number | null;
    }[];
    vokasiWithSupplyCount?: number;
    activeClassesCount?: number;
    demandHeadcount?: number;
    demandFilledQuota?: number;
    demandCountryCount?: number;
    verifiedInstitutionsCount?: number;
    activeInstitutionsCount?: number;
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
            title: "Housekeeping / Waiter / Spa Therapist",
            jp: 180,
            startDate: "07 Nov 2026",
            finishDate: "24 Des 2026",
          },
          {
            type: "bahasa",
            title: "Bahasa Inggris (Hospitality)",
            jp: 640,
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
            title: "Pelatihan & Sertifikasi Teknis Manufaktur",
            jp: 320,
            startDate: "10 Nov 2026",
            finishDate: "30 Des 2026",
          },
          {
            type: "bahasa",
            title: "Bahasa Inggris / Turki Dasar",
            jp: 640,
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
            title: "Pelatihan Teknis Konstruksi",
            jp: 320,
            startDate: "05 Nov 2026",
            finishDate: "20 Des 2026",
          },
          {
            type: "bahasa",
            title: "Bahasa Inggris",
            jp: 640,
            startDate: "05 Nov 2026",
            finishDate: "30 Nov 2026",
          },
        ],
      },
      {
        sector: "Agriculture",
        tracks: [
          {
            type: "teknis",
            title: "Plantation Worker Sawit",
            jp: 140,
            startDate: "08 Nov 2026",
            finishDate: "18 Des 2026",
          },
          {
            type: "bahasa",
            title: "Bahasa & Budaya Kerja Perkebunan",
            jp: 40,
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
            title: "Sertifikasi Teknis ABK Fishermen",
            jp: 20,
            startDate: "03 Nov 2026",
            finishDate: "05 Jan 2027",
          },
          {
            type: "bahasa",
            title: "Bahasa Korea (EPS-TOPIK)",
            jp: 640,
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
            title: "Welder (160 JP) / Molding (320 JP)",
            jp: 160,
            startDate: "05 Nov 2026",
            finishDate: "10 Jan 2027",
          },
          {
            type: "bahasa",
            title: "Bahasa Korea (EPS-TOPIK)",
            jp: 640,
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
            title: "Caregiver (Lvl Pelaksana) SSW",
            jp: 160,
            startDate: "01 Nov 2026",
            finishDate: "15 Jan 2027",
          },
          {
            type: "bahasa",
            title: "Bahasa Jepang (JLPT N4 / JFT-Basic)",
            jp: 640,
            startDate: "01 Nov 2026",
            finishDate: "31 Des 2026",
          },
        ],
      },
      {
        sector: "Agriculture",
        tracks: [
          {
            type: "teknis",
            title: "Farmer / Farming",
            jp: 140,
            startDate: "04 Nov 2026",
            finishDate: "24 Des 2026",
          },
          {
            type: "bahasa",
            title: "Bahasa Jepang",
            jp: 640,
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

  const handlePillarDrilldown = (stageType: "peserta" | "program" | "lembaga" | "demand") => {
    const elem = document.getElementById("dashboard-command-center");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
    window.dispatchEvent(new CustomEvent("p2mi:open-drilldown", { detail: stageType }));
  };

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    updateTime();
    const intervalId = window.setInterval(updateTime, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  // Metrik Dinamis Alur 4 Pilar
  // Pilar 1: Suplai / Siap Latih
  const TARGET_SUPPLY = 12600;
  const TARGET_PROGRAM = 630;
  const TARGET_VOKASI = 2382;
  const TARGET_DEMAND_COUNTRIES = 4;

  const candidateCount =
    kpiSummary.metrics.find((metric) => metric.key === "registeredJobSeekers")?.value ??
    publicCommandCenter?.national?.candidatesCount ??
    0;
  const candidateTarget = TARGET_SUPPLY;
  const candidatePercent = Math.min(
    100,
    Math.round((candidateCount / (candidateTarget || 1)) * 100),
  );

  // Pilar 2: Siap Program (Realisasi Program & Kurikulum Standarisasi)
  const curriculumCount =
    kpiSummary.metrics.find((metric) => metric.key === "activeTrainingPrograms")?.value ??
    publicCommandCenter?.national?.programsCount ??
    0;
  const activeClassesCount =
    kpiSummary.activeClassesCount ??
    publicCommandCenter?.national?.activeClassesCount ??
    0;
  const programTarget = TARGET_PROGRAM;
  const programPercent = Math.min(
    100,
    Math.round((curriculumCount / (programTarget || 1)) * 100),
  );

  // Pilar 3: Siap Vokasi (Lembaga Vokasi Terdaftar, Terverifikasi & Vokasi Suplai)
  const vokasiWithSupplyCount =
    kpiSummary.vokasiWithSupplyCount ??
    publicCommandCenter?.national?.vokasiWithSupplyCount ??
    0;
  const rawVocational =
    kpiSummary.activeInstitutionsCount ??
    kpiSummary.metrics.find((metric) => metric.key === "activeVocationalInstitutions")?.value ??
    publicCommandCenter?.national?.providersCount;
  const vocationalCount = rawVocational && rawVocational > 0 ? rawVocational : 0;
  const vocationalTarget = TARGET_VOKASI;
  const vocationalPercent = Math.min(
    100,
    Math.round((vocationalCount / (vocationalTarget || 1)) * 100),
  );

  // Pilar 4: Siap Permintaan (Demand Luar Negeri, Kuota Headcount & Kuota Terpenuhi)
  const demandCount =
    kpiSummary.metrics.find((metric) => metric.key === "validatedDemandCount")?.value ??
    publicCommandCenter?.national?.demandsCount ??
    0;
  const demandHeadcount =
    kpiSummary.demandHeadcount ??
    publicCommandCenter?.national?.totalDemandHeadcount ??
    0;
  const demandFilledQuota =
    kpiSummary.demandFilledQuota ??
    publicCommandCenter?.national?.totalDemandFilledQuota ??
    0;
  const demandPercent = Math.min(
    100,
    Math.round((demandFilledQuota / (demandHeadcount || 1)) * 100),
  );
  const targetCountryCount =
    kpiSummary.demandCountryCount ??
    (projection.countries.length > 0 ? projection.countries.length : (publicCommandCenter?.national?.demandCountryCount ?? TARGET_DEMAND_COUNTRIES));
  const targetCountryNames = projection.countries.length > 0
    ? projection.countries.slice(0, 3).map((c) => c.name).join(", ") + (projection.countries.length > 3 ? "…" : "")
    : "Turki, Jepang, Korea…";
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

          {/* Right program overview card - Modern 2x2 Ecosystem Grid */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl space-y-5">
            {/* Header Alur Ekosistem */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                      Alur Ekosistem Hulu ke Hilir
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Hulu ke Hilir
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Rantai proses terpadu dari penjaringan talenta hingga penempatan luar negeri.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-Time</span>
                </div>
              </div>
            </div>

            {/* 2x2 Interactive Flow Grid */}
            <div className="relative">
              {/* Connector lines between cards (Desktop) */}
              {/* Top Row Connector Arrow: Card 1 -> Card 2 */}
              <div className="hidden md:flex absolute top-[24%] left-[48%] -translate-x-1/2 -translate-y-1/2 items-center justify-center z-20 pointer-events-none">
                <div className="flex items-center gap-1 bg-slate-900/95 border border-cyan-500/40 px-2 py-0.5 rounded-full shadow-lg shadow-cyan-950/60 text-cyan-400 text-[10px] font-extrabold">
                  <span className="animate-pulse">---▶</span>
                </div>
              </div>

              {/* S-curve connector badge: Card 2 (top-right) -> Card 3 (bottom-left) */}
              <div className="hidden md:flex absolute top-[50%] left-[48%] -translate-x-1/2 -translate-y-1/2 items-center justify-center z-20 pointer-events-none">
                <div className="flex items-center gap-1.5 bg-slate-900/95 border border-slate-700/80 px-2.5 py-0.5 rounded-full text-slate-300 text-[9px] font-semibold shadow-md">
                  <span className="text-cyan-400 font-bold">↺</span> Standardisasi ke Fasilitas
                </div>
              </div>

              {/* Bottom Row Connector Arrow: Card 3 -> Card 4 */}
              <div className="hidden md:flex absolute top-[76%] left-[48%] -translate-x-1/2 -translate-y-1/2 items-center justify-center z-20 pointer-events-none">
                <div className="flex items-center gap-1 bg-slate-900/95 border border-purple-500/40 px-2 py-0.5 rounded-full shadow-lg shadow-purple-950/60 text-purple-400 text-[10px] font-extrabold">
                  <span className="animate-pulse">---▶</span>
                </div>
              </div>

              {/* The 2x2 Grid of 4 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-0">
                {/* 1. Siap Latih (Top-Left) */}
                <article
                  onClick={() => handlePillarDrilldown("peserta")}
                  className="group relative rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-slate-900/95 p-4 sm:p-5 flex flex-col justify-between hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-900/20 transition-all duration-300 cursor-pointer"
                  title="Klik untuk membuka data rincian peserta / suplai siap latih"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                        1. Siap Latih
                      </h4>
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-inner">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Hero Number */}
                    <div className="my-2">
                      <div className="text-3xl sm:text-4xl font-black text-white tracking-tight tabular-nums">
                        {candidateCount.toLocaleString("id-ID")}
                        <span className="text-xs text-cyan-400 font-semibold ml-2">Peserta Terdata</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Calon Peserta Siap Latih Terdaftar Riil
                      </p>
                    </div>

                    {/* Rincian Keterangan */}
                    <div className="mt-2 py-2 px-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1 text-[10px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Target Penjaringan:</span>
                        <strong className="text-slate-200 font-bold">{candidateTarget.toLocaleString("id-ID")} Peserta</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Capaian Terdata:</span>
                        <strong className="text-cyan-300 font-bold">{candidatePercent}% ({candidateCount.toLocaleString("id-ID")})</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Sebaran Wilayah:</span>
                        <strong className="text-emerald-400 font-bold">38 Provinsi (100% Dukcapil)</strong>
                      </div>
                    </div>
                  </div>

                  {/* Badges / Pill Tags */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold mt-2">
                    <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {candidateCount.toLocaleString("id-ID")} Peserta
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60">
                      Target: {candidateTarget.toLocaleString("id-ID")}
                    </span>
                  </div>
                </article>

                {/* 2. Siap Program (Top-Right) */}
                <article
                  onClick={() => handlePillarDrilldown("program")}
                  className="group relative rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-900/95 p-4 sm:p-5 flex flex-col justify-between hover:border-amber-400 hover:shadow-xl hover:shadow-amber-900/20 transition-all duration-300 cursor-pointer"
                  title="Klik untuk membuka data rincian 5 sektor program prioritas"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors">
                        2. Siap Program
                      </h4>
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Hero Number */}
                    <div className="my-2">
                      <div className="text-3xl sm:text-4xl font-black text-white tracking-tight tabular-nums">
                        {activeClassesCount.toLocaleString("id-ID")}
                        <span className="text-xs text-amber-400 font-semibold ml-2">Kelas Berjalan</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Kelas Pelatihan Terstandarisasi JP BP2MI
                      </p>
                    </div>

                    {/* Rincian Keterangan */}
                    <div className="mt-2 py-2 px-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1 text-[10px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Target Kurikulum:</span>
                        <strong className="text-slate-200 font-bold">{programTarget.toLocaleString("id-ID")} Standar</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Kurikulum Aktif:</span>
                        <strong className="text-amber-400 font-bold">{curriculumCount.toLocaleString("id-ID")} Kurikulum</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Peserta Siap Program:</span>
                        <strong className="text-cyan-300 font-bold">{candidateCount.toLocaleString("id-ID")} Peserta</strong>
                      </div>
                    </div>
                  </div>

                  {/* Badges / Pill Tags */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold mt-2">
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {activeClassesCount} Kelas Berjalan
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-800/80 text-amber-300 border border-slate-700/60">
                      {curriculumCount.toLocaleString("id-ID")} Kurikulum Aktif
                    </span>
                  </div>
                </article>

                {/* 3. Siap Vokasi (Bottom-Left) */}
                <article
                  onClick={() => handlePillarDrilldown("lembaga")}
                  className="group relative rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-900/95 p-4 sm:p-5 flex flex-col justify-between hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-900/20 transition-all duration-300 cursor-pointer"
                  title="Klik untuk membuka data rincian lembaga vokasi suplai"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                        3. Siap Vokasi
                      </h4>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Hero Number */}
                    <div className="my-2">
                      <div className="text-3xl sm:text-4xl font-black text-white tracking-tight tabular-nums">
                        {vokasiWithSupplyCount.toLocaleString("id-ID")}
                        <span className="text-xs text-emerald-400 font-semibold ml-2">Vokasi Suplai</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Lembaga Vokasi Penyuplai Peserta Aktif
                      </p>
                    </div>

                    {/* Keterangan Kesiapan Vokasi */}
                    <div className="mt-2 py-2 px-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1 text-[10px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Target LPK / Vokasi:</span>
                        <strong className="text-slate-200 font-bold">{vocationalTarget.toLocaleString("id-ID")} Target</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Lembaga Terdaftar:</span>
                        <strong className="text-emerald-400 font-bold">{vocationalCount.toLocaleString("id-ID")} Lembaga</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Peserta Suplai:</span>
                        <strong className="text-cyan-400 font-bold">{candidateCount.toLocaleString("id-ID")} Peserta</strong>
                      </div>
                    </div>
                  </div>

                  {/* Badges / Pill Tags */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold mt-2">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {vokasiWithSupplyCount} Vokasi Suplai
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-800/80 text-emerald-400 border border-slate-700/60">
                      {vocationalCount.toLocaleString("id-ID")} Lembaga Terdaftar
                    </span>
                  </div>
                </article>

                {/* 4. Siap Permintaan (Bottom-Right) */}
                <article
                  onClick={() => handlePillarDrilldown("demand")}
                  className="group relative rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-slate-900/90 to-slate-900/95 p-4 sm:p-5 flex flex-col justify-between hover:border-purple-400 hover:shadow-xl hover:shadow-purple-900/20 transition-all duration-300 cursor-pointer"
                  title="Klik untuk membuka data rincian permintaan luar negeri"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-extrabold text-white group-hover:text-purple-300 transition-colors">
                        4. Siap Permintaan
                      </h4>
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-inner">
                        <Globe2 className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Hero Number */}
                    <div className="my-2">
                      <div className="text-3xl sm:text-4xl font-black text-white tracking-tight tabular-nums">
                        {demandHeadcount.toLocaleString("id-ID")}
                        <span className="text-xs text-purple-400 font-semibold ml-2">Kuota Demand</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Kebutuhan Pekerja Migran Luar Negeri
                      </p>
                    </div>

                    {/* Keterangan Demand Luar Negeri */}
                    <div className="mt-2 py-2 px-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1 text-[10px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Negara Mitra Resmi:</span>
                        <strong className="text-cyan-300 font-bold">{targetCountryCount} Negara ({targetCountryNames})</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Headcount Order Batch I:</span>
                        <strong className="text-amber-400 font-bold">{demandHeadcount} Kuota ({demandCount} Order)</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Kuota Terisi:</span>
                        <strong className="text-emerald-400 font-bold">{demandFilledQuota} Kuota ({demandPercent}%)</strong>
                      </div>
                    </div>
                  </div>

                  {/* Badges / Pill Tags */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold mt-2">
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {demandCount} Order ({demandHeadcount.toLocaleString("id-ID")} Kuota)
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-800/80 text-purple-300 border border-slate-700/60">
                      {targetCountryCount} Negara Mitra
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
