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
  const candidateCount =
    kpiSummary.metrics.find((metric) => metric.key === "registeredJobSeekers")?.value ??
    publicCommandCenter?.national?.candidatesCount ??
    0;
  const rawCandidateTarget = kpiSummary.metrics.find((metric) => metric.key === "registeredJobSeekers")?.target;
  const candidateTarget = rawCandidateTarget && rawCandidateTarget !== 6000 && rawCandidateTarget > 0
    ? rawCandidateTarget
    : 12600;
  const candidatePercent = Math.min(
    100,
    Math.round((candidateCount / (candidateTarget || 1)) * 100),
  );

  // Pilar 2: Siap Program (Realisasi Kelas Aktif vs Kurikulum e-Vokasi)
  const curriculumCount =
    kpiSummary.metrics.find((metric) => metric.key === "activeTrainingPrograms")?.value ??
    publicCommandCenter?.national?.programsCount ??
    9811;
  const activeClassesCount =
    kpiSummary.activeClassesCount ??
    publicCommandCenter?.national?.activeClassesCount ??
    4;
  const programTarget =
    kpiSummary.metrics.find((metric) => metric.key === "activeTrainingPrograms")?.target ??
    630;
  const programPercent = Math.min(
    100,
    Math.round((activeClassesCount / (programTarget || 1)) * 100),
  );

  // Pilar 3: Siap Vokasi (Vokasi Ber-Suplai dari data siap peserta vs Total Direktori)
  const vokasiWithSupplyCount =
    kpiSummary.vokasiWithSupplyCount ??
    publicCommandCenter?.national?.vokasiWithSupplyCount ??
    3;
  const vocationalCount =
    kpiSummary.metrics.find((metric) => metric.key === "activeVocationalInstitutions")?.value ??
    publicCommandCenter?.national?.providersCount ??
    1707;
  const vocationalTarget =
    kpiSummary.metrics.find((metric) => metric.key === "activeVocationalInstitutions")?.target ??
    2382;
  const vocationalPercent = Math.min(
    100,
    Math.round((vocationalCount / (vocationalTarget || 1)) * 100),
  );

  // Pilar 4: Siap Permintaan (Demand Luar Negeri, Kuota Headcount & Kuota Terpenuhi)
  const demandCount =
    kpiSummary.metrics.find((metric) => metric.key === "validatedDemandCount")?.value ??
    publicCommandCenter?.national?.demandsCount ??
    5;
  const demandHeadcount =
    kpiSummary.demandHeadcount ??
    publicCommandCenter?.national?.totalDemandHeadcount ??
    210;
  const demandFilledQuota =
    kpiSummary.demandFilledQuota ??
    publicCommandCenter?.national?.totalDemandFilledQuota ??
    57;
  const demandPercent = Math.min(
    100,
    Math.round((demandFilledQuota / (demandHeadcount || 1)) * 100),
  );
  const targetCountryCount =
    kpiSummary.demandCountryCount ??
    (projection.countries.length > 0 ? projection.countries.length : 4);
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

          {/* Right program overview card */}
          <div className="lg:col-span-7 bg-slate-900/95 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/40 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    Alur Ekosistem SMK Go Global: Hulu ke Hilir
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Rantai proses terpadu dari penjaringan talenta hingga penempatan luar negeri.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full shrink-0 self-start sm:self-auto">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Alur Terhubung Real-Time</span>
              </div>
            </div>

            {/* Alur 4 Pilar Terhubung dengan Garis Data */}
            <div className="relative">
              {/* Desktop Connecting Line di latar belakang */}
              <div className="hidden xl:block absolute top-1/2 left-6 right-6 h-0.5 -translate-y-1/2 bg-gradient-to-r from-blue-500/50 via-indigo-500/50 via-emerald-500/50 to-amber-500/50 pointer-events-none z-0" />

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 relative z-10">
                {/* Pilar 1 */}
                <article
                  onClick={() => handlePillarDrilldown("peserta")}
                  className="group relative rounded-xl border border-blue-500/60 bg-slate-800/95 p-3.5 flex flex-col justify-between hover:border-blue-400 hover:bg-slate-800 hover:shadow-lg hover:shadow-blue-900/30 transition cursor-pointer"
                  title="Klik untuk membuka data rincian peserta / suplai siap latih"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        PENJARINGAN
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white group-hover:text-blue-300 transition-colors">
                      1. Siap Latih / Suplai Tersedia
                    </h4>
                    <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                      Calon Peserta Siap Latih
                    </p>

                    {/* Informasi Ketercapaian & Progres */}
                    <div className="mt-2.5 bg-slate-900/90 rounded-lg p-2 border border-slate-700/60">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-emerald-400 tabular-nums">{candidatePercent}%</span>
                        <span className="text-slate-200 tabular-nums">
                          {candidateCount.toLocaleString("id-ID")} / {candidateTarget.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${Math.max(candidateCount > 0 ? 3 : 0, Math.min(100, candidatePercent))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Target: {candidateTarget.toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs font-black text-emerald-400 tabular-nums">
                      {candidateCount.toLocaleString("id-ID")} Peserta
                    </span>
                  </div>

                  {/* Panah alur desktop */}
                  <div className="hidden xl:flex absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-900 border border-blue-500/50 items-center justify-center text-[10px] text-blue-400 z-20">
                    →
                  </div>
                </article>

                {/* Pilar 2 */}
                <article
                  onClick={() => handlePillarDrilldown("program")}
                  className="group relative rounded-xl border border-slate-700/80 bg-slate-800/90 p-3.5 flex flex-col justify-between hover:border-indigo-400 hover:bg-slate-800 hover:shadow-lg hover:shadow-indigo-900/30 transition cursor-pointer"
                  title="Klik untuk membuka data rincian program pelatihan"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        STANDARDISASI
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                      2. Siap Program
                    </h4>
                    <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                      Bahasa · Teknis · Sertifikasi
                    </p>

                    {/* Informasi Ketercapaian & Progres Kelas */}
                    <div className="mt-2.5 bg-slate-900/90 rounded-lg p-2 border border-slate-700/60">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-indigo-400 tabular-nums">{programPercent}%</span>
                        <span className="text-slate-200 tabular-nums">
                          {activeClassesCount.toLocaleString("id-ID")} / {programTarget.toLocaleString("id-ID")} Kelas
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                          style={{ width: `${Math.max(activeClassesCount > 0 ? 3 : 0, Math.min(100, programPercent))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Target: {programTarget.toLocaleString("id-ID")} Kelas
                    </span>
                    <span className="text-xs font-black text-indigo-300 tabular-nums">
                      {curriculumCount.toLocaleString("id-ID")} Kurikulum
                    </span>
                  </div>

                  {/* Panah alur desktop */}
                  <div className="hidden xl:flex absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 items-center justify-center text-[10px] text-slate-400 z-20">
                    →
                  </div>
                </article>

                {/* Pilar 3 */}
                <article
                  onClick={() => handlePillarDrilldown("lembaga")}
                  className="group relative rounded-xl border border-slate-700/80 bg-slate-800/90 p-3.5 flex flex-col justify-between hover:border-emerald-400 hover:bg-slate-800 hover:shadow-lg hover:shadow-emerald-900/30 transition cursor-pointer"
                  title="Klik untuk membuka data rincian lembaga vokasi ber-suplai"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        FASILITAS
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                      3. Siap Vokasi
                    </h4>
                    <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                      Sesuai Vokasi Ber-Suplai
                    </p>

                    {/* Informasi Ketercapaian & Progres Vokasi Terdaftar */}
                    <div className="mt-2.5 bg-slate-900/90 rounded-lg p-2 border border-slate-700/60">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-emerald-400 tabular-nums">{vocationalPercent}%</span>
                        <span className="text-slate-200 tabular-nums">
                          {vocationalCount.toLocaleString("id-ID")} / {vocationalTarget.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${Math.max(vocationalCount > 0 ? 3 : 0, Math.min(100, vocationalPercent))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Vokasi Ber-Suplai:
                    </span>
                    <span className="text-xs font-black text-emerald-300 tabular-nums">
                      {vokasiWithSupplyCount} Vokasi ({candidateCount} Peserta)
                    </span>
                  </div>

                  {/* Panah alur desktop */}
                  <div className="hidden xl:flex absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 items-center justify-center text-[10px] text-slate-400 z-20">
                    →
                  </div>
                </article>

                {/* Pilar 4 */}
                <article
                  onClick={() => handlePillarDrilldown("demand")}
                  className="group relative rounded-xl border border-slate-700/80 bg-slate-800/90 p-3.5 flex flex-col justify-between hover:border-amber-400 hover:bg-slate-800 hover:shadow-lg hover:shadow-amber-900/30 transition cursor-pointer"
                  title="Klik untuk membuka data rincian permintaan luar negeri"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                        <Globe2 className="w-4 h-4" />
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ORDER KERJA
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors">
                      4. Siap Permintaan
                    </h4>
                    <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                      Permintaan Luar Negeri
                    </p>

                    {/* Informasi Ketercapaian & Progres Pemenuhan Kuota */}
                    <div className="mt-2.5 bg-slate-900/90 rounded-lg p-2 border border-slate-700/60">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-amber-400 tabular-nums">{demandPercent}%</span>
                        <span className="text-slate-200 tabular-nums">
                          {demandFilledQuota.toLocaleString("id-ID")} / {demandHeadcount.toLocaleString("id-ID")} Kuota
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all duration-500"
                          style={{ width: `${Math.max(demandFilledQuota > 0 ? 3 : 0, Math.min(100, demandPercent))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Target: {targetCountryCount} Negara Mitra
                    </span>
                    <span className="text-xs font-black text-cyan-300 tabular-nums">
                      {demandCount.toLocaleString("id-ID")} Order ({demandHeadcount} Kuota)
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
