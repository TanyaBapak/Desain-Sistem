import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  mockAggregateMatching,
  mockDrillDownData,
  mockStageDetails,
} from '../../data';
import { ExecutiveTier } from '../../types';
import {
  ShieldAlert,
  Building2,
  Users,
  GraduationCap,
  Globe2,
  Workflow,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Award,
  Filter,
  Activity,
  FileCheck2,
  Cpu,
  BarChart3,
  MapPin,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Badge } from '../ui/Badge';

interface ExecutiveCommandCenterProps {
  onNavigate: (tab: string) => void;
}

export const ExecutiveCommandCenter: React.FC<ExecutiveCommandCenterProps> = ({ onNavigate }) => {
  const {
    candidates,
    programs,
    providers,
    demands,
    allocations,
    executiveTier,
    setExecutiveTier,
    drillDownFilter,
    setDrillDownFilter,
    activeBusinessStage,
    setActiveBusinessStage,
    setActiveStage,
  } = useAppStore();

  const [matchingModeTab, setMatchingModeTab] = useState<'aggregate' | 'stages'>('aggregate');
  const [ccSubTab, setCcSubTab] = useState<'ringkasan' | 'drilldown' | 'matching' | 'integrasi' | 'all'>('ringkasan');

  // Selected Province and Kabupaten in Drill-down
  const activeProvinceData =
    mockDrillDownData.find((p) => p.provinsi === drillDownFilter.provinsi) ||
    mockDrillDownData[0];

  const activeKabupatenData =
    activeProvinceData.kabupatenList.find(
      (k) => k.nama === drillDownFilter.kabupatenKota
    ) || activeProvinceData.kabupatenList[0];

  const activeSektorData =
    activeKabupatenData.sektorList.find(
      (s) => s.sektor === drillDownFilter.sektor
    ) || activeKabupatenData.sektorList[0];

  // Prototype KPI Metrics (from Section 4 of user spec)
  const prototypeMetrics = {
    calonPeserta: 2440,
    kapasitasPelatihan: 1920,
    demand: 1330,
    potensiMatching: 1330,
    targetNasional: 40000,
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* 1. COMMAND CENTER MASTER HEADER & PRINCIPLE BANNER */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-6 sm:p-8 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-red-400" />
              <span>SGG-AC · Command Center SMK Go Global</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              National Supply – Training – Demand – Placement Intelligence
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Platform digital terpadu untuk mengendalikan percepatan program SMK Go Global. Mengintegrasikan pemetaan calon peserta, kesiapan lembaga vokasi, penyelenggaraan pelatihan, hingga pencocokan kebutuhan tenaga kerja luar negeri dan kesiapan penempatan.
            </p>

            {/* Principle Tag */}
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
              <span className="font-semibold text-slate-400">Prinsip Utama:</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 font-bold">
                Satu Data
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 font-bold">
                Satu Proses Pemantauan
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-blue-300 font-bold">
                Satu Dashboard Pengambilan Keputusan
              </span>
            </div>
          </div>

          {/* Quick Simulation CTA */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={() => {
                setActiveStage(3);
                onNavigate('matching');
              }}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-blue-600/30 transition flex items-center justify-center gap-2"
            >
              <Workflow className="w-4 h-4" />
              <span>Buka Smart Matching Engine</span>
            </button>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Nasional 2026</span>
              <span className="text-xl font-black text-amber-400">{prototypeMetrics.targetNasional.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block">Peserta PMI Vokasi</span>
            </div>
          </div>
        </div>

        {/* System Ecosystem Relationship Note */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Lapisan Koordinasi Operasional & Analitik: Terhubung dengan <strong>e-Vokasi</strong> (Lembaga), <strong>SMART PMI</strong> (Program), dan <strong>SISKOP2MI</strong> (Rujukan Penempatan).
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Kementerian Pelindungan Pekerja Migran Indonesia (P2MI)
          </span>
        </div>
      </div>

      {/* 2. SGG-CC PROTOTYPE KPI CARDS (From Section 4 of Spec) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Indikator Capaian Utama (SGG Command Center Prototype)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium italic">
            Contoh tampilan • Data simulasi operasional Task Force
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Calon Peserta */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-400 transition">
            <span className="text-xs font-bold text-slate-500 uppercase block">Calon Peserta Siap Latih</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900">
                {prototypeMetrics.calonPeserta.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Supply
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Terhimpun dari Disnaker, SMK, BP3MI, dan BLK
            </p>
          </div>

          {/* Card 2: Kapasitas Pelatihan */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-400 transition">
            <span className="text-xs font-bold text-slate-500 uppercase block">Kapasitas Pelatihan Vokasi</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-emerald-600">
                {prototypeMetrics.kapasitasPelatihan.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Kapasitas
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Kesiapan kelas & bengkel lembaga e-Vokasi
            </p>
          </div>

          {/* Card 3: Demand */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-400 transition">
            <span className="text-xs font-bold text-slate-500 uppercase block">Lowongan Demand Luar Negeri</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-amber-600">
                {prototypeMetrics.demand.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                Slot Kerja
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Terverifikasi via SISKOP2MI / Perjanjian Bilateral
            </p>
          </div>

          {/* Card 4: Potensi Matching */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-400 transition">
            <span className="text-xs font-bold text-slate-500 uppercase block">Potensi Smart Matching</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-indigo-600">
                {prototypeMetrics.potensiMatching.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                100% Demand
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Kandidat memenuhi kualifikasi teknis awal
            </p>
          </div>
        </div>
      </div>

      {/* SUB-NAVIGASI SEGMENTED TAB UNTUK SIMPLIFIKASI UI/UX */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setCcSubTab('ringkasan')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              ccSubTab === 'ringkasan'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>1. Dashboard Pimpinan (3 Tingkat)</span>
          </button>

          <button
            onClick={() => setCcSubTab('drilldown')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              ccSubTab === 'drilldown'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>2. Drill-Down Wilayah & PIC</span>
          </button>

          <button
            onClick={() => setCcSubTab('matching')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              ccSubTab === 'matching'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>3. Matching Agregat & 6 Tahap</span>
          </button>

          <button
            onClick={() => setCcSubTab('integrasi')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              ccSubTab === 'integrasi'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>4. Integrasi Sistem (e-Vokasi, gardata, dll)</span>
          </button>
        </div>

        <button
          onClick={() => setCcSubTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            ccSubTab === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-500 hover:text-slate-800 bg-slate-100'
          }`}
        >
          {ccSubTab === 'all' ? '✓ Tampilan Lengkap' : 'Tampilkan Semua Bagian'}
        </button>
      </div>

      {/* 3. TIGA TINGKAT PENGENDALIAN DASHBOARD (Section 5 of Spec) */}
      {(ccSubTab === 'ringkasan' || ccSubTab === 'all') && (
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 block mb-0.5">
              TIGA TINGKAT PENGENDALIAN EKSEKUTIF
            </span>
            <h3 className="text-xl font-extrabold text-slate-900">
              Pusat Kendali Pengambilan Keputusan (Executive Control Tier)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih tingkat komando untuk melihat perspektif kendali strategis, taktis, hingga operasional lapangan.
            </p>
          </div>

          {/* 3 Tier Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setExecutiveTier('menteri')}
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition ${
                executiveTier === 'menteri'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tingkat 1: Menteri / Wamen
            </button>
            <button
              onClick={() => setExecutiveTier('dirjen')}
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition ${
                executiveTier === 'dirjen'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tingkat 2: Dirjen / Task Force
            </button>
            <button
              onClick={() => setExecutiveTier('bp3mi')}
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition ${
                executiveTier === 'bp3mi'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tingkat 3: BP3MI / Pemda
            </button>
          </div>
        </div>

        {/* Tier 1: Menteri / Wakil Menteri Content */}
        {executiveTier === 'menteri' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded">
                  Komando Tertinggi Menteri / Wamen P2MI
                </span>
                <h4 className="text-base font-extrabold text-slate-900 mt-1">
                  Pengendalian Target Strategis Nasional 40.000 Peserta (Tahun 2026)
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Fokus pada realisasi penempatan internasional, kepatuhan pagu anggaran, dan resolusi kendala antar-kementerian.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Realisasi Nasional</span>
                  <span className="text-xl font-black text-red-600">18.420 / 40.000</span>
                  <span className="text-[10px] text-emerald-600 font-bold block">46,0% Capaian</span>
                </div>
              </div>
            </div>

            {/* 4 Minister-Level Strategic Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Peserta Terverifikasi</span>
                <span className="text-xl font-black text-slate-900 block mt-1">2.440 Siswa</span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Siap Pelatihan</span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Kuota SK Ditetapkan</span>
                <span className="text-xl font-black text-blue-600 block mt-1">1.920 Kursi</span>
                <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">12 Batch Alokasi</span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Pelatihan Berjalan</span>
                <span className="text-xl font-black text-amber-600 block mt-1">840 Siswa</span>
                <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">Progres 42% JP</span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Siap Penempatan (Lulus)</span>
                <span className="text-xl font-black text-emerald-600 block mt-1">1.330 Siswa</span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Sertifikasi Lengkap</span>
              </div>
            </div>
          </div>
        )}

        {/* Tier 2: Dirjen / Task Force Nasional Content */}
        {executiveTier === 'dirjen' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  Pengendalian Operasional Dirjen P3KLN & Task Force
                </span>
                <h4 className="text-base font-extrabold text-slate-900 mt-1">
                  Matriks Capaian Wilayah, Sektor, Lembaga, Kebutuhan Anggaran & PIC
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Pantau kesenjangan supply-demand, kepatuhan timeline, dan peringatan dini keterlambatan per sektor.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Pagu Anggaran Berjalan</span>
                <span className="text-lg font-black text-blue-700">Rp 28,4 Miliar</span>
                <span className="text-[10px] text-slate-500 block">Dari Plafon Rp 60 M</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Provinsi Prioritas Utama</span>
                <h5 className="font-extrabold text-slate-900 text-sm">Jawa Barat & Jawa Tengah</h5>
                <p className="text-slate-500 text-[11px]">Memasok 58% dari total talenta terverifikasi nasional.</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Sektor Kebutuhan Terbesar</span>
                <h5 className="font-extrabold text-slate-900 text-sm">Kesehatan (Kaigo) & Pengelasan (Welder)</h5>
                <p className="text-slate-500 text-[11px]">Tuntutan kuota Jepang & Korea mendominasi 72% demand.</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Peringatan Keterlambatan PIC</span>
                <h5 className="font-extrabold text-amber-600 text-sm">2 Hambatan Butuh Eskalasi</h5>
                <p className="text-slate-500 text-[11px]">Slot CBT Prometric Jakarta & Legalisasi Ijazah Jerman.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tier 3: BP3MI / Pemda / Lembaga Vokasi Content */}
        {executiveTier === 'bp3mi' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Tingkat Implementasi BP3MI, Pemda & Lembaga Vokasi
                </span>
                <h4 className="text-base font-extrabold text-slate-900 mt-1">
                  Kesiapan Kelas, Presensi Peserta, Realisasi Jam Pelajaran & Asesmen
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Validasi berkas calon PMI, kesiapan sarana bengkel kerja e-Vokasi, dan tindak lanjut penempatan.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Tingkat Kehadiran Kelas</span>
                <span className="text-lg font-black text-emerald-700">96,4%</span>
                <span className="text-[10px] text-slate-500 block">Sangat Baik</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Kelas Aktif</span>
                <span className="text-base font-black text-slate-800">24 Kelas</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Rata-rata JP Tuntas</span>
                <span className="text-base font-black text-blue-600">184 / 360 JP</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Instruktur Aktif</span>
                <span className="text-base font-black text-slate-800">48 Orang</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Lembaga Terverifikasi</span>
                <span className="text-base font-black text-emerald-600">{providers.length} Lembaga</span>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* 4. FITUR KUNCI DRILL-DOWN WILAYAH & SEKTOR (Section 5 of Spec) */}
      {(ccSubTab === 'drilldown' || ccSubTab === 'all') && (
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-fade-in">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <MapPin className="w-4 h-4" />
            <span>Fitur Drill-Down Analitik SGG-CC</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">
            Penelusuran Terperinci: Provinsi → Kabupaten/Kota → Sektor & Hambatan
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Menteri dan Pimpinan Task Force dapat menelusuri secara spesifik kondisi pasokan peserta, kesiapan lembaga vokasi, serta hambatan riil dan PIC penanggung jawab di daerah.
          </p>
        </div>

        {/* 3 Cascade Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          {/* Select Provinsi */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1.5">
              1. Pilih Provinsi:
            </label>
            <select
              value={drillDownFilter.provinsi}
              onChange={(e) => {
                const newProv = e.target.value;
                const provObj = mockDrillDownData.find((p) => p.provinsi === newProv);
                const firstKab = provObj?.kabupatenList[0]?.nama || '';
                const firstSektor = provObj?.kabupatenList[0]?.sektorList[0]?.sektor || '';
                setDrillDownFilter({
                  provinsi: newProv,
                  kabupatenKota: firstKab,
                  sektor: firstSektor,
                });
              }}
              className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {mockDrillDownData.map((p) => (
                <option key={p.provinsi} value={p.provinsi}>{p.provinsi}</option>
              ))}
            </select>
          </div>

          {/* Select Kabupaten/Kota */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1.5">
              2. Pilih Kabupaten / Kota:
            </label>
            <select
              value={drillDownFilter.kabupatenKota}
              onChange={(e) => {
                const newKab = e.target.value;
                const kabObj = activeProvinceData.kabupatenList.find((k) => k.nama === newKab);
                const firstSektor = kabObj?.sektorList[0]?.sektor || '';
                setDrillDownFilter({
                  kabupatenKota: newKab,
                  sektor: firstSektor,
                });
              }}
              className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {activeProvinceData.kabupatenList.map((k) => (
                <option key={k.nama} value={k.nama}>{k.nama}</option>
              ))}
            </select>
          </div>

          {/* Select Sektor Kejuruan */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1.5">
              3. Pilih Sektor Pekerjaan:
            </label>
            <select
              value={drillDownFilter.sektor}
              onChange={(e) => setDrillDownFilter({ sektor: e.target.value })}
              className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {activeKabupatenData.sektorList.map((s) => (
                <option key={s.sektor} value={s.sektor}>{s.sektor}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Drill-Down Detail Inspection Result */}
        <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-blue-200/60 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Hasil Penelusuran Wilayah Terpilih
              </span>
              <h4 className="text-base font-extrabold text-slate-900 mt-1">
                {drillDownFilter.kabupatenKota}, {drillDownFilter.provinsi} — Sektor {drillDownFilter.sektor}
              </h4>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-xl shadow-xs">
              <Globe2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Target Penempatan: {activeSektorData.targetCountry}</span>
            </div>
          </div>

          {/* 4 Quantitative Data Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Calon Terdata</span>
              <span className="text-lg font-black text-slate-900">{activeSektorData.supplyCount} Orang</span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Kandidat Siap Latih</span>
              <span className="text-lg font-black text-emerald-600">{activeSektorData.readyCount} Orang</span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Lembaga e-Vokasi Siap</span>
              <span className="text-lg font-black text-blue-600">{activeSektorData.providerCount} Mitra</span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Kebutuhan Lowongan</span>
              <span className="text-lg font-black text-amber-600">{activeSektorData.targetDemand} Slot</span>
            </div>
          </div>

          {/* Critical Operational Bottleneck & PIC (As Requested by User Spec) */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-amber-900 block text-xs">
                  Catatan Hambatan Operasional:
                </span>
                <p className="text-amber-900/90 leading-relaxed mt-0.5 font-medium">
                  {activeSektorData.hambatanUtama}
                </p>
              </div>
            </div>

            <div className="bg-white/90 border border-amber-200 px-3 py-1.5 rounded-lg shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">PIC Penanggung Jawab:</span>
              <span className="font-extrabold text-slate-800 text-xs">{activeSektorData.picTindakLanjut}</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 5. DUA TINGKAT MODEL MATCHING & 6 TAHAPAN SISTEM (Section 3 & 6 of Spec) */}
      {(ccSubTab === 'matching' || ccSubTab === 'all') && (
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-0.5">
              MODEL MATCHING & PROSES BISNIS HULU-HILIR
            </span>
            <h3 className="text-xl font-extrabold text-slate-900">
              Matching Agregat (Makro) & Alur 6 Tahapan Operasional
            </h3>
          </div>

          {/* Subtabs for Aggregate vs Stages */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setMatchingModeTab('aggregate')}
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition ${
                matchingModeTab === 'aggregate'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Matching Agregat (Kebutuhan Kuota)
            </button>
            <button
              onClick={() => setMatchingModeTab('stages')}
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition ${
                matchingModeTab === 'stages'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Alur 6 Tahapan Sistem & PIC
            </button>
          </div>
        </div>

        {/* Tab 1: Matching Agregat (Section 6 Table from User Spec) */}
        {matchingModeTab === 'aggregate' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Matching Agregat untuk Perencanaan Kuota Nasional: Membandingkan Demand, Pasokan Terverifikasi, dan Kapasitas Lembaga.
              </span>
              <button
                onClick={() => {
                  setActiveStage(3);
                  onNavigate('matching');
                }}
                className="font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Buka Matching Individual</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Negara & Sektor</th>
                    <th className="py-3 px-4">Jabatan Target</th>
                    <th className="py-3 px-4 text-center">Demand Kuota</th>
                    <th className="py-3 px-4 text-center">Supply Terverifikasi</th>
                    <th className="py-3 px-4 text-center">Kapasitas Lembaga</th>
                    <th className="py-3 px-4 text-center">Kesenjangan Kursi</th>
                    <th className="py-3 px-4">Rencana Tindak Lanjut</th>
                    <th className="py-3 px-4">PIC Bertanggung Jawab</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {mockAggregateMatching.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 block">{item.country}</span>
                        <span className="text-[11px] text-slate-400">{item.sector}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {item.jobTitle}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-700">
                        {item.demandQuota} Orang
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-blue-700">
                        {item.verifiedSupply} Orang
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {item.providerCapacity} Kursi
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full font-bold text-[11px] ${
                            item.gapSeat < 0
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {item.gapSeat < 0 ? `Defisit ${Math.abs(item.gapSeat)} Kursi` : `Surplus +${item.gapSeat}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs leading-relaxed">
                        {item.actionPlan}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {item.responsiblePic}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: 6 Tahapan Proses Bisnis dari Hulu ke Hilir (Section 3 of Spec) */}
        {matchingModeTab === 'stages' && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-xs text-slate-500">
              Setiap tahapan memiliki PIC, tenggat waktu, status verifikasi, dan catatan hambatan sehingga Task Force dapat mendeteksi titik macet secara transparan.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockStageDetails.map((stage) => (
                <div
                  key={stage.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-400 shadow-xs transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-600 uppercase tracking-wider">
                        {stage.title}
                      </span>
                      <Badge
                        size="sm"
                        variant={
                          stage.status === 'Selesai'
                            ? 'success'
                            : stage.status === 'Sedang Berjalan'
                            ? 'primary'
                            : stage.status === 'Perlu Tindak Lanjut'
                            ? 'danger'
                            : 'neutral'
                        }
                      >
                        {stage.status}
                      </Badge>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                      {stage.subtitle}
                    </h4>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Progres Tahapan</span>
                        <span className="font-bold text-slate-700">{stage.progressPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${stage.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* PIC & Deadline */}
                    <div className="pt-1 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>PIC: <strong className="text-slate-800">{stage.pic}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Tenggat: {stage.deadline}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottleneck Notes */}
                  <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900">
                    <span className="font-bold block">Catatan Hambatan:</span>
                    <p className="mt-0.5 leading-relaxed">{stage.bottleneckNotes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* 6. ARSITEKTUR INTEGRASI SISTEM NASIONAL (Bagian 7 Rancangan) */}
      {(ccSubTab === 'integrasi' || ccSubTab === 'all') && (
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/30 text-blue-300 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Arsitektur Integrasi Sistem Nasional (SGG-CC Hub)</span>
            </div>
            <h3 className="text-xl font-black text-white">
              Satu Ekosistem Koordinasi: Orkestrasi 4 Pilar Sistem Operasional
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              SGG-CC berfungsi sebagai lapisan orkestrasi & analitik di tingkat atas yang menyinkronkan data secara real-time dari sistem eksisting tanpa meniadakan kewenangan masing-masing institusi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400">Gateway API Pusdatin Aktif</span>
          </div>
        </div>

        {/* 4 Connected Systems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* System 1: e-Vokasi */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Lembaga Vokasi
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">Kemendikbud</span>
              </div>
              <h4 className="font-extrabold text-sm text-white">e-Vokasi</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Menyediakan profil legalitas lembaga, status akreditasi, ketersediaan bengkel/lab kerja, instruktur terlisensi, dan kapasitas kelas.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-bold">✓ Data Terverifikasi</span>
              <span className="text-slate-400">Sync Tiap Jam</span>
            </div>
          </div>

          {/* System 2: gardata.sippmi.com */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-950/80 to-slate-800/90 border border-blue-500/50 shadow-md space-y-3 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-900/60 px-2 py-0.5 rounded border border-blue-400/30">
                  Pelaporan Lapangan
                </span>
                <span className="text-[10px] text-amber-400 font-bold">Feeder Aktif</span>
              </div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-extrabold text-sm text-white">gardata.sippmi.com</h4>
                <a
                  href="https://gardata.sippmi.com"
                  target="_blank"
                  rel="noreferrer"
                  title="Kunjungi Portal gardata.sippmi.com"
                  className="text-blue-400 hover:text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                <strong>Sistem Pelaporan Kegiatan Pelatihan CPMI</strong>: Menginput kehadiran harian siswa, progres Jam Pelajaran (JP), modul teknis, dan asesmen di level lembaga vokasi.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
              <span className="text-blue-400 font-bold">✓ Feeder Presensi & JP</span>
              <a
                href="https://gardata.sippmi.com"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Buka Portal</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* System 3: SMART PMI */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                  Kurikulum & Diklat
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">Kemnaker / P2MI</span>
              </div>
              <h4 className="font-extrabold text-sm text-white">SMART PMI</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Mengelola data program pelatihan vokasi resmi, katalog silabus terpadu (JIS Welder, SSW Kaigo), serta pemetaan kebutuhan upskilling.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
              <span className="text-indigo-400 font-bold">✓ Modul Terhubung</span>
              <span className="text-slate-400">Sinkronisasi Harian</span>
            </div>
          </div>

          {/* System 4: SISKOP2MI */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30">
                  Otoritas Penempatan
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">BP2MI Resmi</span>
              </div>
              <h4 className="font-extrabold text-sm text-white">SISKOP2MI</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Sistem rujukan proses penempatan legal, penerbitan E-KTKLN / ID PMI, verifikasi kontrak kerja, visa kerja, dan pelindungan penempatan luar negeri.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
              <span className="text-red-400 font-bold">✓ Otoritas Legalitas</span>
              <span className="text-slate-400">API Terkoneksi</span>
            </div>
          </div>
        </div>

        {/* API Integration & Master Data Banner */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white block">
                API Integration, Master Data & Keamanan Data Pribadi (Pusdatin)
              </span>
              <p className="text-slate-400 mt-0.5">
                Menggunakan standar format pertukaran data JSON REST API terenkripsi, identitas referensi tunggal (Single Source of Truth), dan audit trail perubahan data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-lg bg-slate-700/80 text-slate-200 font-semibold text-[11px]">
              Protokol TLS 1.3 & Enkripsi AES-256
            </span>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
