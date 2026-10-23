import React from 'react';
import { TrainingProgram } from '../../types';
import { Badge } from '../ui/Badge';
import {
  Clock,
  Award,
  Users,
  Coins,
  ArrowRight,
  BookOpen,
  Globe2,
  CheckCircle2,
  Edit2,
  Trash2
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { visitAllocationStage } from '../../lib/navigation';

interface ProgramCardProps {
  program: TrainingProgram;
  onViewCurriculum: (program: TrainingProgram) => void;
  onEditProgram?: (program: TrainingProgram) => void;
  onDeleteProgram?: (program: TrainingProgram) => void;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({
  program,
  onViewCurriculum,
  onEditProgram,
  onDeleteProgram,
}) => {
  const {
    currentRole,
    selectedProgramId,
    selectedProviderId,
    setSelectedProgramId,
    setActiveStage,
  } = useAppStore();

  const isSelected = selectedProgramId === program.id;

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleSelectProgram = () => {
    setSelectedProgramId(program.id);
    setActiveStage(4);
    visitAllocationStage({ programId: program.id, providerId: selectedProviderId ?? undefined });
  };

  const availableSlots = program.quota - program.enrolledCount;

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/30'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Header Card */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <Badge
            variant={
              program.programType === 'Teknis Terpadu'
                ? 'primary'
                : program.programType === 'Upskilling'
                ? 'success'
                : program.programType === 'Reskilling'
                ? 'purple'
                : 'warning'
            }
            size="sm"
          >
            {program.programType}
          </Badge>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
              <Globe2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{program.targetCountry}</span>
            </div>

            {onEditProgram && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProgram(program);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                title="Edit Program Pelatihan"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {onDeleteProgram && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProgram(program);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Hapus Program"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600">
          {program.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
          <span>{program.targetSector}</span>
          <span>•</span>
          <span className="font-semibold text-slate-700">{program.targetJobRole}</span>
        </div>
      </div>

      {/* Body Metrics */}
      <div className="p-5 space-y-3 bg-slate-50/40 text-xs">
        {/* Certification Target */}
        <div className="flex items-start gap-2 text-slate-700">
          <Award className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Standar Kelulusan:</span>
            <span className="font-semibold text-slate-800">{program.certificationTarget}</span>
          </div>
        </div>

        {/* Cost & Duration */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Durasi (JP)</span>
              <span className="font-bold text-slate-800">{program.durationJP} Jam</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Biaya / Peserta</span>
              <span className="font-bold text-emerald-700">
                {formatIDR(program.estimatedCostPerParticipant)}
              </span>
            </div>
          </div>
        </div>

        {/* Quota Progress Bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Kapasitas Peserta:</span>
            </span>
            <span className="font-bold text-slate-800">
              {program.enrolledCount} / {program.quota} ({availableSlots} Slot Sisa)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${(program.enrolledCount / program.quota) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewCurriculum(program)}
          className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-1"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Lihat Kurikulum</span>
        </button>

        {currentRole === 'taskforce' && (
          <button
            type="button"
            onClick={handleSelectProgram}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs ${
              isSelected
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSelected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terpilih di Tahap 4</span>
              </>
            ) : (
              <>
                <span>Pilih Alokasi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
