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
  Trash2,
  Calendar
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { visitAllocationStage } from '../../lib/navigation';

interface ProgramCardProps {
  program: TrainingProgram;
  onViewCurriculum: (program: TrainingProgram) => void;
  onEditProgram?: (program: TrainingProgram) => void;
  onEditSchedule?: (program: TrainingProgram) => void;
  onDeleteProgram?: (program: TrainingProgram) => void;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({
  program,
  onViewCurriculum,
  onEditProgram,
  onEditSchedule,
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

  const formatDateIndo = (dateStr?: string) => {
    if (!dateStr) return null;
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(parsed);
  };

  const formattedStart = formatDateIndo(program.scheduleStart);
  const formattedEnd = formatDateIndo(program.scheduleEnd);
  const hasSchedule = Boolean(formattedStart || formattedEnd);

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/30'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Top Header Card */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
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
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
              <Globe2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{program.targetCountry}</span>
            </div>

            {onEditProgram && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProgram(program);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
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
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                title="Hapus Program"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400">
          {program.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
          <span>{program.targetSector}</span>
          <span>•</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{program.targetJobRole}</span>
        </div>
      </div>

      {/* Body Metrics */}
      <div className="p-5 space-y-3 bg-slate-50/40 dark:bg-slate-800/40 text-xs">
        {/* Certification Target */}
        <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
          <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-400 dark:text-slate-500 font-semibold block text-[10px] uppercase">Standar Kelulusan:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{program.certificationTarget}</span>
          </div>
        </div>

        {/* Cost & Duration */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">Durasi (JP)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{program.durationJP} Jam</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">Biaya / Peserta</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {formatIDR(program.estimatedCostPerParticipant)}
              </span>
            </div>
          </div>
        </div>

        {/* Jadwal Pelaksanaan Pelatihan */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/60">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">Tanggal Pelatihan</span>
              {hasSchedule ? (
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block tabular-nums">
                  {formattedStart || '-'} s/d {formattedEnd || '-'}
                </span>
              ) : (
                <span className="font-medium text-amber-600 dark:text-amber-400 block">
                  Jadwal belum diatur
                </span>
              )}
            </div>
          </div>

          {onEditSchedule && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditSchedule(program);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/70 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/70 transition shrink-0 flex items-center gap-1"
              title="Atur Tanggal Mulai & Selesai Pelatihan"
            >
              <Calendar className="w-3 h-3" />
              <span>{hasSchedule ? 'Ubah Tanggal' : 'Atur Tanggal'}</span>
            </button>
          )}
        </div>

        {/* Quota Progress Bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Kapasitas Peserta:</span>
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {program.enrolledCount} / {program.quota} ({availableSlots} Slot Sisa)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${(program.enrolledCount / program.quota) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewCurriculum(program)}
          className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition flex items-center gap-1"
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
