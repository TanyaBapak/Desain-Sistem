import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { router } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import { ProgramCard } from './ProgramCard';
import { Bp2miTargetProgramsTable } from './Bp2miTargetProgramsTable';
import { CurriculumModal } from './CurriculumModal';
import { ProgramFormModal } from './ProgramFormModal';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import { TrainingProgram } from '../../types';
import { archiveBusinessData, saveBusinessData } from '../../lib/business-data';
import { Search, GraduationCap, Award, BookOpen, Layers, Plus, Calendar, X, Save, ChevronLeft, ChevronRight, Table2, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

export const TrainingProgramsView: React.FC = () => {
  const {
    currentRole,
    programs,
    searchProgram,
    setSearchProgram,
    filterProgramType,
    setFilterProgramType,
    filterProgramCountry,
    setFilterProgramCountry,
    businessOptions,
  } = useAppStore();

  const [syncing, setSyncing] = useState(false);

  const handleSyncFromProviders = () => {
    setSyncing(true);
    router.post('/business-data/programs/sync-from-providers', {}, {
      preserveScroll: true,
      onFinish: () => setSyncing(false),
    });
  };

  const [activeModalProgram, setActiveModalProgram] = useState<TrainingProgram | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [programToEdit, setProgramToEdit] = useState<TrainingProgram | null>(null);
  const [deletingProgram, setDeletingProgram] = useState<TrainingProgram | null>(null);

  // Schedule form state (for Super Admin & Task Force)
  const [scheduleProgram, setScheduleProgram] = useState<TrainingProgram | null>(null);
  const [scheduleStartInput, setScheduleStartInput] = useState('');
  const [scheduleEndInput, setScheduleEndInput] = useState('');
  const [scheduleJpInput, setScheduleJpInput] = useState<string>('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  const [scheduleFilter, setScheduleFilter] = useState<'BP2MI_TARGET' | 'ALL' | 'SCHEDULED' | 'UNSCHEDULED'>('BP2MI_TARGET');
  const [displayMode, setDisplayMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 24;

  const canManageSchedule = [
    'superadmin',
    'taskforce',
    'vokasi',
    'admin',
    'direktorat',
    'super_admin',
    'task_force',
    'directorate_admin',
  ].includes(currentRole as string);

  const openScheduleModal = (program: TrainingProgram) => {
    setScheduleProgram(program);
    setScheduleStartInput(program.scheduleStart || new Date().toISOString().slice(0, 10));
    setScheduleEndInput(program.scheduleEnd || '');
    setScheduleJpInput(program.durationJP ? String(program.durationJP) : '');
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleProgram) return;
    if (!scheduleStartInput || !scheduleEndInput) {
      toast.error('Tanggal mulai dan tanggal selesai pelatihan wajib diisi.');
      return;
    }
    setSavingSchedule(true);
    router.patch(
      `/business-data/programs/${scheduleProgram.id}/schedule`,
      {
        scheduleStart: scheduleStartInput,
        scheduleEnd: scheduleEndInput,
        durationJP: scheduleJpInput !== '' ? Number(scheduleJpInput) : scheduleProgram.durationJP,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Jadwal tanggal program pelatihan berhasil disimpan.');
          setScheduleProgram(null);
        },
        onError: (errors) => {
          const firstMsg = Object.values(errors)[0];
          toast.error(typeof firstMsg === 'string' ? firstMsg : 'Gagal menyimpan jadwal program.');
        },
        onFinish: () => setSavingSchedule(false),
      },
    );
  };

  const programCategories = [
    'All Programs',
    'Teknis Terpadu',
    'Upskilling',
    'Reskilling',
    'Pelatihan Bahasa',
  ];

  const bp2miTargetPrograms = useMemo(
    () => programs.filter((p) => p.isBp2miTarget || p.id.startsWith('BP2MI-PROG-')),
    [programs],
  );

  const activeScheduledCount = useMemo(
    () =>
      programs.filter(
        (p) =>
          !p.isBp2miTarget &&
          !p.id.startsWith('BP2MI-PROG-') &&
          ((p.durationJP && p.durationJP > 0) || Boolean(p.scheduleStart)),
      ).length,
    [programs],
  );

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const search = searchProgram.toLowerCase();
      const matchSearch =
        !searchProgram ||
        (p.title || '').toLowerCase().includes(search) ||
        (p.targetSector || '').toLowerCase().includes(search) ||
        (p.targetJobRole || '').toLowerCase().includes(search) ||
        (p.projectionPlacement || '').toLowerCase().includes(search) ||
        (p.certificationTarget || '').toLowerCase().includes(search) ||
        (p.institutionName || '').toLowerCase().includes(search);

      const matchType =
        filterProgramType === 'ALL' ||
        filterProgramType === 'All Programs' ||
        p.programType === filterProgramType;

      const matchCountry =
        filterProgramCountry === 'ALL' ||
        p.targetCountry === filterProgramCountry ||
        (p.projectionPlacement || '').toLowerCase().includes(filterProgramCountry.toLowerCase());

      const isBp2mi = Boolean(p.isBp2miTarget || p.id.startsWith('BP2MI-PROG-'));
      const hasScheduleOrJp = Boolean(p.scheduleStart || p.scheduleEnd || (p.durationJP && p.durationJP > 0));
      const matchSchedule =
        scheduleFilter === 'ALL' ||
        (scheduleFilter === 'BP2MI_TARGET' && isBp2mi) ||
        (scheduleFilter === 'SCHEDULED' && !isBp2mi && hasScheduleOrJp) ||
        (scheduleFilter === 'UNSCHEDULED' && !isBp2mi && !hasScheduleOrJp);

      return matchSearch && matchType && matchCountry && matchSchedule;
    });
  }, [programs, searchProgram, filterProgramType, filterProgramCountry, scheduleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPrograms.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedPrograms = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return filteredPrograms.slice(start, start + perPage);
  }, [filteredPrograms, safePage]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Modul B: Training Program Intelligence</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Katalog Standardisasi Kurikulum & Pelatihan PMI Vokasi
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Menyediakan program pelatihan tersertifikasi BNSP dan standar negara penempatan luar negeri. Dirancang untuk menutup kesenjangan teknis (*upskilling/reskilling*) dan bahasa calon pekerja migran.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Target Penyiapan BP2MI</span>
            <span className="text-xl font-extrabold text-emerald-400 tabular-nums">
              {bp2miTargetPrograms.length} Program · 2.000 Kelas
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Kelas Berjalan (LPK)</span>
            <span className="text-xl font-extrabold text-amber-400 tabular-nums">{activeScheduledCount} Kelas</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Kurikulum</span>
            <span className="text-xl font-extrabold text-blue-400 tabular-nums">{programs.length.toLocaleString('id-ID')} Paket</span>
          </div>

          <button
            onClick={() => {
              setProgramToEdit(null);
              setFormMode('create');
              setIsFormOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Program</span>
          </button>
          {(currentRole === 'superadmin' || currentRole === 'taskforce' || (currentRole as string) === 'direktorat' || (currentRole as string) === 'directorate_admin') && (
            <button
              onClick={handleSyncFromProviders}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Menarik Program...' : 'Tarik Program dari Lembaga Vokasi'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Control & Tab Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {programCategories.map((cat) => {
              const isActive =
                filterProgramType === cat || (cat === 'All Programs' && filterProgramType === 'ALL');
              return (
                <button
                  key={cat}
                  onClick={() => setFilterProgramType(cat === 'All Programs' ? 'ALL' : cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Target Country, Schedule Filter & View Mode */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => setDisplayMode('table')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1 transition ${
                  displayMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                <span>Tabel Target BP2MI</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('cards')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1 transition ${
                  displayMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kartu Program</span>
              </button>
            </div>

            <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">Kelompok:</label>
            <select
              value={scheduleFilter}
              onChange={(e) => {
                const next = e.target.value as 'BP2MI_TARGET' | 'ALL' | 'SCHEDULED' | 'UNSCHEDULED';
                setScheduleFilter(next);
                if (next !== 'BP2MI_TARGET') {
                  setDisplayMode('cards');
                }
                setCurrentPage(1);
              }}
              className="text-xs py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="BP2MI_TARGET">Target Penyiapan BP2MI ({bp2miTargetPrograms.length} Program · 2.000 Kelas)</option>
              <option value="SCHEDULED">Kelas Berjalan LPK ({activeScheduledCount} Kelas)</option>
              <option value="ALL">Semua Program ({programs.length.toLocaleString('id-ID')})</option>
              <option value="UNSCHEDULED">Katalog Lainnya (Belum Dijadwalkan)</option>
            </select>

            <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap ml-1">Negara:</label>
            <select
              value={filterProgramCountry}
              onChange={(e) => {
                setFilterProgramCountry(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">Semua Negara</option>
              {businessOptions.countries.map((country) => (
                <option key={country.id} value={country.name}>{country.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchProgram}
            onChange={(e) => {
              setSearchProgram(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari program pelatihan, lembaga vokasi, sertifikasi (misal: SSW Tokutei Ginou, BNSP), atau sektor..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition"
          />
        </div>
      </div>

      {/* Table or Grid Program Cards */}
      {displayMode === 'table' ? (
        <Bp2miTargetProgramsTable
          programs={filteredPrograms}
          canManageSchedule={canManageSchedule}
          onEditSchedule={canManageSchedule ? openScheduleModal : undefined}
          onViewCurriculum={setActiveModalProgram}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onViewCurriculum={setActiveModalProgram}
              onEditSchedule={canManageSchedule ? openScheduleModal : undefined}
              onEditProgram={(p) => {
                setProgramToEdit(p);
                setFormMode('edit');
                setIsFormOpen(true);
              }}
              onDeleteProgram={(p) => setDeletingProgram(p)}
            />
          ))}
        </div>
      )}

      {/* Pagination Bar (only in cards mode) */}
      {displayMode === 'cards' && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <span>
            Menampilkan <strong>{(safePage - 1) * perPage + 1}</strong> –{' '}
            <strong>{Math.min(safePage * perPage, filteredPrograms.length)}</strong> dari{' '}
            <strong>{filteredPrograms.length.toLocaleString('id-ID')}</strong> program pelatihan
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>
            <span className="font-bold text-slate-800 dark:text-slate-200 px-2 tabular-nums">
              Hal {safePage} / {totalPages.toLocaleString('id-ID')}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Dedicated Schedule Modal Form for Super Admin & Task Force */}
      {scheduleProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-900 to-blue-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-800/80 border border-indigo-700 flex items-center justify-center text-indigo-200 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Atur Tanggal Pelaksanaan Program Pelatihan
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5 line-clamp-1">
                    {scheduleProgram.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScheduleProgram(null)}
                className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-indigo-800 transition"
                aria-label="Tutup modal jadwal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-6 space-y-4">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-100">{scheduleProgram.title}</div>
                <div className="text-slate-500 dark:text-slate-400">
                  Lembaga: <span className="font-semibold text-slate-700 dark:text-slate-300">{scheduleProgram.institutionName || 'Lembaga Vokasi Terdaftar'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Tanggal Mulai Pelatihan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduleStartInput}
                    onChange={(e) => setScheduleStartInput(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Tanggal Selesai Pelatihan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={scheduleStartInput || undefined}
                    value={scheduleEndInput}
                    onChange={(e) => setScheduleEndInput(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Durasi Jam Pelajaran (Total JP)
                </label>
                <input
                  type="number"
                  min={0}
                  value={scheduleJpInput}
                  onChange={(e) => setScheduleJpInput(e.target.value)}
                  placeholder="Contoh: 840"
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Program dengan Tanggal Pelatihan & Total JP aktif otomatis tercatat sebagai Kelas Berjalan.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setScheduleProgram(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSchedule ? 'Menyimpan...' : 'Simpan Tanggal Pelatihan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Curriculum Modal */}
      <CurriculumModal
        program={activeModalProgram}
        isOpen={!!activeModalProgram}
        onClose={() => setActiveModalProgram(null)}
      />

      {/* Program Form Modal (Create / Edit) */}
      <ProgramFormModal
        isOpen={isFormOpen}
        mode={formMode}
        initialData={programToEdit}
        onClose={() => {
          setIsFormOpen(false);
          setProgramToEdit(null);
        }}
        onSubmit={(data) => {
          saveBusinessData(
            'programs',
            data,
            formMode === 'edit' ? programToEdit?.id : undefined,
            () => {
              setIsFormOpen(false);
              setProgramToEdit(null);
            },
          );
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingProgram}
        onClose={() => setDeletingProgram(null)}
        entityName={deletingProgram?.title || ''}
        entityId={deletingProgram?.id || ''}
        title="Konfirmasi Hapus Program Pelatihan"
        description="Menghapus program pelatihan akan membatalkan ketersediaan kurikulum untuk alokasi dan mencatat penghapusan ke audit log."
        onConfirm={(reason) => {
          if (deletingProgram) {
            archiveBusinessData('programs', deletingProgram.id, reason, () => setDeletingProgram(null));
          }
        }}
      />
    </div>
  );
};
