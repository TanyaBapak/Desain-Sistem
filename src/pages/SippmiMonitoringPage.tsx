import * as React from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  CloudDownload,
  ExternalLink,
  Eye,
  Globe,
  RefreshCw,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/store/useAppStore";
import {
  MonitoringData,
  MonitoringClassData,
  MonitoringCandidateData,
} from "@/types";
import { parseServerDate } from "@/lib/utils";

interface SippmiMonitoringPageProps {
  monitoring: MonitoringData;
}

export function getCandidateSubdomain(candidate: MonitoringCandidateData): string {
  if (candidate.subdomain) return candidate.subdomain;
  const inst = (candidate.institutionName || "").toLowerCase();
  if (inst.includes("indonusa")) return "sippmi.com";
  if (inst.includes("omega")) return "omegahotelacademy.sippmi.com";
  if (inst.includes("victoria")) return "victoriahotelschool.sippmi.com";
  if (inst.includes("duta")) return "dutainternationalcourse.sippmi.com";
  return "gardata.sippmi.com";
}

export function SippmiMonitoringPage({ monitoring }: SippmiMonitoringPageProps) {
  const { currentScope, currentUser } = useAppStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [syncQueued, setSyncQueued] = React.useState(false);
  const [syncStartedAt, setSyncStartedAt] = React.useState<string | null>(null);
  const [selectedSubdomain, setSelectedSubdomain] = React.useState<string>(monitoring.candidateSource || "all");
  const [selectedClassForDetail, setSelectedClassForDetail] = React.useState<MonitoringClassData | null>(null);
  const { summary, classes = [], candidates = [], lastSync, tenants = [] } = monitoring;
  const totalAllSubdomainCandidates = React.useMemo(
    () => tenants.reduce((acc, t) => acc + (t.candidateCount || 0), 0),
    [tenants]
  );

  React.useEffect(() => setSelectedSubdomain(monitoring.candidateSource || "all"), [monitoring.candidateSource]);

  const filteredCandidates = candidates;

  const updateCandidatePage = (page: number, perPage = monitoring.candidatePagination.perPage) => {
    router.get("/app/sippmi-monitoring", {
      candidateSource: selectedSubdomain,
      candidatePage: page,
      candidatePerPage: perPage,
      classPage: monitoring.classPagination.currentPage,
      classPerPage: monitoring.classPagination.perPage,
    }, {
      only: ["businessData"],
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  const updateCandidateSource = (source: string) => {
    setSelectedSubdomain(source);
    router.get("/app/sippmi-monitoring", {
      candidateSource: source,
      candidatePage: 1,
      candidatePerPage: monitoring.candidatePagination.perPage,
      classPage: monitoring.classPagination.currentPage,
      classPerPage: monitoring.classPagination.perPage,
    }, {
      only: ["businessData"],
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  const updateClassPage = (page: number, perPage = monitoring.classPagination.perPage) => {
    router.get("/app/sippmi-monitoring", {
      candidateSource: selectedSubdomain,
      candidatePage: monitoring.candidatePagination.currentPage,
      candidatePerPage: monitoring.candidatePagination.perPage,
      classPage: page,
      classPerPage: perPage,
    }, {
      only: ["businessData"],
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  React.useEffect(() => {
    if (!syncQueued) return;

    const syncCompleted = Boolean(
      lastSync?.startedAt
      && lastSync.startedAt !== syncStartedAt
      && lastSync.status !== "running"
    );
    if (syncCompleted) {
      setSyncQueued(false);
      if (lastSync?.status === "failed") {
        toast.error("Sinkronisasi gagal. Periksa status integrasi dan konfigurasi API.");
      } else if (lastSync?.status === "partial") {
        toast.warning("Sinkronisasi selesai sebagian. Periksa rekaman yang dilewati.");
      } else {
        toast.success("Sinkronisasi selesai. Data monitoring sudah diperbarui.");
      }
      return;
    }

    const interval = window.setInterval(() => {
      router.reload({ only: ["businessData"] });
    }, 3000);
    const timeout = window.setTimeout(() => {
      setSyncQueued(false);
      toast.warning("Sinkronisasi masih mengantre atau belum terkonfirmasi. Segarkan halaman beberapa saat lagi.");
    }, 120000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [lastSync?.startedAt, lastSync?.status, syncQueued, syncStartedAt]);

  const refresh = () => {
    setRefreshing(true);
    router.reload({
      only: ["businessData"],
      onFinish: () => setRefreshing(false),
    });
  };

  const handleSyncGardata = () => {
    setSyncStartedAt(lastSync?.startedAt ?? null);
    setSyncing(true);
    router.post(
      "/integrations/gardata/sync",
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          setSyncQueued(true);
          toast.info("Sinkronisasi dijadwalkan. Status akan diperbarui setelah proses selesai.");
        },
        onError: () => {
          toast.error(
            "Sinkronisasi Gardata gagal dimulai. Periksa konfigurasi antrean atau cache."
          );
        },
        onFinish: () => setSyncing(false),
      }
    );
  };

  const syncFailed = lastSync?.status === "failed" || lastSync?.status === "partial";

  return (
    <section className="space-y-6" aria-labelledby="monitoring-title">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 id="monitoring-title" className="text-2xl font-semibold tracking-tight text-foreground">
            Monitoring Pelatihan dan Gardata
          </h1>
          <p className="text-sm text-muted-foreground">
            Data lokal dan hasil sinkronisasi tersimpan. Lingkup: {currentScope.name}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(currentUser?.roleName === "task_force" || currentUser?.roleName === "super_admin") && (
            <Button
              onClick={handleSyncGardata}
              variant="default"
              size="sm"
              disabled={syncing || syncQueued || refreshing}
            >
              <CloudDownload className={`mr-2 h-4 w-4 ${syncing || syncQueued ? "animate-spin" : ""}`} />
              {syncing ? "Memulai sinkronisasi…" : syncQueued ? "Menunggu hasil sinkronisasi…" : "Tarik Data Gardata"}
            </Button>
          )}
          <Button onClick={refresh} variant="outline" size="sm" disabled={refreshing || syncing || syncQueued}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Memuat ulang…" : "Segarkan"}
          </Button>
        </div>
      </header>

      {syncFailed && (
        <Card role="alert" className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="flex flex-row items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
            <div>
              <CardTitle className="text-sm text-foreground">Sinkronisasi terakhir perlu diperiksa</CardTitle>
              <CardDescription>
                Status terakhir: {lastSync?.status}. Periksa log integrasi, koneksi subdomain, dan konfigurasi API; data monitoring menunjukkan rekaman yang sudah tersimpan.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* METRIK SUMMARY NASIONAL */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total kelas" value={summary.totalClasses} icon={Building2} />
        <SummaryCard label="Kelas berjalan" value={summary.activeClasses} icon={CheckCircle2} />
        <SummaryCard label="Peserta Gardata / SIPPMI" value={summary.gardataCandidates} icon={Users} />
        <SummaryCard label="Laporan terverifikasi" value={summary.verifiedReports} icon={Clock} />
      </div>

      {/* KONSOL SISTEM MULTITENANT SUBDOMAIN LPK */}
      <Card className="border-primary/20 shadow-sm overflow-hidden">
        <div className="bg-primary/5 px-6 py-4 border-b border-border/50 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                <Globe className="h-3 w-3" />
                SUMBER LPK YANG DIKONFIGURASI
              </span>
              <span className="font-mono text-xs text-muted-foreground">gardata.sippmi.com</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground mt-1">
              LPK Gardata Multitenant dan Politeknik Indonusa Surakarta
            </h2>
            <p className="text-xs text-muted-foreground">
              Data peserta dan kelas berasal dari hasil sinkronisasi Gardata dan SIPPMI yang tersimpan di aplikasi.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border bg-background/80 px-3 py-1.5 shadow-sm text-xs font-medium">
              <span className="text-muted-foreground">TENANT DIKONFIGURASI:</span>
              <span className="font-bold tabular-nums text-foreground">{tenants.length.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">LPK / sumber</TableHead>
                  <TableHead>Subdomain Operasional</TableHead>
                  <TableHead>Wilayah / Basis</TableHead>
                  <TableHead className="text-center">Peserta Terpantau</TableHead>
                  <TableHead className="text-center">Kelas</TableHead>
                  <TableHead>Sumber</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                      Belum ada tenant yang dikonfigurasi untuk sinkronisasi.
                    </TableCell>
                  </TableRow>
                ) : tenants.map((tenant) => (
                  <TableRow
                    key={tenant.id || tenant.subdomain}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {tenant.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div>{tenant.name}</div>
                          <div className="text-xs text-muted-foreground font-normal">Sumber integrasi</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <a
                        href={tenant.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {tenant.subdomain}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tenant.district
                        ? `${tenant.district}, ${tenant.province}`
                        : tenant.province || "—"}
                    </TableCell>
                    <TableCell className="text-center tabular-nums font-semibold">
                      {tenant.candidateCount.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {tenant.classCount.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {tenant.subdomain === "sippmi.com" ? "SIPPMI" : "Gardata multitenant"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant={selectedSubdomain === tenant.subdomain ? "default" : "outline"}
                          size="sm"
                          className="h-8 text-xs font-medium"
                          onClick={() => {
                            setSelectedSubdomain(tenant.subdomain);
                            document.getElementById("tabel-peserta-subdomain")?.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          <Users className="h-3.5 w-3.5 mr-1" />
                          Lihat Siswa ({tenant.candidateCount})
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          <a
                            href={tenant.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1"
                            title={`Buka subdomain ${tenant.subdomain}`}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Kelas dan batch pelatihan</CardTitle>
            <CardDescription>Gabungan kelas lokal dan riwayat pelatihan Gardata yang tersimpan.</CardDescription>
          </div>
          <Badge variant="outline">{monitoring.classPagination.total.toLocaleString("id-ID")} kelas</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode kelas</TableHead>
                  <TableHead>Program / sektor</TableHead>
                  <TableHead>Sumber</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Jam pelajaran</TableHead>
                  <TableHead>Peserta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                      Belum ada data kelas. Data Gardata akan tampil setelah sinkronisasi berhasil.
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map((trainingClass) => (
                    <TableRow key={trainingClass.id}>
                      <TableCell className="font-mono text-sm">{trainingClass.classCode}</TableCell>
                      <TableCell>{trainingClass.sector || trainingClass.name}</TableCell>
                      <TableCell>{trainingClass.source}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(trainingClass.startDate)} – {formatDate(trainingClass.endDate)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <div className="space-y-1 min-w-[130px]">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span>
                              {(trainingClass.achievedJp ?? 0).toLocaleString("id-ID")}
                              {" / "}
                              {trainingClass.targetJp.toLocaleString("id-ID")} JP
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {Math.min(
                                100,
                                Math.round(
                                  ((trainingClass.achievedJp ?? 0) / (trainingClass.targetJp || 1)) * 100
                                )
                              )}
                              %
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-300"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    Math.round(
                                      ((trainingClass.achievedJp ?? 0) / (trainingClass.targetJp || 1)) * 100
                                    )
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedClassForDetail(trainingClass)}
                          className="h-8 gap-1.5 px-2 font-semibold text-primary hover:bg-primary/10 hover:text-primary transition-colors"
                          title="Klik untuk melihat peserta kelas ini"
                        >
                          <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{trainingClass.participantCount.toLocaleString("id-ID")}</span>
                        </Button>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{trainingClass.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedClassForDetail(trainingClass)}
                          className="h-8 gap-1 text-xs"
                          title="Lihat rincian peserta kelas pelatihan ini"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Rincian</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {monitoring.classPagination.total === 0 ? 0 : (monitoring.classPagination.currentPage - 1) * monitoring.classPagination.perPage + 1}
            –{Math.min(monitoring.classPagination.currentPage * monitoring.classPagination.perPage, monitoring.classPagination.total)}
            {' dari '}{monitoring.classPagination.total.toLocaleString("id-ID")} kelas
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="monitoring-class-page-size" className="text-sm text-muted-foreground">Baris per halaman</label>
            <select
              id="monitoring-class-page-size"
              value={monitoring.classPagination.perPage}
              onChange={(event) => updateClassPage(1, Number(event.target.value))}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateClassPage(monitoring.classPagination.currentPage - 1)}
              disabled={monitoring.classPagination.currentPage <= 1}
              aria-label="Halaman kelas sebelumnya"
            >
              Sebelumnya
            </Button>
            <span className="text-sm tabular-nums text-foreground">
              Halaman {monitoring.classPagination.currentPage} dari {monitoring.classPagination.lastPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateClassPage(monitoring.classPagination.currentPage + 1)}
              disabled={monitoring.classPagination.currentPage >= monitoring.classPagination.lastPage}
              aria-label="Halaman kelas berikutnya"
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </Card>

      {/* Dialog Detail Peserta Kelas Pelatihan */}
      <Dialog
        open={Boolean(selectedClassForDetail)}
        onOpenChange={(open) => !open && setSelectedClassForDetail(null)}
      >
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl">
          <DialogHeader className="p-5 md:p-6 pb-4 border-b border-border bg-muted/20">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold tracking-wider text-primary uppercase">
                Kelas Pelatihan • {selectedClassForDetail?.source}
              </span>
              <DialogTitle className="text-lg md:text-xl font-bold text-foreground">
                {selectedClassForDetail?.name || selectedClassForDetail?.sector}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Kode Kelas: <span className="font-mono font-semibold text-foreground">{selectedClassForDetail?.classCode}</span>
                {selectedClassForDetail?.startDate && (
                  <> • Periode: {formatDate(selectedClassForDetail.startDate)} – {formatDate(selectedClassForDetail.endDate)}</>
                )}
              </DialogDescription>
            </div>

            {/* Status & Jam Pelajaran Banner */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-background border border-border">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Jam Pelajaran (Sedang Berjalan / Total JP)</span>
                <div className="flex items-center justify-between text-sm font-bold tabular-nums">
                  <span className="text-primary">
                    {(selectedClassForDetail?.achievedJp ?? 0).toLocaleString("id-ID")} / {(selectedClassForDetail?.targetJp ?? 0).toLocaleString("id-ID")} JP
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {Math.min(
                      100,
                      Math.round(
                        ((selectedClassForDetail?.achievedJp ?? 0) /
                          (selectedClassForDetail?.targetJp || 1)) *
                          100
                      )
                    )}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((selectedClassForDetail?.achievedJp ?? 0) /
                            (selectedClassForDetail?.targetJp || 1)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-1">
                <span className="text-xs text-muted-foreground">Total Peserta Terdaftar</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground tabular-nums">
                    {selectedClassForDetail?.participantCount ?? 0} Peserta
                  </span>
                  <Badge variant="secondary">{selectedClassForDetail?.status}</Badge>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Daftar Peserta di Kelas Ini ({selectedClassForDetail?.participants?.length ?? selectedClassForDetail?.participantCount ?? 0} Orang)
            </h4>

            {selectedClassForDetail?.participants && selectedClassForDetail.participants.length > 0 ? (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead>Nama Peserta</TableHead>
                      <TableHead>NIK</TableHead>
                      <TableHead>Jurusan / Keahlian</TableHead>
                      <TableHead>Capaian JP</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedClassForDetail.participants.map((p, idx) => (
                      <TableRow key={p.id || idx}>
                        <TableCell className="text-center font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-foreground">
                          {p.fullName}
                          <span className="ml-1 text-[11px] text-muted-foreground">({p.gender === 'P' ? 'P' : 'L'})</span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.nik}</TableCell>
                        <TableCell className="text-sm">{p.major || "-"}</TableCell>
                        <TableCell className="tabular-nums text-sm font-medium">
                          {p.achievedJp !== null && p.achievedJp !== undefined ? `${p.achievedJp} JP` : `${selectedClassForDetail.achievedJp ?? 0} JP`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[11px] font-normal">
                            {p.status || "ENROLLED"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground text-sm">
                Rincian individual peserta untuk kelas ini belum terhubung secara langsung, tercatat kuota/agregat {selectedClassForDetail?.participantCount} peserta pada sistem eksternal.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card id="tabel-peserta-subdomain" className="scroll-mt-6">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">Peserta LPK Gardata dan Politeknik Indonusa Surakarta</CardTitle>
              {selectedSubdomain !== "all" && (
                <Badge variant="secondary" className="text-xs font-normal border">
                  Filter: {selectedSubdomain}
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1">
              Daftar berisi data peserta yang tersimpan dari Gardata / SIPPMI. Status verifikasi yang ditampilkan adalah status internal aplikasi.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {filteredCandidates.length} ditampilkan dari {monitoring.candidatePagination.total.toLocaleString("id-ID")} peserta
            </Badge>
            {selectedSubdomain !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => updateCandidateSource("all")}
              >
                Reset Filter
              </Button>
            )}
          </div>
        </CardHeader>

        <p className="border-b border-border px-6 py-3 text-xs text-muted-foreground">
        Persetujuan di Gardata / SIPPMI tidak otomatis mengubah status verifikasi internal. Pemetaan status eksternal memerlukan kontrak field API resmi.
        </p>

        {/* Filter Bar per Subdomain */}
        <div className="px-6 pb-3 pt-1 border-b flex flex-wrap items-center gap-2 bg-muted/20">
          <span className="text-xs font-medium text-muted-foreground mr-1">Filter Subdomain:</span>
          <button
            type="button"
            onClick={() => updateCandidateSource("all")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedSubdomain === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            Semua Subdomain
            <span className="rounded-full bg-background/20 px-1.5 py-0.2 text-[10px] font-bold">
              {(selectedSubdomain === "all" ? monitoring.candidatePagination.total : totalAllSubdomainCandidates).toLocaleString("id-ID")}
            </span>
          </button>
          {tenants.map((t) => {
            const isSelected = selectedSubdomain === t.subdomain;
            return (
              <button
                key={t.subdomain}
                type="button"
                onClick={() => updateCandidateSource(isSelected ? "all" : t.subdomain)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                <Building2 className="h-3 w-3" />
                {t.name}
                <span className="rounded-full bg-background/20 px-1.5 py-0.2 text-[10px] font-bold">
                  {t.candidateCount.toLocaleString("id-ID")}
                </span>
              </button>
            );
          })}
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Peserta</TableHead>
                  <TableHead>Subdomain Asal</TableHead>
                  <TableHead>Asal LPK / Lembaga</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Wilayah</TableHead>
                  <TableHead>Keahlian</TableHead>
                  <TableHead>Negara Tujuan</TableHead>
                  <TableHead>Kesiapan</TableHead>
                  <TableHead>Verifikasi internal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-sm text-muted-foreground">
                      Tidak ada peserta ditemukan untuk filter subdomain ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCandidates.map((candidate) => {
                    const candidateSubdomain = getCandidateSubdomain(candidate);
                    return (
                      <TableRow key={candidate.id}>
                        <TableCell className="font-medium">{candidate.fullName}</TableCell>
                        <TableCell>
                          <a
                            href={`https://${candidateSubdomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-primary/10 text-primary hover:bg-primary/20 px-2 py-0.5 text-xs font-mono transition-colors"
                            title={`Buka subdomain https://${candidateSubdomain}`}
                          >
                            <Globe className="h-3 w-3" />
                            {candidateSubdomain}
                            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                          </a>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {candidate.institutionName ? (
                            <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5">
                              <Building2 className="h-3 w-3 text-primary" />
                              {candidate.institutionName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{candidate.nik}</TableCell>
                        <TableCell>{candidate.region}</TableCell>
                        <TableCell>{candidate.expertise || "—"}</TableCell>
                        <TableCell>{candidate.targetCountry}</TableCell>
                        <TableCell>
                          <Badge variant={candidate.readinessStatus === "JOB_READY" ? "default" : "outline"} className="text-[11px]">
                            {candidate.readinessStatus === "JOB_READY" ? "Siap Kerja" : "Siap Latih"}
                          </Badge>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{candidate.status}</Badge></TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {monitoring.candidatePagination.total === 0 ? 0 : (monitoring.candidatePagination.currentPage - 1) * monitoring.candidatePagination.perPage + 1}
            –{Math.min(monitoring.candidatePagination.currentPage * monitoring.candidatePagination.perPage, monitoring.candidatePagination.total)}
            {' dari '}{monitoring.candidatePagination.total.toLocaleString("id-ID")} peserta
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="monitoring-page-size" className="text-sm text-muted-foreground">Baris per halaman</label>
            <select
              id="monitoring-page-size"
              value={monitoring.candidatePagination.perPage}
              onChange={(event) => updateCandidatePage(1, Number(event.target.value))}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {[10, 25, 50, 100, 150, 250].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateCandidatePage(monitoring.candidatePagination.currentPage - 1)}
              disabled={monitoring.candidatePagination.currentPage <= 1}
              aria-label="Halaman peserta sebelumnya"
            >
              Sebelumnya
            </Button>
            <span className="text-sm tabular-nums text-foreground">
              Halaman {monitoring.candidatePagination.currentPage} dari {monitoring.candidatePagination.lastPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateCandidatePage(monitoring.candidatePagination.currentPage + 1)}
              disabled={monitoring.candidatePagination.currentPage >= monitoring.candidatePagination.lastPage}
              aria-label="Halaman peserta berikutnya"
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status sinkronisasi Gardata</CardTitle>
          <CardDescription>
            {lastSync
              ? `Status: ${lastSync.status}.`
              : "Belum ada catatan sinkronisasi Gardata."}
          </CardDescription>
        </CardHeader>
        {lastSync && (
          <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <p>Terakhir dijalankan: {formatDateTime(lastSync.finishedAt ?? lastSync.startedAt)}</p>
            {lastSync.recordsFetched === null ? (
              <p>Jumlah rekaman sinkronisasi tidak tersedia per wilayah.</p>
            ) : (
              <>
                <p>Data diterima: {lastSync.recordsFetched.toLocaleString("id-ID")}</p>
                <p>Data baru / diperbarui: {lastSync.recordsInserted?.toLocaleString("id-ID") ?? "—"} / {lastSync.recordsUpdated?.toLocaleString("id-ID") ?? "—"}</p>
                <p>Data dilewati: {lastSync.recordsSkipped?.toLocaleString("id-ID") ?? "—"}</p>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{value.toLocaleString("id-ID")}</p>
      </CardContent>
    </Card>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(parseServerDate(value));
}

function formatDateTime(value: string | null): string {
  if (!value) return "Belum tersedia";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(parseServerDate(value)) + " WIB";
}
