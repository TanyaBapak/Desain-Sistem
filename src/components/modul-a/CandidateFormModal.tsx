import React, { useState, useEffect } from 'react';
import { CandidateParticipant } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { X, UserPlus, Save, AlertCircle, Sparkles } from 'lucide-react';

interface CandidateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<CandidateParticipant, 'id'>) => void;
  initialData?: CandidateParticipant | null;
  mode: 'create' | 'edit';
  canVerify?: boolean;
}

export const CandidateFormModal: React.FC<CandidateFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  canVerify = false,
}) => {
  const { businessOptions } = useAppStore();
  const [fullName, setFullName] = useState('');
  const [nik, setNik] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [provinsi, setProvinsi] = useState('Jawa Barat');
  const [kabupatenKota, setKabupatenKota] = useState('Kabupaten Bogor');
  const [educationLevel, setEducationLevel] = useState<'SMK' | 'D3' | 'S1' | 'Lainnya'>('SMK');
  const [institutionName, setInstitutionName] = useState('');
  const [sourceType, setSourceType] = useState<CandidateParticipant['sourceType']>('Disnaker Pemda');
  const [major, setMajor] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [language, setLanguage] = useState<'Jepang' | 'Jerman' | 'Inggris' | 'Mandarin' | 'Korea'>('Jepang');
  const [langLevel, setLangLevel] = useState('');
  const [preferredCountry, setPreferredCountry] = useState('');
  const [preferredJobRole, setPreferredJobRole] = useState('');
  const [readinessStatus, setReadinessStatus] = useState<CandidateParticipant['readinessStatus']>('Needs Upskilling');
  const [verificationStatus, setVerificationStatus] = useState<CandidateParticipant['verificationStatus']>('Pending Verification');
  const availableDistricts = businessOptions.districts.filter(
    (district) => businessOptions.provinces.find((province) => province.name === provinsi)?.id === district.province_id,
  );

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFullName(initialData.fullName);
      setNik(initialData.nik);
      setGender(initialData.gender);
      setProvinsi(initialData.provinsi);
      setKabupatenKota(initialData.kabupatenKota);
      setEducationLevel(initialData.educationLevel);
      setInstitutionName(initialData.institutionName);
      setSourceType(initialData.sourceType || 'Disnaker Pemda');
      setMajor(initialData.major);
      setSkillsInput(initialData.skills.join(', '));
      if (initialData.languageProficiency.length > 0) {
        setLanguage(initialData.languageProficiency[0].language);
        setLangLevel(initialData.languageProficiency[0].level);
      }
      setPreferredCountry(initialData.preferredCountry[0] || 'Jepang');
      setPreferredJobRole(initialData.preferredJobRole[0] || 'Welder');
      setReadinessStatus(initialData.readinessStatus);
      setVerificationStatus(initialData.verificationStatus);
    } else {
      // Default reset
      setFullName('');
      setNik('');
      setGender('L');
      setProvinsi('Jawa Barat');
      setSourceType('Disnaker Pemda');
      setKabupatenKota('Kabupaten Bogor');
      setEducationLevel('SMK');
      setInstitutionName('');
      setMajor('');
      setSkillsInput('');
      setLanguage('Jepang');
      setLangLevel('');
      setPreferredCountry('');
      setPreferredJobRole('');
      setReadinessStatus('Needs Upskilling');
      setVerificationStatus('Pending Verification');
    }
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const skillsArray = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onSubmit({
      fullName,
      nik,
      gender,
      provinsi,
      kabupatenKota,
      educationLevel,
      institutionName,
      sourceType,
      major,
      skills: skillsArray,
      languageProficiency: langLevel ? [{ language, level: langLevel }] : [],
      preferredCountry: preferredCountry ? [preferredCountry] : [],
      preferredJobRole: preferredJobRole ? [preferredJobRole] : [],
      readinessStatus,
      verificationStatus,
      lifecycleStatus: mode === 'create' ? 'SUBMITTED' : initialData?.lifecycleStatus || 'APPROVED',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {mode === 'create' ? 'Tambah Data Calon Peserta (Supply)' : 'Edit Data Calon Peserta'}
              </h3>
              <p className="text-xs text-slate-500">
                Modul A: Input & Pemutakhiran Data Pencari Kerja Lulusan Vokasi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama Lengkap */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Sesuai KTP *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="misal: Rizky Pratama"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* NIK */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Induk Kependudukan (NIK) *</label>
              <input
                type="text"
                required
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                placeholder="16 digit NIK..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>

            {/* Pendidikan */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tingkat Pendidikan</label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SMK">SMK (Vokasi)</option>
                <option value="D3">Diploma 3 (D3)</option>
                <option value="S1">Sarjana Terapan / S1</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            {/* Asal Sekolah / Lembaga */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Asal Sekolah / Lembaga Vokasi *</label>
              <input
                type="text"
                required
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="misal: SMKN 1 Cibinong"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sumber Input Data */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Sumber Input Data *</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Disnaker Pemda">Dinas Tenaga Kerja Pemda</option>
                <option value="SMK / Pendidikan Vokasi">Sekolah Menengah Kejuruan (SMK)</option>
                <option value="Lembaga Vokasi">Lembaga Pelatihan Vokasi (BLK / LPK / Politeknik)</option>
              </select>
            </div>

            {/* Jurusan */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jurusan / Kompetensi Keahlian *</label>
              <input
                type="text"
                required
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="misal: Teknik Pengelasan / Keperawatan"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Provinsi */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Provinsi Domisili</label>
              <select
                value={provinsi}
                onChange={(e) => {
                  setProvinsi(e.target.value);
                  const provinceId = businessOptions.provinces.find((province) => province.name === e.target.value)?.id;
                  const firstDistrict = businessOptions.districts.find((district) => district.province_id === provinceId);
                  setKabupatenKota(firstDistrict?.name ?? '');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {businessOptions.provinces.map((province) => (
                  <option key={province.id} value={province.name}>{province.name}</option>
                ))}
              </select>
            </div>

            {/* Kabupaten/Kota */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kabupaten / Kota</label>
              <select
                required
                value={kabupatenKota}
                onChange={(e) => setKabupatenKota(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableDistricts.map((district) => (
                  <option key={district.id} value={district.name}>{district.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Keterampilan / Skills */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Keterampilan Teknis & Sertifikasi (Pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="misal: Arc Welding SMAW, GMAW, K3, Kaigo Dasar..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bahasa */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Bahasa Asing Dikuasai</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as typeof language)}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Jepang">Jepang</option>
                  <option value="Jerman">Jerman</option>
                  <option value="Inggris">Inggris</option>
                  <option value="Mandarin">Mandarin</option>
                  <option value="Korea">Korea</option>
                </select>
                <input
                  type="text"
                  value={langLevel}
                  onChange={(e) => setLangLevel(e.target.value)}
                  placeholder="Level (JLPT N4, B1...)"
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Minat Negara & Jabatan */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Negara & Jabatan</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={preferredCountry}
                  onChange={(e) => setPreferredCountry(e.target.value)}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Pilih negara</option>
                    {businessOptions.countries.map((country) => (
                      <option key={country.id} value={country.name}>{country.name}</option>
                    ))}
                </select>
                <input
                  type="text"
                  value={preferredJobRole}
                  onChange={(e) => setPreferredJobRole(e.target.value)}
                  placeholder="Welder / Caregiver..."
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Kesiapan */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Kesiapan Peserta</label>
              <select
                value={readinessStatus}
                onChange={(e) => setReadinessStatus(e.target.value as CandidateParticipant['readinessStatus'])}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Ready for Placement">Ready for Placement (Siap Seleksi/Penempatan)</option>
                <option value="Needs Upskilling">Needs Upskilling (Perlu Penguatan Kompetensi)</option>
                <option value="Needs Reskilling">Needs Reskilling (Perlu Alih Keahlian)</option>
              </select>
            </div>

            {canVerify && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Verifikasi NIK/Sekolah</label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value as CandidateParticipant['verificationStatus'])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pending Verification">Pending Verification (Proses Validasi)</option>
                  <option value="Verified">Verified (Terverifikasi Sah)</option>
                  <option value="Unverified">Unverified (Belum Sah)</option>
                </select>
              </div>
            )}
          </div>

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-800 text-[11px] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Setiap penambahan atau perubahan data otomatis dicatat dalam <strong>Audit Trail Nasional</strong> dengan stempel waktu dan ID pengguna aktif.</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{mode === 'create' ? 'Simpan Peserta Baru' : 'Perbarui Data'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
