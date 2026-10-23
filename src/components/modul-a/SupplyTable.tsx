import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  CheckSquare,
  Square,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Edit2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/useAppStore';
import { CandidateParticipant } from '../../types';
import { Badge } from '../ui/Badge';
import { CandidateDetailModal } from './CandidateDetailModal';
import { CandidateFormModal } from './CandidateFormModal';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import { archiveBusinessData, saveBusinessData } from '../../lib/business-data';

export const SupplyTable: React.FC = () => {
  const {
    candidates,
    selectedCandidateIds,
    toggleCandidateSelection,
    selectAllCandidates,
    clearCandidateSelection,
    searchCandidate,
    setSearchCandidate,
    filterProvinsi,
    setFilterProvinsi,
    filterEducation,
    setFilterEducation,
    filterReadiness,
    setFilterReadiness,
    filterVerification,
    setFilterVerification,
    filterLanguage,
    setFilterLanguage,
    setActiveStage,
    currentRole,
    currentScope,
    setCurrentTab,
  } = useAppStore();

  const [activeCandidate, setActiveCandidate] = useState<CandidateParticipant | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [candidateToEdit, setCandidateToEdit] = useState<CandidateParticipant | null>(null);
  const [deletingCandidate, setDeletingCandidate] = useState<CandidateParticipant | null>(null);
  const [isGardataSyncing, setIsGardataSyncing] = useState(false);

  // Unique filter options extracted from candidates
  const provinsiOptions = useMemo(() => {
    return Array.from(new Set(candidates.map((c) => c.provinsi)));
  }, [candidates]);

  // Filtered dataset
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // Search
      const searchLower = searchCandidate.toLowerCase();
      const matchSearch =
        !searchCandidate ||
        c.fullName.toLowerCase().includes(searchLower) ||
        c.id.toLowerCase().includes(searchLower) ||
        c.institutionName.toLowerCase().includes(searchLower) ||
        c.major.toLowerCase().includes(searchLower) ||
        c.skills.some((s) => s.toLowerCase().includes(searchLower));

      // Filters
      const matchProv = filterProvinsi === 'ALL' || c.provinsi === filterProvinsi;
      const matchEdu = filterEducation === 'ALL' || c.educationLevel === filterEducation;
      const matchReadiness = filterReadiness === 'ALL' || c.readinessStatus === filterReadiness;
      const matchVerif = filterVerification === 'ALL' || c.verificationStatus === filterVerification;
      const matchLang =
        filterLanguage === 'ALL' ||
        c.languageProficiency.some((lp) => lp.language === filterLanguage);

      return matchSearch && matchProv && matchEdu && matchReadiness && matchVerif && matchLang;
    });
  }, [
    candidates,
    searchCandidate,
    filterProvinsi,
    filterEducation,
    filterReadiness,
    filterVerification,
    filterLanguage,
  ]);

  // Bulk selection handling
  const allFilteredSelected =
    filteredCandidates.length > 0 &&
    filteredCandidates.every((c) => selectedCandidateIds.includes(c.id));

  const handleSelectAllToggle = () => {
    if (allFilteredSelected) {
      clearCandidateSelection();
    } else {
      selectAllCandidates(filteredCandidates.map((c) => c.id));
    }
  };

  const readyCount = candidates.filter((c) => c.readinessStatus === 'Ready for Placement').length;
  const upskillCount = candidates.filter((c) => c.readinessStatus === 'Needs Upskilling').length;
  const verifiedCount = candidates.filter((c) => c.verificationStatus === 'Verified').length;

  const readinessLabels: Record<CandidateParticipant['readinessStatus'], string> = {
    'Ready for Placement': 'Siap penempatan',
    'Needs Upskilling': 'Perlu peningkatan',
    'Needs Reskilling': 'Perlu pelatihan ulang',
  };
  const verificationLabels: Record<CandidateParticipant['verificationStatus'], string> = {
    Verified: 'Terverifikasi',
    'Pending Verification': 'Menunggu verifikasi',
    Unverified: 'Belum diverifikasi',
  };
  const canManageCandidates = ['disnaker', 'vokasi', 'taskforce', 'superadmin'].includes(currentRole);
  const canVerifyCandidates = ['taskforce', 'verifikator'].includes(currentRole);
  const canMatchCandidates = ['taskforce', 'matching', 'verifikator'].includes(currentRole);
  const canArchiveCandidates = ['taskforce', 'superadmin'].includes(currentRole);
  const canSyncGardata = ['taskforce', 'superadmin'].includes(currentRole);

  const syncGardata = () => {
    router.post('/integrations/gardata/sync', {}, {
      preserveScroll: true,
      onStart: () => setIsGardataSyncing(true),
      onSuccess: () => toast.success('Sinkronisasi Gardata telah dijadwalkan.'),
      onError: () => toast.error('Sinkronisasi Gardata gagal dimulai. Periksa konfigurasi antrean.'),
      onFinish: () => setIsGardataSyncing(false),
    });
  };

  return (
    <div className="space-y-6">
      {/* 3-Layer Security Scope Notification Ribbon */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-blue-800 bg-gradient-to-r from-blue-900 to-indigo-900 p-4 text-white shadow-xs sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-800 flex items-center justify-center font-bold text-amber-400 shrink-0">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
              <h1 className="text-base font-semibold tracking-tight sm:text-lg">Pencari Kerja</h1>
              <span className="rounded px-2 py-1 text-xs font-semibold text-blue-100 bg-blue-700/60">
                Scope: {currentScope.name}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-blue-100">
              {currentRole === 'disnaker'
                ? 'Kewenangan Disnaker: input dan perbarui data calon peserta di wilayah binaan Anda.'
                : currentRole === 'vokasi'
                  ? 'Kelola data peserta yang terdaftar pada lembaga vokasi Anda.'
                  : 'Menampilkan data calon peserta siap latih terintegrasi dengan validasi NIK Dukcapil & standar SSW.'}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {canSyncGardata && <button
            type="button"
            onClick={syncGardata}
            disabled={isGardataSyncing}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-xs transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isGardataSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{isGardataSyncing ? 'Menjadwalkan…' : 'Sinkronisasi Gardata'}</span>
          </button>}
          {canManageCandidates && <button
            onClick={() => {
              setCandidateToEdit(null);
              setFormMode('create');
              setIsFormOpen(true);
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-500 sm:w-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Tambah Calon Peserta</span>
          </button>}

          {canVerifyCandidates && <button
            onClick={() => setCurrentTab('approvals')}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-900 shadow-xs transition hover:bg-blue-50 sm:w-auto"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Pusat Verifikasi & Usulan</span>
          </button>}
        </div>
      </div>

      {/* Metric Cards Top Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">Total Bank Calon Peserta</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-900">{candidates.length}</span>
            <span className="text-xs text-blue-600 font-bold">Terdaftar</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Lulusan SMK, D3, & Politeknik</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">Siap Penempatan (Ready)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-emerald-600">{readyCount}</span>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
              {Math.round(candidates.length ? (readyCount / candidates.length) * 100 : 0)}%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Bahasa & Teknis Teruji</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">Perlu Upskilling / Reskilling</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-amber-600">{upskillCount}</span>
            <span className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold">
              Kandidat Modul B
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Memerlukan Program Pelatihan</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">Terverifikasi Dukcapil / Sekolah</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-blue-700">{verifiedCount}</span>
            <span className="text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold">
              Validitas Tinggi
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Standardisasi Tahap 2 Selesai</span>
        </div>
      </div>

      {/* Feeder Data Sources Indicator */}
      <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">
            Kanal Integrasi Pasokan (Multi-Feeder): <strong>Disnaker Daerah</strong>, <strong>BP3MI</strong>, dan <strong>gardata.sippmi.com</strong> (Pelaporan Diklat CPMI).
          </span>
        </div>
        <a
          href="https://gardata.sippmi.com"
          target="_blank"
          rel="noreferrer"
          className="text-blue-400 hover:text-white font-semibold transition flex items-center gap-1 shrink-0"
        >
          <span>Portal Pelatihan CPMI ↗</span>
        </a>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchCandidate}
              onChange={(e) => setSearchCandidate(e.target.value)}
              placeholder="Cari nama calon peserta, ID, keterampilan (misal: Arc Welding), atau asal sekolah..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Quick Pool Indicator & Action */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Terpilih: <strong className="text-blue-600">{selectedCandidateIds.length}</strong> Kandidat
            </span>
            {canMatchCandidates && selectedCandidateIds.length > 0 && (
              <button
                onClick={() => setActiveStage(3)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm"
              >
                <span>Bawa ke Matching Tahap 3</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Multi Select Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Provinsi Asal</label>
            <select
              value={filterProvinsi}
              onChange={(e) => setFilterProvinsi(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Provinsi</option>
              {provinsiOptions.map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Tingkat Pendidikan</label>
            <select
              value={filterEducation}
              onChange={(e) => setFilterEducation(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Jenjang</option>
              <option value="SMK">SMK</option>
              <option value="D3">D3 Vokasi</option>
              <option value="S1">S1 Terapan / Ners</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Status Kesiapan</label>
            <select
              value={filterReadiness}
              onChange={(e) => setFilterReadiness(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Kesiapan</option>
              <option value="Ready for Placement">Siap penempatan</option>
              <option value="Needs Upskilling">Perlu peningkatan</option>
              <option value="Needs Reskilling">Perlu pelatihan ulang</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Status Verifikasi</label>
            <select
              value={filterVerification}
              onChange={(e) => setFilterVerification(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Verifikasi</option>
              <option value="Verified">Terverifikasi</option>
              <option value="Pending Verification">Menunggu verifikasi</option>
              <option value="Unverified">Belum diverifikasi</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Kemahiran Bahasa</label>
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Bahasa</option>
              <option value="Jepang">Bahasa Jepang</option>
              <option value="Jerman">Bahasa Jerman</option>
              <option value="Korea">Bahasa Korea</option>
              <option value="Mandarin">Bahasa Mandarin</option>
              <option value="Inggris">Bahasa Inggris</option>
            </select>
          </div>
        </div>

        {/* Batch Validation Helper Bar (Tahap 2 Simulation) */}
        <div className="flex flex-wrap items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 gap-2">
          {canMatchCandidates && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAllToggle}
                className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-blue-600 transition"
              >
                {allFilteredSelected ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Pilih Semua yang Ditampilkan ({filteredCandidates.length})</span>
              </button>
              {selectedCandidateIds.length > 0 && (
                <button
                  onClick={clearCandidateSelection}
                  className="text-xs text-red-500 hover:underline ml-2"
                >
                  Kosongkan Pilihan
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                {canMatchCandidates && <th className="w-[4%] py-3.5 px-1 text-center">
                  <span className="sr-only">Pilih</span>
                </th>}
                <th className="w-[15%] py-3.5 px-1">Calon Peserta</th>
                <th className="w-[17%] py-3.5 px-1">Institusi & Jurusan</th>
                <th className="w-[14%] py-3.5 px-1">Kemahiran Bahasa</th>
                <th className="w-[12%] py-3.5 px-1">Keterampilan Kunci</th>
                <th className="w-[12%] py-3.5 px-1">Status Kesiapan</th>
                <th className="w-[13%] py-3.5 px-1">Verifikasi</th>
                <th className="w-[13%] py-3.5 px-1 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={canMatchCandidates ? 8 : 7} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Tidak ada calon peserta yang cocok</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter Anda.</p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => {
                  const isSelected = canMatchCandidates && selectedCandidateIds.includes(candidate.id);
                  return (
                    <tr
                      key={candidate.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isSelected ? 'bg-blue-50/60 font-medium' : ''
                      }`}
                    >
                      {/* Select Checkbox */}
                      {canMatchCandidates && <td className="py-3 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => toggleCandidateSelection(candidate.id)}
                          aria-label={`Pilih ${candidate.fullName}`}
                          className="rounded p-1.5 text-slate-600 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>}

                      {/* Name & ID */}
                      <td className="py-3 px-1">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                            {candidate.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {candidate.fullName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {candidate.id} • {candidate.kabupatenKota}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Institution & Major */}
                      <td className="py-3 px-1">
                        <span className="font-semibold text-slate-800 block text-xs">
                          {candidate.institutionName}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {candidate.educationLevel} — {candidate.major}
                        </span>
                        {candidate.sourceType && (
                          <span
                            className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              candidate.sourceType === 'Disnaker Pemda'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : candidate.sourceType === 'Lembaga Vokasi'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            Sumber: {candidate.sourceType}
                          </span>
                        )}
                      </td>

                      {/* Language */}
                      <td className="py-3 px-1">
                        <div className="flex flex-col items-start gap-1.5">
                          {candidate.languageProficiency.map((lp, idx) => (
                            <span
                              key={idx}
                              className="inline-flex max-w-full items-center rounded-md border border-indigo-100 bg-indigo-50 px-2 py-1 text-xs font-medium leading-tight text-indigo-700"
                            >
                              <span className="truncate">{lp.language}</span>
                              <span className="mx-1 text-indigo-300" aria-hidden="true">·</span>
                              <span className="shrink-0">{lp.level}</span>
                            </span>
                          ))}
                          {candidate.languageProficiency.length === 0 && (
                            <span className="text-xs text-slate-400">Belum diisi</span>
                          )}
                        </div>
                      </td>

                      {/* Skills */}
                      <td className="py-3 px-1">
                        <div className="flex flex-wrap gap-1.5">
                          {candidate.skills.slice(0, 2).map((sk, idx) => (
                            <span
                              key={idx}
                              className="max-w-full rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium leading-tight text-slate-700"
                            >
                              {sk}
                            </span>
                          ))}
                          {candidate.skills.length > 2 && (
                            <span className="px-1 py-1 text-xs font-medium text-slate-500">
                              +{candidate.skills.length - 2}
                            </span>
                          )}
                          {candidate.skills.length === 0 && (
                            <span className="text-xs text-slate-400">Belum diisi</span>
                          )}
                        </div>
                      </td>

                      {/* Readiness */}
                      <td className="py-3 px-1">
                        <Badge
                          className="h-auto min-h-8 whitespace-normal px-2 py-1"
                          variant={
                            candidate.readinessStatus === 'Ready for Placement'
                              ? 'success'
                              : candidate.readinessStatus === 'Needs Upskilling'
                              ? 'warning'
                              : 'purple'
                          }
                        >
                          <span className="text-center leading-tight">
                            {readinessLabels[candidate.readinessStatus]}
                          </span>
                        </Badge>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3 px-1">
                        <Badge
                          className="h-auto min-h-8 whitespace-normal px-2 py-1"
                          variant={
                            candidate.verificationStatus === 'Verified'
                              ? 'success'
                              : candidate.verificationStatus === 'Pending Verification'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {candidate.verificationStatus === 'Verified' && <CheckCircle2 className="mr-1 h-3.5 w-3.5 shrink-0" />}
                          {candidate.verificationStatus === 'Pending Verification' && <Clock className="mr-1 h-3.5 w-3.5 shrink-0" />}
                          {candidate.verificationStatus === 'Unverified' && <AlertCircle className="mr-1 h-3.5 w-3.5 shrink-0" />}
                          <span className="leading-tight">
                            {verificationLabels[candidate.verificationStatus]}
                          </span>
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-1 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canManageCandidates && <button
                            onClick={() => setActiveCandidate(candidate)}
                            aria-label={`Lihat profil ${candidate.fullName}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-blue-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            title="Lihat Detail Profil"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden 2xl:inline">Profil</span>
                          </button>}

                          {canArchiveCandidates && <button
                            onClick={() => {
                              setCandidateToEdit(candidate);
                              setFormMode('edit');
                              setIsFormOpen(true);
                            }}
                            aria-label={`Ubah data ${candidate.fullName}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 p-1.5 text-xs font-semibold text-blue-700 shadow-xs transition hover:bg-blue-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            title="Ubah Data Peserta"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden 2xl:inline">Ubah</span>
                          </button>}

                          <button
                            onClick={() => setDeletingCandidate(candidate)}
                            aria-label={`Arsipkan data ${candidate.fullName}`}
                            className="inline-flex items-center rounded-lg bg-rose-50 p-1.5 text-xs font-semibold text-rose-700 shadow-xs transition hover:bg-rose-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                            title="Hapus Data Peserta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        candidate={activeCandidate}
        isOpen={!!activeCandidate}
        onClose={() => setActiveCandidate(null)}
      />

      {/* Candidate Form Modal (Create / Edit) */}
      <CandidateFormModal
        isOpen={isFormOpen}
        mode={formMode}
        initialData={candidateToEdit}
        canVerify={canVerifyCandidates}
        onClose={() => {
          setIsFormOpen(false);
          setCandidateToEdit(null);
        }}
        onSubmit={(data) => {
          saveBusinessData(
            'candidates',
            data,
            formMode === 'edit' ? candidateToEdit?.id : undefined,
            () => {
              setIsFormOpen(false);
              setCandidateToEdit(null);
            },
          );
        }}
      />

      {/* Delete Confirmation Modal with Audit Reason */}
      <DeleteConfirmModal
        isOpen={!!deletingCandidate}
        onClose={() => setDeletingCandidate(null)}
        entityName={deletingCandidate?.fullName || ''}
        entityId={deletingCandidate?.id || ''}
        onConfirm={(reason) => {
          if (deletingCandidate) {
            archiveBusinessData('candidates', deletingCandidate.id, reason, () => setDeletingCandidate(null));
          }
        }}
      />
    </div>
  );
};
