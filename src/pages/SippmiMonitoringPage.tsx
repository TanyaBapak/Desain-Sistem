import * as React from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  CloudDownload,
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
import { MonitoringData } from "@/types";

interface SippmiMonitoringPageProps {
  monitoring: MonitoringData;
}

export function SippmiMonitoringPage({ monitoring }: SippmiMonitoringPageProps) {
  const { currentScope } = useAppStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const { summary, classes, candidates, lastSync } = monitoring;

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total kelas" value={summary.totalClasses} icon={Building2} />
        <SummaryCard label="Kelas berjalan" value={summary.activeClasses} icon={CheckCircle2} />
        <SummaryCard label="Peserta Gardata" value={summary.gardataCandidates} icon={Users} />
        <SummaryCard label="Laporan terverifikasi" value={summary.verifiedReports} icon={Clock} />
      </div>

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
            <CardTitle className="text-base">Peserta dari Gardata</CardTitle>
            <CardDescription>NIK ditampilkan dalam bentuk tersamarkan. Daftar dibatasi hingga 100 peserta terbaru.</CardDescription>
          </div>
          <Badge variant="outline">{candidates.length} ditampilkan</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Wilayah</TableHead>
                  <TableHead>Keahlian</TableHead>
                  <TableHead>Negara tujuan</TableHead>
                  <TableHead>Verifikasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-24 text-center text-sm text-muted-foreground">
                      Belum ada peserta Gardata yang dapat ditampilkan.
                    </TableCell>
                  </TableRow>
                ) : candidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium">{candidate.fullName}</TableCell>
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
