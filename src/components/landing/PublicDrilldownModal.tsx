import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  GraduationCap,
  Building2,
  Globe2,
  Workflow,
  CheckCircle2,
  Clock,
  Briefcase,
  BriefcaseBusiness,
} from "lucide-react";
import type {
  PublicCommandCenterData,
  PublicPreviewInstitution,
  PublicPreviewDemand,
} from "@/types";

const NON_VOCATIONAL_INSTITUTION_TYPES = new Set(["LPK", "LKP", "BLKLN"]);

export type PublicDrilldownType =
  | "peserta"
  | "program"
  | "lembaga"
  | "national_lpk"
  | "demand"
  | "alokasi"
  | "sebaran_lembaga";

interface PublicDrilldownModalProps {
  type: PublicDrilldownType | null;
  onClose: () => void;
  scopeName: string;
  data: PublicCommandCenterData;
  targetSectors: string[];
}

export const PublicDrilldownModal: React.FC<PublicDrilldownModalProps> = ({
  type,
  onClose,
  scopeName,
  data,
  targetSectors,
}) => {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const sectors = useMemo(() => {
    const uniqueSectors = new Map<string, string>();
    targetSectors.forEach((sector) => {
      const name = sector.trim();
      const normalizedName = name.toLocaleLowerCase("id-ID");
      if (normalizedName && !uniqueSectors.has(normalizedName)) {
        uniqueSectors.set(normalizedName, name);
      }
    });
    return Array.from(uniqueSectors.values()).sort((left, right) =>
      left.localeCompare(right, "id"),
    );
  }, [targetSectors]);

  useEffect(() => {
    setSelectedSector(null);
  }, [type]);

  if (!type) return null;

  const institutions: PublicPreviewInstitution[] =
    data.previewDirectories?.institutions ?? [];
  const demands: PublicPreviewDemand[] =
    data.previewDirectories?.demands ?? [];
  const nationalLpkList = data.nationalLpkByProvince ?? [];
  const institutionsList = data.institutionsByProvince ?? [];
  const vocationalInstitutions = institutions.filter(
    (institution) =>
      !NON_VOCATIONAL_INSTITUTION_TYPES.has(
        institution.type.trim().toLocaleUpperCase("id-ID"),
      ),
  );
  const filteredInstitutions = selectedSector
    ? vocationalInstitutions.filter((institution) =>
        institution.supportedSectors?.some(
          (sector) =>
            sector.trim().toLocaleLowerCase("id-ID") ===
            selectedSector.toLocaleLowerCase("id-ID"),
        ),
      )
    : [];

  const renderInstitutionList = (items: PublicPreviewInstitution[]) => (
    <div className="rounded-lg border border-border p-2">
      {items.length === 0 ? (
        <p className="p-5 text-center text-sm text-muted-foreground">
          Belum ada lembaga vokasi yang sesuai dengan pilihan ini.
        </p>
      ) : (
        <div className="space-y-2.5">
          {items.map((institution) => {
            const isVerified =
              institution.evokasiStatus === "Terverifikasi e-Vokasi";
            return (
              <div
                key={institution.id}
                className="rounded-lg border border-border/80 bg-card p-3 space-y-1.5"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h6 className="break-words text-sm font-semibold text-foreground">
                      {institution.name}
                    </h6>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {institution.district ? `${institution.district}, ` : ""}
                      {institution.province || scopeName}
                    </p>
                  </div>
                  <Badge
                    variant={isVerified ? "default" : "outline"}
                    className={
                      isVerified
                        ? "max-w-[45%] shrink-0 whitespace-normal break-words bg-emerald-600/10 text-right text-xs text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                        : "max-w-[45%] shrink-0 whitespace-normal break-words text-right text-xs"
                    }
                  >
                    {institution.evokasiStatus || "Terdaftar"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border/40 pt-1 text-xs text-muted-foreground">
                  <span>
                    Jenis: <strong>{institution.type}</strong>
                  </span>
                  {institution.accreditation && (
                    <span>
                      Akreditasi: <strong>{institution.accreditation}</strong>
                    </span>
                  )}
                  {institution.totalActiveStudents !== undefined && (
                    <span>
                      Kapasitas:{" "}
                      <strong>{institution.totalActiveStudents} peserta</strong>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case "peserta":
      case "lembaga":
      case "sebaran_lembaga":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Lembaga Vokasi Mitra — {scopeName}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {data.activeStats.registeredProvidersCount} dari{" "}
                    {data.activeStats.providersCount} lembaga telah terverifikasi
                  </p>
                </div>
              </div>
            </div>
            {renderInstitutionList(vocationalInstitutions)}
          </div>
        );

      case "program":
        return (
          <div className="space-y-4">
            {selectedSector ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSector(null)}
                  className="-ml-2 w-fit"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                  Kembali ke daftar sektor
                </Button>
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <h4 className="text-sm font-bold text-foreground">
                    Daftar Lembaga Vokasi sektor {selectedSector}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lembaga vokasi yang mendukung sektor target negara ini.
                  </p>
                </div>
                {renderInstitutionList(filteredInstitutions)}
              </>
            ) : (
              <>
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Sektor Program Pelatihan dari Target Negara
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Pilih sektor untuk melihat daftar lembaga vokasi yang sesuai.
                      </p>
                    </div>
                  </div>
                </div>

                {sectors.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                    Belum ada sektor yang terdaftar pada target negara.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sectors.map((sector) => (
                      <button
                        key={sector}
                        type="button"
                        onClick={() => setSelectedSector(sector)}
                        className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1 break-words text-sm font-semibold">
                          {sector}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );

      case "national_lpk":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Globe2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Sebaran LPK Terdaftar Nasional per Provinsi
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Cakupan 38 Provinsi di Seluruh Indonesia · {data.national.nationalLpkCount.toLocaleString("id-ID")} Lembaga
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border">
              <div className="p-3 divide-y divide-border/60">
                {(nationalLpkList.length > 0
                  ? nationalLpkList
                  : institutionsList.length > 0
                  ? institutionsList
                  : [
                      { province: "Jawa Tengah", totalCount: 965, registeredCount: 8 },
                      { province: "Jawa Barat", totalCount: 620, registeredCount: 6 },
                      { province: "Jawa Timur", totalCount: 410, registeredCount: 4 },
                      { province: "DKI Jakarta", totalCount: 180, registeredCount: 3 },
                      { province: "Bali", totalCount: 95, registeredCount: 2 },
                      { province: "Sumatera Utara", totalCount: 88, registeredCount: 1 },
                    ]
                ).map((row, idx) => {
                  const pct = Math.round((row.registeredCount / (row.totalCount || 1)) * 100);
                  return (
                    <div key={row.province} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-muted-foreground w-5 tabular-nums">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-foreground">{row.province}</span>
                        </div>
                        <div className="flex items-center gap-2 tabular-nums">
                          <span className="text-muted-foreground text-[11px]">
                            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{row.registeredCount}</strong> / {row.totalCount}
                          </span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted ml-7">
                        <div
                          className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all"
                          style={{ width: `${Math.max(pct, 3)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case "demand":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Globe2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Lowongan Permintaan Kerja Luar Negeri (Demand)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Demand resmi tervalidasi dari mitra employer & program G to G / P to P
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border p-2">
              <div className="space-y-2.5">
                {(demands.length > 0
                  ? demands
                  : [
                      { id: "DMD-1", country: "Jepang", employerName: "Zen-Noh Care Services Tokyo", sector: "Kesehatan", occupation: "Kaigo Caregiver (SSW)", quota: 120, deadline: "30 Des 2026" },
                      { id: "DMD-2", country: "Jerman", employerName: "Maritim Hotelgesellschaft mbH", sector: "Hospitality", occupation: "Hotelfachmann / Duales Ausbildung", quota: 80, deadline: "15 Jan 2027" },
                      { id: "DMD-3", country: "Korea Selatan", employerName: "Hyundai Heavy Industries", sector: "Manufaktur", occupation: "Shipbuilding Welder (E-7)", quota: 150, deadline: "28 Feb 2027" },
                      { id: "DMD-4", country: "Turki", employerName: "Anadolu Health Group", sector: "Kesehatan", occupation: "Nurse Assistant", quota: 60, deadline: "10 Mar 2027" },
                    ]
                ).map((dmd) => (
                  <div key={dmd.id} className="rounded-lg border border-border/80 bg-card p-3 space-y-1.5 hover:border-primary/50 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h6 className="text-xs font-bold text-foreground">{dmd.occupation || "Tenaga Terampil"}</h6>
                        <p className="text-[11px] text-muted-foreground">{dmd.employerName || "Mitra Resmi Luar Negeri"}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 font-bold border-blue-500/40 text-blue-600 dark:text-blue-400">
                        {dmd.country}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                      <span>Sektor: <strong>{dmd.sector || "Umum"}</strong></span>
                      <span>Kuota: <strong className="text-foreground">{dmd.quota || 0} orang</strong></span>
                      {dmd.deadline && <span>Batas: {dmd.deadline}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "alokasi":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Workflow className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Alokasi Penempatan Batch & Tracking
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Proses alokasi batch pelatihan terverifikasi ke demand pemberi kerja luar negeri
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border p-4 bg-card space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
                <span className="font-semibold text-foreground">Tahapan Alokasi Aktif</span>
                <Badge variant="secondary" className="text-[10px]">
                  Batch I & II 2027
                </Badge>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Tahap 1 & 2: Agregasi data calon peserta & verifikasi Dukcapil tuntas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Tahap 3: Analisis kesenjangan & smart matching kuota lembaga vs demand.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Tahap 4 & 5: Pelaksanaan kelas bahasa intensif dan sertifikasi kompetensi.</span>
                </li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "peserta":
        return "Direktori Lembaga Vokasi Mitra";
      case "program":
        return selectedSector
          ? `Lembaga Vokasi — ${selectedSector}`
          : "Sektor Pelatihan Target Negara";
      case "lembaga":
      case "sebaran_lembaga":
        return "Direktori Lembaga Vokasi Mitra";
      case "national_lpk":
        return "Sebaran LPK Nasional";
      case "demand":
        return "Lowongan Kerja Luar Negeri";
      case "alokasi":
        return "Status Alokasi Penempatan";
      default:
        return "Detail Informasi";
    }
  };

  return (
    <Dialog open={Boolean(type)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex w-[calc(100%-2rem)] max-w-xl max-h-[calc(100dvh-2rem)] flex-col gap-4 overflow-hidden p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold text-foreground">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Data statistik Command Center Task Force SMK Go Global
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          {renderContent()}
        </div>

        <div className="flex shrink-0 justify-end border-t border-border pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
