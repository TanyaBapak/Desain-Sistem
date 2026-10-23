import React from 'react';
import { GlobalDemand } from '../../types';
import { Badge } from '../ui/Badge';
import {
  Globe2,
  Building,
  DollarSign,
  Calendar,
  Languages,
  Users,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface DemandCardProps {
  demand: GlobalDemand;
  onViewDetail: (demand: GlobalDemand) => void;
}

export const DemandCard: React.FC<DemandCardProps> = ({
  demand,
  onViewDetail,
}) => {
  const { selectedDemandId, setSelectedDemandId, setActiveStage } = useAppStore();

  const isSelected = selectedDemandId === demand.id;

  const handleLaunchMatching = () => {
    setSelectedDemandId(demand.id);
    setActiveStage(3);
  };

  const remainingQuota = demand.requiredQuota - demand.filledQuota;

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/30'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            {demand.sector}
          </span>

          <div className="flex items-center gap-1 text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full">
            <Globe2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{demand.country}</span>
          </div>
        </div>

        <h3 className="font-bold text-slate-900 text-base leading-snug">
          {demand.jobTitle}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
          <Building className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">{demand.employerName}</span>
        </div>
      </div>

      {/* Body Details */}
      <div className="p-5 space-y-3 bg-slate-50/40 text-xs">
        {/* Salary */}
        <div className="flex items-start gap-2 text-slate-700">
          <DollarSign className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Estimasi Gaji Pokok:</span>
            <span className="font-extrabold text-emerald-700 text-xs">{demand.salaryRangeString}</span>
          </div>
        </div>

        {/* Language Requirement */}
        <div className="flex items-start gap-2 text-slate-700">
          <Languages className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Standar Bahasa:</span>
            <span className="font-semibold text-slate-800">{demand.requiredLanguageLevel}</span>
          </div>
        </div>

        {/* Quota & Deadline */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2 bg-white border border-slate-200 rounded-lg">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Kebutuhan Kuota</span>
            <span className="font-bold text-slate-800 text-xs">
              {demand.filledQuota} / {demand.requiredQuota} ({remainingQuota} Sisa)
            </span>
          </div>

          <div className="p-2 bg-white border border-slate-200 rounded-lg">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Batas Waktu</span>
            <span className="font-bold text-slate-800 text-xs">{demand.deadlineDate}</span>
          </div>
        </div>

        {/* Skills Preview */}
        <div className="pt-1">
          <div className="flex flex-wrap gap-1">
            {demand.requiredSkills.slice(0, 3).map((sk, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
              >
                {sk}
              </span>
            ))}
            {demand.requiredSkills.length > 3 && (
              <span className="text-[10px] text-slate-400 font-medium">
                +{demand.requiredSkills.length - 3} lainnya
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewDetail(demand)}
          className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
        >
          Lihat Kualifikasi
        </button>

        <button
          type="button"
          onClick={handleLaunchMatching}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs ${
            isSelected
              ? 'bg-blue-600 text-white shadow-blue-500/20'
              : 'bg-slate-900 text-white hover:bg-blue-600'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span>Jalankan Matching</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
