import React from 'react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { CandidateParticipant } from '../../types';
import {
  User,
  GraduationCap,
  MapPin,
  Languages,
  Wrench,
  Globe,
  CheckCircle,
  Clock,
  AlertCircle,
  Briefcase,
  Award,
  Layers,
  Building
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { saveBusinessData } from '../../lib/business-data';

interface CandidateDetailModalProps {
  candidate: CandidateParticipant | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  isOpen,
  onClose,
}) => {
  const { currentRole, toggleCandidateSelection, selectedCandidateIds } = useAppStore();
  const canVerify = ['taskforce', 'verifikator'].includes(currentRole);
  const canMatch = currentRole === 'taskforce';

  if (!candidate) return null;

  const isSelected = selectedCandidateIds.includes(candidate.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Pemetaan Calon PMI Vokasi"
      subtitle={`ID: ${candidate.id} — Program SMK Go Global`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Profile Card Header (Nama, NIK, Domisili, Status) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shrink-0">
              {candidate.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-lg font-bold text-slate-900">{candidate.fullName}</h4>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                  {candidate.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
                {candidate.sourceType && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      candidate.sourceType.includes('Gardata')
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : candidate.sourceType === 'Disnaker Pemda'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-purple-50 text-purple-800 border-purple-300'
                    }`}
                  >
                    Sumber: {candidate.sourceType}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">NIK: {candidate.nik}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold">{candidate.kabupatenKota}, {candidate.provinsi}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Status Verifikasi:</span>
              <Badge
                variant={
                  candidate.verificationStatus === 'Verified'
                    ? 'success'
                    : candidate.verificationStatus === 'Pending Verification'
                    ? 'warning'
                    : 'danger'
                }
              >
                {candidate.verificationStatus === 'Verified' && <CheckCircle className="w-3 h-3 mr-1" />}
                {candidate.verificationStatus === 'Pending Verification' && <Clock className="w-3 h-3 mr-1" />}
                {candidate.verificationStatus === 'Unverified' && <AlertCircle className="w-3 h-3 mr-1" />}
                {candidate.verificationStatus}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Kesiapan Kerja:</span>
              <Badge
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
            </div>
          </div>
        </div>

        {/* 9 Komponen Pemetaan Utama Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Pendidikan & Lembaga Asal */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-3">
              <GraduationCap className="w-4 h-4" />
              <span>1. Latar Belakang Pendidikan</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 block">Jenjang & Nama Sekolah / Lembaga:</span>
                <span className="font-bold text-slate-800 text-sm">{candidate.educationLevel} — {candidate.institutionName}</span>
              </div>
              {candidate.createdBy && (
                <div>
                  <span className="text-slate-500 block">Pengguna / Pembuat:</span>
                  <span className="font-semibold text-slate-700">{candidate.createdBy}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500 block">Jurusan / Konsentrasi:</span>
                <span className="font-semibold text-slate-700">{candidate.major}</span>
              </div>
            </div>
          </div>

          {/* 2. Kemahiran Bahasa Asing */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-3">
              <Languages className="w-4 h-4" />
              <span>2. Kemampuan Bahasa Asing</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {candidate.languageProficiency.map((lp, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5 text-xs"
                >
                  <span className="font-bold text-indigo-950">{lp.language}:</span>
                  <span className="px-2 py-0.5 rounded bg-white text-indigo-700 font-bold shadow-xs">
                    {lp.level}
                  </span>
                </div>
              ))}
              {candidate.languageProficiency.length === 0 && (
                <span className="text-xs text-slate-400">Belum ada catatan kemahiran bahasa.</span>
              )}
            </div>
          </div>

          {/* 3. Pengalaman Kerja (Bidang & Lama Pengalaman) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <Briefcase className="w-4 h-4" />
                <span>3. Pengalaman Kerja / Magang Industri</span>
              </div>
              <span className="text-xs text-slate-500">
                {candidate.workExperiences && candidate.workExperiences.length > 0
                  ? `${candidate.workExperiences.reduce((acc, curr) => acc + curr.durationYears, 0).toFixed(1)} Tahun Total Pengalaman`
                  : 'Fresh Graduate'}
              </span>
            </div>

            {candidate.workExperiences && candidate.workExperiences.length > 0 ? (
              <div className="space-y-2 mt-2">
                {candidate.workExperiences.map((exp, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/70 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{exp.role}</span>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[11px]">
                          Bidang: {exp.sector}
                        </span>
                      </div>
                      <span className="text-slate-600 font-semibold">
                        Lama: <strong className="text-amber-800">{exp.durationYears} Tahun</strong>
                      </span>
                    </div>
                    {exp.companyName && (
                      <div className="flex items-center gap-1.5 text-slate-600 mt-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exp.companyName}</span>
                      </div>
                    )}
                    {exp.description && (
                      <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
                Lulusan baru (Fresh Graduate) / belum memiliki riwayat pekerjaan formal sebelum diklat.
              </div>
            )}
          </div>

          {/* 4. Sertifikasi Kompetensi yang Dimiliki */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white md:col-span-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-2">
              <Award className="w-4 h-4" />
              <span>4. Sertifikasi Kompetensi yang Dimiliki</span>
            </div>
            {candidate.certifications && candidate.certifications.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {candidate.certifications.map((cert, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-emerald-950 block">{cert.name}</span>
                      <span className="shrink-0 px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                        VALID
                      </span>
                    </div>
                    <span className="text-emerald-800 text-[11px] block mt-1">
                      Penerbit: <strong>{cert.issuer}</strong>
                    </span>
                    {cert.validUntil && (
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Berlaku hingga: {cert.validUntil}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
                Belum terdaftar memiliki sertifikat kompetensi resmi (kandidat perlu uji kompetensi di Modul B).
              </div>
            )}
          </div>

          {/* 5. Keterampilan / Kompetensi Teknis */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              <span>5. Bidang Keahlian & Keterampilan</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {candidate.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* 6. Preferensi Penempatan: Negara, Sektor & Jabatan */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>6. Peminatan Penempatan Luar Negeri</span>
            </div>
            <div className="space-y-2 text-xs mt-2">
              <div>
                <span className="text-slate-500 block mb-1">Negara Tujuan yang Diminati:</span>
                <div className="flex flex-wrap gap-1">
                  {candidate.preferredCountry.map((country, i) => (
                    <Badge key={i} variant="primary" size="sm">
                      {country}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Sektor & Jabatan yang Dipilih:</span>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.preferredSectors && candidate.preferredSectors.map((sector, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-bold text-[11px]">
                      Sektor: {sector}
                    </span>
                  ))}
                  {candidate.preferredJobRole.map((role, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-medium text-[11px]">
                      Jabatan: {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-200 gap-3">
          {canVerify && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Tindakan verifikasi:</span>
              {candidate.verificationStatus !== 'Verified' ? (
                <button
                  onClick={() => saveBusinessData(
                    'candidates',
                    { ...candidate, verificationStatus: 'Verified' },
                    candidate.id,
                  )}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1 shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Verifikasi Data Calon PMI</span>
                </button>
              ) : (
                <button
                  onClick={() => saveBusinessData(
                    'candidates',
                    { ...candidate, verificationStatus: 'Pending Verification' },
                    candidate.id,
                  )}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                >
                  Tandai menunggu verifikasi
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {canMatch && (
              <button
                onClick={() => toggleCandidateSelection(candidate.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                  isSelected
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <User className="w-4 h-4" />
                <span>{isSelected ? 'Keluarkan dari Matching Pool' : 'Pilih ke Matching Pool (Tahap 3)'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
