import { useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";
import { MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ManagedUser, UserManagementData } from "@/pages/user-management-types";

interface UserRegionalScopeDialogProps {
  user: ManagedUser;
  provinces: UserManagementData["provinces"];
  districts: UserManagementData["districts"];
}

export function UserRegionalScopeDialog({ user, provinces, districts }: UserRegionalScopeDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm({
    provinceId: user.provinceId ?? "",
    districtId: user.districtId ?? "",
  });
  const isDistrictAdmin = user.roleName === "district_admin";
  const visibleDistricts = districts.filter((district) => district.province_id === form.data.provinceId);

  useEffect(() => {
    if (!open) {
      form.setData({
        provinceId: user.provinceId ?? "",
        districtId: user.districtId ?? "",
      });
    }
  }, [open, user.provinceId, user.districtId]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    form.patch(`/admin/users/${user.id}/regional-scope`, {
      preserveScroll: true,
      onSuccess: () => setOpen(false),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <MapPinned className="mr-2 h-4 w-4" />
        Edit lingkup daerah
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit lingkup daerah</DialogTitle>
          <DialogDescription>
            Ubah wilayah data yang dapat dikelola oleh {user.name}. Peran pengguna tidak berubah.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
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
              {provinces.map((province) => (
                <option key={province.id} value={province.id}>{province.name}</option>
              ))}
            </select>
          </Field>
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
          {Object.keys(form.errors).length > 0 && (
            <p role="alert" className="text-sm text-destructive">
              Periksa kembali wilayah yang dipilih.
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={form.processing}>
              {form.processing ? "Menyimpan…" : "Simpan lingkup"}
            </Button>
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
