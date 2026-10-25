import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DemandCard } from './DemandCard';
import { DemandDetailModal } from './DemandDetailModal';
import { DemandFormModal } from './DemandFormModal';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import { GlobalDemand } from '../../types';
import { archiveBusinessData, saveBusinessData } from '../../lib/business-data';
import { Search, Plus } from 'lucide-react';

export const GlobalDemandsView: React.FC = () => {
  const {
    demands,
    searchDemand,
    setSearchDemand,
    filterDemandCountry,
    setFilterDemandCountry,
    filterDemandSector,
    setFilterDemandSector,
  } = useAppStore();

  const [activeModalDemand, setActiveModalDemand] = useState<GlobalDemand | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [demandToEdit, setDemandToEdit] = useState<GlobalDemand | null>(null);
  const [deletingDemand, setDeletingDemand] = useState<GlobalDemand | null>(null);

  // Compute summary metrics
  const totalSlotsRequired = demands.reduce((acc, d) => acc + d.requiredQuota, 0);
  const totalSlotsFilled = demands.reduce((acc, d) => acc + d.filledQuota, 0);
  const achievementRate = totalSlotsRequired > 0
    ? Math.round((totalSlotsFilled / totalSlotsRequired) * 100)
    : 0;

  const countryOptions = useMemo(() => {
    return Array.from(new Set(demands.map((d) => d.country)));
  }, [demands]);

  const sectorOptions = useMemo(() => {
    return Array.from(new Set(demands.map((d) => d.sector)));
  }, [demands]);

  const filteredDemands = useMemo(() => {
    return demands.filter((d) => {
      const matchSearch =
        !searchDemand ||
        d.jobTitle.toLowerCase().includes(searchDemand.toLowerCase()) ||
        d.employerName.toLowerCase().includes(searchDemand.toLowerCase()) ||
        d.requiredSkills.some((s) => s.toLowerCase().includes(searchDemand.toLowerCase())) ||
        d.requiredLanguageLevel.toLowerCase().includes(searchDemand.toLowerCase());

      const matchCountry =
        filterDemandCountry === 'ALL' || d.country === filterDemandCountry;

      const matchSector =
        filterDemandSector === 'ALL' || d.sector === filterDemandSector;

      return matchSearch && matchCountry && matchSector;
    });
  }, [demands, searchDemand, filterDemandCountry, filterDemandSector]);

  return (
    <div className="space-y-6">
      {/* 4 Executive Metric Cards for Demand */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
          <span className="block text-xs font-semibold text-muted-foreground">Total target kuota</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold tabular-nums text-foreground">{totalSlotsRequired.toLocaleString('id-ID')}</span>
            <span className="text-xs font-bold text-primary">orang</span>
          </div>
          <span className="mt-1 block text-xs text-muted-foreground">
            {totalSlotsFilled.toLocaleString('id-ID')} terpenuhi · {Math.max(totalSlotsRequired - totalSlotsFilled, 0).toLocaleString('id-ID')} tersisa
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
          <span className="block text-xs font-semibold text-muted-foreground">Negara tujuan</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold tabular-nums text-foreground">{countryOptions.length.toLocaleString('id-ID')}</span>
          </div>
          <span className="mt-1 block text-xs text-muted-foreground">Negara dengan demand tercatat</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
          <span className="block text-xs font-semibold text-muted-foreground">Sektor permintaan</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold tabular-nums text-foreground">{sectorOptions.length.toLocaleString('id-ID')}</span>
          </div>
          <span className="mt-1 block text-xs text-muted-foreground">Sektor dengan demand tercatat</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
          <span className="block text-xs font-semibold text-muted-foreground">Capaian kuota demand</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold tabular-nums text-foreground">{achievementRate}%</span>
          </div>
          <span className="mt-1 block text-xs text-muted-foreground">Terpenuhi dibanding target kuota</span>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchDemand}
              onChange={(e) => setSearchDemand(e.target.value)}
              placeholder="Cari posisi pekerjaan (Caregiver, Welder, SMT), perusahaan, bahasa, atau skill..."
              className="w-full rounded-xl border border-input bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Country & Sector Filters & Add Button */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterDemandCountry}
              onChange={(e) => setFilterDemandCountry(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">Semua Negara</option>
              {countryOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={filterDemandSector}
              onChange={(e) => setFilterDemandSector(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">Semua Sektor</option>
              {sectorOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setDemandToEdit(null);
                setFormMode('create');
                setIsFormOpen(true);
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Lowongan Demand</span>
            </button>
          </div>
        </div>
      </div>

      {filteredDemands.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDemands.map((demand) => (
            <DemandCard
              key={demand.id}
              demand={demand}
              onViewDetail={setActiveModalDemand}
              onEditDemand={(d) => {
                setDemandToEdit(d);
                setFormMode('edit');
                setIsFormOpen(true);
              }}
              onDeleteDemand={(d) => setDeletingDemand(d)}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {demands.length === 0
            ? 'Belum ada data demand. Tambahkan permintaan untuk mulai memantau target.'
            : 'Tidak ada demand yang sesuai dengan pencarian atau filter.'}
        </p>
      )}

      {/* Demand Detail Modal */}
      <DemandDetailModal
        demand={activeModalDemand}
        isOpen={!!activeModalDemand}
        onClose={() => setActiveModalDemand(null)}
      />

      {/* Demand Form Modal (Create / Edit) */}
      <DemandFormModal
        isOpen={isFormOpen}
        mode={formMode}
        initialData={demandToEdit}
        onClose={() => {
          setIsFormOpen(false);
          setDemandToEdit(null);
        }}
        onSubmit={(data) => {
          const demandData = { ...data, filledQuota: formMode === 'create' ? 0 : demandToEdit?.filledQuota ?? 0 };
          saveBusinessData(
            'demands',
            demandData,
            formMode === 'edit' ? demandToEdit?.id : undefined,
            () => {
              setIsFormOpen(false);
              setDemandToEdit(null);
            },
          );
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingDemand}
        onClose={() => setDeletingDemand(null)}
        entityName={deletingDemand?.jobTitle || ''}
        entityId={deletingDemand?.id || ''}
        title="Konfirmasi Batalkan / Hapus Lowongan Demand"
        description="Membatalkan lowongan kerja ini akan menghentikan proses matching kandidat yang sedang berjalan dan mencatat aksi ke audit log."
        confirmText="Ya, Batalkan Lowongan"
        onConfirm={(reason) => {
          if (deletingDemand) {
            archiveBusinessData('demands', deletingDemand.id, reason, () => setDeletingDemand(null));
          }
        }}
      />
    </div>
  );
};
