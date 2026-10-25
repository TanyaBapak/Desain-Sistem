import { useForm } from "@inertiajs/react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { UserManagementData } from "@/pages/user-management-types";

export function UserCreateForm({ data }: { data: UserManagementData }) {
  const form = useForm({
    name: "",
    username: "",
    email: "",
    password: "",
    role: data.roles[0]?.name ?? "",
    scopeName: "",
    provinceId: "",
    districtId: "",
    institutionId: "",
    employerId: "",
  });

  const selectedRole = data.roles.find((role) => role.name === form.data.role)?.name;
  const asksProvince = selectedRole === "province_admin" || selectedRole === "district_admin";
  const asksBp3mi = selectedRole === "task_force";
  const asksDistrict = selectedRole === "district_admin";
  const asksInstitution = selectedRole === "institution_admin" || selectedRole === "training_operator";
  const asksEmployer = selectedRole === "demand_admin";
  const visibleDistricts = data.districts.filter((district) => district.province_id === form.data.provinceId);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    form.post("/admin/users", {
      preserveScroll: true,
      onSuccess: () => form.reset(),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><UserPlus className="h-5 w-5" />Tambah Akun</CardTitle>
        <p className="text-sm text-muted-foreground">Kata sandi awal minimal 10 karakter. Peran Super Admin hanya dapat diberikan di luar halaman ini.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nama lengkap" error={form.errors.name}>
            <Input value={form.data.name} onChange={(event) => form.setData("name", event.target.value)} autoComplete="name" required />
          </Field>
          <Field label="Nama pengguna" error={form.errors.username}>
            <Input value={form.data.username} onChange={(event) => form.setData("username", event.target.value)} autoComplete="username" required />
          </Field>
          <Field label="Email" error={form.errors.email}>
            <Input type="email" value={form.data.email} onChange={(event) => form.setData("email", event.target.value)} autoComplete="email" required />
          </Field>
          <Field label="Kata sandi awal" error={form.errors.password}>
            <Input type="password" value={form.data.password} onChange={(event) => form.setData("password", event.target.value)} autoComplete="new-password" minLength={10} required />
          </Field>
          <Field label="Peran" error={form.errors.role}>
            <select className={selectClass} value={form.data.role} onChange={(event) => {
              form.setData("role", event.target.value);
            }} required>
              {data.roles.map((role) => <option key={role.name} value={role.name}>{role.title}</option>)}
            </select>
          </Field>
          {asksProvince && (
            <Field label="Provinsi" error={form.errors.provinceId}>
              <select className={selectClass} value={form.data.provinceId} onChange={(event) => { form.setData("provinceId", event.target.value); form.setData("districtId", ""); }} required>
                <option value="">Pilih provinsi</option>
                {data.provinces.map((province) => <option key={province.id} value={province.id}>{province.name}</option>)}
              </select>
            </Field>
          )}
          {asksDistrict && (
            <Field label="Kabupaten/kota" error={form.errors.districtId}>
              <select className={selectClass} value={form.data.districtId} onChange={(event) => form.setData("districtId", event.target.value)} required disabled={!form.data.provinceId}>
                <option value="">Pilih kabupaten/kota</option>
                {visibleDistricts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
              </select>
            </Field>
          )}
          {asksInstitution && (
            <Field label="Lembaga" error={form.errors.institutionId}>
              <select className={selectClass} value={form.data.institutionId} onChange={(event) => form.setData("institutionId", event.target.value)} required>
                <option value="">Pilih lembaga</option>
                {data.institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}
              </select>
            </Field>
          )}
          {asksEmployer && (
            <Field label="Pemberi kerja" error={form.errors.employerId}>
              <select className={selectClass} value={form.data.employerId} onChange={(event) => form.setData("employerId", event.target.value)} required>
                <option value="">Pilih pemberi kerja</option>
                {data.employers.map((employer) => <option key={employer.id} value={employer.id}>{employer.name}</option>)}
              </select>
            </Field>
          )}
          {selectedRole && !asksProvince && !asksBp3mi && !asksInstitution && !asksEmployer && (
            <Field label="Nama lingkup (opsional)" error={form.errors.scopeName}>
              <Input value={form.data.scopeName} onChange={(event) => form.setData("scopeName", event.target.value)} placeholder="Nasional" />
            </Field>
          )}
          <div className="flex items-end">
            <Button type="submit" disabled={form.processing || data.roles.length === 0}>
              {form.processing ? "Menyimpan…" : "Buat Akun"}
            </Button>
          </div>
          {Object.keys(form.errors).length > 0 && (
            <p role="alert" className="text-sm text-destructive sm:col-span-2 lg:col-span-3">Periksa kembali isian yang ditandai. Kata sandi awal minimal 10 karakter.</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error && <span role="alert" className="block text-xs font-normal text-destructive">{error}</span>}
    </label>
  );
}
