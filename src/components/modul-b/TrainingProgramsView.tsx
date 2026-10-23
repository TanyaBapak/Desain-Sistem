import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ProgramCard } from './ProgramCard';
import { CurriculumModal } from './CurriculumModal';
import { ProgramFormModal } from './ProgramFormModal';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import { TrainingProgram } from '../../types';
import { Search, GraduationCap, Award, BookOpen, Layers, Plus } from 'lucide-react';

export const TrainingProgramsView: React.FC = () => {
  const {
    programs,
    searchProgram,
    setSearchProgram,
    filterProgramType,
    setFilterProgramType,
    filterProgramCountry,
    setFilterProgramCountry,
    createProgram,
    updateProgram,
    deleteProgram,
  } = useAppStore();

  const [activeModalProgram, setActiveModalProgram] = useState<TrainingProgram | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [programToEdit, setProgramToEdit] = useState<TrainingProgram | null>(null);
  const [deletingProgram, setDeletingProgram] = useState<TrainingProgram | null>(null);

  const programCategories = [
    'All Programs',
    'Teknis Terpadu',
    'Upskilling',
    'Reskilling',
    'Pelatihan Bahasa',
  ];

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const matchSearch =
        !searchProgram ||
        p.title.toLowerCase().includes(searchProgram.toLowerCase()) ||
        p.targetSector.toLowerCase().includes(searchProgram.toLowerCase()) ||
        p.targetJobRole.toLowerCase().includes(searchProgram.toLowerCase()) ||
        p.certificationTarget.toLowerCase().includes(searchProgram.toLowerCase());

      const matchType =
        filterProgramType === 'ALL' ||
        filterProgramType === 'All Programs' ||
        p.programType === filterProgramType;

      const matchCountry =
        filterProgramCountry === 'ALL' || p.targetCountry === filterProgramCountry;

      return matchSearch && matchType && matchCountry;
    });
  }, [programs, searchProgram, filterProgramType, filterProgramCountry]);

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

        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Program</span>
            <span className="text-xl font-extrabold text-blue-400">{programs.length} Paket</span>
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
        </div>
      </div>

      {/* Control & Tab Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
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
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Target Country Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-semibold whitespace-nowrap">Negara:</label>
            <select
              value={filterProgramCountry}
              onChange={(e) => setFilterProgramCountry(e.target.value)}
              className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">Semua Negara</option>
              <option value="Jepang">Jepang</option>
              <option value="Jerman">Jerman</option>
              <option value="Korea">Korea Selatan</option>
              <option value="Taiwan">Taiwan</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchProgram}
            onChange={(e) => setSearchProgram(e.target.value)}
            placeholder="Cari program pelatihan, sertifikasi (misal: SSW Tokutei Ginou, BNSP, B1), atau sektor..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Grid Program Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            onViewCurriculum={setActiveModalProgram}
            onEditProgram={(p) => {
              setProgramToEdit(p);
              setFormMode('edit');
              setIsFormOpen(true);
            }}
            onDeleteProgram={(p) => setDeletingProgram(p)}
          />
        ))}
      </div>

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
          if (formMode === 'create') {
            createProgram(data);
          } else if (programToEdit) {
            updateProgram(programToEdit.id, data);
          }
          setIsFormOpen(false);
          setProgramToEdit(null);
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
            deleteProgram(deletingProgram.id);
            setDeletingProgram(null);
          }
        }}
      />
    </div>
  );
};
