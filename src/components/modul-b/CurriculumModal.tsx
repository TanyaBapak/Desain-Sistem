import React from 'react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { TrainingProgram } from '../../types';
import {
  BookOpen,
  Calendar,
  Clock,
  Coins,
  Award,
  Users,
  CheckCircle,
  Globe2,
  Briefcase
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface CurriculumModalProps {
  program: TrainingProgram | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CurriculumModal: React.FC<CurriculumModalProps> = ({
  program,
  isOpen,
  onClose,
}) => {
  const { setSelectedProgramId, setActiveStage } = useAppStore();

  if (!program) return null;

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleSelectForAllocation = () => {
    setSelectedProgramId(program.id);
    setActiveStage(4);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Kurikulum & Biaya Pelatihan Terstandar"
      subtitle={`Kode Program: ${program.id} — Sesuai Standar Kompetensi Kerja Internasional`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
              {program.programType}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Globe2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Target Negara: {program.targetCountry}</span>
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-900 leading-snug">{program.title}</h3>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2">
            <div className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>Sektor: {program.targetSector}</span>
            </div>
            <span>•</span>
            <span className="font-semibold text-slate-800">Target Role: {program.targetJobRole}</span>
          </div>
        </div>

        {/* 4 Metric Info Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
            <Clock className="w-4 h-4 mx-auto text-blue-600 mb-1" />
            <span className="text-[11px] text-slate-400 uppercase font-bold block">Durasi Pelatihan</span>
            <span className="text-sm font-extrabold text-slate-800">{program.durationJP} Jam (JP)</span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
            <Coins className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
            <span className="text-[11px] text-slate-400 uppercase font-bold block">Biaya / Peserta</span>
            <span className="text-sm font-extrabold text-emerald-700">
              {formatIDR(program.estimatedCostPerParticipant)}
            </span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
            <Users className="w-4 h-4 mx-auto text-indigo-600 mb-1" />
            <span className="text-[11px] text-slate-400 uppercase font-bold block">Kuota Peserta</span>
            <span className="text-sm font-extrabold text-slate-800">
              {program.enrolledCount} / {program.quota} Siswa
            </span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
            <Calendar className="w-4 h-4 mx-auto text-amber-600 mb-1" />
            <span className="text-[11px] text-slate-400 uppercase font-bold block">Jadwal Pelaksanaan</span>
            <span className="text-xs font-bold text-slate-700 block mt-0.5">
              {program.scheduleStart} s.d {program.scheduleEnd}
            </span>
          </div>
        </div>

        {/* Target Certification */}
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Target Output Sertifikasi Internasional</span>
          </div>
          <p className="text-sm font-semibold text-emerald-950 mt-1">
            {program.certificationTarget}
          </p>
          <p className="text-xs text-emerald-700 mt-1">
            Peserta yang lulus dijamin memperoleh sertifikat kompetensi berstandar BNSP dan standar negara tujuan untuk pengurusan visa kerja (SSW / E-7 / Ausbildung).
          </p>
        </div>

        {/* Outline Curriculum Units */}
        <div>
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-3">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Silabus & Unit Modul Pembelajaran</span>
          </div>
          <div className="space-y-2">
            {program.curriculumOutline.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              >
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <span className="text-slate-700 font-medium leading-relaxed">{item}</span>
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
            onClick={handleSelectForAllocation}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Pilih Program untuk Alokasi Tahap 4</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
