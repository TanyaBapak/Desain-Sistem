import { useForm, router } from "@inertiajs/react";
import { ArrowLeftRight, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ManagedUser {
  id: string;
  name: string;
  username: string;
  email: string;
  status: string;
  scopeName: string;
  roleName: string;
  roleTitle: string;
}

interface UserManagementData {
  data: ManagedUser[];
  currentPage: number;
  lastPage: number;
  total: number;
  roles: { name: string; title: string }[];
  provinces: { id: string; name: string }[];
  districts: { id: string; province_id: string; name: string }[];
  institutions: { id: string; name: string }[];
  employers: { id: string; name: string }[];
}

interface UserManagementPageProps {
  adminUsers?: UserManagementData;
  currentUserId: string;
}

export function UserManagementPage({ adminUsers, currentUserId }: UserManagementPageProps) {
  if (!adminUsers) {
    return <p role="alert" className="text-sm text-destructive">Data pengguna tidak dapat dimuat. Muat ulang halaman atau hubungi administrator.</p>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Pengelola Pengguna</h1>
        <p className="mt-1 text-sm text-muted-foreground">Buat akun, atur status akses, dan uji tampilan melalui sesi pengguna.</p>
      </header>
      <CreateUserForm data={adminUsers} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Daftar Akun</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{adminUsers.total} akun terdaftar</p>
          </div>
        </CardHeader>
        <CardContent>
          {adminUsers.data.length === 0 ? (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">Belum ada akun untuk ditampilkan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="border-b text-muted-foreground">
                  <tr>
                    <th className="p-3 font-medium">Pengguna</th>
                    <th className="p-3 font-medium">Peran</th>
                    <th className="p-3 font-medium">Lingkup</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {adminUsers.data.map((user) => (
                    <ManagedUserRow key={user.id} user={user} currentUserId={currentUserId} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Halaman {adminUsers.currentPage} dari {adminUsers.lastPage}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={adminUsers.currentPage <= 1}
                onClick={() => router.get("/app/rbac", { page: adminUsers.currentPage - 1 }, { preserveScroll: true })}
                aria-label="Halaman sebelumnya"
              ><ChevronLeft className="h-4 w-4" /></Button>
              <Button
                variant="outline"
                size="sm"
                disabled={adminUsers.currentPage >= adminUsers.lastPage}
                onClick={() => router.get("/app/rbac", { page: adminUsers.currentPage + 1 }, { preserveScroll: true })}
                aria-label="Halaman berikutnya"
              ><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateUserForm({ data }: { data: UserManagementData }) {
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
        <p className="text-sm text-muted-foreground">Kata sandi awal minimal 12 karakter. Peran Super Admin hanya dapat diberikan di luar halaman ini.</p>
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
            <Input type="password" value={form.data.password} onChange={(event) => form.setData("password", event.target.value)} autoComplete="new-password" minLength={12} required />
          </Field>
          <Field label="Peran" error={form.errors.role}>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.data.role} onChange={(event) => form.setData("role", event.target.value)} required>
              {data.roles.map((role) => <option key={role.name} value={role.name}>{role.title}</option>)}
            </select>
          </Field>
          {asksProvince && (
            <Field label="Provinsi" error={form.errors.provinceId}>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.data.provinceId} onChange={(event) => { form.setData("provinceId", event.target.value); form.setData("districtId", ""); }} required>
                <option value="">Pilih provinsi</option>
                {data.provinces.map((province) => <option key={province.id} value={province.id}>{province.name}</option>)}
              </select>
            </Field>
          )}
          {asksDistrict && (
            <Field label="Kabupaten/kota" error={form.errors.districtId}>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.data.districtId} onChange={(event) => form.setData("districtId", event.target.value)} required disabled={!form.data.provinceId}>
                <option value="">Pilih kabupaten/kota</option>
                {visibleDistricts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
              </select>
            </Field>
          )}
          {asksInstitution && (
            <Field label="Lembaga" error={form.errors.institutionId}>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.data.institutionId} onChange={(event) => form.setData("institutionId", event.target.value)} required>
                <option value="">Pilih lembaga</option>
                {data.institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}
              </select>
            </Field>
          )}
          {asksEmployer && (
            <Field label="Pemberi kerja" error={form.errors.employerId}>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.data.employerId} onChange={(event) => form.setData("employerId", event.target.value)} required>
                <option value="">Pilih pemberi kerja</option>
                {data.employers.map((employer) => <option key={employer.id} value={employer.id}>{employer.name}</option>)}
              </select>
            </Field>
          )}
          {selectedRole && !asksProvince && !asksInstitution && !asksEmployer && (
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
            <p role="alert" className="sm:col-span-2 lg:col-span-3 text-sm text-destructive">Periksa kembali isian yang ditandai. Kata sandi awal minimal 12 karakter.</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function ManagedUserRow({ user, currentUserId }: { user: ManagedUser; currentUserId: string }) {
  const isProtected = user.id === currentUserId || user.roleName === "super_admin";

  return (
    <tr>
      <td className="p-3">
        <p className="font-medium">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.username} · {user.email}</p>
      </td>
      <td className="p-3">{user.roleTitle}</td>
      <td className="p-3">{user.scopeName}</td>
      <td className="p-3">{user.status}</td>
      <td className="p-3">
        <div className="flex justify-end gap-2">
          {!isProtected && (
            <>
              <Button type="button" variant="outline" size="sm" disabled={user.status !== "Aktif"} onClick={() => router.post(`/admin/users/${user.id}/impersonate`)}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />Login sebagai
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => router.patch(`/admin/users/${user.id}/status`, { status: user.status === "Aktif" ? "Nonaktif" : "Aktif" })}>
                {user.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}
              </Button>
            </>
          )}
          {isProtected && <span className="text-xs text-muted-foreground">Dilindungi</span>}
        </div>
      </td>
    </tr>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error && <span role="alert" className="block text-xs font-normal text-destructive">{error}</span>}
    </label>
  );
}
