import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ProviderCard } from './ProviderCard';
import { ProviderDetailModal } from './ProviderDetailModal';
import { ProviderFormModal } from './ProviderFormModal';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import { VocationalProvider } from '../../types';
import { Search, Building2, ShieldCheck, CheckCircle2, Plus } from 'lucide-react';

export const ProvidersView: React.FC = () => {
  const {
    providers,
    searchProvider,
    setSearchProvider,
    filterProviderType,
    setFilterProviderType,
    filterEvokasiStatus,
    setFilterEvokasiStatus,
    createProvider,
    updateProvider,
    deleteProvider,
  } = useAppStore();

  const [activeModalProvider, setActiveModalProvider] = useState<VocationalProvider | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [providerToEdit, setProviderToEdit] = useState<VocationalProvider | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<VocationalProvider | null>(null);

  const providerTypeOptions = [
    'ALL',
    'SMK',
    'BLK',
    'LPK',
    'Perguruan Tinggi / Politeknik',
  ];

  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const matchSearch =
        !searchProvider ||
        p.name.toLowerCase().includes(searchProvider.toLowerCase()) ||
        p.provinsi.toLowerCase().includes(searchProvider.toLowerCase()) ||
        p.kabupatenKota.toLowerCase().includes(searchProvider.toLowerCase()) ||
        p.supportedSectors.some((s) => s.toLowerCase().includes(searchProvider.toLowerCase())) ||
        p.facilities.some((f) => f.toLowerCase().includes(searchProvider.toLowerCase()));

      const matchType =
        filterProviderType === 'ALL' || p.providerType === filterProviderType;

      const matchEvokasi =
        filterEvokasiStatus === 'ALL' || p.evokasiVerificationStatus === filterEvokasiStatus;

      return matchSearch && matchType && matchEvokasi;
    });
  }, [providers, searchProvider, filterProviderType, filterEvokasiStatus]);

  const verifiedCount = providers.filter(
    (p) => p.evokasiVerificationStatus === 'Terverifikasi e-Vokasi'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Modul C: Vocational Provider Readiness</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Direktori Kesiapan Lembaga Penyelenggara Vokasi Terakreditasi
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Pemetaan sarana prasarana, bengkel kerja industri, sertifikasi instruktur, dan verifikasi e-Vokasi dari SMK Negeri, Balai Latihan Kerja (BLK), LPK Swasta, hingga Politeknik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Terverifikasi e-Vokasi</span>
            <span className="text-xl font-extrabold text-emerald-400">{verifiedCount} / {providers.length} Lembaga</span>
          </div>

          <a
            href="https://gardata.sippmi.com"
            target="_blank"
            rel="noreferrer"
            className="bg-blue-950/80 border border-blue-600/50 hover:border-blue-400 px-4 py-2.5 rounded-xl text-center transition group block"
            title="Sistem Pelaporan Kegiatan Pelatihan CPMI"
          >
            <span className="text-[10px] text-blue-300 block font-bold uppercase flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              gardata.sippmi.com
            </span>
            <span className="text-xs font-extrabold text-white group-hover:text-amber-300">
              Feeder Kelas Aktif ↗
            </span>
          </a>

          <button
            onClick={() => {
              setProviderToEdit(null);
              setFormMode('create');
              setIsFormOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Daftarkan Lembaga</span>
          </button>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Provider Type Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {providerTypeOptions.map((type) => {
              const isActive = filterProviderType === type;
              return (
                <button
                  key={type}
                  onClick={() => setFilterProviderType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type === 'ALL' ? 'Semua Jenis Lembaga' : type}
                </button>
              );
            })}
          </div>

          {/* e-Vokasi Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-semibold whitespace-nowrap">Status e-Vokasi:</label>
            <select
              value={filterEvokasiStatus}
              onChange={(e) => setFilterEvokasiStatus(e.target.value)}
              className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">Semua Status</option>
              <option value="Terverifikasi e-Vokasi">Terverifikasi e-Vokasi</option>
              <option value="Proses Verifikasi">Proses Verifikasi</option>
              <option value="Belum Terverifikasi">Belum Terverifikasi</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchProvider}
            onChange={(e) => setSearchProvider(e.target.value)}
            placeholder="Cari nama lembaga, lokasi (Jawa Barat, Surabaya, dll.), fasilitas bengkel las, lab komputer..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Grid Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProviders.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onViewDetail={setActiveModalProvider}
            onEditProvider={(p) => {
              setProviderToEdit(p);
              setFormMode('edit');
              setIsFormOpen(true);
            }}
            onDeleteProvider={(p) => setDeletingProvider(p)}
          />
        ))}
      </div>

      {/* Provider Detail Modal */}
      <ProviderDetailModal
        provider={activeModalProvider}
        isOpen={!!activeModalProvider}
        onClose={() => setActiveModalProvider(null)}
      />

      {/* Provider Form Modal (Create / Edit) */}
      <ProviderFormModal
        isOpen={isFormOpen}
        mode={formMode}
        initialData={providerToEdit}
        onClose={() => {
          setIsFormOpen(false);
          setProviderToEdit(null);
        }}
        onSubmit={(data) => {
          if (formMode === 'create') {
            createProvider(data);
          } else if (providerToEdit) {
            updateProvider(providerToEdit.id, data);
          }
          setIsFormOpen(false);
          setProviderToEdit(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingProvider}
        onClose={() => setDeletingProvider(null)}
        entityName={deletingProvider?.name || ''}
        entityId={deletingProvider?.id || ''}
        title="Konfirmasi Nonaktifkan / Hapus Lembaga Vokasi"
        description="Menonaktifkan lembaga vokasi akan mencabut status verifikasi penyelenggara dari sistem alokasi batch pelatihan nasional."
        confirmText="Ya, Nonaktifkan Lembaga"
        onConfirm={(reason) => {
          if (deletingProvider) {
            deleteProvider(deletingProvider.id);
            setDeletingProvider(null);
          }
        }}
      />
    </div>
  );
};
