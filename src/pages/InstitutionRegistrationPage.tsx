import { FormEvent, useMemo, useState } from "react";
import { router, useForm } from "@inertiajs/react";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InstitutionRegistrationPageProps {
  provinces: { id: string; name: string }[];
  districts: { id: string; province_id: string; name: string }[];
  sectors: { id: string; name: string }[];
  countries: { id: string; name: string }[];
}

export function InstitutionRegistrationPage({
  provinces,
  districts,
  sectors,
  countries,
}: InstitutionRegistrationPageProps) {
  const [provinceId, setProvinceId] = useState(provinces[0]?.id ?? "");
  const availableDistricts = useMemo(
    () => (districts ?? []).filter((district) => district.province_id === provinceId),
    [districts, provinceId],
  );
  const { data, setData, post, processing, errors } = useForm({
    institutionName: "",
    institutionType: "LPK",
    ownershipType: "Swasta",
    registrationSource: "umum",
    registrationSourceId: "",
    registrationNumber: "",
    provinceId: provinces[0]?.id ?? "",
    districtId: "",
    address: "",
    headName: "",
    contactEmail: "",
    contactPhone: "",
    accreditation: "",
    evokasiUrl: "",
    procurementCatalogUrl: "",
    mouDriveUrl: "",
    instructorCount: "0",
    classCount: "0",
    readyParticipantCount: "0",
    supportedSectors: [] as string[],
    supportedCountries: [] as string[],
    procurementMethod: "",
    password: "",
    password_confirmation: "",
    consent: false,
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    post("/lembaga/daftar");
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button type="button" variant="ghost" onClick={() => router.visit("/login")}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Kembali ke halaman masuk
        </Button>

        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Pendaftaran Lembaga Vokasi</h1>
              <p className="text-sm text-muted-foreground">Daftarkan identitas lembaga dan ajukan verifikasi.</p>
            </div>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Isi identitas lembaga dan informasi kesiapan. Akun akan aktif setelah data pendaftaran
            diperiksa oleh verifikator.
          </p>
        </header>

        <form onSubmit={submit} className="space-y-6">
          {/* Kanal Asal / Sumber Pendaftaran */}
          <section className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold">Kanal Asal / Sumber Pendaftaran</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pilih jalur pendaftaran lembaga (SISKOP2MI, Disnaker, atau pendaftaran umum/mandiri).
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label
                className={`flex flex-col justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                  data.registrationSource === "siskop2mi"
                    ? "border-blue-600 bg-blue-500/10 ring-2 ring-blue-500/20"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-foreground">SISKOP2MI</span>
                    <input
                      type="radio"
                      name="registrationSource"
                      value="siskop2mi"
                      checked={data.registrationSource === "siskop2mi"}
                      onChange={(e) => setData("registrationSource", e.target.value)}
                      className="text-primary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sinkronisasi data sistem penempatan BP2MI / SISKOP2MI
                  </p>
                </div>
              </label>

              <label
                className={`flex flex-col justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                  data.registrationSource === "disnaker"
                    ? "border-indigo-600 bg-indigo-500/10 ring-2 ring-indigo-500/20"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-foreground">Disnaker</span>
                    <input
                      type="radio"
                      name="registrationSource"
                      value="disnaker"
                      checked={data.registrationSource === "disnaker"}
                      onChange={(e) => setData("registrationSource", e.target.value)}
                      className="text-primary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Rekomendasi / inputan Disnaker Provinsi atau Kab/Kota
                  </p>
                </div>
              </label>

              <label
                className={`flex flex-col justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                  data.registrationSource === "umum"
                    ? "border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-500/20"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-foreground">Umum / Lembaga</span>
                    <input
                      type="radio"
                      name="registrationSource"
                      value="umum"
                      checked={data.registrationSource === "umum"}
                      onChange={(e) => setData("registrationSource", e.target.value)}
                      className="text-primary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pendaftaran mandiri SMK, LPK, atau Balai Pelatihan Vokasi
                  </p>
                </div>
              </label>
            </div>

            <div className="pt-1">
              <Field
                label={
                  data.registrationSource === "siskop2mi"
                    ? "ID Lembaga di SISKOP2MI"
                    : data.registrationSource === "disnaker"
                    ? "Nomor Rekomendasi / Registrasi Disnaker"
                    : "NPSN / Nomor Izin Operasional Lembaga"
                }
              >
                <Input
                  value={data.registrationSourceId}
                  onChange={(e) => setData("registrationSourceId", e.target.value)}
                  placeholder={
                    data.registrationSource === "siskop2mi"
                      ? "Contoh: SISKO-LPK-2026-00123"
                      : data.registrationSource === "disnaker"
                      ? "Contoh: 560/DISNAKER-VOK/2026"
                      : "Contoh: NPSN 20101234 atau Izin LPK Mandiri"
                  }
                />
              </Field>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold">Identitas lembaga</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama resmi lembaga" error={errors.institutionName}>
                <Input required value={data.institutionName} onChange={(event) => setData("institutionName", event.target.value)} />
              </Field>
              <Field label="NPSN / nomor izin lembaga" error={errors.registrationNumber}>
                <Input required value={data.registrationNumber} onChange={(event) => setData("registrationNumber", event.target.value)} />
              </Field>
              <Field label="Bentuk lembaga" error={errors.institutionType}>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={data.institutionType} onChange={(event) => setData("institutionType", event.target.value)}>
                  <option value="SMK">SMK</option>
                  <option value="BLK">BLK / Balai Pelatihan</option>
                  <option value="LPK">LPK</option>
                  <option value="LKP">LKP</option>
                  <option value="Perguruan Tinggi / Politeknik">Perguruan Tinggi / Politeknik</option>
                </select>
              </Field>
              <Field label="Kepemilikan" error={errors.ownershipType}>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={data.ownershipType} onChange={(event) => setData("ownershipType", event.target.value)}>
                  <option value="Negeri">Negeri</option>
                  <option value="Swasta">Swasta</option>
                </select>
              </Field>
              <Field label="Provinsi" error={errors.provinceId}>
                <select
                  required
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={provinceId}
                  onChange={(event) => {
                    setProvinceId(event.target.value);
                    setData("provinceId", event.target.value);
                    setData("districtId", "");
                  }}
                >
                  <option value="">Pilih provinsi</option>
                  {provinces.map((province) => <option key={province.id} value={province.id}>{province.name}</option>)}
                </select>
              </Field>
              <Field label="Kabupaten / kota" error={errors.districtId}>
                <select required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={data.districtId} onChange={(event) => setData("districtId", event.target.value)}>
                  <option value="">Pilih kabupaten/kota</option>
                  {availableDistricts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
                </select>
              </Field>
              <Field label="Alamat lengkap" error={errors.address} className="sm:col-span-2">
                <textarea required rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={data.address} onChange={(event) => setData("address", event.target.value)} />
              </Field>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold">Kontak dan kesiapan</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama pimpinan / penanggung jawab" error={errors.headName}>
                <Input required value={data.headName} onChange={(event) => setData("headName", event.target.value)} />
              </Field>
              <Field label="Email akun dan kontak" error={errors.contactEmail}>
                <Input required type="email" autoComplete="email" value={data.contactEmail} onChange={(event) => setData("contactEmail", event.target.value)} />
              </Field>
              <Field label="Nomor telepon lembaga" error={errors.contactPhone}>
                <Input required type="tel" value={data.contactPhone} onChange={(event) => setData("contactPhone", event.target.value)} />
              </Field>
              <Field label="Akreditasi (jika ada)" error={errors.accreditation}>
                <Input value={data.accreditation} onChange={(event) => setData("accreditation", event.target.value)} placeholder="Contoh: A, B, Unggul" />
              </Field>
              <Field label="Tautan profil e-Vokasi" error={errors.evokasiUrl}>
                <Input
                  type="url"
                  inputMode="url"
                  placeholder="https://..."
                  value={data.evokasiUrl}
                  onChange={(event) => setData("evokasiUrl", event.target.value)}
                />
              </Field>
              <Field label="Tautan katalog INAPROC" error={errors.procurementCatalogUrl}>
                <Input
                  type="url"
                  inputMode="url"
                  placeholder="https://katalog.inaproc.id/..."
                  value={data.procurementCatalogUrl}
                  onChange={(event) => setData("procurementCatalogUrl", event.target.value)}
                />
              </Field>
              <Field label="Tautan Google Drive MoU" error={errors.mouDriveUrl}>
                <Input
                  type="url"
                  inputMode="url"
                  placeholder="https://drive.google.com/..."
                  value={data.mouDriveUrl}
                  onChange={(event) => setData("mouDriveUrl", event.target.value)}
                />
              </Field>
              <Field label="Skema penyelenggaraan" error={errors.procurementMethod}>
                <select
                  required
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={data.procurementMethod}
                  onChange={(event) => setData("procurementMethod", event.target.value)}
                >
                  <option value="">Pilih skema penyelenggaraan</option>
                  <option value="Swakelola Tipe 2">Swakelola Tipe 2</option>
                  <option value="Swakelola Tipe 3">Swakelola Tipe 3</option>
                  <option value="E-purchasing">E-purchasing</option>
                </select>
              </Field>
              <Field label="Jumlah instruktur" error={errors.instructorCount}>
                <Input required type="number" min="0" value={data.instructorCount} onChange={(event) => setData("instructorCount", event.target.value)} />
              </Field>
              <Field label="Jumlah kelas" error={errors.classCount}>
                <Input required type="number" min="0" value={data.classCount} onChange={(event) => setData("classCount", event.target.value)} />
              </Field>
              <Field label="Jumlah peserta yang siap mengikuti pelatihan" error={errors.readyParticipantCount}>
                <Input required type="number" min="0" value={data.readyParticipantCount} onChange={(event) => setData("readyParticipantCount", event.target.value)} />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  Sektor pelatihan yang didukung <span className="text-destructive">*</span>
                </legend>
                <p className="text-xs text-muted-foreground">Pilih satu atau lebih sektor.</p>
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-input p-3">
                  {sectors.map((sector) => (
                    <label key={sector.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={data.supportedSectors.includes(sector.name)}
                        onChange={(event) =>
                          setData(
                            "supportedSectors",
                            toggleSelection(data.supportedSectors, sector.name, event.target.checked),
                          )
                        }
                        className="h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      {sector.name}
                    </label>
                  ))}
                </div>
                {errors.supportedSectors && (
                  <p role="alert" className="text-sm text-destructive">{errors.supportedSectors}</p>
                )}
              </fieldset>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Negara target</legend>
                <p className="text-xs text-muted-foreground">Pilih negara target program lembaga.</p>
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-input p-3">
                  {countries.map((country) => (
                    <label key={country.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={data.supportedCountries.includes(country.id)}
                        onChange={(event) =>
                          setData(
                            "supportedCountries",
                            toggleSelection(data.supportedCountries, country.id, event.target.checked),
                          )
                        }
                        className="h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      {country.name}
                    </label>
                  ))}
                </div>
                {errors.supportedCountries && (
                  <p role="alert" className="text-sm text-destructive">{errors.supportedCountries}</p>
                )}
              </fieldset>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold">Buat akun pengelola lembaga</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kata sandi (minimal 10 karakter)" error={errors.password}>
                <Input required type="password" autoComplete="new-password" value={data.password} onChange={(event) => setData("password", event.target.value)} />
              </Field>
              <Field label="Ulangi kata sandi" error={errors.password_confirmation}>
                <Input required type="password" autoComplete="new-password" value={data.password_confirmation} onChange={(event) => setData("password_confirmation", event.target.value)} />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">
              Akun hanya dapat digunakan setelah pengajuan disetujui.
            </p>
            <label className="flex items-start gap-3 text-sm text-foreground">
              <input
                required
                type="checkbox"
                checked={data.consent}
                onChange={(event) => setData("consent", event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span>
                Saya berwenang mewakili lembaga dan menyetujui pemrosesan data pendaftaran
                untuk keperluan verifikasi lembaga vokasi.
              </span>
            </label>
            {errors.consent && <p role="alert" className="text-sm text-destructive">{errors.consent}</p>}
          </section>

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => router.visit("/login")}>Batal</Button>
            <Button type="submit" disabled={processing}>
              {processing ? "Mengirim pendaftaran…" : "Kirim pendaftaran"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

function toggleSelection(values: string[], value: string, checked: boolean): string[] {
  return checked ? [...new Set([...values, value])] : values.filter((item) => item !== value);
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="block">
        {label}
        <div className="mt-1.5 font-normal">{children}</div>
      </Label>
      {error && <p role="alert" className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
