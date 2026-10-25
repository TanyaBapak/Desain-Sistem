import React from 'react';
import { Modal } from '../ui/Modal';
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
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Sektor: {demand.sector}
            </span>
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground">
              <Globe2 className="h-3.5 w-3.5 text-primary" />
              <span>Negara Penempatan: {demand.country}</span>
            </div>
          </div>

          <h3 className="text-xl font-semibold leading-snug text-foreground">{demand.jobTitle}</h3>

          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Building className="h-4 w-4" />
            <span className="font-medium text-foreground">{demand.employerName}</span>
          </div>
        </div>

        {/* 4 Metric Info Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-3 text-center text-card-foreground">
            <Users className="mx-auto mb-1 h-4 w-4 text-primary" />
            <span className="block text-xs font-medium uppercase text-muted-foreground">Target kuota</span>
            <span className="text-base font-semibold tabular-nums text-foreground">{demand.requiredQuota} orang</span>
            <span className="mt-0.5 block text-xs font-medium text-muted-foreground">
              Sisa {remainingQuota} Slot
            </span>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 text-center text-card-foreground">
            <DollarSign className="mx-auto mb-1 h-4 w-4 text-primary" />
            <span className="block text-xs font-medium uppercase text-muted-foreground">Rentang gaji pokok</span>
            <span className="mt-1 line-clamp-2 block text-sm font-semibold text-foreground">
              {demand.salaryRangeString}
            </span>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 text-center text-card-foreground">
            <Briefcase className="mx-auto mb-1 h-4 w-4 text-primary" />
            <span className="block text-xs font-medium uppercase text-muted-foreground">Masa kontrak kerja</span>
            <span className="text-base font-semibold text-foreground">{demand.workTermMonths} bulan</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">Dapat diperpanjang</span>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 text-center text-card-foreground">
            <Calendar className="mx-auto mb-1 h-4 w-4 text-primary" />
            <span className="block text-xs font-medium uppercase text-muted-foreground">Batas rekrutmen</span>
            <span className="mt-1 block text-sm font-medium text-foreground">{demand.deadlineDate}</span>
          </div>
        </div>

        {/* Qualifications & Language Standard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
            <div className="mb-2 flex items-center gap-2 text-primary font-semibold text-sm">
              <Languages className="w-4 h-4" />
              <span>Standar Kemahiran Bahasa</span>
            </div>
            <p className="text-sm font-medium text-foreground">{demand.requiredLanguageLevel}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Wajib memiliki sertifikat kelulusan tes resmi sebelum pengajuan visa kerja.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
            <div className="mb-2 flex items-center gap-2 text-primary font-semibold text-sm">
              <Award className="w-4 h-4" />
              <span>Pendidikan Minimum</span>
            </div>
            <p className="text-sm font-medium text-foreground">{demand.minEducation}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Diutamakan lulusan SMK Kejuruan relevan atau D3/Politeknik Terapan.
            </p>
          </div>
        </div>

        {/* Required Skills */}
        <div>
          <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-foreground">
            Keterampilan Wajib yang Dipersyaratkan:
          </span>
          <div className="flex flex-wrap gap-2">
            {demand.requiredSkills.map((sk, idx) => (
              <span
                key={idx}
                className="rounded-lg border border-border bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground"
              >
                {sk}
              </span>
            ))}
          </div>
        </div>

        {/* Required Certifications */}
        <div>
          <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-foreground">
            Sertifikasi Dokumen Pendukung:
          </span>
          <div className="space-y-1.5">
            {demand.requiredCertifications.map((cert, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 p-2 text-sm font-medium text-foreground"
              >
                <CheckCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{cert}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Tutup
          </button>
          <button
            onClick={handleLaunchMatching}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Cpu className="w-4 h-4" />
            <span>Jalankan Engine Matching dengan Modul A</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
