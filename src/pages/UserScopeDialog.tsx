import { useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";
import { MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InstitutionIdField } from "@/pages/InstitutionIdField";
import type { ManagedUser, UserManagementData } from "@/pages/user-management-types";

interface UserScopeFormData {
  scopeLevel: string;
  provinceId: string;
  districtId: string;
  institutionId: string;
  institutionIds: string[];
}

interface UserScopeDialogProps {
  user: ManagedUser;
  data: UserManagementData;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode | null;
}

export function UserScopeDialog({
  user,
  data,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: UserScopeDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(val);
    } else {
      setInternalOpen(val);
    }
  };
  const form = useForm<UserScopeFormData>({
    scopeLevel: user.scopeLevel || (user.institutionId ? "lembaga" : user.districtId ? "kabupaten" : user.provinceId ? "provinsi" : "national"),
    provinceId: user.provinceId ?? "",
    districtId: user.districtId ?? "",
    institutionId: user.institutionId ?? "",
    institutionIds: user.institutionIds ? [...user.institutionIds] : (user.institutionId ? [user.institutionId] : []),
  });
  const isProvinceAdmin = user.roleName === "province_admin";
  const isDistrictAdmin = user.roleName === "district_admin";
  const isTaskForce = user.roleName === "task_force";
  const visibleDistricts = (data?.districts ?? []).filter((district) => district.province_id === form.data.provinceId);

  useEffect(() => {
    if (!open) {
      form.setData({
        scopeLevel: user.scopeLevel || (user.institutionId ? "lembaga" : user.districtId ? "kabupaten" : user.provinceId ? "provinsi" : "national"),
        provinceId: user.provinceId ?? "",
        districtId: user.districtId ?? "",
        institutionId: user.institutionId ?? "",
        institutionIds: user.institutionIds ? [...user.institutionIds] : (user.institutionId ? [user.institutionId] : []),
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
      {trigger !== null && (
        trigger ?? (
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            <MapPinned className="mr-2 h-4 w-4" />
            Edit lingkup
          </Button>
        )
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Lingkup & ID Vokasi</DialogTitle>
          <DialogDescription>
            Atur wilayah atau ID Vokasi untuk akun {user.name}. Data pencari kerja dan modul akan ditampilkan sesuai lingkup yang dipilih.
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
            <Field label="Tingkat lingkup" error={form.errors.scopeLevel}>
              <select
                className={selectClass}
                value={form.data.scopeLevel}
                onChange={(event) => {
                  const scopeLevel = event.target.value;
                  form.setData("scopeLevel", scopeLevel);
                  if (scopeLevel !== "kabupaten") form.setData("districtId", "");
                  if (scopeLevel === "national") form.setData("provinceId", "");
                  if (scopeLevel !== "lembaga") form.setData("institutionId", "");
                }}
                disabled={isProvinceAdmin || isDistrictAdmin}
                required
              >
                <option value="national">Nasional</option>
                <option value="provinsi">Provinsi</option>
                <option value="kabupaten">Kabupaten/kota</option>
                <option value="lembaga">Lembaga Vokasi (ID Vokasi)</option>
              </select>
              {(isProvinceAdmin || isDistrictAdmin) && (
                <span className="block text-xs font-normal text-muted-foreground">
                  Tingkat wilayah mengikuti peran {user.roleTitle}.
                </span>
              )}
            </Field>

            {form.data.scopeLevel === "lembaga" && (
              <div className="space-y-2">
                <InstitutionIdField
                  label="Pilih Lembaga & ID Vokasi"
                  value={form.data.institutionId}
                  values={form.data.institutionIds}
                  onChange={(id) => form.setData("institutionId", id)}
                  onChangeValues={(ids) => {
                    form.setData("institutionIds", ids);
                    form.setData("institutionId", ids[0] ?? "");
                  }}
                  institutions={data?.institutions ?? []}
                  error={form.errors.institutionId}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Pengguna dapat mengelola lebih dari 1 institusi (misal data INS dan CSV dari Politeknik Indonusa). Seluruh peserta dari institusi terpilih akan otomatis tampil di dashboard pengelola.
                </p>
              </div>
            )}

            {form.data.scopeLevel !== "national" && form.data.scopeLevel !== "lembaga" && (
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
                  {(data?.provinces ?? []).map((province) => (
                    <option key={province.id} value={province.id}>{province.name}</option>
                  ))}
                </select>
              </Field>
            )}

            {form.data.scopeLevel === "kabupaten" && (
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

            {form.data.scopeLevel === "national" && (
              <p className="text-xs text-muted-foreground">
                Lingkup Nasional dapat memilih area sebagai filter opsional di header. Hak akses tetap mengikuti peran.
              </p>
            )}

            {Object.keys(form.errors).length > 0 && (
              <p role="alert" className="text-sm text-destructive">
                Periksa kembali isian lingkup yang dipilih.
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
