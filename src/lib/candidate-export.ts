import { CandidateParticipant } from '../types';
import * as XLSX from 'xlsx';

const CANDIDATE_HEADERS = [
  'Nama lengkap',
  'Provinsi',
  'Kabupaten/Kota',
  'Jenjang pendidikan',
  'Jurusan',
  'Nama Sekolah/Politeknik',
  'Keterampilan/Kompetensi (pisahkan koma)',
  'Bidang pengalaman kerja',
  'Lama pengalaman (tahun)',
  'Nama perusahaan (opsional)',
  'Sertifikasi kompetensi (nama & penerbit)',
  'Bahasa asing',
  'Level bahasa (JLPT N4/A2/TOEIC/Basic)',
  'Negara tujuan yang diminati (pisahkan koma)',
  'Sektor pilihan (pisahkan koma)',
  'Jabatan yang dipilih (pisahkan koma)',
  'Status kesiapan',
];

const TEMPLATE_HEADERS = [
  'Nama lengkap',
  'NIK (opsional)',
  'Provinsi',
  'Kabupaten/Kota',
  'Jenjang pendidikan (SMK/D3/S1)',
  'Jurusan',
  'Nama Sekolah/Politeknik',
  'Keterampilan/Kompetensi (pisahkan koma)',
  'Bidang pengalaman kerja',
  'Lama pengalaman (tahun, angka)',
  'Nama perusahaan (opsional)',
  'Sertifikasi kompetensi (nama & penerbit)',
  'Bahasa asing',
  'Level bahasa (mis. JLPT N4/A2/TOEIC/Basic)',
  'Negara tujuan yang diminati (pisahkan koma)',
  'Sektor pilihan (pisahkan koma)',
  'Jabatan yang dipilih (pisahkan koma)',
  'Kontak (HP/Email, opsional)',
];

function protectSpreadsheetValue(value: string): string {
  return /^[\t\r ]*[=+\-@]/.test(value) ? `'${value}` : value;
}

function createCsv(rows: string[][]): string {
  const escapeCell = (value: string) => `"${protectSpreadsheetValue(value).replace(/"/g, '""')}"`;
  return `\uFEFFsep=;\r\n${rows.map((row) => row.map(escapeCell).join(';')).join('\r\n')}`;
}

function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatExperienceText(experiences: CandidateParticipant['workExperiences']): {
  bidang: string;
  lama: string;
  perusahaan: string;
} {
  if (!experiences || experiences.length === 0) {
    return { bidang: '', lama: '', perusahaan: '' };
  }
  const exp = experiences[0];
  const total = experiences.reduce((sum, e) => sum + (e.durationYears || 0), 0);
  return {
    bidang: `${exp.sector} - ${exp.role}`,
    lama: total > 0 ? total.toString() : (exp.durationYears || '').toString(),
    perusahaan: exp.companyName || '',
  };
}

function formatCertText(certs: CandidateParticipant['certifications']): string {
  if (!certs || certs.length === 0) return '';
  return certs
    .map((c) => `${c.name}${c.issuer ? ` (${c.issuer})` : ''}`)
    .join('; ');
}

function formatLangText(langs: CandidateParticipant['languageProficiency']): { bahasa: string; level: string } {
  if (!langs || langs.length === 0) return { bahasa: '', level: '' };
  const langStr = langs.map((l) => l.language).join(', ');
  const levelStr = langs.map((l) => l.level).join(', ');
  return { bahasa: langStr, level: levelStr };
}

export function exportCandidatesCsv(candidates: CandidateParticipant[]): void {
  const rows = candidates.map((candidate) => {
    const exp = formatExperienceText(candidate.workExperiences);
    const lang = formatLangText(candidate.languageProficiency);
    return [
      candidate.fullName,
      candidate.provinsi,
      candidate.kabupatenKota,
      candidate.educationLevel,
      candidate.major,
      candidate.institutionName,
      candidate.skills.join(', '),
      exp.bidang,
      exp.lama,
      exp.perusahaan,
      formatCertText(candidate.certifications),
      lang.bahasa,
      lang.level,
      candidate.preferredCountry.join(', '),
      (candidate.preferredSectors ?? []).join(', '),
      candidate.preferredJobRole.join(', '),
      candidate.readinessStatus,
    ];
  });

  downloadCsv('data-calon-pmi.csv', createCsv([CANDIDATE_HEADERS, ...rows]));
}

export function exportCandidatesXlsx(candidates: CandidateParticipant[]): void {
  const rows = candidates.map((candidate) => {
    const exp = formatExperienceText(candidate.workExperiences);
    const lang = formatLangText(candidate.languageProficiency);
    return {
      'Nama lengkap': candidate.fullName,
      'Provinsi': candidate.provinsi,
      'Kabupaten/Kota': candidate.kabupatenKota,
      'Jenjang pendidikan': candidate.educationLevel,
      'Jurusan': candidate.major,
      'Nama Sekolah/Politeknik': candidate.institutionName,
      'Keterampilan/Kompetensi (pisahkan koma)': candidate.skills.join(', '),
      'Bidang pengalaman kerja': exp.bidang,
      'Lama pengalaman (tahun)': exp.lama,
      'Nama perusahaan (opsional)': exp.perusahaan,
      'Sertifikasi kompetensi (nama & penerbit)': formatCertText(candidate.certifications),
      'Bahasa asing': lang.bahasa,
      'Level bahasa (JLPT N4/A2/TOEIC/Basic)': lang.level,
      'Negara tujuan yang diminati (pisahkan koma)': candidate.preferredCountry.join(', '),
      'Sektor pilihan (pisahkan koma)': (candidate.preferredSectors ?? []).join(', '),
      'Jabatan yang dipilih (pisahkan koma)': candidate.preferredJobRole.join(', '),
      'Status kesiapan': candidate.readinessStatus,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: CANDIDATE_HEADERS });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Calon PMI');
  XLSX.writeFile(workbook, 'data-calon-pmi.xlsx');
}

export function downloadCandidateTemplate(): void {
  downloadCsv('template-pengumpulan-calon-pmi.csv', createCsv([TEMPLATE_HEADERS]));
}

export function downloadCandidateTemplateXlsx(): void {
  const worksheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Calon PMI');
  XLSX.writeFile(workbook, 'template-pengumpulan-calon-pmi.xlsx');
}

export type CandidateImportPayload = Omit<CandidateParticipant, 'id'>;

export interface CandidateImportRowError {
  rowNumber: number;
  fullName: string;
  reason: string;
}

export interface CandidateImportParseResult {
  validRows: CandidateImportPayload[];
  errors: CandidateImportRowError[];
  duplicateCount: number;
}

function normalizeHeaderKey(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getCellString(row: Record<string, unknown>, aliases: string[]): string {
  const normalizedMap = new Map<string, unknown>();
  Object.entries(row).forEach(([key, value]) => {
    normalizedMap.set(normalizeHeaderKey(key), value);
  });

  for (const alias of aliases) {
    const val = normalizedMap.get(normalizeHeaderKey(alias));
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim().replace(/^'+/, '');
    }
  }
  return '';
}

function splitList(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeEducationLevel(raw: string): CandidateParticipant['educationLevel'] {
  const upper = raw.toUpperCase().trim();
  if (upper.includes('SMK') || upper.includes('SMA') || upper.includes('STM')) return 'SMK';
  if (upper.includes('D3') || upper.includes('D-3') || upper.includes('DIPLOMA')) return 'D3';
  if (upper.includes('S1') || upper.includes('S-1') || upper.includes('D4') || upper.includes('SARJANA')) return 'S1';
  return 'SMK';
}

function normalizeLanguageName(raw: string): 'Jepang' | 'Jerman' | 'Inggris' | 'Mandarin' | 'Korea' {
  const lower = raw.toLowerCase();
  if (lower.includes('jepang') || lower.includes('japan') || lower.includes('jlpt')) return 'Jepang';
  if (lower.includes('jerman') || lower.includes('german')) return 'Jerman';
  if (lower.includes('korea') || lower.includes('eps') || lower.includes('topik')) return 'Korea';
  if (lower.includes('mandarin') || lower.includes('china') || lower.includes('chinese') || lower.includes('hsk')) return 'Mandarin';
  return 'Inggris';
}

function normalizeReadinessStatus(raw: string): CandidateParticipant['readinessStatus'] {
  const lower = raw.toLowerCase();
  if (lower.includes('ready') || lower.includes('siap')) return 'Ready for Placement';
  if (lower.includes('reskilling') || lower.includes('ulang')) return 'Needs Reskilling';
  return 'Needs Upskilling';
}

function generateDeterministicNik(seedIndex: number): string {
  const suffix = String(Date.now() % 100000000).padStart(8, '0');
  const seq = String(seedIndex + 1).padStart(4, '0');
  return `3300${suffix}${seq}`;
}

export async function parseCandidateSpreadsheet(
  file: File,
  defaults?: {
    provinsi?: string;
    kabupatenKota?: string;
    institutionName?: string;
    sourceType?: CandidateParticipant['sourceType'];
  },
): Promise<CandidateImportParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  let workbook: XLSX.WorkBook;

  if (file.name.toLowerCase().endsWith('.csv')) {
    const text = new TextDecoder('utf-8').decode(arrayBuffer).replace(/^\uFEFF/, '').replace(/^sep=;\r?\n/i, '');
    workbook = XLSX.read(text, { type: 'string', raw: false });
  } else {
    workbook = XLSX.read(arrayBuffer, { type: 'array' });
  }

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { validRows: [], errors: [{ rowNumber: 1, fullName: '-', reason: 'Lembar kerja (sheet) kosong.' }], duplicateCount: 0 };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

  const validRows: CandidateImportPayload[] = [];
  const errors: CandidateImportRowError[] = [];
  const seenNiks = new Set<string>();
  let duplicateCount = 0;

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const fullName = getCellString(row, ['Nama lengkap', 'Nama Lengkap', 'Nama', 'Full Name', 'full_name']);
    const rawNik = getCellString(row, ['NIK (opsional)', 'NIK', 'No KTP', 'Nomor Induk Kependudukan']);
    const provinsi = getCellString(row, ['Provinsi', 'Provinsi Asal', 'Provinsi Domisili']) || defaults?.provinsi || 'Jawa Tengah';
    const kabupatenKota =
      getCellString(row, ['Kabupaten/Kota', 'Kabupaten / Kota', 'Kab/Kota', 'Kota', 'Kabupaten']) ||
      defaults?.kabupatenKota ||
      'Kota Surakarta';
    const eduRaw = getCellString(row, ['Jenjang pendidikan (SMK/D3/S1)', 'Jenjang pendidikan', 'Pendidikan', 'Education']);
    const major = getCellString(row, ['Jurusan', 'Program Studi', 'Kompetensi Keahlian', 'Prodi']) || 'Umum';
    const institutionName =
      getCellString(row, ['Nama Sekolah/Politeknik', 'Asal Sekolah', 'Sekolah', 'Lembaga Vokasi', 'Institusi']) ||
      defaults?.institutionName ||
      'Lembaga Vokasi';

    // Skip completely empty rows
    const hasAnyValue = Object.values(row).some((val) => String(val ?? '').trim() !== '');
    if (!hasAnyValue) {
      return;
    }

    if (!fullName) {
      errors.push({
        rowNumber,
        fullName: '(Tanpa Nama)',
        reason: 'Kolom "Nama lengkap" wajib diisi.',
      });
      return;
    }

    const digitsOnlyNik = rawNik.replace(/\D/g, '');
    let finalNik = digitsOnlyNik;
    if (digitsOnlyNik.length > 0 && digitsOnlyNik.length !== 16) {
      errors.push({
        rowNumber,
        fullName,
        reason: `NIK "${rawNik}" harus terdiri dari 16 digit angka (atau kosongkan bila belum ada).`,
      });
      return;
    }
    if (!finalNik) {
      finalNik = generateDeterministicNik(index);
    }

    if (seenNiks.has(finalNik)) {
      duplicateCount += 1;
      errors.push({
        rowNumber,
        fullName,
        reason: `Duplikat NIK (${finalNik}) ditemukan di dalam berkas yang sama.`,
      });
      return;
    }
    seenNiks.add(finalNik);

    const genderRaw = getCellString(row, ['Jenis Kelamin', 'Gender', 'L/P', 'JK']).toUpperCase();
    const gender: 'L' | 'P' = genderRaw.startsWith('P') || genderRaw.startsWith('W') || genderRaw === 'F' ? 'P' : 'L';

    const skills = splitList(
      getCellString(row, ['Keterampilan/Kompetensi (pisahkan koma)', 'Keterampilan', 'Kompetensi', 'Skills']),
    );

    const expField = getCellString(row, ['Bidang pengalaman kerja', 'Bidang Pengalaman', 'Pengalaman Kerja']);
    const expYearsRaw = getCellString(row, ['Lama pengalaman (tahun, angka)', 'Lama pengalaman (tahun)', 'Lama Pengalaman']);
    const expCompany = getCellString(row, ['Nama perusahaan (opsional)', 'Nama Perusahaan', 'Perusahaan']);
    const expYears = parseFloat(expYearsRaw.replace(',', '.'));

    const workExperiences: CandidateParticipant['workExperiences'] = [];
    if (expField || (!Number.isNaN(expYears) && expYears > 0)) {
      const parts = expField.split('-').map((p) => p.trim());
      workExperiences.push({
        sector: parts[0] || 'Hospitality & Pariwisata',
        role: parts[1] || parts[0] || 'Staf Operasional',
        durationYears: !Number.isNaN(expYears) && expYears >= 0 ? expYears : 1,
        companyName: expCompany || undefined,
      });
    }

    const certRaw = getCellString(row, ['Sertifikasi kompetensi (nama & penerbit)', 'Sertifikasi Kompetensi', 'Sertifikasi']);
    const certifications: CandidateParticipant['certifications'] = splitList(certRaw).map((item) => {
      const match = item.match(/^(.+?)\s*\((.+?)\)$/);
      return {
        name: match ? match[1].trim() : item,
        issuer: match ? match[2].trim() : 'LSP / Lembaga Sertifikasi',
      };
    });

    const langNames = splitList(getCellString(row, ['Bahasa asing', 'Bahasa Asing', 'Bahasa']));
    const langLevels = splitList(
      getCellString(row, [
        'Level bahasa (mis. JLPT N4/A2/TOEIC/Basic)',
        'Level bahasa (JLPT N4/A2/TOEIC/Basic)',
        'Level Bahasa',
        'Level',
      ]),
    );
    const languageProficiency: CandidateParticipant['languageProficiency'] =
      langNames.length > 0
        ? langNames.map((lang, idx) => ({
            language: normalizeLanguageName(lang),
            level: langLevels[idx] || langLevels[0] || 'Basic',
          }))
        : [{ language: 'Inggris', level: 'Basic' }];

    const preferredCountry = splitList(
      getCellString(row, ['Negara tujuan yang diminati (pisahkan koma)', 'Negara Tujuan', 'Negara']),
    );
    const preferredSectors = splitList(
      getCellString(row, ['Sektor pilihan (pisahkan koma)', 'Sektor Pilihan', 'Sektor']),
    );
    const preferredJobRole = splitList(
      getCellString(row, ['Jabatan yang dipilih (pisahkan koma)', 'Jabatan Pilihan', 'Jabatan']),
    );
    const readinessRaw = getCellString(row, ['Status kesiapan', 'Status Kesiapan', 'Kesiapan']);

    validRows.push({
      nik: finalNik,
      fullName,
      gender,
      provinsi,
      kabupatenKota,
      educationLevel: normalizeEducationLevel(eduRaw),
      institutionName,
      sourceType: defaults?.sourceType || 'Lembaga Vokasi',
      major,
      skills: skills.length > 0 ? skills : [major],
      workExperiences,
      certifications,
      preferredSectors: preferredSectors.length > 0 ? preferredSectors : ['Hospitality'],
      languageProficiency,
      preferredCountry: preferredCountry.length > 0 ? preferredCountry : ['Jepang'],
      preferredJobRole: preferredJobRole.length > 0 ? preferredJobRole : ['Staf Umum'],
      readinessStatus: readinessRaw ? normalizeReadinessStatus(readinessRaw) : 'Ready for Placement',
      verificationStatus: 'Pending Verification',
      lifecycleStatus: 'SUBMITTED',
    });
  });

  return { validRows, errors, duplicateCount };
}
