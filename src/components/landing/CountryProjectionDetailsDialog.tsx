import { BriefcaseBusiness, ChevronDown, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const numberFormat = new Intl.NumberFormat("id-ID");

export interface CountryProjection {
  name: string;
  year: number | null;
  target: number;
  achieved: number;
  projected: number;
}

export interface SectorProjection {
  name: string;
  target: number;
  occupations: { name: string; target: number }[];
}

interface CountryProjectionDetailsDialogProps {
  country: CountryProjection | null;
  sectors: SectorProjection[];
  totalTarget: number;
  selectedSector: string | null;
  onOpenChange: (open: boolean) => void;
  onSectorSelect: (sectorName: string) => void;
}

export function CountryProjectionDetailsDialog({
  country,
  sectors,
  totalTarget,
  selectedSector,
  onOpenChange,
  onSectorSelect,
}: CountryProjectionDetailsDialogProps) {
  return (
    <Dialog open={country !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{country ? `Rincian ${country.name}` : "Rincian negara"}</DialogTitle>
          <DialogDescription>
            {country
              ? `Target sektor dan jabatan ${country.year ? `tahun ${country.year}` : "di semua periode"}. Pilih sektor untuk melihat jabatan.`
              : "Pilih negara untuk melihat rincian target."}
          </DialogDescription>
        </DialogHeader>

        {country && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Target negara</p>
                <p className="mt-1 text-xl font-bold tabular-nums">
                  {numberFormat.format(country.target)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Target dari jabatan terdaftar</p>
                <p className="mt-1 text-xl font-bold tabular-nums">
                  {numberFormat.format(totalTarget)}
                </p>
              </div>
            </div>

            {sectors.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                Belum ada sektor dan jabatan yang didaftarkan untuk negara ini.
              </p>
            ) : (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Sektor terdaftar</h3>
                {sectors.map((sector) => {
                  const isSelected = selectedSector === sector.name;

                  return (
                    <section
                      key={sector.name}
                      className="overflow-hidden rounded-lg border border-border"
                    >
                      <button
                        type="button"
                        onClick={() => onSectorSelect(sector.name)}
                        aria-expanded={isSelected}
                        className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{sector.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {numberFormat.format(sector.occupations.length)} jabatan
                            </span>
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-semibold tabular-nums">
                            {numberFormat.format(sector.target)}
                          </span>
                          {isSelected ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          )}
                        </span>
                      </button>
                      {isSelected && (
                        <div className="border-t border-border bg-muted/20 px-3 py-2">
                          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 text-sm">
                            {sector.occupations.map((occupation) => (
                              <div key={occupation.name} className="contents">
                                <span className="flex items-center gap-2 py-1 text-muted-foreground">
                                  <span
                                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                                    aria-hidden="true"
                                  />
                                  {occupation.name}
                                </span>
                                <span className="py-1 text-right font-medium tabular-nums">
                                  {numberFormat.format(occupation.target)}
                                </span>
                              </div>
                            ))}
                            <span className="border-t border-border pt-2 font-semibold">
                              Total sektor
                            </span>
                            <span className="border-t border-border pt-2 text-right font-bold tabular-nums">
                              {numberFormat.format(sector.target)}
                            </span>
                          </div>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
