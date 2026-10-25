export const BP3MI_ASSIGNMENT = [
  { code: 'BP3MI-JKT', name: 'BP3MI Jakarta', provinces: ['DKI Jakarta'] },
  { code: 'BP3MI-JABAR', name: 'BP3MI Jawa Barat', provinces: ['Jawa Barat'] },
  { code: 'BP3MI-JATIM', name: 'BP3MI Jawa Timur', provinces: ['Jawa Timur'] },
  { code: 'BP3MI-JATENG', name: 'BP3MI Jawa Tengah', provinces: ['Jawa Tengah'] },
  { code: 'BP3MI-BANTEN', name: 'BP3MI Banten', provinces: ['Banten'] },
  { code: 'BP3MI-LAMPUNG', name: 'BP3MI Lampung', provinces: ['Lampung'] },
  { code: 'BP3MI-NTB', name: 'BP3MI Nusa Tenggara Barat', provinces: ['Nusa Tenggara Barat'] },
  { code: 'BP3MI-DIY', name: 'BP3MI Daerah Istimewa Yogyakarta', provinces: ['Daerah Istimewa Yogyakarta'] },
  { code: 'BP3MI-SULSEL', name: 'BP3MI Sulawesi Selatan', provinces: ['Sulawesi Selatan'] },
  { code: 'BP3MI-SUMSEL', name: 'BP3MI Sumatera Selatan', provinces: ['Sumatera Selatan'] },
] as const;

export const BP3MI_PROVINCE_NAMES = BP3MI_ASSIGNMENT.flatMap((b) => b.provinces);

export function getBp3miByCode(code?: string | null) {
  if (!code) return null;
  return BP3MI_ASSIGNMENT.find((b) => b.code === code) ?? null;
}

export function getBp3miProvincesByCode(code?: string | null) {
  const bp3mi = getBp3miByCode(code);
  return bp3mi?.provinces ?? [];
}
