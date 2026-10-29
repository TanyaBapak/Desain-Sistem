import { BadgeCheck, BriefcaseBusiness, ChevronDown, ChevronRight, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
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
  achieved: number;
  occupations: { name: string; target: number }[];
}

export interface ParticipantProjection {
  id: string;
  name: string;
  sectorName: string;
  occupationName: string;
  province: string;
  educationLevel: string;
  major?: string;
  readinessStatus: string;
  sourceType: string;
}

interface CountryProjectionDetailsDialogProps {
  country: CountryProjection | null;
  sectors: SectorProjection[];
  participants: ParticipantProjection[];
  totalTarget: number;
  selectedSector: string | null;
  onOpenChange: (open: boolean) => void;
  onSectorSelect: (sectorName: string) => void;
}

function normalizeSectorName(name: string) {
  return name
    .trim()
    .toLocaleLowerCase("id-ID")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function CountryProjectionDetailsDialog({
  country,
  sectors,
  participants,
  totalTarget,
  selectedSector,
  onOpenChange,
  onSectorSelect,
}: CountryProjectionDetailsDialogProps) {
  const visibleParticipants = selectedSector
    ? participants.filter(
        (participant) =>
          normalizeSectorName(participant.sectorName) === normalizeSectorName(selectedSector),
      )
    : participants;

  return (
    <Dialog open={country !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{country ? `Rincian ${country.name}` : "Rincian negara"}</DialogTitle>
          <DialogDescription>
            {country
              ? `Target, capaian, dan peserta terverifikasi ${country.year ? `tahun ${country.year}` : "di semua periode"}. Pilih sektor untuk melihat jabatan dan pesertanya.`
              : "Pilih negara untuk melihat rincian target."}
          </DialogDescription>
        </DialogHeader>

        {country && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Target negara</p>
                <p className="mt-1 text-xl font-bold tabular-nums">
                  {numberFormat.format(country.target)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Peserta terverifikasi</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-primary">
                  {numberFormat.format(country.achieved)}
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
                          <span className="flex flex-col items-end">
                            <span className="text-sm font-semibold tabular-nums">
                              {numberFormat.format(sector.target)}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {numberFormat.format(sector.achieved)} peserta
                            </span>
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
                          {sector.occupations.length === 0 ? (
                            <p className="py-1 text-sm text-muted-foreground">
                              Belum ada jabatan yang didaftarkan untuk sektor ini.
                            </p>
                          ) : (
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
                                Total jabatan
                              </span>
                              <span className="border-t border-border pt-2 text-right font-bold tabular-nums">
                                {numberFormat.format(
                                  sector.occupations.reduce(
                                    (total, occupation) => total + occupation.target,
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}

            <section className="space-y-2" aria-labelledby="participants-heading">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id="participants-heading" className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                  Peserta terverifikasi
                </h3>
                <Badge variant="secondary" className="tabular-nums">
                  {numberFormat.format(visibleParticipants.length)}
                  {selectedSector ? ` dari ${numberFormat.format(participants.length)}` : ""} peserta
                </Badge>
              </div>
              {selectedSector && (
                <p className="text-xs text-muted-foreground">
                  Menampilkan peserta dengan sektor {selectedSector}. Pilih sektor yang sama untuk
                  melihat seluruh peserta.
                </p>
              )}
              {visibleParticipants.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  {participants.length === 0
                    ? "Belum ada peserta terverifikasi untuk negara ini."
                    : "Belum ada peserta terverifikasi pada sektor ini."}
                </p>
              ) : (
                <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {visibleParticipants.map((participant) => (
                    <li
                      key={`${participant.id}-${participant.sectorName}`}
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                            aria-hidden="true"
                          >
                            {participant.name.charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{participant.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {participant.province} · {participant.educationLevel}
                              {participant.major ? ` · ${participant.major}` : ""}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 gap-1 border-emerald-500/30 bg-emerald-500/10 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"
                        >
                          <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                          Terverifikasi
                        </Badge>
                      </div>
                      <div className="mt-2 grid gap-1.5 border-t border-border/60 pt-2 text-xs sm:grid-cols-3">
                        <div className="rounded bg-muted/40 p-1.5">
                          <span className="block text-[10px] font-medium text-muted-foreground">
                            Sektor
                          </span>
                          <span className="block truncate font-semibold">
                            {participant.sectorName}
                          </span>
                        </div>
                        <div className="rounded bg-muted/40 p-1.5">
                          <span className="block text-[10px] font-medium text-muted-foreground">
                            Jabatan
                          </span>
                          <span className="block truncate font-semibold">
                            {participant.occupationName}
                          </span>
                        </div>
                        <div className="rounded bg-muted/40 p-1.5">
                          <span className="block text-[10px] font-medium text-muted-foreground">
                            Sumber data
                          </span>
                          <span className="block truncate font-semibold">
                            {participant.sourceType}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
