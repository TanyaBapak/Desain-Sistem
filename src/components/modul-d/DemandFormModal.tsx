import React, { useState, useEffect } from 'react';
import { GlobalDemand } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { X, Briefcase, Save, Sparkles } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/30 p-4 backdrop-blur-sm animate-fade-in">
      <div
        className="my-8 w-full max-w-3xl transform overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border bg-muted/50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {mode === 'create'
                  ? 'Input Lowongan Kerja / Demand Luar Negeri'
                  : 'Perbarui Data Lowongan Demand Luar Negeri'}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Modul D • Job Order Terverifikasi BP3MI & Standar Ketenagakerjaan Global
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup formulir"
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Posisi & Perusahaan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Posisi Pekerjaan / Job Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                list="demand-occupations"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Pilih jabatan dari data referensi"
                className="w-full rounded-xl border border-input bg-background p-2.5 text-sm text-foreground placeholder:text-muted-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <datalist id="demand-occupations">
                {availableOccupations.map((occupation) => (
                  <option key={occupation.id} value={occupation.title} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Nama Perusahaan Pemberi Kerja (Employer) <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={employerName}
                onChange={(e) => setEmployerName(e.target.value)}
                placeholder="Contoh: Mitsubishi Heavy Industries / Asahi Glass"
                className="w-full rounded-xl border border-input bg-background p-2.5 text-sm text-foreground placeholder:text-muted-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Negara, Sektor & Pendidikan Minimal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Negara Penempatan <span className="text-destructive">*</span>
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {businessOptions.countries.map((item) => (
                  <option key={item.id} value={item.name}>{item.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Sektor Industri <span className="text-destructive">*</span>
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
                className="w-full rounded-xl border border-input bg-background p-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {businessOptions.sectors.map((item) => (
                  <option key={item.id} value={item.name}>{item.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Pendidikan Minimal <span className="text-destructive">*</span>
              </label>
              <select
                value={minEducation}
                onChange={(e) => setMinEducation(e.target.value)}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              <label className="mb-1 block text-sm font-medium text-foreground">
                Kebutuhan Kuota (Orang) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                required
                value={requiredQuota}
                onChange={(e) => setRequiredQuota(Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Estimasi Gaji Pokok <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={salaryRangeString}
                onChange={(e) => setSalaryRangeString(e.target.value)}
                placeholder="Contoh: ¥ 210.000 - 240.000 (~Rp 22-26 Jt)"
                className="w-full rounded-xl border border-input bg-background p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Standar Bahasa Asing <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={requiredLanguageLevel}
                onChange={(e) => setRequiredLanguageLevel(e.target.value)}
                placeholder="Contoh: JLPT N4 / JFT-Basic A2 / Goethe B1"
                className="w-full rounded-xl border border-input bg-background p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Masa Kontrak & Tenggat Waktu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Masa Kontrak Kerja (Bulan) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min={6}
                max={60}
                required
                value={workTermMonths}
                onChange={(e) => setWorkTermMonths(Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Batas Waktu Rekrutmen (Deadline) <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                placeholder="Contoh: 30 Nov 2026 atau 2026-11-30"
                className="w-full rounded-xl border border-input bg-background p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Persyaratan Keterampilan (Skills) */}
          <div>
            <label className="mb-1 flex items-center justify-between text-sm font-medium text-foreground">
              <span>Keterampilan Teknis yang Dibutuhkan (Pisahkan dengan koma)</span>
              <span className="font-normal text-muted-foreground">Kunci pencocokan algoritma Tahap 3</span>
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="Arc Welding 3G, Blue Print Reading, Pemotongan Plasma"
              className="w-full rounded-xl border border-input bg-background p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Sertifikasi Wajib */}
          <div>
            <label className="mb-1 flex items-center justify-between text-sm font-medium text-foreground">
              <span>Sertifikasi Kerja Wajib (Pisahkan dengan koma)</span>
              <span className="font-normal text-muted-foreground">Contoh: BNSP, SSW Tokutei Ginou</span>
            </label>
            <input
              type="text"
              value={certsInput}
              onChange={(e) => setCertsInput(e.target.value)}
              placeholder="Sertifikat Uji Kompetensi Pengelasan BNSP, SSW Tokutei Ginou"
              className="w-full rounded-xl border border-input bg-background p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Footer Form Buttons */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Lowongan terhubung langsung dengan AI Matching Engine Tahap 3
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
