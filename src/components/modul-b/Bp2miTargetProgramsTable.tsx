import React, { useMemo } from 'react';
import { TrainingProgram } from '../../types';
import { Calendar, BookOpen } from 'lucide-react';

interface Bp2miTargetProgramsTableProps {
  programs: TrainingProgram[];
  canManageSchedule: boolean;
  onEditSchedule?: (program: TrainingProgram) => void;
  onViewCurriculum: (program: TrainingProgram) => void;
}

const SECTOR_ORDER = [
  'Kesehatan',
  'Hospitality',
  'Manufaktur',
  'Transportasi',
  'Agriculture',
  'Bahasa',
  'Pelatihan dan Sertifikasi Teknis',
  'Sertifikasi Teknis',
];

function formatDateShort(dateStr?: string): string | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export const Bp2miTargetProgramsTable: React.FC<Bp2miTargetProgramsTableProps> = ({
  programs,
  canManageSchedule,
  onEditSchedule,
  onViewCurriculum,
}) => {
  const groupedBySector = useMemo(() => {
    const map = new Map<string, TrainingProgram[]>();
    for (const sector of SECTOR_ORDER) {
      map.set(sector, []);
    }
    for (const p of programs) {
      const sec = p.targetSector || 'Lainnya';
      if (!map.has(sec)) {
        map.set(sec, []);
      }
      map.get(sec)!.push(p);
    }
    return Array.from(map.entries()).filter(([, list]) => list.length > 0);
  }, [programs]);

  const grandTotalTarget = useMemo(
    () => programs.reduce((acc, p) => acc + (p.quota || 0), 0),
    [programs],
  );
  const grandTotalClasses = useMemo(
    () => programs.reduce((acc, p) => acc + (p.classCount || 0), 0),
    [programs],
  );

  if (programs.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
        Tidak ada program pelatihan yang sesuai dengan filter pencarian.
      </div>
    );
  }

  let runningRowNo = 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/70 dark:bg-slate-800/40">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
            Tabel Penyiapan Program Pelatihan (Target Nasional BP2MI)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rincian Target Peserta, Jumlah Kelas (@ 20 Org/Kls), Komponen Jam Pelajaran (JP), dan Jadwal Pelaksanaan per Sektor & Jabatan.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs shrink-0">
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 tabular-nums">
            Total Target: {grandTotalTarget.toLocaleString('id-ID')} Peserta
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800 tabular-nums">
            Total Kelas: {grandTotalClasses.toLocaleString('id-ID')} Kelas
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-left">
              <th className="py-3 px-3 font-bold text-center w-10 border-r border-slate-700">No</th>
              <th className="py-3 px-3 font-bold border-r border-slate-700">Sektor</th>
              <th className="py-3 px-3 font-bold border-r border-slate-700">Jenis Jabatan</th>
              <th className="py-3 px-3 font-bold border-r border-slate-700 min-w-[200px]">Proyeksi Penempatan</th>
              <th className="py-3 px-3 font-bold text-right border-r border-slate-700">Target</th>
              <th className="py-3 px-3 font-bold text-center border-r border-slate-700">Jumlah Kelas @20 Org/Kls</th>
              <th className="py-3 px-2.5 font-bold text-center border-r border-slate-700">JP Pelatihan Teknis</th>
              <th className="py-3 px-2.5 font-bold text-center border-r border-slate-700">Sertifikasi Teknis</th>
              <th className="py-3 px-2.5 font-bold text-center border-r border-slate-700">JP Bahasa</th>
              <th className="py-3 px-2.5 font-bold text-center border-r border-slate-700">Sertifikasi Bahasa</th>
              <th className="py-3 px-3 font-bold text-center bg-amber-400 text-slate-950 border-r border-amber-500">Total JP</th>
              <th className="py-3 px-3 font-bold text-center min-w-[180px]">Tanggal Pelaksanaan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {groupedBySector.map(([sectorName, sectorPrograms], sectorIdx) => {
              const sectorTargetSum = sectorPrograms.reduce((acc, p) => acc + (p.quota || 0), 0);
              const sectorClassSum = sectorPrograms.reduce((acc, p) => acc + (p.classCount || 0), 0);

              return (
                <React.Fragment key={sectorName}>
                  {sectorPrograms.map((program, idx) => {
                    runningRowNo += 1;
                    const startStr = formatDateShort(program.scheduleStart);
                    const endStr = formatDateShort(program.scheduleEnd);
                    const hasDate = Boolean(startStr || endStr);

                    return (
                      <tr
                        key={program.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {idx === 0 && (
                          <>
                            <td
                              rowSpan={sectorPrograms.length}
                              className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 align-middle bg-slate-50/40 dark:bg-slate-900/40 tabular-nums"
                            >
                              {sectorIdx + 1}
                            </td>
                            <td
                              rowSpan={sectorPrograms.length}
                              className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 align-middle bg-slate-50/40 dark:bg-slate-900/40"
                            >
                              {sectorName}
                            </td>
                          </>
                        )}
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">
                          <div className="flex items-center justify-between gap-2">
                            <span>
                              <span className="text-slate-400 mr-1.5 tabular-nums">{runningRowNo}.</span>
                              {program.targetJobRole}
                            </span>
                            <button
                              type="button"
                              onClick={() => onViewCurriculum(program)}
                              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 shrink-0"
                              title="Lihat Rincian Silabus"
                            >
                              <BookOpen className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                          {program.projectionPlacement || program.targetCountry}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 tabular-nums">
                          {program.quota.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 tabular-nums">
                          {program.classCount != null ? `${program.classCount.toLocaleString('id-ID')} Kelas` : '-'}
                        </td>
                        <td className="py-2.5 px-2.5 text-center text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 tabular-nums">
                          {program.technicalJP ? `${program.technicalJP} JP` : '-'}
                        </td>
                        <td className="py-2.5 px-2.5 text-center text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 tabular-nums">
                          {program.technicalCertificationJP ? `${program.technicalCertificationJP} JP` : '-'}
                        </td>
                        <td className="py-2.5 px-2.5 text-center text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 tabular-nums">
                          {program.languageJP ? `${program.languageJP} JP` : '-'}
                        </td>
                        <td className="py-2.5 px-2.5 text-center text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 tabular-nums">
                          {program.languageCertificationJP ? `${program.languageCertificationJP} JP` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-extrabold bg-amber-300/80 dark:bg-amber-500/20 text-slate-950 dark:text-amber-300 border-r border-amber-300 dark:border-amber-800/50 tabular-nums">
                          {program.durationJP} JP
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-between gap-2">
                            {hasDate ? (
                              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                {startStr || '-'} s/d {endStr || '-'}
                              </span>
                            ) : (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400">
                                Belum diatur
                              </span>
                            )}
                            {canManageSchedule && onEditSchedule && (
                              <button
                                type="button"
                                onClick={() => onEditSchedule(program)}
                                className="px-2 py-1 rounded-md text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:hover:bg-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition inline-flex items-center gap-1 shrink-0"
                              >
                                <Calendar className="w-3 h-3" />
                                <span>{hasDate ? 'Ubah' : 'Atur Tanggal'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Subtotal Row per Sector */}
                  <tr className="bg-amber-100/70 dark:bg-amber-950/30 font-extrabold text-slate-900 dark:text-amber-200 border-t border-b border-amber-200 dark:border-amber-800/50">
                    <td colSpan={4} className="py-2 px-3 text-right uppercase tracking-wider text-[11px] border-r border-amber-200 dark:border-amber-800/50">
                      TOTAL {sectorName.toUpperCase()}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums border-r border-amber-200 dark:border-amber-800/50">
                      {sectorTargetSum.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 text-center tabular-nums border-r border-amber-200 dark:border-amber-800/50">
                      {sectorClassSum.toLocaleString('id-ID')} Kelas
                    </td>
                    <td colSpan={6} className="py-2 px-3" />
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-amber-400 text-slate-950 font-black text-xs sm:text-sm">
              <td colSpan={4} className="py-3 px-4 text-center uppercase tracking-wider border-r border-amber-500">
                TOTAL KESELURUHAN
              </td>
              <td className="py-3 px-3 text-right tabular-nums border-r border-amber-500">
                {grandTotalTarget.toLocaleString('id-ID')}
              </td>
              <td className="py-3 px-3 text-center tabular-nums border-r border-amber-500">
                {grandTotalClasses.toLocaleString('id-ID')} Kelas
              </td>
              <td colSpan={6} className="py-3 px-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
