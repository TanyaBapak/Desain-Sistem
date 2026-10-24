import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const stages = [
  { title: "Pengumpulan Data", subtitle: "Disnaker · BP3MI · LPK · Demand" },
  { title: "Validasi & Standardisasi", subtitle: "Deduplikasi · Verifikasi lembaga · Klasifikasi sektor" },
  { title: "Analisis Gap & Matching", subtitle: "Demand vs Supply · Kompetensi · Kapasitas" },
  { title: "Penetapan Program & Lembaga", subtitle: "Kuota · Wilayah · Penyelenggara · Peserta · Anggaran" },
  { title: "Pelaksanaan & Monitoring", subtitle: "Kelas · Kehadiran · JP · Asesmen · Sertifikasi" },
  { title: "Job Matching & Penempatan", subtitle: "Seleksi employer · Persyaratan · Penempatan" },
];

export function ProcessStages() {
  return (
    <section aria-labelledby="process-stages-title" className="space-y-3">
      <div>
        <h2 id="process-stages-title" className="text-lg font-semibold text-foreground">Alur program</h2>
        <p className="text-sm text-muted-foreground">Enam tahap utama program SMK Go Global.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stages.map(({ title, subtitle }, index) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-start gap-3 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold tabular-nums text-primary">
                {index + 1}
              </span>
              <div>
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                <CardDescription className="mt-1 text-xs">{subtitle}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
