import React, { useState, useMemo } from 'react';
import {
  useAppStore,
  calculateMatchingScore
} from '../../store/useAppStore';
import { MatchingGapCard } from './MatchingGapCard';
import {
  Cpu,
  Layers,
  Award,
  Users,
  CheckCircle2,
  Calendar,
  DollarSign,
  Building2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Globe2,
  Plus,
  Trash2,
  FileCheck,
  ExternalLink
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { SystemStageStepper } from '../layout/SystemStageStepper';

export const MatchingEngineView: React.FC = () => {
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
    clearCandidateSelection,
    selectedProgramId,
    setSelectedProgramId,
    selectedProviderId,
    setSelectedProviderId,
    createAllocation,
    updateAllocationStatus,
    deleteAllocation,
    batchVerifyCandidates,
  } = useAppStore();

  // State for Tahap 4 batch dates
  const [startDate, setStartDate] = useState('2026-12-01');
  const [endDate, setEndDate] = useState('2027-03-31');
  const [allocationSuccessNotice, setAllocationSuccessNotice] = useState<string | null>(null);

  // Selected entities
  const activeDemand = demands.find((d) => d.id === selectedDemandId) || demands[0];
  const activeProgram = programs.find((p) => p.id === selectedProgramId) || programs[0];
  const activeProvider = providers.find((p) => p.id === selectedProviderId) || providers[0];

  // Candidates who are verified for matching (or all candidates if in stage 1/2)
  const candidatePool = useMemo(() => {
    if (activeStage >= 3) {
      // Tahap 3 & 4 prioritizes verified candidates
      return candidates.filter((c) => c.verificationStatus === 'Verified');
    }
    return candidates;
  }, [candidates, activeStage]);

  // Calculate matching scores against active demand
  const scoredCandidates = useMemo(() => {
    if (!activeDemand) return [];
    return candidatePool.map((candidate) => {
      const matchResult = calculateMatchingScore(candidate, activeDemand);
      const recommendedProgram = programs.find(
        (p) => p.id === matchResult.recommendedProgramId
      );
      return {
        candidate,
        matchResult,
        recommendedProgramTitle: recommendedProgram?.title || 'Program Standarisasi Teknis',
      };
    }).sort((a, b) => b.matchResult.matchScore - a.matchResult.matchScore);
  }, [candidatePool, activeDemand, programs]);

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
    if (selectedCandidateIds.length === 0) {
      alert('Pilih minimal 1 calon peserta untuk penetapan batch!');
      return;
    }

    const decision = createAllocation({
      demandId: activeDemand.id,
      programId: activeProgram.id,
      providerId: activeProvider.id,
      candidateIds: selectedCandidateIds,
      startDate,
      endDate,
    });

    setAllocationSuccessNotice(
      `Keputusan Alokasi ${decision.allocationId} Berhasil Ditetapkan! Total Anggaran: ${formatIDR(
        decision.totalBudgetRequired
      )} untuk ${decision.allocatedCandidateIds.length} peserta.`
    );

    setTimeout(() => {
      setAllocationSuccessNotice(null);
    }, 6000);
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
              Tahap awal menyatukan 4 pilar data intelijen: Pasokan Calon PMI dari SMK/Politeknik (Modul A), Kurikulum Pelatihan Terakreditasi (Modul B), Direktori Lembaga Penyelenggara e-Vokasi (Modul C), dan Permintaan Pasar Kerja Global dari SISKOP2MI (Modul D).
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
                  <span className="truncate">SSW Kaigo / Welder</span>
                  <span className="truncate">Ausbildung</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-900 uppercase">Modul C: Vokasi</span>
                  <Building2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-900">{providers.length}</div>
                <p className="mt-1 text-xs text-emerald-700">Lembaga Terverifikasi e-Vokasi</p>
                <div className="mt-3 flex items-center justify-between gap-2 overflow-hidden border-t border-emerald-200/60 pt-2 text-xs text-emerald-700">
                  <span className="truncate">
                    Kapasitas: {providers.some((provider) => provider.capacityPerBatch !== null)
                      ? providers.reduce((total, provider) => total + (provider.capacityPerBatch ?? 0), 0)
                      : 'Belum tersedia'}
                  </span>
                  <span className="truncate">Skor Rata2: 87/100</span>
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
                  <span className="truncate">Jepang, Jerman, Korea</span>
                  <span className="truncate">Taiwan</span>
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
              Sebelum dimasukkan ke dalam Matching Engine, seluruh calon peserta divalidasi keabsahan NIK Dukcapil, ijazah kejuruan, dan sertifikat bahasa. Lembaga vokasi juga disaring wajib memiliki status <strong>Terverifikasi e-Vokasi</strong>.
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
                  <span className="text-xs font-semibold text-slate-500 block">Simulasi Verifikasi Cepat</span>
                  <p className="text-[11px] text-slate-400 mt-1">Verifikasi seluruh kandidat pending sekaligus.</p>
                </div>
                <button
                  onClick={() => batchVerifyCandidates(candidates.map((c) => c.id))}
                  className="mt-2 w-full py-2 px-3 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verifikasi Semua Calon Peserta</span>
                </button>
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
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {demands.map((d) => (
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
                <strong>Formulasi Skor Matching:</strong> (Kesesuaian Keterampilan × 50%) + (Standar Bahasa Asing × 35%) + (Pendidikan Vokasi × 15%). Kandidat dengan skor ≥80% siap penempatan langsung, sedangkan skor &lt;80% diarahkan ke Modul B.
              </span>
            </div>
          </div>

          {/* Scored Candidate Cards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Daftar Hasil Matching ({scoredCandidates.length} Calon Peserta Terverifikasi diurutkan dari skor tertinggi)
              </span>
              <span>Terpilih untuk Alokasi: <strong className="text-blue-600">{selectedCandidateIds.length}</strong></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scoredCandidates.map(({ candidate, matchResult, recommendedProgramTitle }) => (
                <MatchingGapCard
                  key={candidate.id}
                  candidate={candidate}
                  demand={activeDemand}
                  result={matchResult}
                  recommendedProgramTitle={recommendedProgramTitle}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STAGE 4: PENETAPAN PROGRAM & ALOKASI LEMBAGA            */}
      {/* ======================================================== */}
      {activeStage === 4 && (
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
                      {demands.map((d) => (
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
                      {providers.map((pr) => (
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
                  disabled={selectedCandidateIds.length === 0}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Terbitkan Keputusan Penetapan Alokasi Batch</span>
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
                                  onClick={() => updateAllocationStatus(alloc.allocationId, 'Finalized')}
                                  className="px-2 py-1 text-[11px] font-bold rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                                  title="Finalisasi Keputusan"
                                >
                                  Final
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus keputusan alokasi ${alloc.allocationId}?`)) {
                                    deleteAllocation(alloc.allocationId);
                                  }
                                }}
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
                  Pemantauan Kelas Berjalan, Presensi, Asesmen & Uji Kompetensi BNSP
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
                <Badge variant="primary">PIC: Balai / SMK & Asesor BNSP</Badge>
              </div>
            </div>

            {/* Feeder gardata.sippmi.com status notice */}
            <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Data kehadiran dan capaian JP disinkronkan langsung dari <strong>gardata.sippmi.com</strong> (Sistem Pelaporan Kegiatan Pelatihan CPMI).
                </span>
              </div>
              <a
                href="https://gardata.sippmi.com"
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 font-bold hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Kelola Absensi Harian</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>

            {/* 3 Monitoring Progress Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Tingkat Kehadiran Kelas</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-600">96,4%</span>
                  <span className="text-xs text-slate-400">Rata-rata Presensi</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '96.4%' }} />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Capaian Jam Pelajaran (JP)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-blue-600">184 / 360</span>
                  <span className="text-xs text-slate-400">JP Tuntas</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '51.1%' }} />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Kesiapan Asesmen BNSP</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-indigo-600">88%</span>
                  <span className="text-xs text-slate-400">Siap Uji Kompetensi</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: '88%' }} />
                </div>
              </div>
            </div>

            {/* Live Active Batches Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
                Daftar Kelas Pelatihan Vokasi yang Sedang Berjalan:
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900 block">Kelas SSW Kaigo Kaizen Batch I — LPK Global Nusantara Surabaya</span>
                    <span className="text-slate-500 text-[11px]">28 Siswa • Progres JP: 210/360 JP • Instruktur: Tanaka Kenji & Ns. Siti Rahayu</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    On-Schedule
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900 block">Kelas Welder 3G/4G Heavy Plate — BBPVP Bandung</span>
                    <span className="text-slate-500 text-[11px]">22 Siswa • Progres JP: 180/300 JP • Instruktur: Ir. Bambang Priyono (BNSP Master)</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    On-Schedule
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900 block">Kelas Intensif Bahasa Jerman Ausbildung B1 — Politeknik Pariwisata Bali</span>
                    <span className="text-slate-500 text-[11px]">19 Siswa • Progres JP: 160/400 JP • Target Ujian Goethe B1: Desember 2026</span>
                  </div>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Perlu Peningkatan Kaiwa
                  </span>
                </div>
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
                  Tahap 6: Job Matching, Seleksi User & Penempatan SISKOP2MI
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Finalisasi Kontrak Kerja, Visa Penempatan & Integrasi Sistem Berwenang
                </h3>
              </div>
              <Badge variant="success">Rujukan Resmi: SISKOP2MI</Badge>
            </div>

            {/* SISKOP2MI Integration Info */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-blue-900 block">
                  Kepatuhan Regulasi Penempatan PMI:
                </span>
                <p className="text-blue-800 leading-relaxed mt-0.5">
                  Sesuai prinsip arsitektur SGG-CC, proses penempatan legal, penerbitan E-KTKLN, dan OPP (Orientasi Pra Pemberangkatan) diproses melalui sistem rujukan resmi <strong>SISKOP2MI</strong> sesuai dengan kewenangan perundang-undangan.
                </p>
              </div>
            </div>

            {/* Candidate Placement Readiness Pipeline Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Daftar Peserta Menuju Tahap Akhir Penempatan Luar Negeri:</span>
                <span className="text-blue-600 font-bold">14 Kandidat Siap Terbang</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/60 border-b border-slate-200 font-bold text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Nama Kandidat</th>
                      <th className="py-2.5 px-3">Asal Vokasi</th>
                      <th className="py-2.5 px-3">Jabatan & Negara</th>
                      <th className="py-2.5 px-3">Employer Luar Negeri</th>
                      <th className="py-2.5 px-3">Status Dokumen</th>
                      <th className="py-2.5 px-3 text-right">Proses SISKOP2MI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">Ahmad Fauzi Pratama</td>
                      <td className="py-2.5 px-3 text-slate-500">SMKN 1 Cibinong (Jabar)</td>
                      <td className="py-2.5 px-3">Welder • Jepang</td>
                      <td className="py-2.5 px-3 text-slate-600">Mitsubishi Heavy Ind.</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          CoE & Visa Terbit
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600">
                        E-KTKLN: 3201-2026-0041
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">Siti Nurhaliza Rahayu</td>
                      <td className="py-2.5 px-3 text-slate-500">SMK Bakti Husada Purwokerto</td>
                      <td className="py-2.5 px-3">Caregiver • Jepang</td>
                      <td className="py-2.5 px-3 text-slate-600">Zenkoukai Group</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Kontrak Kerja Ditandatangani
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600">
                        E-KTKLN: 3302-2026-0082
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">Cut Intan Permatasari</td>
                      <td className="py-2.5 px-3 text-slate-500">SMKN 1 Gandapura (Aceh)</td>
                      <td className="py-2.5 px-3">Hotel Specialist • Jerman</td>
                      <td className="py-2.5 px-3 text-slate-600">Maritim Hotelgesellschaft</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          Pengajuan Visa Kedubes
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600">
                        E-KTKLN: 1111-2026-0019
                      </td>
                    </tr>
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
              <button
                onClick={() => {
                  alert('Data penempatan tersinkronisasi sempurna dengan SISKOP2MI!');
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 sm:w-auto"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Sinkronisasi Data dengan SISKOP2MI</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
