import React from 'react';
import {
  CheckCircle2,
  ArrowRight,
  Database,
  ShieldCheck,
  Cpu,
  Award,
  BookOpenCheck,
  PlaneTakeoff
} from 'lucide-react';

interface StepperProps {
  currentStage: number; // 1, 2, 3, 4, 5, or 6
  onSelectStage: (stage: number) => void;
}

const stages = [
  {
    id: 1,
    title: 'Tahap 1',
    subtitle: 'Pengumpulan Data',
    description: 'Disnaker, BP3MI & SMK',
    icon: Database,
  },
  {
    id: 2,
    title: 'Tahap 2',
    subtitle: 'Validasi & Standar',
    description: 'Dukcapil & e-Vokasi',
    icon: ShieldCheck,
  },
  {
    id: 3,
    title: 'Tahap 3',
    subtitle: 'Gap & Smart Matching',
    description: 'Demand vs Supply Score',
    icon: Cpu,
  },
  {
    id: 4,
    title: 'Tahap 4',
    subtitle: 'Penetapan & Alokasi',
    description: 'SK Kuota & Anggaran',
    icon: Award,
  },
  {
    id: 5,
    title: 'Tahap 5',
    subtitle: 'Pelaksanaan & JP',
    description: 'Kelas, Jam & Sertifikasi',
    icon: BookOpenCheck,
  },
  {
    id: 6,
    title: 'Tahap 6',
    subtitle: 'Job Match & Penempatan',
    description: 'Seleksi User & SISKOP2MI',
    icon: PlaneTakeoff,
  },
];

export const SystemStageStepper: React.FC<StepperProps> = ({ currentStage, onSelectStage }) => {
  return (
    <div className="w-full bg-slate-900 border border-slate-800 text-white p-4 sm:p-5 rounded-2xl shadow-xl mb-6 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-3 border-b border-slate-800 gap-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
            Alur Proses Bisnis Terpadu SGG-CC (6 Tahapan Dari Hulu ke Hilir)
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white">
            Pengendalian Siklus Penyiapan & Penempatan Tenaga Kerja Migran Vokasi
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Status Tahapan:</span>
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30">
            {stages.find((s) => s.id === currentStage)?.title}: {stages.find((s) => s.id === currentStage)?.subtitle}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 relative">
        {stages.map((stg, idx) => {
          const isActive = currentStage === stg.id;
          const isCompleted = currentStage > stg.id;
          const Icon = stg.icon;

          return (
            <div key={stg.id} className="relative flex items-stretch">
              <button
                type="button"
                onClick={() => onSelectStage(stg.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                  isActive
                    ? 'bg-gradient-to-br from-blue-700 to-indigo-900 border-blue-400 text-white shadow-lg shadow-blue-900/40 scale-[1.02] ring-2 ring-blue-500/40'
                    : isCompleted
                    ? 'bg-slate-800/80 border-emerald-500/30 text-slate-200 hover:bg-slate-800 hover:border-slate-700'
                    : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`p-1 rounded-md ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {stg.title}
                    </span>
                  </div>

                  {isCompleted ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-800/40">
                      ✓
                    </span>
                  ) : isActive ? (
                    <span className="text-[9px] font-bold text-white bg-blue-500/40 px-1.5 py-0.5 rounded-full">
                      Aktif
                    </span>
                  ) : null}
                </div>

                <div>
                  <h4 className="text-xs font-bold leading-tight mb-0.5">{stg.subtitle}</h4>
                  <p className="text-[10px] opacity-75 leading-normal line-clamp-1">{stg.description}</p>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
