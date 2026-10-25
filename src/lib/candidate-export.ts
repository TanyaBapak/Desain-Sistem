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
