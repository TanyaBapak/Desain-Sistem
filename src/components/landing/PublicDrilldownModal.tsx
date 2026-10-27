import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  GraduationCap,
  Building2,
  Globe2,
  Workflow,
  MapPin,
  CheckCircle2,
  Clock,
  Briefcase,
} from "lucide-react";
import type {
  PublicCommandCenterData,
  PublicPreviewInstitution,
  PublicPreviewProgram,
  PublicPreviewDemand,
} from "@/types";

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
}

export const PublicDrilldownModal: React.FC<PublicDrilldownModalProps> = ({
  type,
  onClose,
  scopeName,
  data,
}) => {
  if (!type) return null;

  const institutions: PublicPreviewInstitution[] =
    data.previewDirectories?.institutions ?? [];
  const programs: PublicPreviewProgram[] =
    data.previewDirectories?.programs ?? [];
  const demands: PublicPreviewDemand[] =
    data.previewDirectories?.demands ?? [];
  const educationBreakdown =
    data.previewDirectories?.candidateEducation ?? [];

  const nationalLpkList = data.nationalLpkByProvince ?? [];
  const institutionsList = data.institutionsByProvince ?? [];

  const renderContent = () => {
    switch (type) {
      case "peserta":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Distribusi Calon Peserta — {scopeName}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Total {data.activeStats.candidatesCount.toLocaleString("id-ID")} peserta terdata siap latih dan penempatan
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Distribusi Tingkat Pendidikan
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(educationBreakdown.length > 0
                  ? educationBreakdown
                  : [
                      { label: "SMK / Vokasi", count: Math.round(data.activeStats.candidatesCount * 0.65) },
                      { label: "Diploma / D3", count: Math.round(data.activeStats.candidatesCount * 0.18) },
                      { label: "SMA / Sederajat", count: Math.round(data.activeStats.candidatesCount * 0.12) },
                      { label: "Sarjana / S1", count: Math.round(data.activeStats.candidatesCount * 0.05) },
                    ]
                ).map((item) => (
                  <div key={item.label} className="rounded-lg border border-border p-3 bg-card">
                    <span className="text-[11px] text-muted-foreground block truncate">{item.label}</span>
                    <span className="text-lg font-bold tabular-nums text-foreground">
                      {item.count.toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Sebaran Pencari Kerja per Wilayah
              </h5>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {data.byProvince.slice(0, 8).map((p) => {
                  const maxCandidates = Math.max(1, ...data.byProvince.map((i) => i.candidatesCount));
                  const pct = Math.round((p.candidatesCount / maxCandidates) * 100);
                  return (
                    <div key={p.province} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{p.province}</span>
                        <span className="tabular-nums text-muted-foreground font-semibold">
                          {p.candidatesCount.toLocaleString("id-ID")} orang
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case "program":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Katalog Program Pelatihan Vokasi
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {data.activeStats.programsCount.toLocaleString("id-ID")} program kurikulum pelatihan berstandar internasional
                  </p>
                </div>
              </div>
            </div>

            <ScrollArea className="h-72 rounded-lg border border-border p-2">
              <div className="space-y-2.5">
                {(programs.length > 0
                  ? programs
                  : [
                      { id: "PRG-1", name: "Pelatihan Terpadu SSW Kaigo Caregiver Jepang", sector: "Kesehatan", programType: "Teknis Terpadu", totalHours: 160, quota: 50 },
                      { id: "PRG-2", name: "Intensif Bahasa Jerman B1 Duales Ausbildung", sector: "Hospitality", programType: "Pelatihan Bahasa", totalHours: 240, quota: 40 },
                      { id: "PRG-3", name: "Welder FCAW 6G Standar Galangan Kapal Korea", sector: "Manufaktur", programType: "Upskilling", totalHours: 200, quota: 35 },
                      { id: "PRG-4", name: "Mekatronika & Otomasi Industri Jepang", sector: "Manufaktur", programType: "Reskilling", totalHours: 180, quota: 45 },
                    ]
                ).map((prog) => (
                  <div key={prog.id} className="rounded-lg border border-border/80 bg-card p-3 space-y-1.5 hover:border-primary/50 transition">
                    <div className="flex items-start justify-between gap-2">
                      <h6 className="text-xs font-bold text-foreground">{prog.name}</h6>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {prog.sector || "Umum"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {prog.totalHours || 120} JP
                      </span>
                      <span>Kuota: <strong>{prog.quota || 50}</strong></span>
                      {prog.programType && (
                        <span className="text-primary font-medium">{prog.programType}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        );

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
                    Lembaga Vokasi Mitra Penyelenggara — {scopeName}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {data.activeStats.registeredProvidersCount} dari {data.activeStats.providersCount} lembaga telah Terverifikasi e-Vokasi
                  </p>
                </div>
              </div>
            </div>

            <ScrollArea className="h-72 rounded-lg border border-border p-2">
              <div className="space-y-2.5">
                {(institutions.length > 0
                  ? institutions
                  : [
                      { id: "LMB-1", name: "LPK Global Mandiri Semarang", type: "LPK", province: "Jawa Tengah", district: "Kota Semarang", accreditation: "A", evokasiStatus: "Terverifikasi e-Vokasi", totalActiveStudents: 120 },
                      { id: "LMB-2", name: "SMKN 7 Semarang (Stemba)", type: "SMK", province: "Jawa Tengah", district: "Kota Semarang", accreditation: "Unggul", evokasiStatus: "Terverifikasi e-Vokasi", totalActiveStudents: 450 },
                      { id: "LMB-3", name: "LPK Kaigo Sejahtera Solo", type: "LPK", province: "Jawa Tengah", district: "Kota Surakarta", accreditation: "A", evokasiStatus: "Terverifikasi e-Vokasi", totalActiveStudents: 85 },
                      { id: "LMB-4", name: "BBPVP Bandung Kampus II", type: "BLK", province: "Jawa Barat", district: "Kota Bandung", accreditation: "A", evokasiStatus: "Terverifikasi e-Vokasi", totalActiveStudents: 310 },
                    ]
                ).map((inst) => {
                  const isVerified = inst.evokasiStatus === "Terverifikasi e-Vokasi";
                  return (
                    <div key={inst.id} className="rounded-lg border border-border/80 bg-card p-3 space-y-1.5 hover:border-primary/50 transition">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h6 className="text-xs font-bold text-foreground">{inst.name}</h6>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span>{inst.district ? `${inst.district}, ` : ""}{inst.province || scopeName}</span>
                          </div>
                        </div>
                        <Badge
                          variant={isVerified ? "default" : "outline"}
                          className={isVerified ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px]" : "text-[10px]"}
                        >
                          {inst.evokasiStatus || "Terdaftar"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                        <span>Tipe: <strong>{inst.type}</strong></span>
                        <span>Akreditasi: <strong>{inst.accreditation || "A"}</strong></span>
                        {inst.totalActiveStudents !== undefined && (
                          <span>Kapasitas: <strong>{inst.totalActiveStudents} siswa</strong></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
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

            <ScrollArea className="h-72 rounded-lg border border-border">
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
            </ScrollArea>
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

            <ScrollArea className="h-72 rounded-lg border border-border p-2">
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
            </ScrollArea>
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
        return "Rincian Calon Peserta";
      case "program":
        return "Katalog Program Pelatihan";
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
      <DialogContent className="max-w-xl max-h-[85vh] p-6 gap-4">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold text-foreground">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Data statistik Command Center Task Force SMK Go Global
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        <div className="flex justify-end pt-2 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
