import React from 'react';
import { GlobalDemand } from '../../types';
import {
  Globe2,
  Building,
  DollarSign,
  Calendar,
  Languages,
  Users,
  Cpu,
  ArrowRight,
  Edit2,
  Trash2
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface DemandCardProps {
  demand: GlobalDemand;
  onViewDetail: (demand: GlobalDemand) => void;
  onEditDemand?: (demand: GlobalDemand) => void;
  onDeleteDemand?: (demand: GlobalDemand) => void;
}

export const DemandCard: React.FC<DemandCardProps> = ({
  demand,
  onViewDetail,
  onEditDemand,
  onDeleteDemand,
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
      className={`flex flex-col justify-between overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-md ${
        isSelected
          ? 'border-primary ring-2 ring-ring/30'
          : 'border-border hover:border-ring/50'
      }`}
    >
      {/* Top Header */}
      <div className="border-b border-border p-5">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {demand.sector}
          </span>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
              <Globe2 className="h-3.5 w-3.5 text-primary" />
              <span>{demand.country}</span>
            </div>

            {onEditDemand && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditDemand(demand);
                }}
                aria-label={`Edit demand ${demand.jobTitle}`}
                className="rounded-lg p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="Edit Lowongan Demand LN"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {onDeleteDemand && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteDemand(demand);
                }}
                aria-label={`Hapus demand ${demand.jobTitle}`}
                className="rounded-lg p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="Hapus / Batalkan Lowongan"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <h3 className="text-base font-semibold leading-snug text-foreground">
          {demand.jobTitle}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Building className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{demand.employerName}</span>
        </div>
      </div>

      {/* Body Details */}
      <div className="space-y-3 bg-muted/30 p-5 text-sm">
        {/* Salary */}
        <div className="flex items-start gap-2 text-foreground">
          <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <span className="block text-xs font-medium uppercase text-muted-foreground">Estimasi gaji pokok</span>
            <span className="text-sm font-semibold text-foreground">{demand.salaryRangeString}</span>
          </div>
        </div>

        {/* Language Requirement */}
        <div className="flex items-start gap-2 text-foreground">
          <Languages className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <span className="block text-xs font-medium uppercase text-muted-foreground">Standar bahasa</span>
            <span className="font-medium text-foreground">{demand.requiredLanguageLevel}</span>
          </div>
        </div>

        {/* Quota & Deadline */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-lg border border-border bg-background p-2">
            <span className="block text-xs font-medium uppercase text-muted-foreground">Target kuota</span>
            <span className="text-sm font-medium tabular-nums text-foreground">
              {demand.filledQuota} / {demand.requiredQuota} ({remainingQuota} Sisa)
            </span>
          </div>

          <div className="rounded-lg border border-border bg-background p-2">
            <span className="block text-xs font-medium uppercase text-muted-foreground">Batas waktu</span>
            <span className="text-sm font-medium text-foreground">{demand.deadlineDate}</span>
          </div>
        </div>

        {/* Skills Preview */}
        <div className="pt-1">
          <div className="flex flex-wrap gap-1">
            {demand.requiredSkills.slice(0, 3).map((sk, idx) => (
              <span
                key={idx}
                className="rounded border border-border bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
              >
                {sk}
              </span>
            ))}
            {demand.requiredSkills.length > 3 && (
              <span className="text-xs font-medium text-muted-foreground">
                +{demand.requiredSkills.length - 3} lainnya
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="flex items-center justify-between gap-2 border-t border-border bg-card p-4">
        <button
          type="button"
          onClick={() => onViewDetail(demand)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Lihat Kualifikasi
        </button>

        <button
          type="button"
          onClick={handleLaunchMatching}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs ${
            isSelected
              ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground'
          }`}
        >
          <Cpu className={`h-3.5 w-3.5 ${isSelected ? 'text-primary-foreground' : 'text-primary'}`} />
          <span>Jalankan Matching</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
