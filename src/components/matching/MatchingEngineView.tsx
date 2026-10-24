import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/useAppStore';
import { MatchingGapCard } from './MatchingGapCard';
import {
  Cpu,
  Layers,
  Award,
  Users,
  CheckCircle2,
  Building2,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Globe2,
  Trash2,
  FileCheck,
  ExternalLink
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { SystemStageStepper } from '../layout/SystemStageStepper';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import { MonitoringData, PersistedCandidateMatch } from '../../types';

interface MatchingEngineViewProps {
  candidateMatches: PersistedCandidateMatch[];
  monitoring: MonitoringData | undefined;
}

const inputDate = (date: Date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

const EMPTY_MONITORING: MonitoringData = {
  summary: {
    totalClasses: 0,
    activeClasses: 0,
    gardataCandidates: 0,
    verifiedReports: 0,
    averageAttendance: null,
    averageAssessmentScore: null,
    gardataTargetJp: 0,
    gardataAchievedJp: 0,
  },
  classes: [],
  candidates: [],
  placements: [],
  lastSync: null,
};

export const MatchingEngineView: React.FC<MatchingEngineViewProps> = ({ candidateMatches, monitoring }) => {
  const {
    candidates,
    programs,
    providers,
    demands,
    allocations,
    activeStage,
    setActiveStage,
    selectedDemandId,
    setSelectedDemandId,
    selectedCandidateIds,
    toggleCandidateSelection,
    selectAllCandidates,
    selectedProgramId,
    setSelectedProgramId,
    selectedProviderId,
    setSelectedProviderId,
  } = useAppStore();
  const monitoringData = monitoring && !Array.isArray(monitoring) ? monitoring : EMPTY_MONITORING;

  // State for Tahap 4 batch dates
  const [startDate, setStartDate] = useState(() => inputDate(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const end = new Date();
    end.setMonth(end.getMonth() + 3);
    return inputDate(end);
  });
  const [allocationSuccessNotice, setAllocationSuccessNotice] = useState<string | null>(null);
  const [allocationError, setAllocationError] = useState<string | null>(null);
  const [savingAllocation, setSavingAllocation] = useState(false);
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);

  // Selected entities
  const allocationDemands = demands.filter((d) => d.verificationStatus === 'Approved');
  const allocationProviders = providers.filter((p) => p.verificationStatus === 'Verified');
  const activeDemand = allocationDemands.find((d) => d.id === selectedDemandId) || allocationDemands[0];
  const activeProgram = programs.find((p) => p.id === selectedProgramId) || programs[0];
  const activeProvider = allocationProviders.find((p) => p.id === selectedProviderId) || allocationProviders[0];

  // Scores and recommendations are taken from persisted matching records.
  const scoredCandidates = useMemo(() => {
    if (!activeDemand) return [];
    return candidateMatches
      .filter((match) => match.demandId === activeDemand.id)
      .flatMap((match) => {
        const candidate = candidates.find((entry) => entry.id === match.candidateId);
        return candidate ? [{ candidate, matchResult: match }] : [];
      });
  }, [candidateMatches, candidates, activeDemand]);

  // Format currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Estimated total budget for selected candidates in Tahap 4
  const estimatedBudget =
    (activeProgram?.estimatedCostPerParticipant || 0) * selectedCandidateIds.length;

  // Handle allocation submission in Tahap 4
  const handleFinalizeAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDemand || !activeProgram || !activeProvider) {
      const message = 'Demand, program, dan lembaga yang aktif harus tersedia sebelum keputusan alokasi diterbitkan.';
      setAllocationError(message);
      toast.error(message);
      return;
    }

    if (selectedCandidateIds.length === 0) {
      alert('Pilih minimal 1 calon peserta untuk penetapan batch!');
      return;
    }

    setSavingAllocation(true);
    setAllocationError(null);
    router.post('/allocations', {
      demandId: activeDemand.id,
      programId: activeProgram.id,
      providerId: activeProvider.id,
      candidateIds: selectedCandidateIds,
      startDate,
      endDate,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setAllocationSuccessNotice(
          `Keputusan alokasi berhasil disimpan ke database. Total anggaran: ${formatIDR(estimatedBudget)} untuk ${selectedCandidateIds.length} peserta.`
        );
        toast.success('Keputusan alokasi batch berhasil disimpan.');
        setTimeout(() => setAllocationSuccessNotice(null), 6000);
      },
      onError: (errors) => {
        const message = Object.values(errors).find(Boolean) ?? 'Alokasi belum dapat disimpan. Periksa kelengkapan data dan kapasitas.';
        setAllocationError(message);
        toast.error(message);
      },
      onFinish: () => setSavingAllocation(false),
    });
  };

  const finalizeAllocation = (allocationId: string) => {
    router.patch(`/allocations/${encodeURIComponent(allocationId)}`, { status: 'Finalized' }, {
      preserveScroll: true,
      onSuccess: () => toast.success('Alokasi berhasil difinalisasi.'),
      onError: () => toast.error('Alokasi belum dapat difinalisasi. Periksa status dan hak akses.'),
    });
  };

  const archiveAllocation = (allocationId: string) => {
    setPendingArchiveId(allocationId);
  };

  const confirmArchiveAllocation = (reason: string) => {
    if (!pendingArchiveId) return;

    const allocationId = pendingArchiveId;
    router.delete(`/allocations/${encodeURIComponent(allocationId)}`, {
      data: { reason },
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Alokasi berhasil dibatalkan dan diarsipkan.');
        setPendingArchiveId(null);
      },
      onError: () => toast.error('Alokasi belum dapat dibatalkan. Alokasi final tidak dapat dibatalkan.'),
    });
  };

  return (
    <div className="space-y-6">
      {/* 4 Stage Interactive Stepper Component */}
      <SystemStageStepper
        currentStage={activeStage}
        onSelectStage={(stage) => setActiveStage(stage)}
      />

      {/* Success Notification Banner */}
      {allocationSuccessNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900 shadow-sm animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm font-semibold">{allocationSuccessNotice}</div>
        </div>
      )}
      {allocationError && (
        <div role="alert" className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {allocationError}
        </div>
      )}

      {/* ======================================================== */}
      {/* STAGE 1: PENGUMPULAN DATA (DATA INGESTION OVERVIEW)      */}
      {/* ======================================================== */}
      {activeStage === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4" />
              <span>Tahap 1: Pengumpulan & Agregasi Data</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Integrasi Multilateral Ekosistem Vokasi & Ketenagakerjaan Luar Negeri
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Ringkasan ini menggunakan data yang tersimpan pada basis data aplikasi. Data Gardata ditampilkan setelah disinkronkan; sumber Demand mengikuti catatan pada basis data dan belum otomatis menunjukkan integrasi SISKOP2MI.
            </p>

            {/* 4 Pillars Summary Grid */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-900 uppercase">Modul A: Supply</span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-blue-900">{candidates.length}</div>
                <p className="mt-1 text-xs text-blue-700">Calon Peserta Vokasi Terdata</p>
                <div className="mt-3 flex items-center justify-between gap-2 overflow-hidden border-t border-blue-200/60 pt-2 text-xs text-blue-700">
                  <span className="truncate">Siap: {candidates.filter(c => c.readinessStatus === 'Ready for Placement').length}</span>
                  <span className="truncate">Upskill: {candidates.filter(c => c.readinessStatus === 'Needs Upskilling').length}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-900 uppercase">Modul B: Kurikulum</span>
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-indigo-900">{programs.length}</div>
                <p className="mt-1 text-xs text-indigo-700">Program Pelatihan Standar</p>
                <div className="mt-3 flex items-center justify-between gap-2 overflow-hidden border-t border-indigo-200/60 pt-2 text-xs text-indigo-700">
                  <span className="truncate">
                    {programs.filter((program) => program.programType === 'Upskilling').length} Upskilling
                  </span>
                  <span className="truncate">
                    {programs.filter((program) => program.programType === 'Reskilling').length} Reskilling
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-900 uppercase">Modul C: Vokasi</span>
                  <Building2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-900">{providers.length}</div>
                <p className="mt-1 text-xs text-emerald-700">Lembaga dalam basis data</p>
                <div className="mt-3 flex items-center justify-between gap-2 overflow-hidden border-t border-emerald-200/60 pt-2 text-xs text-emerald-700">
                  <span className="truncate">
                    Kelas: {providers.some((provider) => provider.classCount != null)
                      ? providers.reduce((total, provider) => total + (provider.classCount ?? 0), 0)
                      : 'Belum tersedia'}
                  </span>
                  <span className="truncate">
                    Peserta siap pelatihan: {providers.some((provider) => provider.readyParticipantCount != null)
                      ? providers.reduce((total, provider) => total + (provider.readyParticipantCount ?? 0), 0)
                      : 'Belum tersedia'}
                  </span>
                  <span className="truncate">
                    Terverifikasi: {providers.filter((provider) => provider.verificationStatus === 'Verified').length}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-900 uppercase">Modul D: Demand</span>
                  <Globe2 className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-900">{demands.reduce((acc, d) => acc + d.requiredQuota, 0)}</div>
                <p className="mt-1 text-xs text-amber-700">Total Kuota Permintaan Global</p>
                <div className="mt-3 flex items-center justify-between gap-2 overflow-hidden border-t border-amber-200/60 pt-2 text-xs text-amber-700">
                  <span className="truncate">
                    {new Set(demands.map((demand) => demand.country)).size} negara tujuan
                  </span>
                  <span className="truncate">
                    Terpenuhi: {demands.reduce((total, demand) => total + demand.filledQuota, 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveStage(2)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
              >
                <span>Lanjutkan ke Tahap 2: Validasi & Standardisasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STAGE 2: VALIDASI & STANDARDISASI (VERIFIKASI SISTEM)   */}
      {/* ======================================================== */}
      {activeStage === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Tahap 2: Validasi, Verifikasi NIK & Standarisasi Vokasi</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Pembersihan Data, Deduplikasi & Kelayakan Calon Peserta
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
              Tahap ini menampilkan status verifikasi yang tersimpan di database. Pemeriksaan Dukcapil, Dapodik, atau e-Vokasi hanya dianggap selesai jika integrasi resmi telah menyediakan hasilnya.
            </p>

            {/* Validation Metrics Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs font-semibold text-slate-500 block">Kandidat Terverifikasi</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-emerald-600">
                    {candidates.filter((c) => c.verificationStatus === 'Verified').length} / {candidates.length}
                  </span>
                  <span className="text-xs text-slate-400">Peserta</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${candidates.length ? (candidates.filter((c) => c.verificationStatus === 'Verified').length / candidates.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs font-semibold text-slate-500 block">Kesiapan e-Vokasi Lembaga</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-blue-600">
                    {providers.filter((p) => p.evokasiVerificationStatus === 'Terverifikasi e-Vokasi').length} / {providers.length}
                  </span>
                  <span className="text-xs text-slate-400">Lembaga</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 mt-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{
                      width: `${providers.length ? (providers.filter((p) => p.evokasiVerificationStatus === 'Terverifikasi e-Vokasi').length / providers.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Tahap Verifikasi</span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Periksa dan simpan hasil verifikasi melalui detail peserta atau menu Verifikasi.
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Verifikasi tercatat di database
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => setActiveStage(1)}
                className="w-full rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 sm:w-auto"
              >
                Kembali ke Tahap 1
              </button>
              <button
                onClick={() => setActiveStage(3)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
              >
                <span>Lanjutkan ke Tahap 3: Analisis Gap & Matching</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STAGE 3: ANALISIS GAP & MATCHING ENGINE                  */}
      {/* ======================================================== */}
      {activeStage === 3 && (
        <div className="space-y-6 animate-fade-in">
          {/* Target Demand Selector Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Target Lowongan Kerja (Modul D)
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Pilih Permintaan Kerja Luar Negeri untuk Dihitung Kecocokannya
                </h3>
              </div>

              {/* Demand Selector Dropdown */}
              <div className="w-full sm:w-80">
                <select
                  value={activeDemand?.id}
                  onChange={(e) => setSelectedDemandId(e.target.value)}
                  disabled={allocationDemands.length === 0}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {allocationDemands.length === 0 && <option value="">Belum ada demand disetujui</option>}
                  {allocationDemands.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.country}: {d.jobTitle} ({d.employerName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Demand Details Bar */}
            {activeDemand && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{activeDemand.jobTitle}</span>
                    <Badge variant="primary" size="sm">{activeDemand.country}</Badge>
                  </div>
                  <p className="text-slate-500">
                    Employer: <span className="font-semibold text-slate-700">{activeDemand.employerName}</span> • Kuota Dibutuhkan: <strong className="text-blue-700">{activeDemand.requiredQuota} Orang</strong>
                  </p>
                  <p className="text-slate-500">
                    Syarat Bahasa: <span className="font-semibold text-indigo-700">{activeDemand.requiredLanguageLevel}</span> • Estimasi Gaji: <span className="font-semibold text-emerald-700">{activeDemand.salaryRangeString}</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => {
                      // Select top 3 candidates by match score
                      const topIds = scoredCandidates.slice(0, 3).map((sc) => sc.candidate.id);
                      selectAllCandidates(topIds);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs whitespace-nowrap"
                  >
                    Pilih Top 3 Otomatis
                  </button>
                  <button
                    onClick={() => setActiveStage(4)}
                    disabled={selectedCandidateIds.length === 0}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                  >
                    <span>Lanjut ke Alokasi ({selectedCandidateIds.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Formula Explanation Banner */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
              <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Skor dan rekomendasi berikut berasal dari hasil matching yang tersimpan di database. Jika belum ada hasil, jalankan proses matching backend terlebih dahulu.
              </span>
            </div>
          </div>

          {/* Scored Candidate Cards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Daftar hasil matching tersimpan ({scoredCandidates.length} peserta)
              </span>
              <span>Terpilih untuk Alokasi: <strong className="text-blue-600">{selectedCandidateIds.length}</strong></span>
            </div>

            {scoredCandidates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
                Belum ada hasil matching untuk demand ini. Hasil hanya muncul setelah dicatat pada proses matching backend.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scoredCandidates.map(({ candidate, matchResult }) => (
                  <MatchingGapCard
                    key={matchResult.id}
                    candidate={candidate}
                    result={matchResult}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STAGE 4: PENETAPAN PROGRAM & ALOKASI LEMBAGA            */}
      {/* ======================================================== */}
      {activeStage === 4 && (
        !activeDemand || !activeProgram || !activeProvider ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950" role="status">
            <h3 className="text-base font-bold">Data alokasi belum lengkap</h3>
            <p className="mt-2 text-sm">
              {[
                !activeDemand ? 'Belum ada demand yang disetujui dan tersedia untuk akun ini.' : null,
                !activeProgram ? 'Belum ada program pelatihan yang tersedia.' : null,
                !activeProvider ? 'Belum ada lembaga vokasi yang terverifikasi.' : null,
              ].filter(Boolean).join(' ')}
            </p>
            <p className="mt-1 text-sm">
              Periksa status verifikasi dan akses akun, lalu pilih data yang tersedia sebelum melanjutkan.
            </p>
            <button
              type="button"
              onClick={() => setActiveStage(3)}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Kembali ke Tahap Matching
            </button>
          </div>
        ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Allocation Creation Simulator Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Tahap 4: Simulator Penetapan Program & Alokasi Lembaga Vokasi
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                Penyusunan Paket Alokasi Kuota Peserta, Lembaga Penyelenggara & Anggaran
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kombinasikan Lowongan Target (Modul D), Peserta Terpilih (Modul A), Program Pelatihan Standar (Modul B), dan Lembaga Penyelenggara (Modul C).
              </p>
            </div>

            <form onSubmit={handleFinalizeAllocation} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Demand & Candidates Selection Summary */}
                <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Globe2 className="w-4 h-4 text-blue-600" />
                    <span>1. Target Demand & Calon Peserta</span>
                  </h4>

                  <div>
                    <label className="text-xs text-slate-500 font-semibold block mb-1">Target Demand (Modul D):</label>
                    <select
                      value={activeDemand.id}
                      onChange={(e) => setSelectedDemandId(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {allocationDemands.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.country}: {d.jobTitle} ({d.employerName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 font-semibold">Peserta Terpilih (Modul A):</span>
                      <span className="font-bold text-blue-600">{selectedCandidateIds.length} Siswa</span>
                    </div>

                    {selectedCandidateIds.length === 0 ? (
                      <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs">
                        Belum ada peserta yang dipilih. Buka <strong>Tahap 3</strong> atau centang di bawah untuk memilih kandidat.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-white rounded-lg border border-slate-200">
                        {selectedCandidateIds.map((cid) => {
                          const c = candidates.find((cand) => cand.id === cid);
                          return (
                            <span
                              key={cid}
                              className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1 font-medium"
                            >
                              <span>{c?.fullName || cid}</span>
                              <button
                                type="button"
                                onClick={() => toggleCandidateSelection(cid)}
                                className="text-blue-500 hover:text-red-600 font-bold ml-1"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Program & Provider Selection */}
                <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>2. Penetapan Program & Lembaga Vokasi</span>
                  </h4>

                  <div>
                    <label className="text-xs text-slate-500 font-semibold block mb-1">Program Pelatihan (Modul B):</label>
                    <select
                      value={activeProgram.id}
                      onChange={(e) => setSelectedProgramId(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.durationJP} JP - {formatIDR(p.estimatedCostPerParticipant)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 font-semibold block mb-1">Lembaga Penyelenggara (Modul C):</label>
                    <select
                      value={activeProvider.id}
                      onChange={(e) => setSelectedProviderId(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {allocationProviders.map((pr) => (
                        <option key={pr.id} value={pr.id}>
                          {pr.name} ({pr.provinsi} - Kesiapan: {pr.operationalReadinessScore == null ? 'Belum tersedia' : `${pr.operationalReadinessScore}/100`})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Schedule & Budget Summary Calculation */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div>
                  <label className="text-[11px] font-bold text-blue-900 uppercase block mb-1">Jadwal Mulai Pelatihan</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs py-1.5 px-3 bg-white border border-blue-200 rounded-lg font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-blue-900 uppercase block mb-1">Jadwal Selesai Pelatihan</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs py-1.5 px-3 bg-white border border-blue-200 rounded-lg font-medium"
                    required
                  />
                </div>

                <div className="text-center sm:text-right">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Kalkulasi Anggaran Total</span>
                  <span className="text-xl font-black text-emerald-700 block">
                    {formatIDR(estimatedBudget)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    ({selectedCandidateIds.length} Peserta × {formatIDR(activeProgram.estimatedCostPerParticipant)})
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStage(3)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  Kembali ke Tahap 3 (Matching)
                </button>
                <button
                  type="submit"
                  disabled={selectedCandidateIds.length === 0 || savingAllocation}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{savingAllocation ? 'Menyimpan keputusan…' : 'Terbitkan Keputusan Penetapan Alokasi Batch'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Established Allocations List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  Buku Registrasi Keputusan Alokasi Batch Penempatan PMI
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rekapitulasi penetapan resmi alokasi kuota, lembaga vokasi, dan pagu anggaran Kementerian P2MI.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                {allocations.length} Alokasi Terbit
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">No. Registrasi</th>
                    <th className="py-3 px-4">Target Demand</th>
                    <th className="py-3 px-4">Program Pelatihan</th>
                    <th className="py-3 px-4">Lembaga Penyelenggara</th>
                    <th className="py-3 px-4 text-center">Jumlah Peserta</th>
                    <th className="py-3 px-4 text-right">Pagu Anggaran</th>
                    <th className="py-3 px-4">Jadwal Batch</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {allocations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                        Belum ada keputusan alokasi yang ditetapkan.
                      </td>
                    </tr>
                  ) : (
                    allocations.map((alloc) => {
                      const d = demands.find((dem) => dem.id === alloc.demandId);
                      const p = programs.find((prog) => prog.id === alloc.selectedProgramId);
                      const pr = providers.find((prov) => prov.id === alloc.selectedProviderId);

                      return (
                        <tr key={alloc.allocationId} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-mono font-bold text-blue-700">
                            {alloc.allocationId}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{d?.jobTitle || alloc.demandId}</span>
                            <span className="text-slate-400 text-[11px]">{d?.country} ({d?.employerName})</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 block">{p?.title || alloc.selectedProgramId}</span>
                            <span className="text-slate-400 text-[11px]">{p?.durationJP} JP</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 block">{pr?.name || alloc.selectedProviderId}</span>
                            <span className="text-slate-400 text-[11px]">{pr?.provinsi}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-900">
                            {alloc.allocatedCandidateIds.length} Siswa
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                            {formatIDR(alloc.totalBudgetRequired)}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {alloc.batchScheduleStart} s.d {alloc.batchScheduleEnd}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              size="sm"
                              variant={
                                alloc.approvalStatus === 'Finalized'
                                  ? 'purple'
                                  : alloc.approvalStatus === 'Approved'
                                  ? 'success'
                                  : 'warning'
                              }
                            >
                              {alloc.approvalStatus}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {alloc.approvalStatus !== 'Finalized' && (
                                <button
                                  onClick={() => finalizeAllocation(alloc.allocationId)}
                                  className="px-2 py-1 text-[11px] font-bold rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                                  title="Finalisasi Keputusan"
                                >
                                  Final
                                </button>
                              )}
                              <button
                                onClick={() => archiveAllocation(alloc.allocationId)}
                                className="p-1 text-slate-400 hover:text-red-600 transition rounded"
                                title="Hapus Alokasi"
                              >
                                <Trash2 className="w-4 h-4" />
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
        </div>
        )
      )}

      {/* ======================================================== */}
      {/* STAGE 5: PELAKSANAAN KELAS & MONITORING JP/SERTIFIKASI  */}
      {/* ======================================================== */}
      {activeStage === 5 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
                  Tahap 5: Pelaksanaan Pelatihan & Monitoring Capaian JP
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Pemantauan Kelas, Presensi & Asesmen Tercatat
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://gardata.sippmi.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition"
                  title="Buka Sistem Pelaporan Pelatihan CPMI"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Feeder: gardata.sippmi.com</span>
                </a>
                <Badge variant="primary">Sumber: Database Aplikasi & Gardata</Badge>
              </div>
            </div>

            {/* Feeder gardata.sippmi.com status notice */}
            <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <span>
                  Status sinkronisasi Gardata:{' '}
                  <strong>{monitoringData.lastSync?.status ?? 'Belum pernah disinkronkan'}</strong>
                  {monitoringData.lastSync?.finishedAt
                    ? ` · Pembaruan ${new Date(monitoringData.lastSync.finishedAt).toLocaleString('id-ID')}`
                    : ''}
                </span>
              </div>
              <a
                href="https://gardata.sippmi.com"
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 font-bold hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Buka Gardata</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>

            {/* 3 Monitoring Progress Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Tingkat Kehadiran Kelas</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-600">
                    {monitoringData.summary.averageAttendance === null
                      ? 'Belum tersedia'
                      : `${monitoringData.summary.averageAttendance.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`}
                  </span>
                  <span className="text-xs text-slate-400">Data database lokal</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, monitoringData.summary.averageAttendance ?? 0)}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Capaian Jam Pelajaran (JP)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-blue-600">
                    {monitoringData.summary.gardataAchievedJp.toLocaleString('id-ID')} / {monitoringData.summary.gardataTargetJp.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs text-slate-400">JP Gardata</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{
                      width: `${monitoringData.summary.gardataTargetJp
                        ? Math.min(100, (monitoringData.summary.gardataAchievedJp / monitoringData.summary.gardataTargetJp) * 100)
                        : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Rata-rata Nilai Asesmen</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-indigo-600">
                    {monitoringData.summary.averageAssessmentScore === null
                      ? 'Belum tersedia'
                      : `${monitoringData.summary.averageAssessmentScore.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`}
                  </span>
                  <span className="text-xs text-slate-400">Data database lokal</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${Math.min(100, monitoringData.summary.averageAssessmentScore ?? 0)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Persisted batches and Gardata training records */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
                Kelas dari database lokal dan catatan pelatihan Gardata:
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {monitoringData.classes.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">Belum ada data kelas atau riwayat pelatihan tersinkron.</p>
                ) : monitoringData.classes.map((trainingClass) => (
                  <div key={trainingClass.id} className="p-3 flex flex-col gap-1 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{trainingClass.name}</span>
                      <span className="text-slate-500 text-[11px]">
                        {trainingClass.source} · {trainingClass.participantCount} peserta · JP:{' '}
                        {trainingClass.achievedJp === null
                          ? 'belum tercatat'
                          : `${trainingClass.achievedJp}/${trainingClass.targetJp}`}
                        {trainingClass.averageAttendance === null
                          ? ''
                          : ` · Presensi ${trainingClass.averageAttendance.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{trainingClass.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => setActiveStage(4)}
                className="w-full rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 sm:w-auto"
              >
                Kembali ke Tahap 4
              </button>
              <button
                onClick={() => setActiveStage(6)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 sm:w-auto"
              >
                <span>Lanjut ke Tahap 6: Job Matching & Penempatan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STAGE 6: JOB MATCHING & PENEMPATAN RESMI (SISKOP2MI)    */}
      {/* ======================================================== */}
      {activeStage === 6 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                  Tahap 6: Job Matching, Seleksi User & Penempatan
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Rekapitulasi proses penempatan yang tercatat
                </h3>
              </div>
              <Badge variant="primary">Data database lokal</Badge>
            </div>

            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-800 leading-relaxed mt-0.5">
                  Daftar di bawah berasal dari catatan penempatan lokal. Integrasi pengambilan atau sinkronisasi SISKOP2MI belum dikonfigurasi di alur ini; ID eksternal hanya ditampilkan jika tersimpan.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Catatan penempatan:</span>
                <span className="text-blue-600 font-bold">{monitoringData.placements.length} data</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/60 border-b border-slate-200 font-bold text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Nama Kandidat</th>
                      <th className="py-2.5 px-3">Jabatan & Negara</th>
                      <th className="py-2.5 px-3">Pemberi Kerja</th>
                      <th className="py-2.5 px-3">Status Penempatan</th>
                      <th className="py-2.5 px-3 text-right">Tanggal Berangkat</th>
                      <th className="py-2.5 px-3 text-right">ID SISKOP2MI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {monitoringData.placements.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          Belum ada catatan penempatan pada database untuk akun dan cakupan ini.
                        </td>
                      </tr>
                    ) : monitoringData.placements.map((placement) => (
                      <tr key={placement.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{placement.candidateName}</td>
                        <td className="py-2.5 px-3 text-slate-500">{placement.occupation} · {placement.country}</td>
                        <td className="py-2.5 px-3 text-slate-600">{placement.employer}</td>
                        <td className="py-2.5 px-3">{placement.status}</td>
                        <td className="py-2.5 px-3 text-right">{placement.flightDate ?? 'Belum dijadwalkan'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600">
                          {placement.siskop2miId ?? 'Belum terhubung'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => setActiveStage(5)}
                className="w-full rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 sm:w-auto"
              >
                Kembali ke Tahap 5
              </button>
              <span className="text-xs text-slate-500">
                Sinkronisasi otomatis belum tersedia pada modul ini.
              </span>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={pendingArchiveId !== null}
        onClose={() => setPendingArchiveId(null)}
        onConfirm={confirmArchiveAllocation}
        title="Konfirmasi Pembatalan Alokasi"
        entityName="Keputusan alokasi batch"
        entityId={pendingArchiveId ?? ''}
        description="Keputusan akan diarsipkan, batch dibatalkan, peserta dikeluarkan, dan kuota dikembalikan. Tindakan ini tercatat di audit log."
        confirmText="Batalkan dan Arsipkan"
      />
    </div>
  );
};
