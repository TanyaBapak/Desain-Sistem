import React from 'react';
import { BarChart3, Building2, GraduationCap, Users, BriefcaseBusiness } from 'lucide-react';

export interface ReportSummary {
  candidateCount: number;
  readyCandidateCount: number;
  programCount: number;
  institutionCount: number;
  demandCount: number;
  updatedAt: string | null;
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
            }).format(new Date(summary.updatedAt))}
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

      {isAuditor && (
        <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Tampilan auditor hanya memuat angka agregat; data pribadi dan rincian peserta tidak ditampilkan.
        </p>
      )}
    </section>
  );
}
