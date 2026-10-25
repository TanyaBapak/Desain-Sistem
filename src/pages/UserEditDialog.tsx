import { useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface EditableUser {
  id: string;
  name: string;
  username: string;
  email: string;
  roleName: string;
  scopeName: string;
  provinceId: string | null;
  bp3miCode: string | null;
  districtId: string | null;
  institutionId: string | null;
  employerId: string | null;
}

interface UserEditDialogProps {
  user: EditableUser;
  roles: { name: string; title: string }[];
  provinces: { id: string; name: string }[];
  bp3miAssignments: { code: string; name: string; provinces: string[] }[];
  districts: { id: string; province_id: string; name: string }[];
  institutions: { id: string; name: string }[];
  employers: { id: string; name: string }[];
}

export function UserEditDialog({ user, roles, provinces, bp3miAssignments, districts, institutions, employers }: UserEditDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm({
    name: user.name,
    username: user.username,
    email: user.email,
    password: "",
    role: user.roleName,
    scopeName: user.scopeName,
    provinceId: user.provinceId ?? "",
    bp3miCode: user.bp3miCode ?? "",
    districtId: user.districtId ?? "",
    institutionId: user.institutionId ?? "",
    employerId: user.employerId ?? "",
  });

  useEffect(() => {
    if (!open) {
      form.setData({
        name: user.name,
        username: user.username,
        email: user.email,
        password: "",
        role: user.roleName,
        scopeName: user.scopeName,
        provinceId: user.provinceId ?? "",
        bp3miCode: user.bp3miCode ?? "",
        districtId: user.districtId ?? "",
        institutionId: user.institutionId ?? "",
        employerId: user.employerId ?? "",
      });
    }
  }, [open, user]);

  const asksProvince = form.data.role === "province_admin" || form.data.role === "district_admin";
  const asksBp3mi = form.data.role === "task_force";
  const asksDistrict = form.data.role === "district_admin";
  const asksInstitution = form.data.role === "institution_admin" || form.data.role === "training_operator";
  const asksEmployer = form.data.role === "demand_admin";
  const visibleDistricts = districts.filter((district) => district.province_id === form.data.provinceId);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    form.patch(`/admin/users/${user.id}`, {
      preserveScroll: true,
      onSuccess: () => setOpen(false),
    });
  }

  function changeRole(role: string) {
    form.setData("role", role);
    form.setData("scopeName", "");
    form.setData("provinceId", "");
    form.setData("bp3miCode", "");
    form.setData("districtId", "");
    form.setData("institutionId", "");
    form.setData("employerId", "");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="mr-2 h-4 w-4" />Edit
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pengguna</DialogTitle>
          <DialogDescription>Perbarui identitas, peran, dan lingkup akses. Kosongkan kata sandi jika tidak ingin menggantinya.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama lengkap" error={form.errors.name}>
            <Input value={form.data.name} onChange={(event) => form.setData("name", event.target.value)} required />
          </Field>
          <Field label="Nama pengguna" error={form.errors.username}>
            <Input value={form.data.username} onChange={(event) => form.setData("username", event.target.value)} required />
          </Field>
          <Field label="Email" error={form.errors.email}>
            <Input type="email" value={form.data.email} onChange={(event) => form.setData("email", event.target.value)} required />
          </Field>
          <Field label="Kata sandi baru (opsional)" error={form.errors.password}>
            <Input type="password" value={form.data.password} onChange={(event) => form.setData("password", event.target.value)} autoComplete="new-password" minLength={10} />
          </Field>
          <Field label="Peran" error={form.errors.role}>
            <select className={selectClass} value={form.data.role} onChange={(event) => changeRole(event.target.value)} required>
              {roles.map((role) => <option key={role.name} value={role.name}>{role.title}</option>)}
            </select>
          </Field>
          {asksBp3mi && (
            <Field label="Penetapan BP3MI" error={form.errors.bp3miCode}>
              <select className={selectClass} value={form.data.bp3miCode} onChange={(event) => form.setData("bp3miCode", event.target.value)} required>
                <option value="">Pilih wilayah BP3MI</option>
                {bp3miAssignments.map((assignment) => (
                  <option key={assignment.code} value={assignment.code}>{assignment.name}</option>
                ))}
              </select>
            </Field>
          )}
          {asksProvince && (
            <Field label="Provinsi" error={form.errors.provinceId}>
              <select className={selectClass} value={form.data.provinceId} onChange={(event) => { form.setData("provinceId", event.target.value); form.setData("districtId", ""); }} required>
                <option value="">Pilih provinsi</option>
                {provinces.map((province) => <option key={province.id} value={province.id}>{province.name}</option>)}
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
                {institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}
              </select>
            </Field>
          )}
          {asksEmployer && (
            <Field label="Pemberi kerja" error={form.errors.employerId}>
              <select className={selectClass} value={form.data.employerId} onChange={(event) => form.setData("employerId", event.target.value)} required>
                <option value="">Pilih pemberi kerja</option>
                {employers.map((employer) => <option key={employer.id} value={employer.id}>{employer.name}</option>)}
              </select>
            </Field>
          )}
          {!asksProvince && !asksBp3mi && !asksInstitution && !asksEmployer && (
            <Field label="Nama lingkup (opsional)" error={form.errors.scopeName}>
              <Input value={form.data.scopeName} onChange={(event) => form.setData("scopeName", event.target.value)} placeholder="Nasional" />
            </Field>
          )}
          {Object.keys(form.errors).length > 0 && (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">Periksa kembali isian yang ditandai.</p>
          )}
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={form.processing}>{form.processing ? "Menyimpan…" : "Simpan Perubahan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
