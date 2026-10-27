import { BP3MI_ASSIGNMENT } from './bp3mi';

export interface ProvinceOption {
  id: string;
  name: string;
  bp3miCode?: string;
  bp3miName?: string;
}

export const INDONESIA_38_PROVINCES: readonly ProvinceOption[] = [
  { id: '11', name: 'Aceh' },
  { id: '12', name: 'Sumatera Utara' },
  { id: '13', name: 'Sumatera Barat' },
  { id: '14', name: 'Riau' },
  { id: '15', name: 'Jambi' },
  { id: '16', name: 'Sumatera Selatan', bp3miCode: 'BP3MI-SUMSEL', bp3miName: 'BP3MI Sumatera Selatan' },
  { id: '17', name: 'Bengkulu' },
  { id: '18', name: 'Lampung', bp3miCode: 'BP3MI-LAMPUNG', bp3miName: 'BP3MI Lampung' },
  { id: '19', name: 'Kepulauan Bangka Belitung' },
  { id: '21', name: 'Kepulauan Riau' },
  { id: '31', name: 'DKI Jakarta', bp3miCode: 'BP3MI-JKT', bp3miName: 'BP3MI Jakarta' },
  { id: '32', name: 'Jawa Barat', bp3miCode: 'BP3MI-JABAR', bp3miName: 'BP3MI Jawa Barat' },
  { id: '33', name: 'Jawa Tengah', bp3miCode: 'BP3MI-JATENG', bp3miName: 'BP3MI Jawa Tengah' },
  { id: '34', name: 'Daerah Istimewa Yogyakarta', bp3miCode: 'BP3MI-DIY', bp3miName: 'BP3MI Daerah Istimewa Yogyakarta' },
  { id: '35', name: 'Jawa Timur', bp3miCode: 'BP3MI-JATIM', bp3miName: 'BP3MI Jawa Timur' },
  { id: '36', name: 'Banten', bp3miCode: 'BP3MI-BANTEN', bp3miName: 'BP3MI Banten' },
  { id: '51', name: 'Bali' },
  { id: '52', name: 'Nusa Tenggara Barat', bp3miCode: 'BP3MI-NTB', bp3miName: 'BP3MI Nusa Tenggara Barat' },
  { id: '53', name: 'Nusa Tenggara Timur' },
  { id: '61', name: 'Kalimantan Barat' },
  { id: '62', name: 'Kalimantan Tengah' },
  { id: '63', name: 'Kalimantan Selatan' },
  { id: '64', name: 'Kalimantan Timur' },
  { id: '65', name: 'Kalimantan Utara' },
  { id: '71', name: 'Sulawesi Utara' },
  { id: '72', name: 'Sulawesi Tengah' },
  { id: '73', name: 'Sulawesi Selatan', bp3miCode: 'BP3MI-SULSEL', bp3miName: 'BP3MI Sulawesi Selatan' },
  { id: '74', name: 'Sulawesi Tenggara' },
  { id: '75', name: 'Gorontalo' },
  { id: '76', name: 'Sulawesi Barat' },
  { id: '81', name: 'Maluku' },
  { id: '82', name: 'Maluku Utara' },
  { id: '91', name: 'Papua' },
  { id: '92', name: 'Papua Barat' },
  { id: '93', name: 'Papua Selatan' },
  { id: '94', name: 'Papua Tengah' },
  { id: '95', name: 'Papua Pegunungan' },
  { id: '96', name: 'Papua Barat Daya' },
];

/**
 * Returns BP3MI info for a given province name, or null if none.
 */
export function getProvinceBp3mi(provinceName: string) {
  const clean = provinceName.trim().toLowerCase();
  const matched = BP3MI_ASSIGNMENT.find((b) =>
    b.provinces.some((p) => p.toLowerCase() === clean)
  );
  if (matched) return matched;

  // Also check direct mapping in INDONESIA_38_PROVINCES
  const prov = INDONESIA_38_PROVINCES.find(
    (p) => p.name.toLowerCase() === clean || (clean === 'di yogyakarta' && p.name.includes('Yogyakarta'))
  );
  if (prov?.bp3miName) {
    return { code: prov.bp3miCode ?? '', name: prov.bp3miName, provinces: [prov.name] };
  }
  return null;
}
