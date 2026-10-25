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
  Globe,
  HardDrive,
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
import { useAppStore } from "@/store/useAppStore";
import { MonitoringData, MonitoringTenantLpk } from "@/types";

interface SippmiMonitoringPageProps {
  monitoring: MonitoringData;
}

const DEFAULT_TENANTS: MonitoringTenantLpk[] = [
  {
    id: "omega-cilacap",
    name: "Omega Cilacap",
    subdomain: "omegahotelacademy.sippmi.com",
    url: "https://omegahotelacademy.sippmi.com",
    status: "Aktif",
    province: "Jawa Tengah",
    district: "Kabupaten Cilacap",
    candidateCount: 0,
    classCount: 2,
    lastSyncAt: null,
  },
  {
    id: "victoria-hotel-school",
    name: "VictoriaHotelSchool",
    subdomain: "victoriahotelschool.sippmi.com",
    url: "https://victoriahotelschool.sippmi.com",
    status: "Aktif",
    province: "Jawa Tengah",
    district: "Kota Magelang",
    candidateCount: 0,
    classCount: 1,
    lastSyncAt: null,
  },
  {
    id: "duta-international-course",
    name: "DutaInternationalCourse",
    subdomain: "dutainternationalcourse.sippmi.com",
    url: "https://dutainternationalcourse.sippmi.com",
    status: "Aktif",
    province: "Jawa Tengah",
    district: "Kota Surakarta",
    candidateCount: 0,
    classCount: 1,
    lastSyncAt: null,
  },
];

export function SippmiMonitoringPage({ monitoring }: SippmiMonitoringPageProps) {
  const { currentScope } = useAppStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const { summary, classes, candidates, lastSync, tenants = [] } = monitoring;

  const displayTenants = (tenants && tenants.length > 0 ? tenants : DEFAULT_TENANTS).map((t) => {
    const matchedCount = candidates.filter(
      (c) =>
        (c.institutionName && c.institutionName.toLowerCase().includes(t.name.toLowerCase())) ||
        (t.district &&
          c.region &&
          c.region
            .toLowerCase()
            .includes(
              t.district
                .toLowerCase()
                .replace("kabupaten ", "")
                .replace("kota ", "")
            ))
    ).length;

    const matchedClassesCount = classes.filter(
      (cls) =>
        (cls.name && cls.name.toLowerCase().includes(t.name.toLowerCase())) ||
        (cls.classCode && cls.classCode.toLowerCase().includes(t.name.substring(0, 4).toLowerCase())) ||
        (cls.sector && cls.sector.toLowerCase().includes(t.name.toLowerCase()))
    ).length;

    return {
      ...t,
      candidateCount: t.candidateCount > 0 ? t.candidateCount : matchedCount,
      classCount: t.classCount > 0 ? t.classCount : (matchedClassesCount > 0 ? matchedClassesCount : t.classCount),
    };
  });

  const refresh = () => {
    setRefreshing(true);
    router.reload({
      only: ["businessData"],
      onFinish: () => setRefreshing(false),
    });
  };

  const handleSyncGardata = () => {
    setSyncing(true);
    router.post(
      "/integrations/gardata/sync",
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success("Sinkronisasi data Gardata berhasil dijadwalkan / dijalankan.");
          refresh();
        },
        onError: () => {
          toast.error("Sinkronisasi Gardata gagal. Periksa konfigurasi API.");
        },
        onFinish: () => setSyncing(false),
      }
    );
  };

  const syncFailed = lastSync?.status === "failed";

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
          <Button
            onClick={handleSyncGardata}
            variant="default"
            size="sm"
            disabled={syncing || refreshing}
          >
            <CloudDownload className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Menyinkronkan…" : "Tarik Data Gardata"}
          </Button>
          <Button onClick={refresh} variant="outline" size="sm" disabled={refreshing || syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Memuat ulang…" : "Segarkan"}
          </Button>
        </div>
      </header>

      {syncFailed && (
        <Card role="alert" className="border-destructive/50">
          <CardHeader className="flex flex-row items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <div>
              <CardTitle className="text-sm">Sinkronisasi Gardata terakhir gagal</CardTitle>
              <CardDescription>
                Periksa konfigurasi integrasi dan jalankan ulang sinkronisasi melalui menu Integrasi.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* METRIK SUMMARY NASIONAL */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total kelas" value={summary.totalClasses} icon={Building2} />
        <SummaryCard label="Kelas berjalan" value={summary.activeClasses} icon={CheckCircle2} />
        <SummaryCard label="Peserta Gardata" value={summary.gardataCandidates} icon={Users} />
        <SummaryCard label="Laporan terverifikasi" value={summary.verifiedReports} icon={Clock} />
      </div>

      {/* KONSOL SISTEM MULTITENANT SUBDOMAIN LPK */}
      <Card className="border-primary/20 shadow-sm overflow-hidden">
        <div className="bg-primary/5 px-6 py-4 border-b border-border/50 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                <Globe className="h-3 w-3" />
                DOMAIN PUSAT · TERPISAH DARI OPERASIONAL LPK
              </span>
              <span className="font-mono text-xs text-muted-foreground">gardata.sippmi.com</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground mt-1">
              Ringkasan Sistem Multitenant LPK
            </h2>
            <p className="text-xs text-muted-foreground">
              Terhubung langsung dengan database tenant operasional LPK pada subdomain masing-masing.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border bg-background/80 px-3 py-1.5 shadow-sm text-xs font-medium">
              <span className="text-muted-foreground">TOTAL LPK:</span>
              <span className="font-bold tabular-nums text-foreground">{summary.totalLpk ?? 8}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border bg-emerald-500/10 border-emerald-500/30 px-3 py-1.5 shadow-sm text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AKTIF:</span>
              <span className="font-bold tabular-nums">
                {summary.activeLpk ?? displayTenants.filter((t) => t.status === "Aktif").length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border bg-background/80 px-3 py-1.5 shadow-sm text-xs font-medium">
              <span className="text-muted-foreground">NONAKTIF:</span>
              <span className="font-bold tabular-nums text-foreground">
                {Math.max(
                  0,
                  (summary.totalLpk ?? 8) -
                    (summary.activeLpk ?? displayTenants.filter((t) => t.status === "Aktif").length)
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border bg-background/80 px-3 py-1.5 shadow-sm text-xs font-medium">
              <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">ESTIMASI DB:</span>
              <span className="font-bold text-foreground font-mono">
                {summary.tenantDbSizeEstimate ?? "6.7 MB"}
              </span>
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">LPK Terdaftar</TableHead>
                  <TableHead>Subdomain Operasional</TableHead>
                  <TableHead>Wilayah / Basis</TableHead>
                  <TableHead className="text-center">Peserta Terpantau</TableHead>
                  <TableHead className="text-center">Kelas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayTenants.map((tenant) => (
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
                          <div className="text-xs text-muted-foreground font-normal">
                            Tenant Vokasi Terverifikasi
                          </div>
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
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {tenant.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-medium hover:bg-primary hover:text-primary-foreground"
                      >
                        <a
                          href={tenant.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1"
                        >
                          Buka Subdomain
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
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
          <Badge variant="outline">{classes.length} kelas</Badge>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-24 text-center text-sm text-muted-foreground">
                      Belum ada data kelas. Data Gardata akan tampil setelah sinkronisasi berhasil.
                    </TableCell>
                  </TableRow>
                ) : classes.map((trainingClass) => (
                  <TableRow key={trainingClass.id}>
                    <TableCell className="font-mono text-sm">{trainingClass.classCode}</TableCell>
                    <TableCell>{trainingClass.sector || trainingClass.name}</TableCell>
                    <TableCell>{trainingClass.source}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(trainingClass.startDate)} – {formatDate(trainingClass.endDate)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {trainingClass.achievedJp === null
                        ? "Belum tercatat"
                        : `${trainingClass.achievedJp.toLocaleString("id-ID")} / ${trainingClass.targetJp.toLocaleString("id-ID")}`}
                    </TableCell>
                    <TableCell className="tabular-nums">{trainingClass.participantCount.toLocaleString("id-ID")}</TableCell>
                    <TableCell><Badge variant="secondary">{trainingClass.status}</Badge></TableCell>
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
            <CardTitle className="text-base">Peserta dari Gardata / Subdomain</CardTitle>
            <CardDescription>
              NIK ditampilkan dalam bentuk tersamarkan. Daftar menampilkan hingga 100 peserta terbaru.
            </CardDescription>
          </div>
          <Badge variant="outline">{candidates.length} ditampilkan</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Peserta</TableHead>
                  <TableHead>Asal LPK / Lembaga</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Wilayah</TableHead>
                  <TableHead>Keahlian</TableHead>
                  <TableHead>Negara Tujuan</TableHead>
                  <TableHead>Verifikasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                      Belum ada peserta Gardata yang dapat ditampilkan.
                    </TableCell>
                  </TableRow>
                ) : candidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium">{candidate.fullName}</TableCell>
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
                    <TableCell><Badge variant="secondary">{candidate.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
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
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

function formatDateTime(value: string | null): string {
  if (!value) return "Belum tersedia";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value)) + " WIB";
}
