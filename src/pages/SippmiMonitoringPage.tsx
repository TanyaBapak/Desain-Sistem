"use client";

import * as React from "react";
import { useAppStore } from "@/store/useAppStore";
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
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import {
  Monitor,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { API_CONFIG } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PlacementClass {
  id: number;
  batch_name: string;
  class_code: string;
  program_id?: number;
  sector_name?: string;
  department?: string;
  start_date: string;
  end_date: string;
  training_jp: number;
  initial_pagu: number;
  is_active: boolean;
  student_count?: number;
  attendance_rate?: number;
}

interface PlacementCandidate {
  id: number;
  full_name: string;
  nik?: string;
  email?: string;
  phone?: string;
  province?: string;
  city?: string;
  expertise?: string;
  language?: string;
  target_country?: string;
  status?: string;
}

interface PlacementSummary {
  total_classes: number;
  active_classes: number;
  total_students: number;
  avg_attendance: number;
  total_pagu: number;
}

export const SippmiMonitoringPage: React.FC = () => {
  const { currentRole, currentScope } = useAppStore();
  const { toast } = useToast();

  const [classes, setClasses] = React.useState<PlacementClass[]>([]);
  const [candidates, setCandidates] = React.useState<PlacementCandidate[]>([]);
  const [summary, setSummary] = React.useState<PlacementSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [summaryRes, classesRes, candidatesRes] = await Promise.all([
          fetch(`${API_CONFIG.sippmiBase}${API_CONFIG.placement.summary}`).then((r) => r.json()).catch(() => null),
          fetch(`${API_CONFIG.sippmiBase}${API_CONFIG.placement.classes}`).then((r) => r.json()).catch(() => null),
          fetch(`${API_CONFIG.sippmiBase}${API_CONFIG.placement.candidates}`).then((r) => r.json()).catch(() => null),
        ]);

        if (!cancelled) {
          if (summaryRes && !summaryRes.error) setSummary(summaryRes);
          if (classesRes) setClasses(Array.isArray(classesRes) ? classesRes : classesRes.data || []);
          if (candidatesRes) setCandidates(Array.isArray(candidatesRes) ? candidatesRes : candidatesRes.data || []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Gagal mengambil data dari SIPPMI. Pastikan CORS di gardata.sippmi.com mengizinkan p2mi.sippmi.com.");
          toast("Koneksi SIPPMI gagal", {
            description: errorMessage(err),
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [toast]);

  const errorMessage = (err: any) => {
    if (err?.type === "invalid-json") return "Respons dari SIPPMI tidak valid (JSON).";
    return err?.message || "Terjadi kesalahan jaringan.";
  };

  const statusBadge = (active: boolean) => (
    <Badge variant={active ? "default" : "secondary"} className="text-[10px]">
      {active ? "Aktif" : "Tidak Aktif"}
    </Badge>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Monitoring SIPPMI (Tahap 4-6)</h1>
          <p className="text-sm text-muted-foreground">
            Pemantauan penetapan program & lembaga, pelaksanaan kelas, kehadiran, dan penempatan
            dari sistem LPK (SIPPMI). Lingkup:{" "}
            <span className="font-medium">{currentScope.name}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              window.location.reload();
            }}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Segarkan
          </Button>
          <Button size="sm" variant="outline" disabled>
            Export Laporan
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="p-4 pb-3 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <CardTitle className="text-sm font-bold">Koneksi SIPPMI terputus</CardTitle>
              <CardDescription className="text-xs">{error}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-sm text-slate-700 space-y-1">
              <div>Pastikan server Laravel SIPPMI berjalan:</div>
              <div className="text-xs font-mono text-slate-500 mt-1">
                cd /Users/it/Project/sippmi && php artisan serve
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Endpoint: <code className="text-red-600">GET /api/v1/placement/summary</code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard label="Total Kelas (T4)" value={summary?.total_classes ?? 0} icon={Building2} />
        <SummaryCard label="Kelas Aktif" value={summary?.active_classes ?? 0} icon={CheckCircle2} />
        <SummaryCard label="Total Peserta (T6)" value={summary?.total_students ?? 0} icon={Users} />
        <SummaryCard label="Rata-rata Kehadiran (T5)" value={summary?.avg_attendance ?? 0} suffix="%" icon={Clock} />
        <SummaryCard label="Total Pagu (T4)" value={summary?.total_pagu ?? 0} prefix="Rp" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes (T4) */}
        <Card>
          <CardHeader className="flex items-center justify-between p-4 pb-3">
            <CardTitle className="text-sm font-bold">Daftar Kelas / Batch (Tahap 4)</CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {classes.length} kelas
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Kelas</TableHead>
                    <TableHead>Program / Sektor</TableHead>
                    <TableHead className="w-20">Tanggal</TableHead>
                    <TableHead className="w-16">JP</TableHead>
                    <TableHead className="w-16">Status</TableHead>
                    <TableHead className="w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.length === 0 ? (
                    <TableRow>
                      <TableCell className="h-24 text-center text-slate-500">
                        {loading ? "Memuat data kelas dari SIPPMI..." : "Tidak ada data kelas."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    classes.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-mono text-sm">{cls.class_code}</TableCell>
                        <TableCell className="text-sm">{cls.sector_name || cls.department || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {new Date(cls.start_date).toLocaleDateString("id-ID")}
                          {" - "}
                          {new Date(cls.end_date).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell className="text-sm">{cls.training_jp}</TableCell>
                        <TableCell>{statusBadge(cls.is_active)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" className="w-full">
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Candidates / Placement (T6) */}
        <Card>
          <CardHeader className="flex items-center justify-between p-4 pb-3">
            <CardTitle className="text-sm font-bold">Peserta & Penempatan (Tahap 6)</CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {candidates.length} peserta
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead className="w-24">NIK</TableHead>
                    <TableHead className="w-32">Wilayah</TableHead>
                    <TableHead className="w-32">Keahlian</TableHead>
                    <TableHead className="w-24">Negara Tujuan</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.length === 0 ? (
                    <TableRow>
                      <TableCell className="h-24 text-center text-slate-500">
                        {loading ? "Memuat data peserta dari SIPPMI..." : "Tidak ada data peserta."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    candidates.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium text-sm">{c.full_name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{c.nik || "—"}</TableCell>
                        <TableCell className="text-sm">{`${c.city || "-"}, ${c.province || "-"}`}</TableCell>
                        <TableCell className="text-sm">{c.expertise || "—"}</TableCell>
                        <TableCell className="text-sm">{c.target_country || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={c.status === "Disetujui" ? "default" : "secondary"} className="text-[10px]">
                            {c.status || "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Info panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Panduan Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-foreground">Tahap 4 — Penetapan Program & Lembaga</div>
                  <div className="text-xs text-slate-600">Lihat batch, kuota, anggaran, dan penyelenggara dari SIPPMI.</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-foreground">Tahap 5 — Pelaksanaan & Monitoring</div>
                  <div className="text-xs text-slate-600">Pantau kehadiran, progres JP, asesmen, dan sertifikasi.</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-foreground">Tahap 6 — Job Matching & Penempatan</div>
                  <div className="text-xs text-slate-600">Seleksi employer, pemenuhan persyaratan, penempatan via sistem berwenang.</div>
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="text-xs text-slate-500">
                  Sumber data: <code className="text-blue-600">http://localhost:8000/api/v1/placement/*</code> (Laravel SIPPMI)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function SummaryCard({ label, value, icon: Icon, prefix, suffix }: { label: string; value: number; icon: React.ElementType; prefix?: string; suffix?: string }) {
  return (
    <Card>
      <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase">{label}</CardTitle>
          <div className="text-2xl font-bold">{prefix ?? ""}{value}{suffix ?? ""}</div>
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400" style={{ backgroundColor: "rgba(148,163,184,0.15)" }}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
    </Card>
  );
}
