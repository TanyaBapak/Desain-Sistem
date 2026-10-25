import { useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";
import { MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ManagedUser, UserManagementData } from "@/pages/user-management-types";

interface UserScopeDialogProps {
  user: ManagedUser;
  data: UserManagementData;
}

export function UserScopeDialog({ user, data }: UserScopeDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm({
    scopeName: user.scopeName,
    provinceId: user.provinceId ?? "",
    districtId: user.districtId ?? "",
    institutionId: user.institutionId ?? "",
    employerId: user.employerId ?? "",
  });
  const isProvinceAdmin = user.roleName === "province_admin";
  const isDistrictAdmin = user.roleName === "district_admin";
  const isInstitutionRole = user.roleName === "institution_admin" || user.roleName === "training_operator";
  const isDemandRole = user.roleName === "demand_admin";
  const isTaskForce = user.roleName === "task_force";
  const visibleDistricts = data.districts.filter((district) => district.province_id === form.data.provinceId);

  useEffect(() => {
    if (!open) {
      form.setData({
        scopeName: user.scopeName,
        provinceId: user.provinceId ?? "",
        districtId: user.districtId ?? "",
        institutionId: user.institutionId ?? "",
        employerId: user.employerId ?? "",
      });
    }
  }, [open, user]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    form.patch(`/admin/users/${user.id}/scope`, {
      preserveScroll: true,
      onSuccess: () => setOpen(false),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <MapPinned className="mr-2 h-4 w-4" />
        Edit lingkup
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit lingkup pengguna</DialogTitle>
          <DialogDescription>
            Ubah lingkup yang terhubung dengan peran {user.roleTitle} milik {user.name}.
          </DialogDescription>
        </DialogHeader>
        {isTaskForce ? (
          <div className="space-y-4">
            <p className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
              Area Task Force tidak ditetapkan pada akun. Pengguna memilih area aktif melalui dropdown di header.
            </p>
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>Tutup</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {(isProvinceAdmin || isDistrictAdmin) && (
              <Field label="Provinsi" error={form.errors.provinceId}>
                <select
                  className={selectClass}
                  value={form.data.provinceId}
                  onChange={(event) => {
                    form.setData("provinceId", event.target.value);
                    form.setData("districtId", "");
                  }}
                  required
                >
                  <option value="">Pilih provinsi</option>
                  {data.provinces.map((province) => (
                    <option key={province.id} value={province.id}>{province.name}</option>
                  ))}
                </select>
              </Field>
            )}
            {isDistrictAdmin && (
            <Field label="Kabupaten/kota" error={form.errors.districtId}>
              <select
                className={selectClass}
                value={form.data.districtId}
                onChange={(event) => form.setData("districtId", event.target.value)}
                disabled={!form.data.provinceId}
                required
              >
                <option value="">Pilih kabupaten/kota</option>
                {visibleDistricts.map((district) => (
                  <option key={district.id} value={district.id}>{district.name}</option>
                ))}
              </select>
            </Field>
          )}
            {isInstitutionRole && (
              <Field label="Lembaga" error={form.errors.institutionId}>
                <select
                  className={selectClass}
                  value={form.data.institutionId}
                  onChange={(event) => form.setData("institutionId", event.target.value)}
                  required
                >
                  <option value="">Pilih lembaga</option>
                  {data.institutions.map((institution) => (
                    <option key={institution.id} value={institution.id}>{institution.name}</option>
                  ))}
                </select>
              </Field>
            )}
            {isDemandRole && (
              <Field label="Pemberi kerja" error={form.errors.employerId}>
                <select
                  className={selectClass}
                  value={form.data.employerId}
                  onChange={(event) => form.setData("employerId", event.target.value)}
                  required
                >
                  <option value="">Pilih pemberi kerja</option>
                  {data.employers.map((employer) => (
                    <option key={employer.id} value={employer.id}>{employer.name}</option>
                  ))}
                </select>
              </Field>
            )}
            {!isProvinceAdmin && !isDistrictAdmin && !isInstitutionRole && !isDemandRole && (
              <Field label="Nama lingkup" error={form.errors.scopeName}>
                <Input
                  value={form.data.scopeName}
                  onChange={(event) => form.setData("scopeName", event.target.value)}
                  placeholder="Nasional"
                />
                <span className="block text-xs font-normal text-muted-foreground">
                  Mengubah label lingkup pada akun dan audit, tidak mengubah aturan akses berbasis peran.
                </span>
              </Field>
            )}
            {Object.keys(form.errors).length > 0 && (
              <p role="alert" className="text-sm text-destructive">
                Periksa kembali lingkup yang dipilih.
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={form.processing}>
                {form.processing ? "Menyimpan…" : "Simpan lingkup"}
              </Button>
            </DialogFooter>
          </form>
        )}
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
