import React, { useState, useMemo, useEffect } from 'react';
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
  UserPlus,
  Edit2,
  Trash2,
  RefreshCw,
  Briefcase,
  Award,
  Globe,
  RotateCcw,
  Sparkles,
  Download,
  LayoutList,
  List,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/useAppStore';
import { getBp3miByCode } from '../../lib/constants/bp3mi';
import { CandidateParticipant } from '../../types';
import { Badge } from '../ui/Badge';
import { StatCard } from '@/components/shared/StatCard';
import { CandidateDetailModal } from './CandidateDetailModal';
import { CandidateFormModal } from './CandidateFormModal';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import { archiveBusinessData, saveBusinessData } from '../../lib/business-data';
import { downloadCandidateTemplate, downloadCandidateTemplateXlsx, exportCandidatesCsv, exportCandidatesXlsx } from '../../lib/candidate-export';

function topCounts(values: string[]): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts, ([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 3);
}

export const SupplyTable: React.FC = () => {
  const {
    currentRole,
    currentUser,
    candidates,
    selectedCandidateIds,
    toggleCandidateSelection,
    selectAllCandidates,
    clearCandidateSelection,
    searchCandidate,
    setSearchCandidate,
    filterProvinsi,
    setFilterProvinsi,
    filterDistrict,
    setFilterDistrict,
    filterEducation,
    setFilterEducation,
    filterSector,
    setFilterSector,
    filterWorkExperience,
    setFilterWorkExperience,
    filterCertification,
    setFilterCertification,
    filterCountry,
    setFilterCountry,
    filterReadiness,
    setFilterReadiness,
    filterVerification,
    setFilterVerification,
    filterLanguage,
    setFilterLanguage,
    setActiveStage,
    currentScope,
    setCurrentTab,
  } = useAppStore();

  const bp3miInfo = getBp3miByCode(currentUser?.bp3miCode);

  const [activeCandidate, setActiveCandidate] = useState<CandidateParticipant | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [candidateToEdit, setCandidateToEdit] = useState<CandidateParticipant | null>(null);
  const [deletingCandidate, setDeletingCandidate] = useState<CandidateParticipant | null>(null);
  const [isGardataSyncing, setIsGardataSyncing] = useState(false);
  const [filterMajor, setFilterMajor] = useState('');
  const [filterSkill, setFilterSkill] = useState('ALL');
  const [filterJobRole, setFilterJobRole] = useState('ALL');
  const [filterLanguageLevel, setFilterLanguageLevel] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'full' | 'compact'>('compact');
  const [pageSize, setPageSize] = useState(100);

  // Dynamic filter options extracted from candidates
  const provinsiOptions = useMemo(() => {
    return Array.from(new Set(candidates.map((c) => c.provinsi))).filter(Boolean).sort();
  }, [candidates]);

  // Cascading district options based on selected province
  const districtOptions = useMemo(() => {
    const list = filterProvinsi === 'ALL'
      ? candidates.map((c) => c.kabupatenKota)
      : candidates.filter((c) => c.provinsi === filterProvinsi).map((c) => c.kabupatenKota);
    return Array.from(new Set(list)).filter(Boolean).sort();
  }, [candidates, filterProvinsi]);

  const sectorOptions = useMemo(() => {
    const sectors = new Set<string>();
    candidates.forEach((c) => {
      if (c.preferredSectors) {
        c.preferredSectors.forEach((s) => sectors.add(s));
      }
      if (c.workExperiences) {
        c.workExperiences.forEach((w) => sectors.add(w.sector));
      }
    });
    return Array.from(sectors).filter(Boolean).sort();
  }, [candidates]);

  const countryOptions = useMemo(() => {
    const countries = new Set<string>();
    candidates.forEach((c) => {
      c.preferredCountry.forEach((cntry) => countries.add(cntry));
    });
    return Array.from(countries).filter(Boolean).sort();
  }, [candidates]);

  const skillOptions = useMemo(
    () => Array.from(new Set(candidates.flatMap((candidate) => candidate.skills))).filter(Boolean).sort(),
    [candidates],
  );
  const jobRoleOptions = useMemo(
    () => Array.from(new Set(candidates.flatMap((candidate) => candidate.preferredJobRole))).filter(Boolean).sort(),
    [candidates],
  );
  const languageLevelOptions = useMemo(
    () => Array.from(new Set(candidates.flatMap((candidate) => candidate.languageProficiency.map((language) => language.level))))
      .filter(Boolean)
      .sort(),
    [candidates],
  );

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      searchCandidate !== '' ||
      filterProvinsi !== 'ALL' ||
      filterDistrict !== 'ALL' ||
      filterEducation !== 'ALL' ||
      filterSector !== 'ALL' ||
      filterWorkExperience !== 'ALL' ||
      filterCertification !== 'ALL' ||
      filterCountry !== 'ALL' ||
      filterReadiness !== 'ALL' ||
      filterVerification !== 'ALL' ||
      filterLanguage !== 'ALL' ||
      filterMajor !== '' ||
      filterSkill !== 'ALL' ||
      filterJobRole !== 'ALL' ||
      filterLanguageLevel !== 'ALL'
    );
  }, [
    searchCandidate,
    filterProvinsi,
    filterDistrict,
    filterEducation,
    filterSector,
    filterWorkExperience,
    filterCertification,
    filterCountry,
    filterReadiness,
    filterVerification,
    filterLanguage,
    filterMajor,
    filterSkill,
    filterJobRole,
    filterLanguageLevel,
  ]);

  const resetAllFilters = () => {
    setSearchCandidate('');
    setFilterProvinsi('ALL');
    setFilterDistrict('ALL');
    setFilterEducation('ALL');
    setFilterSector('ALL');
    setFilterWorkExperience('ALL');
    setFilterCertification('ALL');
    setFilterCountry('ALL');
    setFilterReadiness('ALL');
    setFilterVerification('ALL');
    setFilterLanguage('ALL');
    setFilterMajor('');
    setFilterSkill('ALL');
    setFilterJobRole('ALL');
    setFilterLanguageLevel('ALL');
    setCurrentPage(1);
  };

  // Filtered dataset
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // 1. Search Box
      const searchLower = searchCandidate.toLowerCase();
      const matchSearch =
        !searchCandidate ||
        c.fullName.toLowerCase().includes(searchLower) ||
        c.nik.toLowerCase().includes(searchLower) ||
        c.id.toLowerCase().includes(searchLower) ||
        c.institutionName.toLowerCase().includes(searchLower) ||
        c.major.toLowerCase().includes(searchLower) ||
        c.kabupatenKota.toLowerCase().includes(searchLower) ||
        c.provinsi.toLowerCase().includes(searchLower) ||
        c.skills.some((s) => s.toLowerCase().includes(searchLower)) ||
        (c.certifications && c.certifications.some((cert) => cert.name.toLowerCase().includes(searchLower))) ||
        c.languageProficiency.some((language) => `${language.language} ${language.level}`.toLowerCase().includes(searchLower)) ||
        c.preferredCountry.some((country) => country.toLowerCase().includes(searchLower)) ||
        c.preferredJobRole.some((role) => role.toLowerCase().includes(searchLower)) ||
        (c.preferredSectors ?? []).some((sector) => sector.toLowerCase().includes(searchLower)) ||
        (c.workExperiences && c.workExperiences.some((w) =>
          `${w.sector} ${w.role} ${w.companyName ?? ''}`.toLowerCase().includes(searchLower),
        ));

      // 2. Wilayah
      const matchProv = filterProvinsi === 'ALL' || c.provinsi === filterProvinsi;
      const matchDistrict = filterDistrict === 'ALL' || c.kabupatenKota === filterDistrict;

      // 3. Pendidikan
      const matchEdu = filterEducation === 'ALL' || c.educationLevel === filterEducation;
      const matchMajor = !filterMajor || c.major.toLowerCase().includes(filterMajor.toLowerCase());
      const matchSkill = filterSkill === 'ALL' || c.skills.includes(filterSkill);

      // 4. Sektor
      const matchSector =
        filterSector === 'ALL' ||
        (c.preferredSectors && c.preferredSectors.includes(filterSector)) ||
        (c.workExperiences && c.workExperiences.some((w) => w.sector === filterSector));

      // 5. Pengalaman Kerja
      const totalYears = c.workExperiences ? c.workExperiences.reduce((sum, w) => sum + w.durationYears, 0) : 0;
      let matchWorkExp = true;
      if (filterWorkExperience === 'fresh') {
        matchWorkExp = totalYears === 0;
      } else if (filterWorkExperience === 'lt_1') {
        matchWorkExp = totalYears > 0 && totalYears < 1;
      } else if (filterWorkExperience === '1_to_2') {
        matchWorkExp = totalYears >= 1 && totalYears <= 2;
      } else if (filterWorkExperience === 'gt_2') {
        matchWorkExp = totalYears > 2;
      }

      // 6. Sertifikasi Kompetensi
      let matchCert = true;
      if (filterCertification === 'has_cert') {
        matchCert = !!(c.certifications && c.certifications.length > 0);
      } else if (filterCertification === 'no_cert') {
        matchCert = !c.certifications || c.certifications.length === 0;
      }

      // 7. Negara Tujuan
      const matchCountry = filterCountry === 'ALL' || c.preferredCountry.includes(filterCountry);

      // 8. Status Kesiapan & Verifikasi
      const matchReadiness = filterReadiness === 'ALL' || c.readinessStatus === filterReadiness;
      const matchVerif = filterVerification === 'ALL' || c.verificationStatus === filterVerification;

      // 9. Bahasa Asing
      const matchLang =
        filterLanguage === 'ALL' ||
        c.languageProficiency.some((lp) => lp.language === filterLanguage);
      const matchLanguageLevel = filterLanguageLevel === 'ALL' ||
        c.languageProficiency.some((language) => language.level === filterLanguageLevel);
      const matchJobRole = filterJobRole === 'ALL' || c.preferredJobRole.includes(filterJobRole);

      return (
        matchSearch &&
        matchProv &&
        matchDistrict &&
        matchEdu &&
        matchMajor &&
        matchSkill &&
        matchSector &&
        matchWorkExp &&
        matchCert &&
        matchCountry &&
        matchReadiness &&
        matchVerif &&
        matchLang &&
        matchLanguageLevel &&
        matchJobRole
      );
    });
  }, [
    candidates,
    searchCandidate,
    filterProvinsi,
    filterDistrict,
    filterEducation,
    filterSector,
    filterWorkExperience,
    filterCertification,
    filterCountry,
    filterReadiness,
    filterVerification,
    filterLanguage,
    filterMajor,
    filterSkill,
    filterJobRole,
    filterLanguageLevel,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchCandidate,
    filterProvinsi,
    filterDistrict,
    filterEducation,
    filterMajor,
    filterSkill,
    filterSector,
    filterWorkExperience,
    filterCertification,
    filterCountry,
    filterReadiness,
    filterVerification,
    filterLanguage,
    filterLanguageLevel,
    filterJobRole,
  ]);

  const pageCount = Math.max(1, Math.ceil(filteredCandidates.length / pageSize));
  const visibleCandidates = filteredCandidates.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const filteredRegionalSummary = topCounts(filteredCandidates.map((candidate) => candidate.provinsi));
  const filteredSkillSummary = topCounts(filteredCandidates.flatMap((candidate) => candidate.skills));
  const filteredCountrySummary = topCounts(filteredCandidates.flatMap((candidate) => candidate.preferredCountry));
  const filteredJobSummary = topCounts(filteredCandidates.flatMap((candidate) => candidate.preferredJobRole));

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
  const certifiedCount = candidates.filter((c) => c.certifications && c.certifications.length > 0).length;
  const experiencedCount = candidates.filter((c) => c.workExperiences && c.workExperiences.length > 0).length;
  const verifiedCount = candidates.filter((c) => c.verificationStatus === 'Verified').length;

  const readinessLabels: Record<CandidateParticipant['readinessStatus'], string> = {
    'Ready for Placement': 'Siap Penempatan',
    'Needs Upskilling': 'Perlu Peningkatan',
    'Needs Reskilling': 'Perlu Pelatihan Ulang',
  };
  const verificationLabels: Record<CandidateParticipant['verificationStatus'], string> = {
    Verified: 'Terverifikasi',
    'Pending Verification': 'Menunggu Verifikasi',
    Unverified: 'Belum Diverifikasi',
  };

  const canManageCandidates = ['disnaker', 'vokasi', 'taskforce', 'superadmin'].includes(currentRole);
  const canVerifyCandidates = ['taskforce', 'verifikator'].includes(currentRole);
  const canMatchCandidates = ['taskforce', 'matching', 'verifikator'].includes(currentRole);
  const canArchiveCandidates = ['taskforce', 'superadmin'].includes(currentRole);
  const canSyncGardata = ['taskforce', 'superadmin', 'vokasi'].includes(currentRole);

  const syncGardata = () => {
    router.post('/integrations/gardata/sync', {}, {
      preserveScroll: true,
      onStart: () => setIsGardataSyncing(true),
      onSuccess: () => toast.success('Sinkronisasi data calon PMI dari Gardata berhasil diproses.'),
      onError: () => toast.error('Sinkronisasi Gardata gagal. Periksa koneksi API.'),
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
              <h1 className="text-base font-semibold tracking-tight sm:text-lg">Dashboard Pemetaan Calon PMI</h1>
              <span className="rounded px-2 py-0.5 text-xs font-semibold text-blue-100 bg-blue-700/60">
                Scope: {currentScope.name}
              </span>
              {currentRole === 'vokasi' && (
                <span className="rounded px-2 py-0.5 text-xs font-semibold text-emerald-200 bg-emerald-800/80 border border-emerald-500/40">
                  Feeder Terhubung: LPK Victoria Hotel School
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-blue-100">
              {currentRole === 'disnaker'
                ? 'Kewenangan Disnaker: Input, pemetaan, dan perbarui data calon PMI di wilayah binaan Anda.'
                : currentRole === 'vokasi'
                ? 'Kelola data siswa dan lulusan vokasi LPK Victoria Hotel School siap penempatan luar negeri, tersinkronisasi dengan Gardata.'
                : 'Pemetaan komprehensif data calon pekerja migran terintegrasi Dukcapil, Disnaker Daerah, dan feeder gardata.sippmi.com.'}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {canSyncGardata && (
            <button
              type="button"
              onClick={syncGardata}
              disabled={isGardataSyncing}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-xs transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isGardataSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{isGardataSyncing ? 'Menyinkronkan…' : 'Sinkronisasi Gardata'}</span>
            </button>
          )}

          {canManageCandidates && (
            <button
              onClick={() => {
                setCandidateToEdit(null);
                setFormMode('create');
                setIsFormOpen(true);
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-500 sm:w-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Tambah Calon PMI</span>
            </button>
          )}

          {canVerifyCandidates && (
            <button
              onClick={() => setCurrentTab('approvals')}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-900 shadow-xs transition hover:bg-blue-50 sm:w-auto"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Pusat Verifikasi</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">Total Calon PMI Terdata</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{candidates.length}</span>
            <span className="text-xs text-blue-600 font-bold">Kandidat</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">SMK, D3, & Politeknik Vokasi</span>
        </div>

        <div className="xl:col-span-9 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Rekap Hasil Pencarian &amp; Filter</h2>
            <span className="text-[11px] text-slate-500">{filteredCandidates.length} dari {candidates.length} calon PMI</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {[
              { title: 'Wilayah Terbanyak', items: filteredRegionalSummary },
              { title: 'Kompetensi Terbanyak', items: filteredSkillSummary },
              { title: 'Negara Tujuan', items: filteredCountrySummary },
              { title: 'Jabatan Pilihan', items: filteredJobSummary },
            ].map(({ title, items }) => (
              <div key={title} className="px-4 py-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h3>
                {items.length ? (
                  <ul className="mt-2 space-y-1">
                    {items.map(({ label, count }) => (
                      <li key={label} className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm text-slate-700">{label}</span>
                        <span className="tabular-nums text-sm font-semibold text-slate-900">{count}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-2 text-xs text-slate-400">Belum ada data</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 xl:col-span-12">
          <StatCard
            title="Siap Penempatan (Job Ready)"
            value={readyCount}
            change={
              candidates.length
                ? Math.round((readyCount / candidates.length) * 100) + '%'
                : '0%'
            }
            changeType="positive"
            description="Bahasa & Teknis Terstandar"
          />
          <StatCard
            title="Sertifikasi / Berpengalaman"
            value={certifiedCount}
            change={experiencedCount + ' Magang/Kerja'}
            changeType="positive"
            description="Memiliki Portofolio Kompetensi"
          />
          <StatCard
            title="Terverifikasi Sah Dukcapil"
            value={verifiedCount}
            change="Validitas Tinggi"
            changeType="positive"
            description="Siap Alokasi Matching Tahap 3"
          />
        </div>
      </div>

      {/* Feeder Data Sources Indicator */}
      <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">
            Sumber Feeder Integrasi: <strong>Disnaker Daerah</strong>, <strong>SMK / Lembaga Vokasi</strong>, <strong>gardata.sippmi.com</strong>, dan <strong>victoriahotelschool.sippmi.com</strong>.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-mono text-[11px]">API: Online</span>
          <a
            href="https://victoriahotelschool.sippmi.com"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 hover:text-white font-semibold transition flex items-center gap-1 shrink-0"
          >
            <span>Feeder Victoria ↗</span>
          </a>
          <a
            href="https://gardata.sippmi.com"
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:text-white font-semibold transition flex items-center gap-1 shrink-0"
          >
            <span>Portal Gardata ↗</span>
          </a>
        </div>
      </div>

      {/* Filter and Control Bar (9 Dimensi Pemetaan) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Search Bar & Matching Action */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchCandidate}
              onChange={(e) => setSearchCandidate(e.target.value)}
              placeholder="Cari nama calon PMI, NIK, asal sekolah, jurusan, keterampilan (mis. Welder/Caregiver), sertifikasi..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Terpilih: <strong className="text-blue-600 tabular-nums">{selectedCandidateIds.length}</strong> Calon PMI
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
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1"
                title="Bersihkan semua filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter multidimensi */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100">
          {/* 1. Asal Provinsi */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">1. Provinsi Asal</label>
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

          {/* 2. Kabupaten/Kota (Cascading dinamis) */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">2. Kabupaten / Kota</label>
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Kab/Kota</option>
              {districtOptions.map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          {/* 3. Jenjang Pendidikan */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">3. Pendidikan</label>
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
            <label htmlFor="filter-major" className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Jurusan</label>
            <input
              id="filter-major"
              value={filterMajor}
              onChange={(event) => setFilterMajor(event.target.value)}
              placeholder="Cari jurusan"
              className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Keterampilan</label>
            <select value={filterSkill} onChange={(event) => setFilterSkill(event.target.value)} className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ALL">Semua Keterampilan</option>
              {skillOptions.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
            </select>
          </div>

          {/* 4. Sektor Pilihan */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">4. Sektor Pilihan</label>
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Sektor</option>
              {sectorOptions.map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {/* 5. Pengalaman Kerja */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">5. Pengalaman Kerja</label>
            <select
              value={filterWorkExperience}
              onChange={(e) => setFilterWorkExperience(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Pengalaman</option>
              <option value="fresh">Fresh Graduate / Tanpa Pengalaman</option>
              <option value="lt_1">&lt; 1 Tahun (Magang PKL)</option>
              <option value="1_to_2">1 - 2 Tahun</option>
              <option value="gt_2">&gt; 2 Tahun</option>
            </select>
          </div>

          {/* 6. Sertifikasi Kompetensi */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">6. Sertifikasi</label>
            <select
              value={filterCertification}
              onChange={(e) => setFilterCertification(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Sertifikasi</option>
              <option value="has_cert">Memiliki Sertifikasi (BNSP/SSW)</option>
              <option value="no_cert">Belum Memiliki Sertifikasi</option>
            </select>
          </div>

          {/* 7. Kemahiran Bahasa */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">7. Bahasa Asing</label>
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

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Level Bahasa</label>
            <select value={filterLanguageLevel} onChange={(event) => setFilterLanguageLevel(event.target.value)} className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ALL">Semua Level</option>
              {languageLevelOptions.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>

          {/* 8. Negara Tujuan */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">8. Negara Tujuan</label>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Negara</option>
              {countryOptions.map((cntry) => (
                <option key={cntry} value={cntry}>{cntry}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Jabatan Pilihan</label>
            <select value={filterJobRole} onChange={(event) => setFilterJobRole(event.target.value)} className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ALL">Semua Jabatan</option>
              {jobRoleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>

          {/* 9. Status Kesiapan */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Status Kesiapan</label>
            <select
              value={filterReadiness}
              onChange={(e) => setFilterReadiness(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Kesiapan</option>
              <option value="Ready for Placement">Siap Penempatan</option>
              <option value="Needs Upskilling">Perlu Peningkatan</option>
              <option value="Needs Reskilling">Perlu Pelatihan Ulang</option>
            </select>
          </div>

          {/* 10. Status Verifikasi */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Status Verifikasi</label>
            <select
              value={filterVerification}
              onChange={(e) => setFilterVerification(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Verifikasi</option>
              <option value="Verified">Terverifikasi Sah</option>
              <option value="Pending Verification">Menunggu Verifikasi</option>
              <option value="Unverified">Belum Diverifikasi</option>
            </select>
          </div>
        </div>

        {/* Selection Helper Bar */}
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
          <span className="text-slate-500 font-medium">
            Menampilkan <strong>{filteredCandidates.length}</strong> dari {candidates.length} Calon PMI
          </span>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => exportCandidatesXlsx(filteredCandidates)} className="flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100">
              <Download className="h-3.5 w-3.5" aria-hidden="true" /> Unduh Hasil Filter (.XLSX)
            </button>
            <button type="button" onClick={() => exportCandidatesCsv(filteredCandidates)} className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
              <Download className="h-3.5 w-3.5" aria-hidden="true" /> Unduh Hasil (CSV)
            </button>
            <button type="button" onClick={downloadCandidateTemplateXlsx} className="flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100">
              <Download className="h-3.5 w-3.5" aria-hidden="true" /> Unduh Template Pengumpulan (.XLSX)
            </button>
            <button type="button" onClick={downloadCandidateTemplate} className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
              <Download className="h-3.5 w-3.5" aria-hidden="true" /> Unduh Template (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Daftar Calon PMI</h2>
            <p className="text-xs text-slate-500">Tampilan ringkas cocok untuk pimpinan; bisa beralih ke tampilan lengkap.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-semibold transition ${
                  viewMode === 'compact' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="h-3.5 w-3.5" /> Tampilan Ringkas
              </button>
              <button
                type="button"
                onClick={() => setViewMode('full')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-semibold transition ${
                  viewMode === 'full' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutList className="h-3.5 w-3.5" /> Tampilan Lengkap
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] table-fixed text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                {canMatchCandidates && (
                  <th className="w-[4%] py-3.5 px-2 text-center">
                    <span className="sr-only">Pilih</span>
                  </th>
                )}
                <th className="w-[16%] py-3.5 px-3">Calon PMI & Domisili</th>
                <th className={viewMode === 'compact' ? 'w-[14%] py-3.5 px-2' : 'w-[16%] py-3.5 px-2'}>Pendidikan & Jurusan</th>
                <th className={viewMode === 'compact' ? 'w-[12%] py-3.5 px-2' : 'w-[14%] py-3.5 px-2'}>Keahlian & Sertifikasi</th>
                <th className={viewMode === 'compact' ? 'w-[10%] py-3.5 px-2' : 'w-[13%] py-3.5 px-2'}>Pengalaman Kerja</th>
                <th className={viewMode === 'compact' ? 'w-[18%] py-3.5 px-2' : 'w-[14%] py-3.5 px-2'}>Bahasa, Negara & Jabatan</th>
                <th className="w-[12%] py-3.5 px-2">Status Kesiapan</th>
                <th className="w-[10%] py-3.5 px-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={canMatchCandidates ? 8 : 7} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Tidak ada calon PMI yang cocok dengan kriteria filter</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau reset filter wilayah dan keahlian.</p>
                    {hasActiveFilters && (
                      <button
                        onClick={resetAllFilters}
                        className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                      >
                        Reset Semua Filter
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                visibleCandidates.map((candidate) => {
                  const isSelected = canMatchCandidates && selectedCandidateIds.includes(candidate.id);
                  const totalWorkYears = candidate.workExperiences
                    ? candidate.workExperiences.reduce((acc, curr) => acc + curr.durationYears, 0)
                    : 0;

                  return (
                    <tr
                      key={candidate.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isSelected ? 'bg-blue-50/60 font-medium' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      {canMatchCandidates && (
                        <td className="py-3 px-2 text-center">
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
                        </td>
                      )}

                      {/* 1. Nama Lengkap, NIK Masked & Domisili */}
                      <td className="py-3 px-3">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                            {candidate.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setActiveCandidate(candidate)}
                              className="block max-w-full truncate text-left font-bold leading-tight text-slate-900 underline-offset-2 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                              {candidate.fullName}
                            </button>
                            <span className="text-[11px] text-slate-400 font-mono block">
                              NIK: {candidate.nik}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-0.5">
                              <span className="font-medium text-slate-700 truncate">
                                {candidate.kabupatenKota}, {candidate.provinsi}
                              </span>
                            </div>
                            {viewMode === 'full' && candidate.sourceType && (
                              <span
                                className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                  candidate.sourceType.includes('Gardata')
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : candidate.sourceType === 'Disnaker Pemda'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : 'bg-purple-50 text-purple-800 border-purple-300'
                                }`}
                              >
                                Feeder: {candidate.sourceType}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Pendidikan & Jurusan */}
                      <td className="py-3 px-2">
                        <span className="font-semibold text-slate-800 block text-xs leading-snug">
                          {candidate.institutionName}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          <strong className="text-blue-700">{candidate.educationLevel}</strong> — {candidate.major}
                        </span>
                      </td>

                      {/* 3. Bidang Keahlian & Sertifikasi Kompetensi */}
                      <td className="py-3 px-2">
                        <div className="flex flex-wrap gap-1 mb-1">
                          {(viewMode === 'compact' ? candidate.skills.slice(0, 3) : candidate.skills.slice(0, 2)).map((sk, idx) => (
                            <span
                              key={idx}
                              className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {sk}
                            </span>
                          ))}
                          {(viewMode === 'compact' ? candidate.skills.length > 3 : candidate.skills.length > 2) && (
                            <span className="text-[10px] text-slate-400 font-semibold self-center">
                              +{viewMode === 'compact' ? candidate.skills.length - 3 : candidate.skills.length - 2}
                            </span>
                          )}
                        </div>
                        {candidate.certifications && candidate.certifications.length > 0 ? (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                            <Award className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate max-w-[140px]">{candidate.certifications[0].name}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Belum bersertifikat</span>
                        )}
                      </td>

                      {/* 4. Pengalaman Kerja (Bidang & Lama) */}
                      <td className="py-3 px-2">
                        {totalWorkYears > 0 ? (
                          <div>
                            <div className="flex items-center gap-1 font-bold text-amber-900 text-xs">
                              <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>{totalWorkYears.toFixed(1)} Tahun</span>
                            </div>
                            {viewMode === 'full' && (
                              <span className="text-[11px] text-slate-500 block truncate max-w-[130px] mt-0.5" title={candidate.workExperiences?.[0]?.role}>
                                {candidate.workExperiences?.[0]?.role}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                            Fresh Graduate
                          </span>
                        )}
                      </td>

                      {/* 5. Bahasa Asing & Minat Negara / Jabatan */}
                      <td className="py-3 px-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap gap-1">
                            {candidate.languageProficiency.slice(0, viewMode === 'compact' ? 2 : 2).map((lp, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700"
                              >
                                {lp.language} · {lp.level}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-0.5">
                            <Globe className="w-3 h-3 text-blue-500 shrink-0" />
                            <span className="font-semibold text-slate-800 truncate">
                              {candidate.preferredCountry.join(', ')}
                            </span>
                          </div>
                          {viewMode === 'full' && (
                            <span className="text-[10px] text-slate-400 truncate">
                              {candidate.preferredJobRole.join(' / ')}
                            </span>
                          )}
                          {viewMode === 'compact' && (
                            <span className="text-[10px] text-slate-500 truncate">
                              Jabatan: {candidate.preferredJobRole.slice(0, 2).join(', ')}{candidate.preferredJobRole.length > 2 ? ' +' + (candidate.preferredJobRole.length - 2) : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Status Kesiapan */}
                      <td className="py-3 px-2">
                        <Badge
                          className="h-auto min-h-7 whitespace-normal px-2 py-0.5 text-[11px]"
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

                      {/* 7. Aksi */}
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setActiveCandidate(candidate)}
                            aria-label={`Lihat detail ${candidate.fullName}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 shadow-xs transition hover:bg-blue-600 hover:text-white"
                            title="Lihat Detail Pemetaan"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>

                          {canArchiveCandidates && (
                            <button
                              onClick={() => {
                                setCandidateToEdit(candidate);
                                setFormMode('edit');
                                setIsFormOpen(true);
                              }}
                              aria-label={`Ubah data ${candidate.fullName}`}
                              className="inline-flex items-center rounded-lg bg-slate-100 p-1.5 text-xs font-semibold text-slate-600 shadow-xs transition hover:bg-slate-200"
                              title="Ubah Data"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canArchiveCandidates && (
                            <button
                              onClick={() => setDeletingCandidate(candidate)}
                              aria-label={`Hapus ${candidate.fullName}`}
                              className="inline-flex items-center rounded-lg bg-rose-50 p-1.5 text-xs font-semibold text-rose-700 shadow-xs transition hover:bg-rose-600 hover:text-white"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <nav aria-label="Halaman daftar calon PMI" className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-2 text-slate-600">
            <span>
              Halaman {currentPage} dari {pageCount} · {filteredCandidates.length} hasil
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Tampilkan:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-xs focus:border-blue-500 focus:outline-none"
              >
                {[15, 25, 50, 100, 150].map((size) => (
                  <option key={size} value={size}>
                    {size} per halaman
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
              Sebelumnya
            </button>
            <button type="button" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage === pageCount} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
              Berikutnya
            </button>
          </div>
        </nav>
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

      {/* Delete Confirmation Modal */}
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
