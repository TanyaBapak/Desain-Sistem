import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button } from '../ui/button';

interface GardataBatchOption {
  externalBatchId: string;
  name: string;
  participantCount: number;
  status: string;
}

interface GardataClassMappingControlProps {
  classId: string;
  mappedBatchId: string | null;
  batches: GardataBatchOption[];
  canEdit: boolean;
}

export function GardataClassMappingControl({
  classId,
  mappedBatchId,
  batches,
  canEdit,
}: GardataClassMappingControlProps) {
  const [selectedBatchId, setSelectedBatchId] = useState(mappedBatchId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setSelectedBatchId(mappedBatchId ?? ''), [mappedBatchId]);

  const saveMapping = () => {
    if (!selectedBatchId) return;

    setSaving(true);
    setError(null);
    router.put(`/training-classes/${encodeURIComponent(classId)}/gardata-mapping`, {
      externalBatchId: selectedBatchId,
    }, {
      preserveScroll: true,
      onSuccess: () => toast.success('Pemetaan kelas dengan batch Gardata berhasil disimpan.'),
      onError: (errors) => {
        const message = Object.values(errors).find(Boolean)
          ?? 'Pemetaan belum dapat disimpan. Pilih batch yang memiliki peserta dari kelas ini.';
        setError(message);
        toast.error(message);
      },
      onFinish: () => setSaving(false),
    });
  };

  const mappedBatch = batches.find((batch) => batch.externalBatchId === mappedBatchId);

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
      <label htmlFor={`gardata-batch-${classId}`} className="block text-sm font-medium text-foreground">
        Batch Gardata yang sesuai
      </label>
      {canEdit ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            id={`gardata-batch-${classId}`}
            value={selectedBatchId}
            onChange={(event) => setSelectedBatchId(event.target.value)}
            disabled={batches.length === 0 || saving}
            className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Pilih batch Gardata…</option>
            {batches.map((batch) => (
              <option key={batch.externalBatchId} value={batch.externalBatchId}>
                {batch.name} · {batch.participantCount} peserta · {batch.status}
              </option>
            ))}
          </select>
          <Button
            type="button"
            onClick={saveMapping}
            disabled={!selectedBatchId || saving || batches.length === 0}
            className="shrink-0"
          >
            {saving ? 'Menyimpan…' : 'Simpan Pemetaan'}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {mappedBatch?.name ?? mappedBatchId ?? 'Belum dipetakan'}
        </p>
      )}
      {batches.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Belum ada batch Gardata tersinkron untuk area ini.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
