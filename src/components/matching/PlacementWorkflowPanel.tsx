import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';
import { MonitoringData } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const PLACEMENT_STATUSES = [
  'Proses Dokumen',
  'Penerbitan Visa',
  'Medical Checkup 2',
  'Siap Berangkat',
  'Sudah di Negara Tujuan',
] as const;

interface PlacementWorkflowPanelProps {
  monitoring: MonitoringData;
  onPreviousStage: () => void;
}

export function PlacementWorkflowPanel({ monitoring, onPreviousStage }: PlacementWorkflowPanelProps) {
  const canManagePlacements = useAppStore((state) => state.currentUser?.roleName === 'task_force');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [visaNumbers, setVisaNumbers] = useState<Record<string, string>>({});
  const [flightDates, setFlightDates] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const createPlacement = (candidateMatchId: number) => {
    const actionId = `create-${candidateMatchId}`;
    setBusyAction(actionId);
    setError(null);
    router.post('/placements', { candidateMatchId }, {
      preserveScroll: true,
      onSuccess: () => toast.success('Proses penempatan lokal berhasil dibuat.'),
      onError: (errors) => {
        const message = Object.values(errors).find(Boolean) ?? 'Proses penempatan belum dapat dibuat.';
        setError(message);
        toast.error(message);
      },
      onFinish: () => setBusyAction(null),
    });
  };

  const updatePlacement = (placementId: string, status: string) => {
    setBusyAction(placementId);
    setError(null);
    router.patch(`/placements/${encodeURIComponent(placementId)}`, {
      status,
      visaNumber: visaNumbers[placementId] || undefined,
      flightDate: flightDates[placementId] || undefined,
    }, {
      preserveScroll: true,
      onSuccess: () => toast.success('Progres penempatan berhasil disimpan.'),
      onError: (errors) => {
        const message = Object.values(errors).find(Boolean) ?? 'Progres penempatan belum dapat disimpan.';
        setError(message);
        toast.error(message);
      },
      onFinish: () => setBusyAction(null),
    });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-border bg-background p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tahap 6: Proses Penempatan
            </span>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              Penempatan lokal berdasarkan peserta yang lulus
            </h3>
          </div>
          <Badge variant="primary">Data database lokal</Badge>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            Catatan dan progres disimpan di aplikasi ini. Integrasi SISKOP2MI belum dikonfigurasi; ID eksternal hanya muncul jika memang sudah tersimpan.
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Peserta lulus yang siap diproses ({monitoring.placementCandidates.length})
          </h4>
          {monitoring.placementCandidates.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Belum ada peserta dengan status Gardata GRADUATED pada batch yang sudah dipetakan, atau semua peserta tersebut sudah memiliki proses penempatan.
            </p>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {monitoring.placementCandidates.map((candidate) => (
                <div key={candidate.candidateMatchId} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{candidate.candidateName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {candidate.occupation} · {candidate.country} · {candidate.employer}
                    </p>
                  </div>
                  {canManagePlacements ? (
                    <Button
                      type="button"
                      onClick={() => createPlacement(candidate.candidateMatchId)}
                      disabled={busyAction !== null}
                      className="shrink-0"
                    >
                      {busyAction === `create-${candidate.candidateMatchId}` ? 'Menyimpan...' : 'Mulai Penempatan'}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Hanya Task Force yang dapat mengubah data.</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Proses penempatan tersimpan ({monitoring.placements.length})
          </h4>
          {monitoring.placements.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Belum ada catatan penempatan untuk area ini.
            </p>
          ) : (
            <div className="space-y-3">
              {monitoring.placements.map((placement) => {
                const currentIndex = PLACEMENT_STATUSES.findIndex((status) => status === placement.status);
                const nextStatus = currentIndex >= 0 && currentIndex < PLACEMENT_STATUSES.length - 1
                  ? PLACEMENT_STATUSES[currentIndex + 1]
                  : undefined;

                return (
                  <article key={placement.id} className="space-y-3 rounded-xl border border-border p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h5 className="text-sm font-semibold text-foreground">{placement.candidateName}</h5>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {placement.occupation} · {placement.country} · {placement.employer}
                        </p>
                      </div>
                      <Badge variant="primary">{placement.status}</Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`visa-${placement.id}`} className="mb-1 block text-sm font-medium text-foreground">
                          Nomor visa
                        </label>
                        <Input
                          id={`visa-${placement.id}`}
                          value={visaNumbers[placement.id] ?? ''}
                          onChange={(event) => setVisaNumbers((current) => ({
                            ...current,
                            [placement.id]: event.target.value,
                          }))}
                          maxLength={100}
                          disabled={!canManagePlacements}
                        />
                      </div>
                      <div>
                        <label htmlFor={`flight-${placement.id}`} className="mb-1 block text-sm font-medium text-foreground">
                          Tanggal keberangkatan
                        </label>
                        <Input
                          id={`flight-${placement.id}`}
                          type="date"
                          value={flightDates[placement.id] ?? placement.flightDate ?? ''}
                          onChange={(event) => setFlightDates((current) => ({
                            ...current,
                            [placement.id]: event.target.value,
                          }))}
                          disabled={!canManagePlacements}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">
                        ID SISKOP2MI: {placement.siskop2miId ?? 'Belum terhubung'}
                        {placement.flightDate ? ` · Berangkat ${placement.flightDate}` : ''}
                      </p>
                      {nextStatus && canManagePlacements ? (
                        <Button
                          type="button"
                          onClick={() => updatePlacement(placement.id, nextStatus)}
                          disabled={busyAction !== null}
                        >
                          {busyAction === placement.id ? 'Menyimpan...' : `Lanjut ke ${nextStatus}`}
                        </Button>
                      ) : nextStatus ? (
                        <span className="text-sm text-muted-foreground">Hanya Task Force yang dapat mengubah data.</span>
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">Tahap penempatan selesai</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-start border-t border-border pt-4">
          <Button
            type="button"
            onClick={onPreviousStage}
            variant="outline"
          >
            Kembali ke Tahap 5
          </Button>
        </div>
      </section>
    </div>
  );
}
