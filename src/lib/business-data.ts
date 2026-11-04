import axios from "axios";
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

export async function archiveBusinessData(
  resource: BusinessDataResource,
  id: string,
  reason?: string,
  onSuccess?: () => void,
): Promise<void> {
  const url = `/business-data/${resource}/${encodeURIComponent(id)}`;
  try {
    const res = await axios.delete(url, {
      data: { reason },
      params: { reason },
      headers: { Accept: "application/json" },
    });
    toast.success(res.data?.message || "Data berhasil dinonaktifkan.");
    onSuccess?.();
    return;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number; data?: { message?: string } } };
    if (error.response?.status === 403) {
      toast.error(error.response.data?.message || "Anda tidak memiliki hak akses untuk menonaktifkan data ini.");
      return;
    }
  }

  router.delete(url, {
    data: reason ? { reason } : {},
    preserveScroll: true,
    onSuccess: () => {
      toast.success("Data berhasil dinonaktifkan.");
      onSuccess?.();
    },
    onError: (errors: Record<string, string>) => {
      const message = Object.values(errors).find(Boolean);
      toast.error(message ?? "Data belum dapat dinonaktifkan. Periksa hak akses dan relasi data.");
    },
  });
}
