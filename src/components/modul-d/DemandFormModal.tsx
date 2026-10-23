import React, { useState, useEffect } from 'react';
import { GlobalDemand } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { X, Briefcase, Save, Sparkles, Globe2, DollarSign } from 'lucide-react';

interface DemandFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<GlobalDemand, 'id' | 'filledQuota'>) => void;
  initialData?: GlobalDemand | null;
  mode: 'create' | 'edit';
}

export const DemandFormModal: React.FC<DemandFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}) => {
  const { businessOptions } = useAppStore();
  const [jobTitle, setJobTitle] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [country, setCountry] = useState('Jepang');
  const [sector, setSector] = useState('Manufaktur / Pengelasan');
  const [requiredQuota, setRequiredQuota] = useState(1);
  const [minEducation, setMinEducation] = useState('SMK');
  const [requiredLanguageLevel, setRequiredLanguageLevel] = useState('');
  const [salaryRangeString, setSalaryRangeString] = useState('');
  const [workTermMonths, setWorkTermMonths] = useState(0);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [certsInput, setCertsInput] = useState('');
  const availableOccupations = businessOptions.occupations.filter(
    (occupation) => businessOptions.sectors.find((item) => item.name === sector)?.id === occupation.sector_id,
  );

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setJobTitle(initialData.jobTitle);
      setEmployerName(initialData.employerName);
      setCountry(initialData.country);
      setSector(initialData.sector);
      setRequiredQuota(initialData.requiredQuota);
      setMinEducation(initialData.minEducation);
      setRequiredLanguageLevel(initialData.requiredLanguageLevel);
      setSalaryRangeString(initialData.salaryRangeString);
      setWorkTermMonths(initialData.workTermMonths);
      setDeadlineDate(initialData.deadlineDate);
      setSkillsInput(initialData.requiredSkills.join(', '));
      setCertsInput(initialData.requiredCertifications.join(', '));
    } else {
      setJobTitle('');
      setEmployerName('');
      setCountry('Jepang');
      setSector('Manufaktur / Pengelasan');
      setRequiredQuota(1);
      setMinEducation('SMK');
      setRequiredLanguageLevel('');
      setSalaryRangeString('');
      setWorkTermMonths(0);
      setDeadlineDate('');
      setSkillsInput('');
      setCertsInput('');
    }
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !employerName.trim()) return;

    const skillsArray = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const certsArray = certsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onSubmit({
      jobTitle,
      employerName,
      country,
      sector,
      requiredQuota: Number(requiredQuota),
      minEducation,
      requiredLanguageLevel,
      salaryRangeString,
      workTermMonths: Number(workTermMonths),
      deadlineDate,
      requiredSkills: skillsArray,
      requiredCertifications: certsArray,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-blue-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-800/80 border border-blue-700 flex items-center justify-center text-blue-200 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {mode === 'create'
                  ? 'Input Lowongan Kerja / Demand Luar Negeri'
                  : 'Perbarui Data Lowongan Demand Luar Negeri'}
              </h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Modul D • Job Order Terverifikasi BP3MI & Standar Ketenagakerjaan Global
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
          {/* Posisi & Perusahaan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Posisi Pekerjaan / Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                list="demand-occupations"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Pilih jabatan dari data referensi"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 focus:bg-white transition"
              />
              <datalist id="demand-occupations">
                {availableOccupations.map((occupation) => (
                  <option key={occupation.id} value={occupation.title} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Perusahaan Pemberi Kerja (Employer) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={employerName}
                onChange={(e) => setEmployerName(e.target.value)}
                placeholder="Contoh: Mitsubishi Heavy Industries / Asahi Glass"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Negara, Sektor & Pendidikan Minimal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Negara Penempatan <span className="text-rose-500">*</span>
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              >
                {businessOptions.countries.map((item) => (
                  <option key={item.id} value={item.name}>{item.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sektor Industri <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={sector}
                onChange={(e) => {
                  setSector(e.target.value);
                  const firstOccupation = businessOptions.occupations.find(
                    (occupation) => occupation.sector_id === businessOptions.sectors.find((item) => item.name === e.target.value)?.id,
                  );
                  setJobTitle(firstOccupation?.title ?? '');
                }}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              >
                {businessOptions.sectors.map((item) => (
                  <option key={item.id} value={item.name}>{item.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pendidikan Minimal <span className="text-rose-500">*</span>
              </label>
              <select
                value={minEducation}
                onChange={(e) => setMinEducation(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              >
                <option value="SMK">SMK / Sederajat</option>
                <option value="D3">D3 Vokasi</option>
                <option value="S1">S1 Terapan / Ners</option>
                <option value="Fleksibel">Fleksibel (Sesuai Kompetensi)</option>
              </select>
            </div>
          </div>

          {/* Kuota Kebutuhan, Estimasi Gaji & Standar Bahasa */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kebutuhan Kuota (Orang) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                required
                value={requiredQuota}
                onChange={(e) => setRequiredQuota(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estimasi Gaji Pokok <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={salaryRangeString}
                onChange={(e) => setSalaryRangeString(e.target.value)}
                placeholder="Contoh: ¥ 210.000 - 240.000 (~Rp 22-26 Jt)"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Standar Bahasa Asing <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={requiredLanguageLevel}
                onChange={(e) => setRequiredLanguageLevel(e.target.value)}
                placeholder="Contoh: JLPT N4 / JFT-Basic A2 / Goethe B1"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              />
            </div>
          </div>

          {/* Masa Kontrak & Tenggat Waktu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Masa Kontrak Kerja (Bulan) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={6}
                max={60}
                required
                value={workTermMonths}
                onChange={(e) => setWorkTermMonths(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Batas Waktu Rekrutmen (Deadline) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                placeholder="Contoh: 30 Nov 2026 atau 2026-11-30"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              />
            </div>
          </div>

          {/* Persyaratan Keterampilan (Skills) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Keterampilan Teknis yang Dibutuhkan (Pisahkan dengan koma)</span>
              <span className="text-slate-400 font-normal">Kunci pencocokan algoritma Tahap 3</span>
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="Arc Welding 3G, Blue Print Reading, Pemotongan Plasma"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
            />
          </div>

          {/* Sertifikasi Wajib */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Sertifikasi Kerja Wajib (Pisahkan dengan koma)</span>
              <span className="text-slate-400 font-normal">Contoh: BNSP, SSW Tokutei Ginou</span>
            </label>
            <input
              type="text"
              value={certsInput}
              onChange={(e) => setCertsInput(e.target.value)}
              placeholder="Sertifikat Uji Kompetensi Pengelasan BNSP, SSW Tokutei Ginou"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
            />
          </div>

          {/* Footer Form Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Lowongan terhubung langsung dengan AI Matching Engine Tahap 3
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
                <span>{mode === 'create' ? 'Terbitkan Lowongan' : 'Perbarui Lowongan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
