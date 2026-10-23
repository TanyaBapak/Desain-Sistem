import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DemandCard } from './DemandCard';
import { DemandDetailModal } from './DemandDetailModal';
import { DemandFormModal } from './DemandFormModal';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import { GlobalDemand } from '../../types';
import {
  Search,
  Globe2,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Plus
} from 'lucide-react';

export const GlobalDemandsView: React.FC = () => {
  const {
    demands,
    searchDemand,
    setSearchDemand,
    filterDemandCountry,
    setFilterDemandCountry,
    filterDemandSector,
    setFilterDemandSector,
    createDemand,
    updateDemand,
    deleteDemand,
  } = useAppStore();

  const [activeModalDemand, setActiveModalDemand] = useState<GlobalDemand | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [demandToEdit, setDemandToEdit] = useState<GlobalDemand | null>(null);
  const [deletingDemand, setDeletingDemand] = useState<GlobalDemand | null>(null);

  // Compute summary metrics
  const totalSlotsRequired = demands.reduce((acc, d) => acc + d.requiredQuota, 0);
  const totalSlotsFilled = demands.reduce((acc, d) => acc + d.filledQuota, 0);

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
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">Total Kebutuhan Kuota Global</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-900">{totalSlotsRequired}</span>
            <span className="text-xs text-blue-600 font-bold">Slot PMI</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {totalSlotsFilled} Terisi ({totalSlotsRequired - totalSlotsFilled} Tersedia)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">Negara Tujuan Prioritas</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-blue-700">Jepang & Korea</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Skema SSW Tokutei Ginou & E-7</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">Sektor Permintaan Tertinggi</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-extrabold text-emerald-700">Kesehatan & Manufaktur</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Caregiver & Welder Galangan</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">Deadline Rekrutmen Terdekat</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-red-600">30 Nov 2026</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Mitsubishi Heavy Industries</span>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchDemand}
              onChange={(e) => setSearchDemand(e.target.value)}
              placeholder="Cari posisi pekerjaan (Caregiver, Welder, SMT), perusahaan, bahasa, atau skill..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Country & Sector Filters & Add Button */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterDemandCountry}
              onChange={(e) => setFilterDemandCountry(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">Semua Negara</option>
              {countryOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={filterDemandSector}
              onChange={(e) => setFilterDemandSector(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Lowongan Demand</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Demand Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          if (formMode === 'create') {
            createDemand({ ...data, filledQuota: 0 });
          } else if (demandToEdit) {
            updateDemand(demandToEdit.id, data);
          }
          setIsFormOpen(false);
          setDemandToEdit(null);
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
            deleteDemand(deletingDemand.id);
            setDeletingDemand(null);
          }
        }}
      />
    </div>
  );
};
