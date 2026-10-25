import React, { useState, useMemo, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/useAppStore';
import { ProviderCard } from './ProviderCard';
import { ProviderDetailModal } from './ProviderDetailModal';
import { ProviderFormModal } from './ProviderFormModal';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import { VocationalProvider } from '../../types';
import { archiveBusinessData, saveBusinessData } from '../../lib/business-data';
import {
  Search,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Plus,
  RefreshCw,
  ExternalLink,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const ProvidersView: React.FC = () => {
  const {
    currentRole,
    providers,
    searchProvider,
    setSearchProvider,
    filterProviderType,
    setFilterProviderType,
    filterEvokasiStatus,
    setFilterEvokasiStatus,
    filterProviderProvince,
    setFilterProviderProvince,
    filterProviderSector,
    setFilterProviderSector,
    filterInstitutionStatus,
    setFilterInstitutionStatus,
  } = useAppStore();

  const [activeModalProvider, setActiveModalProvider] = useState<VocationalProvider | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [providerToEdit, setProviderToEdit] = useState<VocationalProvider | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<VocationalProvider | null>(null);

  // KP2MI Live Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const canSync = currentRole === 'superadmin' || currentRole === 'taskforce';
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);

  const handleLiveSync = () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    router.post('/integrations/kp2mi/sync', {}, {
      preserveScroll: true,
      onSuccess: () => {
        setSyncSuccess(true);
        toast.success('Sinkronisasi KP2MI berhasil.');
        setTimeout(() => setSyncSuccess(false), 4000);
      },
      onError: (errors) => {
        toast.error(errors.sync ?? 'Sinkronisasi gagal. Coba kembali beberapa saat lagi.');
      },
      onFinish: () => setIsSyncing(false),
    });
  };

  const providerTypeOptions = [
    { id: 'ALL', label: 'Semua Jenis' },
    { id: 'SMK', label: 'SMK' },
    { id: 'LPK', label: 'LPK' },
    { id: 'BLK', label: 'BLK' },
    { id: 'Politeknik', label: 'Politeknik' },
    { id: 'Universitas', label: 'Universitas' },
    { id: 'LKP', label: 'LKP' },
    { id: 'Balai', label: 'Balai' },
    { id: 'BLKLN', label: 'BLKLN' },
  ];

  const sectorOptions = useMemo(() => [
    'Teknologi Informasi',
    'Bisnis dan Manajemen',
    'Kesehatan',
    'Domestic Worker',
    'Manufaktur',
    'Konstruksi',
    'Seni dan Ekonomi Kreatif',
    'Adminstrasi dan Keuangan',
    'Worker',
    ...providers.flatMap((provider) => [
      ...provider.supportedSectors,
      ...(provider.offerings ?? []).map((offering) => offering.sector),
    ]),
  ].filter((sector, index, sectors) =>
    sectors.findIndex((candidate) => candidate.toLocaleLowerCase('id-ID') === sector.toLocaleLowerCase('id-ID')) === index
  ).sort((left, right) => left.localeCompare(right, 'id-ID')), [providers]);

  const provinceOptions = [
    'ALL',
    'Jawa Barat',
    'Jawa Tengah',
    'Jawa Timur',
    'Daerah Khusus Ibukota Jakarta',
    'Sumatera Utara',
    'Banten',
    'Bali',
    'Sulawesi Selatan',
    'Aceh',
    'Riau',
    'Daerah Istimewa Yogyakarta',
  ];

  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const matchSearch =
        !searchProvider ||
        p.name.toLowerCase().includes(searchProvider.toLowerCase()) ||
        p.provinsi.toLowerCase().includes(searchProvider.toLowerCase()) ||
        p.kabupatenKota.toLowerCase().includes(searchProvider.toLowerCase()) ||
        p.supportedSectors.some((s) => s.toLowerCase().includes(searchProvider.toLowerCase())) ||
        p.facilities.some((f) => f.toLowerCase().includes(searchProvider.toLowerCase())) ||
        (p.sectorals && p.sectorals.some((sec) => 
          sec.sectoral.toLowerCase().includes(searchProvider.toLowerCase()) || 
          sec.position.toLowerCase().includes(searchProvider.toLowerCase())
        )) ||
        p.offerings?.some((offering) =>
          offering.sector.toLowerCase().includes(searchProvider.toLowerCase()) ||
          offering.occupation.toLowerCase().includes(searchProvider.toLowerCase())
        );

      const matchType =
        filterProviderType === 'ALL' ||
        p.providerType.toLowerCase() === filterProviderType.toLowerCase() ||
        (filterProviderType === 'Politeknik' && p.providerType.includes('Politeknik'));

      const matchProvince =
        filterProviderProvince === 'ALL' ||
        p.provinsi.toLowerCase().includes(filterProviderProvince.toLowerCase());

      const matchSector =
        filterProviderSector === 'ALL' ||
        p.supportedSectors.some((s) => s.toLowerCase().includes(filterProviderSector.toLowerCase())) ||
        (p.sectorals && p.sectorals.some((sec) => sec.sectoral.toLowerCase().includes(filterProviderSector.toLowerCase()))) ||
        p.offerings?.some((offering) => offering.sector.toLowerCase().includes(filterProviderSector.toLowerCase()));

      const matchStatus =
        filterInstitutionStatus === 'ALL' ||
        p.institutionStatus?.toLowerCase() === filterInstitutionStatus.toLowerCase();

      const matchEvokasi =
        filterEvokasiStatus === 'ALL' || p.evokasiVerificationStatus === filterEvokasiStatus;

      return matchSearch && matchType && matchProvince && matchSector && matchStatus && matchEvokasi;
    });
  }, [
    providers,
    searchProvider,
    filterProviderType,
    filterProviderProvince,
    filterProviderSector,
    filterInstitutionStatus,
    filterEvokasiStatus,
  ]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchProvider,
    filterProviderType,
    filterProviderProvince,
    filterProviderSector,
    filterInstitutionStatus,
    filterEvokasiStatus,
  ]);

  // Paginated Slices
  const totalItems = filteredProviders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedProviders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProviders.slice(start, start + itemsPerPage);
  }, [filteredProviders, currentPage, itemsPerPage]);

  const verifiedCount = providers.filter(
    (p) => p.evokasiVerificationStatus === 'Terverifikasi e-Vokasi'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Banner with Official KP2MI Integration */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-md">
              <Building2 className="w-3.5 h-3.5" />
              <span>Modul C: Vocational Provider Readiness</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-300 bg-blue-950/60 border border-blue-800/60 px-2.5 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold">Sumber: basis data KP2MI</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
            Direktori Lembaga Penyelenggara Vokasi Terakreditasi
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Data ditampilkan dari basis data aplikasi dan dapat diperbarui melalui sinkronisasi resmi KP2MI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Official Statistics Tile */}
          <div className="bg-slate-800/90 border border-slate-700 px-4 py-2.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">
              Data Lembaga Tersimpan
            </span>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <span className="text-lg font-black text-emerald-400">
                {providers.length.toLocaleString('id-ID')}
              </span>
                <span className="text-xs text-slate-400">Lembaga tersimpan</span>
            </div>
          </div>

          {canSync && (
            <button
              onClick={handleLiveSync}
              disabled={isSyncing}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border shadow-sm ${
                syncSuccess
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
              }`}
              title="Simpan pembaruan dari basis data KP2MI"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : syncSuccess ? 'Tersinkron!' : 'Sinkronisasi'}</span>
            </button>
          )}

          {/* External Portal Link */}
          <a
            href="https://vokasi.kp2mi.go.id/cari-lembaga"
            target="_blank"
            rel="noreferrer"
            className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            title="Buka portal resmi vokasi.kp2mi.go.id di tab baru"
          >
            <span>vokasi.kp2mi.go.id</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Create Provider Button */}
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

      {/* Control & Filter Bar matching https://vokasi.kp2mi.go.id/cari-lembaga */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Row 1: Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchProvider}
            onChange={(e) => setSearchProvider(e.target.value)}
            placeholder="Cari Nama Lembaga atau Pelatihan Lembaga (contoh: SMKS Taruna, BBPVP Bandung, LPK Jepang, Caregiver, Rekam Medis)..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        {/* Row 2: Provider Type Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar border-b border-slate-100 pb-3">
          {providerTypeOptions.map((opt) => {
            const isActive = filterProviderType === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setFilterProviderType(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Row 3: Dropdown Filters for Sektor, Provinsi, Status Kepemilikan, and e-Vokasi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Filter Sektor */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-500 font-semibold block">Sektor Spesialisasi:</label>
            <select
              value={filterProviderSector}
              onChange={(e) => setFilterProviderSector(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="ALL">Semua Sektor Vokasi</option>
              {sectorOptions.map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {/* Filter Provinsi */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-500 font-semibold block">Provinsi:</label>
            <select
              value={filterProviderProvince}
              onChange={(e) => setFilterProviderProvince(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="ALL">Semua Provinsi</option>
              {provinceOptions.filter(x => x !== 'ALL').map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          {/* Filter Status Lembaga (Negeri / Swasta) */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-500 font-semibold block">Status Kepemilikan:</label>
            <select
              value={filterInstitutionStatus}
              onChange={(e) => setFilterInstitutionStatus(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="ALL">Semua Status (Negeri & Swasta)</option>
              <option value="Negeri">Negeri (Pemerintah)</option>
              <option value="Swasta">Swasta</option>
            </select>
          </div>

          {/* Filter Status e-Vokasi */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-500 font-semibold block">Status e-Vokasi:</label>
            <select
              value={filterEvokasiStatus}
              onChange={(e) => setFilterEvokasiStatus(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="ALL">Semua Status Verifikasi</option>
              <option value="Terverifikasi e-Vokasi">Terverifikasi e-Vokasi</option>
              <option value="Proses Verifikasi">Proses Verifikasi</option>
              <option value="Belum Terverifikasi">Belum Terverifikasi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header & Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 px-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">
            Ditemukan {totalItems} Lembaga
          </span>
          <span>(Menampilkan halaman {currentPage} dari {totalPages})</span>
        </div>

        {(searchProvider || filterProviderType !== 'ALL' || filterProviderProvince !== 'ALL' || filterProviderSector !== 'ALL' || filterInstitutionStatus !== 'ALL' || filterEvokasiStatus !== 'ALL') && (
          <button
            onClick={() => {
              setSearchProvider('');
              setFilterProviderType('ALL');
              setFilterProviderProvince('ALL');
              setFilterProviderSector('ALL');
              setFilterInstitutionStatus('ALL');
              setFilterEvokasiStatus('ALL');
            }}
            className="text-blue-600 hover:text-blue-700 font-semibold underline self-start sm:self-auto"
          >
            Reset Semua Filter
          </button>
        )}
      </div>

      {/* Grid Provider Cards */}
      {paginatedProviders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProviders.map((provider) => (
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
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">Tidak ada lembaga vokasi yang cocok</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Coba ubah kata kunci pencarian atau sesuaikan filter jenis lembaga, provinsi, dan sektor vokasi.
          </p>
          <button
            onClick={() => {
              setSearchProvider('');
              setFilterProviderType('ALL');
              setFilterProviderProvince('ALL');
              setFilterProviderSector('ALL');
            }}
            className="px-4 py-2 text-xs font-bold bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition inline-block"
          >
            Reset Filter Pencarian
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                aria-label="Pilihan jumlah kartu per halaman"
              >
                {[12, 24, 60, 100, 150].map((size) => (
                  <option key={size} value={size}>
                    {size} / hal
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Halaman <span className="font-bold text-slate-800">{currentPage}</span> dari{' '}
              <span className="font-bold text-slate-800">{totalPages}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                let pageNumber = idx + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNumber = currentPage - 2 + idx;
                  if (pageNumber > totalPages) pageNumber = totalPages - (4 - idx);
                }
                const isActive = currentPage === pageNumber;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

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
          saveBusinessData(
            'providers',
            data,
            formMode === 'edit' ? providerToEdit?.id : undefined,
            () => {
              setIsFormOpen(false);
              setProviderToEdit(null);
            },
          );
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
        onConfirm={() => {
          if (deletingProvider) {
            archiveBusinessData('providers', deletingProvider.id, undefined, () => setDeletingProvider(null));
          }
        }}
      />
    </div>
  );
};
