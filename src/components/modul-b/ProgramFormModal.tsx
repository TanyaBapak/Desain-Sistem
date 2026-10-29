import React, { useState, useEffect } from 'react';
import { TrainingProgram, ProgramType } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { X, GraduationCap, Save, Sparkles, BookOpen } from 'lucide-react';

interface ProgramFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<TrainingProgram, 'id'>) => void;
  initialData?: TrainingProgram | null;
  mode: 'create' | 'edit';
}

export const ProgramFormModal: React.FC<ProgramFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}) => {
  const { businessOptions } = useAppStore();
  const occupationsList = Array.isArray(businessOptions?.occupations) ? businessOptions.occupations : [];
  const sectorsList = Array.isArray(businessOptions?.sectors) ? businessOptions.sectors : [];
  const institutionsList = Array.isArray(businessOptions?.institutions) ? businessOptions.institutions : [];
  const countriesList = Array.isArray(businessOptions?.countries) ? businessOptions.countries : [];
  const [title, setTitle] = useState('');
  const [programType, setProgramType] = useState<ProgramType>('Teknis Terpadu');
  const [targetSector, setTargetSector] = useState('Manufaktur / Pengelasan');
  const [targetJobRole, setTargetJobRole] = useState('Welder SMAW / GMAW');
  const [targetCountry, setTargetCountry] = useState('Jepang');
  const [institutionId, setInstitutionId] = useState('');
  const [durationJP, setDurationJP] = useState<number | string>('');
  const [certificationTarget, setCertificationTarget] = useState('');
  const [estimatedCostPerParticipant, setEstimatedCostPerParticipant] = useState<number | string>('');
  const [quota, setQuota] = useState<number | string>('');
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleEnd, setScheduleEnd] = useState('');
  const [curriculumInput, setCurriculumInput] = useState('');
  const availableOccupations = occupationsList.filter(
    (occupation) => sectorsList.find((sector) => sector.name === targetSector)?.id === occupation.sector_id,
  );

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setTitle(initialData.title);
      setProgramType(initialData.programType);
      setTargetSector(initialData.targetSector);
      setTargetJobRole(initialData.targetJobRole);
      setTargetCountry(initialData.targetCountry);
      setInstitutionId(initialData.institutionId ?? institutionsList[0]?.id ?? '');
      setDurationJP(initialData.durationJP ?? '');
      setCertificationTarget(initialData.certificationTarget);
      setEstimatedCostPerParticipant(initialData.estimatedCostPerParticipant ?? '');
      setQuota(initialData.quota ?? '');
      setEnrolledCount(initialData.enrolledCount);
      setScheduleStart(initialData.scheduleStart || '');
      setScheduleEnd(initialData.scheduleEnd || '');
      setCurriculumInput(
        initialData.curriculumOutline && initialData.curriculumOutline.length > 0
          ? initialData.curriculumOutline.join('\n')
          : ''
      );
    } else {
      setTitle('');
      setProgramType('Teknis Terpadu');
      setTargetSector('Manufaktur / Pengelasan');
      setTargetJobRole('Welder SMAW / GMAW');
      setTargetCountry('Jepang');
      setInstitutionId(businessOptions.institutions[0]?.id ?? '');
      setDurationJP('');
      setCertificationTarget('');
      setEstimatedCostPerParticipant('');
      setQuota('');
      setEnrolledCount(0);
      setScheduleStart('');
      setScheduleEnd('');
      setCurriculumInput('');
    }
  }, [initialData, mode, isOpen, businessOptions.institutions]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const curriculumArray = curriculumInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onSubmit({
      title,
      programType,
      targetSector,
      targetJobRole,
      targetCountry,
      institutionId,
      durationJP: durationJP === '' ? 0 : Number(durationJP),
      certificationTarget,
      estimatedCostPerParticipant: estimatedCostPerParticipant === '' ? 0 : Number(estimatedCostPerParticipant),
      quota: quota === '' ? 1 : Number(quota),
      enrolledCount: Number(enrolledCount),
      scheduleStart,
      scheduleEnd,
      curriculumOutline: curriculumArray,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-800/80 border border-blue-700 flex items-center justify-center text-blue-200 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {mode === 'create'
                  ? 'Tambah Program Pelatihan & Standarisasi Vokasi'
                  : 'Ubah Data Program Pelatihan'}
              </h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Modul B • Sinkronisasi Kurikulum Berstandar BNSP & Industri Global
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Judul & Tipe Program */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Judul Program Pelatihan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Program Pengelasan Khusus Galangan Kapal & Standar SSW Tokutei Ginou"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Program <span className="text-rose-500">*</span>
              </label>
              <select
                value={programType}
                onChange={(e) => setProgramType(e.target.value as ProgramType)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              >
                <option value="Teknis Terpadu">Teknis Terpadu</option>
                <option value="Upskilling">Upskilling</option>
                <option value="Reskilling">Reskilling</option>
                <option value="Pelatihan Bahasa">Pelatihan Bahasa</option>
              </select>
            </div>
          </div>

          {/* Sektor, Role Pekerjaan & Negara Tujuan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sektor Industri <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={targetSector}
                onChange={(e) => {
                  setTargetSector(e.target.value);
                  const firstOccupation = businessOptions.occupations.find(
                    (occupation) => occupation.sector_id === businessOptions.sectors.find((sector) => sector.name === e.target.value)?.id,
                  );
                  setTargetJobRole(firstOccupation?.title ?? '');
                }}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              >
                {sectorsList.map((sector) => (
                  <option key={sector.id} value={sector.name}>{sector.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Jabatan / Job Role <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={targetJobRole}
                onChange={(e) => setTargetJobRole(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              >
                {availableOccupations.map((occupation) => (
                  <option key={occupation.id} value={occupation.title}>{occupation.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Negara Penempatan Target <span className="text-rose-500">*</span>
              </label>
              <select
                value={targetCountry}
                onChange={(e) => setTargetCountry(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              >
                {countriesList.map((country) => (
                  <option key={country.id} value={country.name}>{country.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lembaga Penyelenggara <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
            >
              <option value="">Pilih lembaga penyelenggara</option>
              {institutionsList.map((institution) => (
                <option key={institution.id} value={institution.id}>{institution.name}</option>
              ))}
            </select>
          </div>

          {/* Durasi JP, Sertifikasi & Biaya Per Peserta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Durasi Pelatihan (JP) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                step="any"
                required
                value={durationJP}
                onChange={(e) => setDurationJP(e.target.value)}
                placeholder="Contoh: 180"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Standar Target Sertifikasi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={certificationTarget}
                onChange={(e) => setCertificationTarget(e.target.value)}
                placeholder="Misal: Sertifikasi BNSP + SSW Tokutei Ginou"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Biaya Pelatihan / Siswa (IDR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                step="any"
                required
                value={estimatedCostPerParticipant}
                onChange={(e) => setEstimatedCostPerParticipant(e.target.value)}
                placeholder="Contoh: 13400000"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              />
            </div>
          </div>

          {/* Kuota & Periode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kapasitas Kuota Kelas <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                step="any"
                required
                value={quota}
                onChange={(e) => setQuota(e.target.value)}
                placeholder="Contoh: 30"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jadwal Mulai Kelas
              </label>
              <input
                type="date"
                value={scheduleStart}
                onChange={(e) => setScheduleStart(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jadwal Selesai Kelas
              </label>
              <input
                type="date"
                value={scheduleEnd}
                onChange={(e) => setScheduleEnd(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              />
            </div>
          </div>

          {/* Silabus Kurikulum */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Garis Besar Silabus Kurikulum (1 baris per modul)</span>
              <span className="text-slate-400 font-normal">Tekan Enter untuk baris baru</span>
            </label>
            <textarea
              rows={4}
              value={curriculumInput}
              onChange={(e) => setCurriculumInput(e.target.value)}
              placeholder="1. Pengenalan Budaya Industri Kerja Jepang (5S/Kaizen)&#10;2. Pengelasan Posisi 1G-3G Standar AWS&#10;3. Bahasa Jepang Teknis & Keselamatan K3"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
            />
          </div>

          {/* Footer Form Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Tersinkronisasi otomatis dengan standar e-Vokasi & BNSP
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{mode === 'create' ? 'Simpan Program Baru' : 'Perbarui Program'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
