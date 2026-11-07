import React, { useState, useEffect, useMemo } from 'react';
import { CandidateParticipant } from '../../types';
import { INDONESIA_38_PROVINCES } from '../../lib/constants/provinces';
import { INDONESIA_DISTRICTS } from '../../lib/constants/districts';
import { useAppStore } from '../../store/useAppStore';
import { X, UserPlus, Save, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

interface CandidateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<CandidateParticipant, 'id'>) => void;
  initialData?: CandidateParticipant | null;
  mode: 'create' | 'edit';
  canVerify?: boolean;
  defaultInstitutionName?: string;
  isSubmitting?: boolean;
}

export const CandidateFormModal: React.FC<CandidateFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  canVerify = false,
  defaultInstitutionName = '',
  isSubmitting = false,
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
  const [isCustomCountry, setIsCustomCountry] = useState(false);
  const [preferredJobRole, setPreferredJobRole] = useState('');
  const [readinessStatus, setReadinessStatus] = useState<CandidateParticipant['readinessStatus']>('Ready for Placement');
  const [verificationStatus, setVerificationStatus] = useState<CandidateParticipant['verificationStatus']>('Pending Verification');
  const provincesList = useMemo(() => {
    const list: Array<{ id: string; name: string }> = [];
    const seenNames = new Set<string>();

    const addProvince = (id: string | number, name: string) => {
      const cleanName = (name || '').trim();
      if (!cleanName) return;
      const key = cleanName.toLowerCase();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        list.push({ id: String(id || cleanName), name: cleanName });
      }
    };

    // 1. Standard 38 provinces of Indonesia
    INDONESIA_38_PROVINCES.forEach((p) => addProvince(p.id, p.name));

    // 2. Business options provinces from store/backend
    if (Array.isArray(businessOptions?.provinces)) {
      businessOptions.provinces.forEach((p) => {
        if (p?.name) {
          addProvince(p.id, p.name);
        }
      });
    }

    // 3. Preserve current candidate's province if present
    if (provinsi) {
      addProvince(provinsi, provinsi);
    }

    // Sort alphabetically for clean selection
    return list.sort((a, b) => a.name.localeCompare(b.name, 'id'));
  }, [businessOptions?.provinces, provinsi]);

  const districtsList = useMemo(() => {
    if (Array.isArray(businessOptions?.districts) && businessOptions.districts.length > 0) {
      return businessOptions.districts;
    }
    return INDONESIA_DISTRICTS;
  }, [businessOptions?.districts]);

  const selectedProvinceId = useMemo(() => {
    const cleanProv = (provinsi || '').trim().toLowerCase();
    if (!cleanProv) return '';
    const match = provincesList.find((p) => p.name.trim().toLowerCase() === cleanProv);
    return match ? String(match.id).trim() : '';
  }, [provincesList, provinsi]);

  const availableDistricts = useMemo(() => {
    if (!selectedProvinceId) return [];
    return districtsList.filter(
      (district) => String(district.province_id).trim() === selectedProvinceId,
    );
  }, [districtsList, selectedProvinceId]);

  // 4 Negara Resmi Sistem SMK Go Global
  const official4Countries = useMemo(() => [
    { id: 'JP', name: 'Jepang' },
    { id: 'KR', name: 'Korea' },
    { id: 'MY', name: 'Malaysia' },
    { id: 'TR', name: 'Turki' },
  ], []);

  // Destinasi Populer Tambahan Calon Pekerja Migran
  const otherPopularCountries = useMemo(() => [
    { id: 'BG', name: 'Bulgaria' },
    { id: 'KP', name: 'Kapal Pesiar Internasional' },
    { id: 'DE', name: 'Jerman' },
    { id: 'TW', name: 'Taiwan' },
    { id: 'SG', name: 'Singapura' },
    { id: 'AU', name: 'Australia' },
    { id: 'NZ', name: 'Selandia Baru' },
    { id: 'AE', name: 'Uni Emirat Arab' },
    { id: 'SA', name: 'Arab Saudi' },
    { id: 'QA', name: 'Qatar' },
    { id: 'PL', name: 'Polandia' },
    { id: 'SK', name: 'Slovakia' },
    { id: 'HR', name: 'Kroasia' },
    { id: 'GB', name: 'Inggris' },
    { id: 'NL', name: 'Belanda' },
    { id: 'CH', name: 'Swiss' },
    { id: 'IT', name: 'Italia' },
    { id: 'ES', name: 'Spanyol' },
    { id: 'US', name: 'Amerika Serikat' },
    { id: 'CA', name: 'Kanada' },
    { id: 'BN', name: 'Brunei Darussalam' },
  ], []);

  const availableOccupations = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    const addOccupation = (title?: string) => {
      const clean = (title || '').trim();
      if (!clean) return;
      const key = clean.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(clean);
      }
    };

    if (Array.isArray(businessOptions?.occupations)) {
      businessOptions.occupations.forEach((occ: any) => addOccupation(occ?.title || occ?.name));
    }

    [
      'Housekeeping',
      'Welder',
      'Caregiver',
      'Perawat',
      'Perhotelan',
      'Hospitality',
      'Operator Mesin',
      'Pengolahan Makanan',
      'Konstruksi',
      'Teknisi Listrik',
      'Pertanian Modern',
      'Waitress / Waiter',
    ].forEach(addOccupation);

    return list.sort((a, b) => a.localeCompare(b, 'id'));
  }, [businessOptions?.occupations]);

  const availableOtherCountries = useMemo(() => {
    const list: Array<{ id: string; name: string }> = [];
    const seen = new Set<string>();
    // Official countries already shown in first optgroup
    official4Countries.forEach((c) => seen.add(c.name.toLowerCase()));

    const addCountry = (name?: string, id?: string) => {
      const clean = (name || '').trim();
      if (!clean) return;
      const normalizedName = ((clean.toLowerCase() === 'korea selatan' || clean.toLowerCase() === 'korsel') ? 'Korea' : clean);
      const key = normalizedName.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ id: id || normalizedName, name: normalizedName });
      }
    };

    otherPopularCountries.forEach((c) => addCountry(c.name, c.id));

    if (Array.isArray(businessOptions?.countries)) {
      businessOptions.countries.forEach((c) => addCountry(c.name, c.id));
    }

    if (preferredCountry) {
      addCountry(preferredCountry);
    }

    return list;
  }, [businessOptions?.countries, official4Countries, otherPopularCountries, preferredCountry]);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFullName(initialData.fullName || '');
      setNik(initialData.nik || '');
      setGender(initialData.gender || 'L');
      const rawProv = (initialData.provinsi || '').trim();
      const matchedProv = INDONESIA_38_PROVINCES.find(
        (p) => p.name.toLowerCase() === rawProv.toLowerCase()
      )?.name || rawProv || 'Jawa Barat';
      setProvinsi(matchedProv);
      setKabupatenKota((initialData.kabupatenKota || '').trim());
      setEducationLevel(initialData.educationLevel || 'SMK');
      setInstitutionName(initialData.institutionName || '');
      setSourceType(initialData.sourceType || 'Disnaker Pemda');
      setMajor(initialData.major || '');
      setSkillsInput(Array.isArray(initialData.skills) ? initialData.skills.join(', ') : '');
      if (initialData.languageProficiency && initialData.languageProficiency.length > 0) {
        setLanguage(initialData.languageProficiency[0].language);
        setLangLevel(initialData.languageProficiency[0].level);
      }
      const rawCountry = Array.isArray(initialData.preferredCountry) && initialData.preferredCountry.length > 0
        ? initialData.preferredCountry[0]
        : (typeof initialData.preferredCountry === 'string' ? initialData.preferredCountry : '');
      const normalizedCountry = ((rawCountry || '').toLowerCase() === 'korea selatan' || (rawCountry || '').toLowerCase() === 'korsel') ? 'Korea' : (rawCountry || 'Jepang');
      setPreferredCountry(normalizedCountry);
      setPreferredJobRole(
        Array.isArray(initialData.preferredJobRole) && initialData.preferredJobRole.length > 0
          ? initialData.preferredJobRole[0]
          : (typeof initialData.preferredJobRole === 'string' ? initialData.preferredJobRole : 'Welder')
      );
      setReadinessStatus(initialData.readinessStatus || 'Ready for Placement');
      setVerificationStatus(initialData.verificationStatus || 'Pending Verification');
      setIsCustomCountry(false);
    } else {
      // Default reset
      setFullName('');
      setNik('');
      setGender('L');
      setProvinsi('Jawa Barat');
      setSourceType('Disnaker Pemda');
      setKabupatenKota('Kabupaten Bogor');
      setEducationLevel('SMK');
      setInstitutionName(initialData?.institutionName || defaultInstitutionName || 'Politeknik Indonusa Surakarta');
      setMajor('');
      setSkillsInput('');
      setLanguage('Jepang');
      setLangLevel('');
      setPreferredCountry('');
      setIsCustomCountry(false);
      setPreferredJobRole('');
      setReadinessStatus('Ready for Placement');
      setVerificationStatus('Pending Verification');
    }
  }, [initialData, mode, isOpen, defaultInstitutionName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !fullName.trim()) return;

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
      workExperiences: initialData?.workExperiences ?? [],
      certifications: initialData?.certifications ?? [],
      preferredSectors: initialData?.preferredSectors ?? [],
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
              <label className="block font-bold text-slate-700 mb-1">Provinsi Domisili *</label>
              <select
                required
                value={provinsi}
                onChange={(e) => {
                  const newProv = e.target.value;
                  setProvinsi(newProv);
                  const provObj = provincesList.find(
                    (p) => p.name.trim().toLowerCase() === newProv.trim().toLowerCase()
                  );
                  const pId = provObj ? String(provObj.id).trim() : '';
                  const matchingDistricts = districtsList.filter(
                    (d) => String(d.province_id).trim() === pId
                  );
                  if (matchingDistricts.length > 0) {
                    setKabupatenKota(matchingDistricts[0].name);
                  } else {
                    setKabupatenKota('');
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium text-slate-800"
              >
                {provincesList.map((province) => (
                  <option key={province.id} value={province.name}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Kabupaten/Kota */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kabupaten / Kota *</label>
              {availableDistricts.length > 0 ? (
                <select
                  required
                  value={kabupatenKota}
                  onChange={(e) => setKabupatenKota(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium text-slate-800"
                >
                  {!availableDistricts.some(
                    (d) => d.name.trim().toLowerCase() === (kabupatenKota || '').trim().toLowerCase()
                  ) && Boolean(kabupatenKota) && (
                    <option value={kabupatenKota}>{kabupatenKota}</option>
                  )}
                  {availableDistricts.map((district) => (
                    <option key={district.id} value={district.name}>
                      {district.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={kabupatenKota}
                  onChange={(e) => setKabupatenKota(e.target.value)}
                  placeholder="Masukkan Kabupaten / Kota..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                />
              )}
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
                <div>
                  {isCustomCountry ? (
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        autoFocus
                        value={preferredCountry}
                        onChange={(e) => setPreferredCountry(e.target.value)}
                        placeholder="Ketik nama negara..."
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomCountry(false)}
                        className="px-2.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 rounded-xl whitespace-nowrap transition cursor-pointer"
                        title="Pilih dari daftar dropdown"
                      >
                        Pilih Dropdown
                      </button>
                    </div>
                  ) : (
                    <select
                      value={((preferredCountry || '').toLowerCase() === 'korea selatan' || (preferredCountry || '').toLowerCase() === 'korsel') ? 'Korea' : preferredCountry}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomCountry(true);
                          setPreferredCountry('');
                        } else {
                          setPreferredCountry(e.target.value);
                        }
                      }}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-800 font-medium"
                    >
                      <option value="">Pilih negara target...</option>
                      <optgroup label="Negara Resmi SMK Go Global">
                        {official4Countries.map((country) => (
                          <option key={country.id || country.name} value={country.name}>
                            {country.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Destinasi Populer Lainnya">
                        {availableOtherCountries.map((country) => (
                          <option key={country.id || country.name} value={country.name}>
                            {country.name}
                          </option>
                        ))}
                      </optgroup>
                      <option value="__custom__">+ Ketik Negara Lainnya...</option>
                    </select>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    list="candidate-job-roles"
                    value={preferredJobRole}
                    onChange={(e) => setPreferredJobRole(e.target.value)}
                    placeholder="Pilih atau ketik jabatan..."
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <datalist id="candidate-job-roles">
                    {availableOccupations.map((title) => (
                      <option key={title} value={title} />
                    ))}
                  </datalist>
                </div>
              </div>
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
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'create' ? 'Menyimpan...' : 'Memperbarui...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{mode === 'create' ? 'Simpan Peserta Baru' : 'Perbarui Data'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
