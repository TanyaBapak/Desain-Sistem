import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TrainingReferenceDataList } from "@/pages/TrainingReferenceDataList";
import type {
  TrainingSectorReference,
  TrainingOccupationReference,
} from "@/pages/TrainingReferenceDataList";

interface TrainingReferenceDataManagerProps {
  sectors: TrainingSectorReference[];
  occupations: TrainingOccupationReference[];
}

type SectorFormData = { id?: string; name: string; aliases: string };
type OccupationFormData = { id?: string; sectorId: string; title: string; aliases: string };

export function TrainingReferenceDataManager({
  sectors,
  occupations,
}: TrainingReferenceDataManagerProps) {
  const sectorForm = useForm<SectorFormData>({ name: "", aliases: "" });
  const occupationForm = useForm<OccupationFormData>({
    sectorId: sectors[0]?.id ?? "",
    title: "",
    aliases: "",
  });
  const editingSector = Boolean(sectorForm.data.id);
  const editingOccupation = Boolean(occupationForm.data.id);

  function submitSector(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sectorForm.transform((data) => ({
      name: data.name.trim(),
      aliases: parseAliases(data.aliases),
    }));
    const url = editingSector
      ? `/admin/training-sectors/${sectorForm.data.id}`
      : "/admin/training-sectors";
    const options = {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(editingSector ? "Sektor berhasil diperbarui." : "Sektor berhasil ditambahkan.");
        sectorForm.reset();
      },
      onError: () => toast.error("Data sektor belum valid. Periksa kembali isian."),
    };
    if (editingSector) {
      sectorForm.patch(url, options);
    } else {
      sectorForm.post(url, options);
    }
  }

  function submitOccupation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    occupationForm.transform((data) => ({
      sectorId: data.sectorId,
      title: data.title.trim(),
      aliases: parseAliases(data.aliases),
    }));
    const url = editingOccupation
      ? `/admin/training-occupations/${occupationForm.data.id}`
      : "/admin/training-occupations";
    const options = {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(editingOccupation ? "Jabatan berhasil diperbarui." : "Jabatan berhasil ditambahkan.");
        occupationForm.reset();
        occupationForm.setData("sectorId", sectors[0]?.id ?? "");
      },
      onError: () => toast.error("Data jabatan belum valid. Periksa kembali isian."),
    };
    if (editingOccupation) {
      occupationForm.patch(url, options);
    } else {
      occupationForm.post(url, options);
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="training-reference-heading">
      <header>
        <h2 id="training-reference-heading" className="text-lg font-semibold">
          Master sektor dan jabatan
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Data ini dipakai oleh formulir target dan daftar sektor pada landing. Alias membantu
          menyatukan penamaan lama dari data lembaga.
        </p>
      </header>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sektor pelatihan</CardTitle>
            <CardDescription>Tambah sektor atau ubah nama dan aliasnya.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={submitSector} className="space-y-3">
              <Field
                label="Nama sektor"
                required
                value={sectorForm.data.name}
                error={sectorForm.errors.name}
                onChange={(value) => sectorForm.setData("name", value)}
              />
              <Field
                label="Alias (pisahkan dengan koma)"
                value={sectorForm.data.aliases}
                error={sectorForm.errors.aliases}
                onChange={(value) => sectorForm.setData("aliases", value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={sectorForm.processing}>
                  {sectorForm.processing ? "Menyimpan…" : editingSector ? "Simpan perubahan" : "Tambah sektor"}
                </Button>
                {editingSector && (
                  <Button type="button" variant="outline" onClick={() => sectorForm.reset()}>
                    Batal
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jabatan per sektor</CardTitle>
            <CardDescription>Jabatan menjadi pilihan lanjutan setelah sektor dipilih.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={submitOccupation} className="space-y-3">
              <label className="block space-y-1.5 text-sm font-medium">
                <span>Sektor</span>
                <select
                  value={occupationForm.data.sectorId}
                  onChange={(event) => occupationForm.setData("sectorId", event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  {sectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>{sector.name}</option>
                  ))}
                </select>
                {occupationForm.errors.sectorId && (
                  <span role="alert" className="block text-xs text-destructive">{occupationForm.errors.sectorId}</span>
                )}
              </label>
              <Field
                label="Nama jabatan"
                required
                value={occupationForm.data.title}
                error={occupationForm.errors.title}
                onChange={(value) => occupationForm.setData("title", value)}
              />
              <Field
                label="Alias (pisahkan dengan koma)"
                value={occupationForm.data.aliases}
                error={occupationForm.errors.aliases}
                onChange={(value) => occupationForm.setData("aliases", value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={occupationForm.processing || sectors.length === 0}>
                  {occupationForm.processing ? "Menyimpan…" : editingOccupation ? "Simpan perubahan" : "Tambah jabatan"}
                </Button>
                {editingOccupation && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      occupationForm.reset();
                      occupationForm.setData("sectorId", sectors[0]?.id ?? "");
                    }}
                  >
                    Batal
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <TrainingReferenceDataList
        sectors={sectors}
        occupations={occupations}
        onEditSector={(sector) => sectorForm.setData({
          id: sector.id,
          name: sector.name,
          aliases: sector.aliases.join(", "),
        })}
        onEditOccupation={(occupation) => occupationForm.setData({
          id: occupation.id,
          sectorId: occupation.sectorId,
          title: occupation.title,
          aliases: occupation.aliases.join(", "),
        })}
      />
      <p className="text-xs text-muted-foreground">
        Data master tidak dapat dihapus agar riwayat program, target, dan matching tetap utuh.
      </p>
    </section>
  );
}

function Field({
  label,
  required = false,
  value,
  error,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} required={required} />
      {error && <span role="alert" className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}

function parseAliases(value: string): string[] {
  return Array.from(new Set(value.split(",").map((alias) => alias.trim()).filter(Boolean)));
}
