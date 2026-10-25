import React from 'react';
import { BarChart3, Building2, GraduationCap, Users, BriefcaseBusiness, Database, Clock3 } from 'lucide-react';
import { ExecutiveDashboardBreakdowns, ExecutiveDashboardBreakdownsData } from '@/components/reports/ExecutiveDashboardBreakdowns';
import { InstitutionDirectory } from '@/components/dashboard/InstitutionDirectory';
import { parseServerDate } from '@/lib/utils';

export interface ReportSummary {
  candidateCount: number;
  readyCandidateCount: number;
  programCount: number;
  institutionCount: number;
  nationalLpkCount: number;
  demandCount: number;
  updatedAt: string | null;
  gardata: {
    candidateCount: number;
    trainingRecordCount: number;
    lastSyncStatus: string | null;
    lastSyncAt: string | null;
    recordsFetched: number | null;
    recordsInserted: number | null;
    recordsUpdated: number | null;
    recordsSkipped: number | null;
  };
  dashboard?: ExecutiveDashboardBreakdownsData;
}

interface ReportsViewProps {
  summary: ReportSummary;
  isAuditor: boolean;
  title?: string;
}

export function ReportsView({ summary, isAuditor, title = 'Laporan' }: ReportsViewProps) {
  const metrics = [
    { label: 'Pencari kerja terdaftar', value: summary.candidateCount, icon: Users },
    { label: 'Siap penempatan', value: summary.readyCandidateCount, icon: BarChart3 },
    { label: 'Program pelatihan aktif', value: summary.programCount, icon: GraduationCap },
    { label: 'Lembaga vokasi aktif', value: summary.institutionCount, icon: Building2 },
    { label: 'LPK terdaftar nasional', value: summary.nationalLpkCount, icon: Building2 },
    { label: 'Permintaan tervalidasi', value: summary.demandCount, icon: BriefcaseBusiness },
  ];

  return (
    <section className="space-y-6" aria-labelledby="reports-title">
      <header className="space-y-1">
        <h1 id="reports-title" className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan agregat data program SMK Go Global. Tampilan ini bersifat baca saja.
        </p>
      </header>

      {summary.updatedAt ? (
        <p className="text-xs text-muted-foreground">
          Data terakhir diperbarui:{' '}
          <time dateTime={summary.updatedAt}>
            {new Intl.DateTimeFormat('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'Asia/Jakarta',
            }).format(parseServerDate(summary.updatedAt))}
          </time>{' '}
WIB
        </p>
      ) : (
        <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Belum ada data untuk ditampilkan. Ringkasan akan muncul setelah data tersedia.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {value.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <ExecutiveDashboardBreakdowns data={summary.dashboard} />
      <InstitutionDirectory
        institutions={summary.dashboard?.institutionDirectory ?? []}
        totalCount={summary.institutionCount}
        scopeLabel="seluruh wilayah"
      />

      {isAuditor && (
        <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Tampilan auditor hanya memuat angka agregat; data pribadi dan rincian peserta tidak ditampilkan.
        </p>
      )}

      <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Database className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-medium text-foreground">Ringkasan Gardata / SIPPMI</h2>
            <p className="text-xs text-muted-foreground">
              Data yang sudah tersimpan di database lokal.
            </p>
          </div>
        </div>
        {summary.gardata.lastSyncStatus ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <GardataMetric label="Peserta Gardata" value={summary.gardata.candidateCount} />
            <GardataMetric label="Riwayat pelatihan" value={summary.gardata.trainingRecordCount} />
            <GardataMetric label="Rekaman diterima" value={summary.gardata.recordsFetched} />
            <div>
              <p className="text-xs text-muted-foreground">Sinkronisasi terakhir</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Clock3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {summary.gardata.lastSyncStatus}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary.gardata.lastSyncAt
                  ? `${new Intl.DateTimeFormat('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'Asia/Jakarta',
                  }).format(parseServerDate(summary.gardata.lastSyncAt))} WIB`
                  : 'Waktu selesai belum tersedia'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-4">
              {summary.gardata.recordsInserted === null
                ? 'Rincian sinkronisasi tidak tersedia per wilayah.'
                : `Baru: ${summary.gardata.recordsInserted.toLocaleString('id-ID')} ·
                  Diperbarui: ${summary.gardata.recordsUpdated?.toLocaleString('id-ID') ?? '—'} ·
                  Dilewati: ${summary.gardata.recordsSkipped?.toLocaleString('id-ID') ?? '—'}`}
            </p>
          </div>
        ) : (
          <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Belum ada catatan sinkronisasi Gardata. Angka Gardata belum tersedia dan tidak dianggap sudah tersinkron.
          </p>
        )}
      </article>
    </section>
  );
}

function GardataMetric({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
        {value === null ? 'Tidak tersedia per wilayah' : value.toLocaleString('id-ID')}
      </p>
    </div>
  );
}
