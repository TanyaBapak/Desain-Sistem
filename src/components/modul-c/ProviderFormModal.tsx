import React, { useState, useEffect } from 'react';
import { VocationalProvider, ProviderType } from '../../types';
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
  const [name, setName] = useState('');
  const [providerType, setProviderType] = useState<ProviderType>('SMK');
  const [provinsi, setProvinsi] = useState('Jawa Barat');
  const [kabupatenKota, setKabupatenKota] = useState('Kabupaten Bekasi');
  const [accreditation, setAccreditation] = useState<VocationalProvider['accreditation']>('A');
  const [evokasiStatus, setEvokasiStatus] = useState<VocationalProvider['evokasiVerificationStatus']>('Proses Verifikasi');
  const [capacityPerBatch, setCapacityPerBatch] = useState(120);
  const [certifiedInstructorsCount, setCertifiedInstructorsCount] = useState(12);
  const [operationalReadinessScore, setOperationalReadinessScore] = useState(88);
  const [supportedSectorsInput, setSupportedSectorsInput] = useState('Manufaktur & Mesin, Otomotif, Teknik Pengelasan');
  const [facilitiesInput, setFacilitiesInput] = useState('Bengkel Las Standar ISO 9606, CNC Machining Center, Lab Bahasa Komputer (35 Unit), Asrama Pelatihan');

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setName(initialData.name);
      setProviderType(initialData.providerType as ProviderType);
      setProvinsi(initialData.provinsi);
      setKabupatenKota(initialData.kabupatenKota);
      setAccreditation(initialData.accreditation);
      setEvokasiStatus(initialData.evokasiVerificationStatus);
      setCapacityPerBatch(initialData.capacityPerBatch);
      setCertifiedInstructorsCount(initialData.certifiedInstructorsCount);
      setOperationalReadinessScore(initialData.operationalReadinessScore);
      setSupportedSectorsInput(initialData.supportedSectors.join(', '));
      setFacilitiesInput(initialData.facilities.join(', '));
    } else {
      setName('');
      setProviderType('SMK');
      setProvinsi('Jawa Barat');
      setKabupatenKota('Kabupaten Bekasi');
      setAccreditation('A');
      setEvokasiStatus('Proses Verifikasi');
      setCapacityPerBatch(120);
      setCertifiedInstructorsCount(12);
      setOperationalReadinessScore(88);
      setSupportedSectorsInput('Manufaktur & Mesin, Otomotif, Teknik Pengelasan');
      setFacilitiesInput('Bengkel Las Standar ISO 9606, CNC Machining Center, Lab Bahasa Komputer (35 Unit), Asrama Pelatihan');
    }
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const sectorsArray = supportedSectorsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const facilitiesArray = facilitiesInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onSubmit({
      name,
      providerType,
      provinsi,
      kabupatenKota,
      accreditation,
      evokasiVerificationStatus: evokasiStatus,
      capacityPerBatch: Number(capacityPerBatch),
      certifiedInstructorsCount: Number(certifiedInstructorsCount),
      operationalReadinessScore: Number(operationalReadinessScore),
      supportedSectors: sectorsArray.length > 0 ? sectorsArray : ['Manufaktur Vokasi'],
      facilities: facilitiesArray.length > 0 ? facilitiesArray : ['Bengkel Praktek Standar Industri'],
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
                <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                <option value="BLK">BLK / BPVP (Balai Pelatihan Vokasi)</option>
                <option value="LPK">LPK (Lembaga Pelatihan Kerja)</option>
                <option value="Perguruan Tinggi / Politeknik">Perguruan Tinggi / Politeknik</option>
              </select>
            </div>
          </div>

          {/* Wilayah Provinsi & Kabupaten */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Provinsi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={provinsi}
                onChange={(e) => setProvinsi(e.target.value)}
                placeholder="Misal: Jawa Barat"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kabupaten / Kota <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={kabupatenKota}
                onChange={(e) => setKabupatenKota(e.target.value)}
                placeholder="Misal: Kabupaten Bogor"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
              />
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
                <option value="A">Akreditasi A</option>
                <option value="Unggul">Unggul</option>
                <option value="B">Akreditasi B</option>
                <option value="Baik Sekali">Baik Sekali</option>
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
                required
                value={operationalReadinessScore}
                onChange={(e) => setOperationalReadinessScore(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
              />
            </div>
          </div>

          {/* Kapasitas Siswa & Instruktur */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kapasitas Siswa / Batch (Orang) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={10}
                max={2000}
                required
                value={capacityPerBatch}
                onChange={(e) => setCapacityPerBatch(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jumlah Instruktur Tersertifikasi BNSP / Industri <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={200}
                required
                value={certifiedInstructorsCount}
                onChange={(e) => setCertifiedInstructorsCount(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
              />
            </div>
          </div>

          {/* Sektor Unggulan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Sektor Vokasi Unggulan (Pisahkan dengan koma)</span>
              <span className="text-slate-400 font-normal">Contoh: Manufaktur, Pengelasan, Otomotif</span>
            </label>
            <input
              type="text"
              value={supportedSectorsInput}
              onChange={(e) => setSupportedSectorsInput(e.target.value)}
              placeholder="Manufaktur & Mesin, Otomotif, Teknik Pengelasan"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
            />
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
