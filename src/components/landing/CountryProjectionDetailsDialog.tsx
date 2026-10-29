import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  Search,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/input";
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

function matchesSearch(participant: ParticipantProjection, query: string): boolean {
  if (query === "") {
    return true;
  }

  return [
    participant.name,
    participant.province,
    participant.sectorName,
    participant.occupationName,
    participant.educationLevel,
    participant.major ?? "",
    participant.sourceType,
  ]
    .join(" ")
    .toLocaleLowerCase("id-ID")
    .includes(query);
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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSearchQuery("");
  }, [country?.name, country?.year]);

  const sectorParticipants = useMemo(() => {
    if (!selectedSector) {
      return participants;
    }

    const sectorKey = normalizeSectorName(selectedSector);

    return participants.filter(
      (participant) => normalizeSectorName(participant.sectorName) === sectorKey,
    );
  }, [participants, selectedSector]);

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("id-ID");
  const visibleParticipants = useMemo(
    () => sectorParticipants.filter((participant) => matchesSearch(participant, normalizedQuery)),
    [sectorParticipants, normalizedQuery],
  );
  const isFiltered = selectedSector !== null || normalizedQuery !== "";

  return (
    <Dialog open={country !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100vw-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-4 text-left sm:px-5">
          <DialogTitle>{country ? `Rincian ${country.name}` : "Rincian negara"}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {country
              ? `Target, capaian, dan peserta terverifikasi ${country.year ? `tahun ${country.year}` : "di semua periode"}. Pilih sektor atau cari peserta untuk mempersempit daftar.`
              : "Pilih negara untuk melihat rincian target."}
          </DialogDescription>
        </DialogHeader>

        {country && (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                <p className="text-xs text-muted-foreground">Target negara</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums">
                  {numberFormat.format(country.target)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                <p className="text-xs text-muted-foreground">Peserta terverifikasi</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-primary">
                  {numberFormat.format(country.achieved)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                <p className="text-xs text-muted-foreground">Target dari jabatan terdaftar</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums">
                  {numberFormat.format(totalTarget)}
                </p>
              </div>
            </div>

            {sectors.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Belum ada sektor dan jabatan yang didaftarkan untuk negara ini.
              </p>
            ) : (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Sektor terdaftar</h3>
                {sectors.map((sector) => {
                  const isSelected =
                    selectedSector !== null &&
                    normalizeSectorName(selectedSector) === normalizeSectorName(sector.name);

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
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{sector.name}</span>
                            <span className="block text-xs text-muted-foreground">
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
                                  <span className="flex min-w-0 items-center gap-2 py-1 text-muted-foreground">
                                    <span
                                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                                      aria-hidden="true"
                                    />
                                    <span className="break-words">{occupation.name}</span>
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
                  {isFiltered ? ` dari ${numberFormat.format(participants.length)}` : ""} peserta
                </Badge>
              </div>

              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari nama, wilayah, sektor, atau jabatan"
                  aria-label="Cari peserta terverifikasi"
                  className="h-9 pl-9 pr-9"
                />
                {searchQuery !== "" && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Hapus pencarian peserta"
                    className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              {selectedSector && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Sektor aktif: <span className="font-semibold text-foreground">{selectedSector}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onSectorSelect(selectedSector)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                    Hapus filter sektor
                  </button>
                </div>
              )}

              {visibleParticipants.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  {participants.length === 0
                    ? "Belum ada peserta terverifikasi untuk negara ini."
                    : sectorParticipants.length === 0
                      ? "Belum ada peserta terverifikasi pada sektor ini."
                      : "Tidak ada peserta yang cocok dengan pencarian."}
                </p>
              ) : (
                <ul className="space-y-2">
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
                      <div className="mt-2 grid grid-cols-1 gap-1.5 border-t border-border/60 pt-2 text-xs sm:grid-cols-3">
                        <div className="min-w-0 rounded bg-muted/40 p-1.5">
                          <span className="block text-[10px] font-medium text-muted-foreground">
                            Sektor
                          </span>
                          <span className="block truncate font-semibold">
                            {participant.sectorName}
                          </span>
                        </div>
                        <div className="min-w-0 rounded bg-muted/40 p-1.5">
                          <span className="block text-[10px] font-medium text-muted-foreground">
                            Jabatan
                          </span>
                          <span className="block truncate font-semibold">
                            {participant.occupationName}
                          </span>
                        </div>
                        <div className="min-w-0 rounded bg-muted/40 p-1.5">
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
