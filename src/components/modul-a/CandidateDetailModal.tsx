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
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

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
  const { updateCandidateVerification, toggleCandidateSelection, selectedCandidateIds } = useAppStore();

  if (!candidate) return null;

  const isSelected = selectedCandidateIds.includes(candidate.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Portofolio Calon Pekerja Migran Vokasi"
      subtitle={`ID: ${candidate.id} — Terintegrasi Bank Data Supply Vokasi P2MI`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
              {candidate.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-slate-900">{candidate.fullName}</h4>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                  {candidate.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">NIK: {candidate.nik}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{candidate.kabupatenKota}, {candidate.provinsi}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
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
              <span className="text-xs text-slate-500">Status Kesiapan:</span>
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

        {/* Grid Info Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pendidikan & Institusi */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-3">
              <GraduationCap className="w-4 h-4" />
              <span>Pendidikan & Lembaga Asal</span>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Jenjang & Institusi:</span>
                <span className="font-semibold text-slate-800">{candidate.educationLevel} — {candidate.institutionName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Konsentrasi Keahlian / Jurusan:</span>
                <span className="font-medium text-slate-700">{candidate.major}</span>
              </div>
            </div>
          </div>

          {/* Kemahiran Bahasa Asing */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-3">
              <Languages className="w-4 h-4" />
              <span>Kemahiran Bahasa Asing</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {candidate.languageProficiency.map((lp, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5 text-xs"
                >
                  <span className="font-bold text-indigo-900">{lp.language}:</span>
                  <span className="px-2 py-0.5 rounded bg-white text-indigo-700 font-semibold shadow-xs">
                    {lp.level}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Keterampilan Teknis */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white md:col-span-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-2">
              <Wrench className="w-4 h-4" />
              <span>Keterampilan & Kompetensi Terverifikasi</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {candidate.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Preferensi Penempatan Global */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white md:col-span-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Minat Penempatan Negara & Jabatan</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-2">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1">Negara Tujuan yang Diminati:</span>
                <div className="flex flex-wrap gap-1">
                  {candidate.preferredCountry.map((country, i) => (
                    <Badge key={i} variant="primary" size="sm">
                      {country}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1">Preferensi Jabatan / Role:</span>
                <div className="flex flex-wrap gap-1">
                  {candidate.preferredJobRole.map((role, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-200 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Tindakan Cepat Tahap 2:</span>
            {candidate.verificationStatus !== 'Verified' ? (
              <button
                onClick={() => updateCandidateVerification(candidate.id, 'Verified')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1 shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Simulasi Verifikasi Dukcapil</span>
              </button>
            ) : (
              <button
                onClick={() => updateCandidateVerification(candidate.id, 'Pending Verification')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
              >
                Tandai Pending
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
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
