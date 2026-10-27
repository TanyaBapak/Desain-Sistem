import React, { useState, useEffect } from 'react';
import { VocationalProvider, ProviderType } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { X, Building2, Save, Sparkles, ShieldCheck } from 'lucide-react';

interface ProviderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<VocationalProvider, 'id'>) => void;
  initialData?: VocationalProvider | null;
  mode: 'create' | 'edit';
}

export const ProviderFormModal: React.FC<ProviderFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}) => {
  const { businessOptions } = useAppStore();
  const defaultCountries = [
    { id: 'JP', name: 'Jepang' },
    { id: 'KR', name: 'Korea' },
    { id: 'MY', name: 'Malaysia' },
    { id: 'TR', name: 'Turki' },
  ];
  const countriesList = businessOptions.countries.length > 0 ? businessOptions.countries : defaultCountries;

  const defaultSectorNames = [
    'Caregiver',
    'Hospitality & Pariwisata',
    'Kesehatan / Caregiver',
    'Manufaktur / Pengelasan',
    'Otomotif & Alat Berat',
    'Konstruksi',
    'Teknologi Informasi',
    'Bisnis dan Manajemen',
    'Pertanian & Perkebunan',
  ];
  const sectorOptions = Array.from(
    new Set([
      ...defaultSectorNames,
      ...businessOptions.sectors.map((sector) => sector.name),
      ...(initialData?.supportedSectors ?? []),
    ]),
  ).sort((left, right) => left.localeCompare(right, 'id'));

  const [name, setName] = useState('');
  const [providerType, setProviderType] = useState<ProviderType>('SMK');
  const [provinsi, setProvinsi] = useState('Jawa Barat');
  const [kabupatenKota, setKabupatenKota] = useState('Kabupaten Bogor');
  const [accreditation, setAccreditation] = useState<VocationalProvider['accreditation']>('A');
  const [evokasiStatus, setEvokasiStatus] = useState<VocationalProvider['evokasiVerificationStatus']>('Proses Verifikasi');
  const [classCount, setClassCount] = useState<number | string>('');
  const [readyParticipantCount, setReadyParticipantCount] = useState<number | string>('');
  const [certifiedInstructorsCount, setCertifiedInstructorsCount] = useState<number | string>('');
  const [operationalReadinessScore, setOperationalReadinessScore] = useState<number | string>('');
  const [supportedSectors, setSupportedSectors] = useState<string[]>([]);
  const [supportedCountries, setSupportedCountries] = useState<string[]>([]);
  const [facilitiesInput, setFacilitiesInput] = useState('');

  const availableDistricts = businessOptions.districts.filter(
    (district) => businessOptions.provinces.find((province) => province.name === provinsi)?.id === district.province_id,
  );

  useEffect(() => {
    if (!isOpen) return;

    if (initialData && mode === 'edit') {
      setName(initialData.name);
      setProviderType(initialData.providerType as ProviderType);

      const prov = initialData.provinsi || 'Jawa Barat';
      setProvinsi(prov);

      const targetProvinceId = businessOptions.provinces.find((p) => p.name === prov)?.id;
      const validDistricts = businessOptions.districts.filter((d) => d.province_id === targetProvinceId);

      if (initialData.kabupatenKota && initialData.kabupatenKota !== 'Belum diketahui') {
        setKabupatenKota(initialData.kabupatenKota);
      } else if (validDistricts.length > 0) {
        setKabupatenKota(validDistricts[0].name);
      } else {
        setKabupatenKota(initialData.kabupatenKota || '');
      }

      setAccreditation(initialData.accreditation);
      setEvokasiStatus(initialData.evokasiVerificationStatus);
      setClassCount(initialData.classCount ?? '');
      setReadyParticipantCount(initialData.readyParticipantCount ?? '');
      setCertifiedInstructorsCount(initialData.certifiedInstructorsCount ?? '');
      setOperationalReadinessScore(initialData.operationalReadinessScore ?? '');
      setSupportedSectors(initialData.supportedSectors ?? []);

      const normalizedCountries = (initialData.supportedCountries ?? []).map((c) => {
        const found = countriesList.find((cl) => cl.id === c || cl.name.toLowerCase() === c.toLowerCase());
        return found ? found.id : c;
      });
      setSupportedCountries(normalizedCountries);
      setFacilitiesInput(initialData.facilities ? initialData.facilities.join(', ') : '');
    } else {
      setName('');
      setProviderType('SMK');
      setProvinsi('Jawa Barat');
      setKabupatenKota('Kabupaten Bogor');
      setAccreditation('A');
      setEvokasiStatus('Proses Verifikasi');
      setClassCount('');
      setReadyParticipantCount('');
      setCertifiedInstructorsCount('');
      setOperationalReadinessScore('');
      setSupportedSectors([]);
      setSupportedCountries([]);
      setFacilitiesInput('');
    }
  }, [isOpen, initialData?.id, mode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const facilitiesArray = facilitiesInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const canonicalCountries = supportedCountries.map((c) => {
      const found = countriesList.find((cl) => cl.id === c || cl.name.toLowerCase() === c.toLowerCase());
      return found ? found.id : c;
    });

    onSubmit({
      name,
      providerType,
      provinsi,
      kabupatenKota,
      accreditation,
      evokasiVerificationStatus: evokasiStatus,
      capacityPerBatch: initialData?.capacityPerBatch ?? null,
      classCount: classCount === '' ? 0 : Number(classCount),
      readyParticipantCount: readyParticipantCount === '' ? 0 : Number(readyParticipantCount),
      certifiedInstructorsCount: certifiedInstructorsCount === '' ? 0 : Number(certifiedInstructorsCount),
      operationalReadinessScore: operationalReadinessScore === '' ? 0 : Number(operationalReadinessScore),
      supportedSectors,
      supportedCountries: canonicalCountries,
      facilities: facilitiesArray,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-900 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-800/80 border border-emerald-700 flex items-center justify-center text-emerald-200 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {mode === 'create'
                  ? 'Pendaftaran Lembaga Penyelenggara Vokasi'
                  : 'Perbarui Data Lembaga Vokasi'}
              </h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                Modul C • Pemetaan Kesiapan Sarpras, Akreditasi & Verifikasi e-Vokasi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Nama Lembaga & Tipe */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Resmi Lembaga / Satuan Vokasi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: SMKN 1 Cikarang Barat / Balai Pelatihan Vokasi dan Produktivitas (BPVP) Bekasi"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bentuk Lembaga <span className="text-rose-500">*</span>
              </label>
              <select
                value={providerType}
                onChange={(e) => setProviderType(e.target.value as ProviderType)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
              >
                {!['SMK', 'BLK', 'LPK', 'Perguruan Tinggi / Politeknik', 'LKP', 'Universitas', 'Politeknik'].includes(providerType) && providerType && (
                  <option value={providerType}>{providerType}</option>
                )}
                <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                <option value="BLK">BLK / BPVP (Balai Pelatihan Vokasi)</option>
                <option value="LPK">LPK (Lembaga Pelatihan Kerja)</option>
                <option value="LKP">LKP (Lembaga Kursus dan Pelatihan)</option>
                <option value="Perguruan Tinggi / Politeknik">Perguruan Tinggi / Politeknik</option>
                <option value="Politeknik">Politeknik</option>
                <option value="Universitas">Universitas</option>
              </select>
            </div>
          </div>

          {/* Wilayah Provinsi & Kabupaten */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Provinsi <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={provinsi}
                onChange={(e) => {
                  const newProv = e.target.value;
                  setProvinsi(newProv);
                  const provinceId = businessOptions.provinces.find((p) => p.name === newProv)?.id;
                  const firstDistrict = businessOptions.districts.find((d) => d.province_id === provinceId);
                  setKabupatenKota(firstDistrict?.name ?? '');
                }}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
              >
                {!businessOptions.provinces.some((p) => p.name === provinsi) && provinsi && (
                  <option value={provinsi}>{provinsi}</option>
                )}
                {businessOptions.provinces.map((province) => (
                  <option key={province.id} value={province.name}>{province.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kabupaten / Kota <span className="text-rose-500">*</span>
              </label>
              {availableDistricts.length === 0 ? (
                <input
                  type="text"
                  required
                  value={kabupatenKota}
                  onChange={(e) => setKabupatenKota(e.target.value)}
                  placeholder="Contoh: Kabupaten Bogor"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 focus:bg-white transition"
                />
              ) : (
                <select
                  required
                  value={kabupatenKota}
                  onChange={(e) => setKabupatenKota(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                >
                  {!availableDistricts.some((d) => d.name === kabupatenKota) && kabupatenKota && (
                    <option value={kabupatenKota}>{kabupatenKota}</option>
                  )}
                  {availableDistricts.map((district) => (
                    <option key={district.id} value={district.name}>{district.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Akreditasi, Status e-Vokasi & Skor Kesiapan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status Akreditasi <span className="text-rose-500">*</span>
              </label>
              <select
                value={accreditation}
                onChange={(e) => setAccreditation(e.target.value as VocationalProvider['accreditation'])}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
              >
                {!['A', 'Unggul', 'B', 'Baik Sekali', 'C', 'Baik', 'Belum Terakreditasi'].includes(accreditation) && accreditation && (
                  <option value={accreditation}>{accreditation}</option>
                )}
                <option value="A">Akreditasi A</option>
                <option value="Unggul">Unggul</option>
                <option value="B">Akreditasi B</option>
                <option value="Baik Sekali">Baik Sekali</option>
                <option value="C">Akreditasi C</option>
                <option value="Baik">Baik</option>
                <option value="Belum Terakreditasi">Belum Terakreditasi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status Verifikasi e-Vokasi <span className="text-rose-500">*</span>
              </label>
              <select
                value={evokasiStatus}
                onChange={(e) => setEvokasiStatus(e.target.value as VocationalProvider['evokasiVerificationStatus'])}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
              >
                <option value="Terverifikasi e-Vokasi">Terverifikasi e-Vokasi</option>
                <option value="Proses Verifikasi">Proses Verifikasi</option>
                <option value="Belum Terverifikasi">Belum Terverifikasi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Skor Kesiapan Sarpras (0-100) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step="any"
                required
                value={operationalReadinessScore}
                onChange={(e) => setOperationalReadinessScore(e.target.value)}
                placeholder="0"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
              />
            </div>
          </div>

          {/* Kelas, peserta siap pelatihan, dan instruktur */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jumlah Kelas <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                max={100000}
                step="any"
                required
                value={classCount}
                onChange={(e) => setClassCount(e.target.value)}
                placeholder="0"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Peserta Siap Mengikuti Pelatihan <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                max={100000}
                step="any"
                required
                value={readyParticipantCount}
                onChange={(e) => setReadyParticipantCount(e.target.value)}
                placeholder="0"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jumlah Instruktur Tersertifikasi BNSP / Industri <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                max={100000}
                step="any"
                required
                value={certifiedInstructorsCount}
                onChange={(e) => setCertifiedInstructorsCount(e.target.value)}
                placeholder="0"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <fieldset className="space-y-2">
              <legend className="block text-xs font-bold text-slate-700">
                Sektor vokasi yang didukung
              </legend>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-border bg-background p-3">
                {sectorOptions.map((sector) => (
                  <label key={sector} className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={supportedSectors.includes(sector)}
                      onChange={(event) =>
                        setSupportedSectors((current) =>
                          toggleSelection(current, sector, event.target.checked),
                        )
                      }
                      className="h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    {sector}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="space-y-2">
              <legend className="block text-xs font-bold text-slate-700">
                Negara tujuan penempatan
              </legend>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-border bg-background p-3">
                {countriesList.map((country) => (
                  <label key={country.id} className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={supportedCountries.includes(country.id) || supportedCountries.includes(country.name)}
                      onChange={(event) =>
                        setSupportedCountries((current) => {
                          const isChecked = event.target.checked;
                          const filtered = current.filter(
                            (item) => item !== country.id && item !== country.name,
                          );
                          return isChecked ? [...filtered, country.id] : filtered;
                        })
                      }
                      className="h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    {country.name}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Fasilitas Bengkel & Lab */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Fasilitas Bengkel Kerja, Workshop & Lab (Pisahkan dengan koma)</span>
              <span className="text-slate-400 font-normal">Daftar sarana uji kompetensi</span>
            </label>
            <textarea
              rows={3}
              value={facilitiesInput}
              onChange={(e) => setFacilitiesInput(e.target.value)}
              placeholder="Bengkel Las Standar ISO, Lab Komputer Bahasa, Mesin CNC 5-Axis, Asrama Siswa"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
            />
          </div>

          {/* Footer Form Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Data terhubung ke sistem verifikasi e-Vokasi Kemendikbud & Kemenaker
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
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{mode === 'create' ? 'Daftarkan Lembaga' : 'Perbarui Lembaga'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

function toggleSelection(values: string[], value: string, checked: boolean): string[] {
  return checked ? [...new Set([...values, value])] : values.filter((item) => item !== value);
}
