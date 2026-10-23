import React from 'react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { GlobalDemand } from '../../types';
import {
  Globe2,
  Building,
  Calendar,
  Award,
  Languages,
  DollarSign,
  Cpu,
  Users,
  CheckCircle,
  Briefcase
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface DemandDetailModalProps {
  demand: GlobalDemand | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DemandDetailModal: React.FC<DemandDetailModalProps> = ({
  demand,
  isOpen,
  onClose,
}) => {
  const { setSelectedDemandId, setActiveStage } = useAppStore();

  if (!demand) return null;

  const handleLaunchMatching = () => {
    setSelectedDemandId(demand.id);
    setActiveStage(3);
    onClose();
  };

  const remainingQuota = demand.requiredQuota - demand.filledQuota;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Permintaan Tenaga Kerja Luar Negeri (Demand)"
      subtitle={`ID Lowongan: ${demand.id} — Resmi Melalui SISKOP2MI / Perjanjian Bilateral`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
              Sektor: {demand.sector}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-xs">
              <Globe2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Negara Penempatan: {demand.country}</span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-900 leading-snug">{demand.jobTitle}</h3>

          <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
            <Building className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-800">{demand.employerName}</span>
          </div>
        </div>

        {/* 4 Metric Info Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
            <Users className="w-4 h-4 mx-auto text-blue-600 mb-1" />
            <span className="text-[11px] text-slate-400 uppercase font-bold block">Kebutuhan Kuota</span>
            <span className="text-base font-extrabold text-slate-800">{demand.requiredQuota} Orang</span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              Sisa {remainingQuota} Slot
            </span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
            <DollarSign className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
            <span className="text-[11px] text-slate-400 uppercase font-bold block">Rentang Gaji Pokok</span>
            <span className="text-xs font-extrabold text-emerald-700 block mt-1 line-clamp-2">
              {demand.salaryRangeString}
            </span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
            <Briefcase className="w-4 h-4 mx-auto text-indigo-600 mb-1" />
            <span className="text-[11px] text-slate-400 uppercase font-bold block">Masa Kontrak Kerja</span>
            <span className="text-base font-extrabold text-slate-800">{demand.workTermMonths} Bulan</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Dapat Diperpanjang</span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
            <Calendar className="w-4 h-4 mx-auto text-red-500 mb-1" />
            <span className="text-[11px] text-slate-400 uppercase font-bold block">Batas Rekrutmen</span>
            <span className="text-xs font-bold text-slate-800 block mt-1">{demand.deadlineDate}</span>
          </div>
        </div>

        {/* Qualifications & Language Standard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-2">
              <Languages className="w-4 h-4" />
              <span>Standar Kemahiran Bahasa</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">{demand.requiredLanguageLevel}</p>
            <p className="text-xs text-slate-500 mt-1">
              Wajib memiliki sertifikat kelulusan tes resmi sebelum pengajuan visa kerja.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-2">
              <Award className="w-4 h-4" />
              <span>Pendidikan Minimum</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">{demand.minEducation}</p>
            <p className="text-xs text-slate-500 mt-1">
              Diutamakan lulusan SMK Kejuruan relevan atau D3/Politeknik Terapan.
            </p>
          </div>
        </div>

        {/* Required Skills */}
        <div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
            Keterampilan Wajib yang Dipersyaratkan:
          </span>
          <div className="flex flex-wrap gap-2">
            {demand.requiredSkills.map((sk, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
              >
                {sk}
              </span>
            ))}
          </div>
        </div>

        {/* Required Certifications */}
        <div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
            Sertifikasi Dokumen Pendukung:
          </span>
          <div className="space-y-1.5">
            {demand.requiredCertifications.map((cert, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900 font-medium"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{cert}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            Tutup
          </button>
          <button
            onClick={handleLaunchMatching}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <Cpu className="w-4 h-4" />
            <span>Jalankan Engine Matching dengan Modul A</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
