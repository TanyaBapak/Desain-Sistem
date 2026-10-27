import { Button } from "@/components/ui/button";

export interface TrainingSectorReference {
  id: string;
  name: string;
  aliases: string[];
}

export interface TrainingOccupationReference {
  id: string;
  sectorId: string;
  sectorName: string;
  title: string;
  aliases: string[];
}

interface TrainingReferenceDataListProps {
  sectors: TrainingSectorReference[];
  occupations: TrainingOccupationReference[];
  onEditSector: (sector: TrainingSectorReference) => void;
  onEditOccupation: (occupation: TrainingOccupationReference) => void;
}

export function TrainingReferenceDataList({
  sectors,
  occupations,
  onEditSector,
  onEditOccupation,
}: TrainingReferenceDataListProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ul className="divide-y divide-border rounded-md border border-border">
        {sectors.length === 0 ? (
          <li className="p-3 text-sm text-muted-foreground">Belum ada sektor.</li>
        ) : sectors.map((sector) => (
          <li key={sector.id} className="flex items-start justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{sector.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Alias: {sector.aliases.length ? sector.aliases.join(", ") : "Belum ada"}
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => onEditSector(sector)}>
              Ubah
            </Button>
          </li>
        ))}
      </ul>
      <ul className="divide-y divide-border rounded-md border border-border">
        {occupations.length === 0 ? (
          <li className="p-3 text-sm text-muted-foreground">Belum ada jabatan.</li>
        ) : occupations.map((occupation) => (
          <li key={occupation.id} className="flex items-start justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{occupation.title}</p>
              <p className="text-xs text-muted-foreground">{occupation.sectorName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Alias: {occupation.aliases.length ? occupation.aliases.join(", ") : "Belum ada"}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onEditOccupation(occupation)}
            >
              Ubah
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
