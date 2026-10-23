import { router } from "@inertiajs/react";
import { toast } from "sonner";

type BusinessDataResource = "candidates" | "programs" | "providers" | "demands";
type PayloadValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | File
  | Blob
  | Date
  | PayloadValue[]
  | { [key: string]: PayloadValue };
type BusinessDataPayload = Record<string, PayloadValue>;

export function saveBusinessData<T extends object>(
  resource: BusinessDataResource,
  payload: T,
  id?: string,
  onSuccess?: () => void,
): void {
  const data = payload as BusinessDataPayload;
  const options = {
    preserveScroll: true,
    onSuccess: () => {
      toast.success("Data berhasil disimpan ke database.");
      onSuccess?.();
    },
    onError: (errors: Record<string, string>) => {
      const message = Object.values(errors).find(Boolean);
      toast.error(message ?? "Data belum dapat disimpan. Periksa kembali isian formulir.");
    },
  };

  if (id) {
    router.put(`/business-data/${resource}/${encodeURIComponent(id)}`, data, options);
    return;
  }

  router.post(`/business-data/${resource}`, data, options);
}

export function archiveBusinessData(
  resource: BusinessDataResource,
  id: string,
  reason?: string,
  onSuccess?: () => void,
): void {
  router.delete(`/business-data/${resource}/${encodeURIComponent(id)}`, {
    data: reason ? { reason } : {},
    preserveScroll: true,
    onSuccess: () => {
      toast.success("Data berhasil dinonaktifkan.");
      onSuccess?.();
    },
    onError: () => {
      toast.error("Data belum dapat dinonaktifkan. Periksa hak akses dan relasi data.");
    },
  });
}
