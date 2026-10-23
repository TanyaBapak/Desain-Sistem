import React, { useState, useMemo } from 'react';
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
  UserCheck
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { CandidateParticipant } from '../../types';
import { Badge } from '../ui/Badge';
import { CandidateDetailModal } from './CandidateDetailModal';

export const SupplyTable: React.FC = () => {
  const {
    candidates,
    selectedCandidateIds,
    toggleCandidateSelection,
    selectAllCandidates,
    clearCandidateSelection,
    batchVerifyCandidates,
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
  } = useAppStore();

  const [activeCandidate, setActiveCandidate] = useState<CandidateParticipant | null>(null);

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

  return (
    <div className="space-y-6">
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
              {Math.round((readyCount / candidates.length) * 100)}%
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
            {selectedCandidateIds.length > 0 && (
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
              <option value="Ready for Placement">Ready for Placement</option>
              <option value="Needs Upskilling">Needs Upskilling</option>
              <option value="Needs Reskilling">Needs Reskilling</option>
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
              <option value="Verified">Verified</option>
              <option value="Pending Verification">Pending Verification</option>
              <option value="Unverified">Unverified</option>
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

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Aksi Massal Tahap 2:</span>
            <button
              disabled={selectedCandidateIds.length === 0}
              onClick={() => batchVerifyCandidates(selectedCandidateIds)}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verifikasi Massal ({selectedCandidateIds.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">
                  <span className="sr-only">Pilih</span>
                </th>
                <th className="py-3.5 px-4">Calon Peserta</th>
                <th className="py-3.5 px-4">Institusi & Jurusan</th>
                <th className="py-3.5 px-4">Kemahiran Bahasa</th>
                <th className="py-3.5 px-4">Keterampilan Kunci</th>
                <th className="py-3.5 px-4">Status Kesiapan</th>
                <th className="py-3.5 px-4">Verifikasi</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Tidak ada calon peserta yang cocok</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter Anda.</p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => {
                  const isSelected = selectedCandidateIds.includes(candidate.id);
                  return (
                    <tr
                      key={candidate.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isSelected ? 'bg-blue-50/60 font-medium' : ''
                      }`}
                    >
                      {/* Select Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleCandidateSelection(candidate.id)}
                          className="p-1 rounded hover:bg-slate-200 text-slate-600 transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>

                      {/* Name & ID */}
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block text-xs">
                          {candidate.institutionName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {candidate.educationLevel} — {candidate.major}
                        </span>
                      </td>

                      {/* Language */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {candidate.languageProficiency.map((lp, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 w-fit"
                            >
                              {lp.language}: {lp.level}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Skills */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.slice(0, 2).map((sk, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium border border-slate-200"
                            >
                              {sk}
                            </span>
                          ))}
                          {candidate.skills.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{candidate.skills.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Readiness */}
                      <td className="py-3 px-4">
                        <Badge
                          size="sm"
                          variant={
                            candidate.readinessStatus === 'Ready for Placement'
                              ? 'success'
                              : candidate.readinessStatus === 'Needs Upskilling'
                              ? 'warning'
                              : 'purple'
                          }
                        >
                          {candidate.readinessStatus}
                        </Badge>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3 px-4">
                        <Badge
                          size="sm"
                          variant={
                            candidate.verificationStatus === 'Verified'
                              ? 'success'
                              : candidate.verificationStatus === 'Pending Verification'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {candidate.verificationStatus === 'Verified' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {candidate.verificationStatus === 'Pending Verification' && <Clock className="w-3 h-3 mr-1" />}
                          {candidate.verificationStatus === 'Unverified' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {candidate.verificationStatus}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setActiveCandidate(candidate)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition inline-flex items-center gap-1 shadow-xs"
                          title="Lihat Detail Profil"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Profil</span>
                        </button>
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
    </div>
  );
};
