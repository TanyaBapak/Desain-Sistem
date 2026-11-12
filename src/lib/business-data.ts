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

export interface SaveBusinessDataOptions {
  onSuccess?: () => void;
  onError?: (error?: string) => void;
  onFinally?: () => void;
}

export async function saveBusinessData<T extends object>(
  resource: BusinessDataResource,
  payload: T,
  id?: string,
  onSuccessOrOptions?: (() => void) | SaveBusinessDataOptions,
  onErrorFallback?: (error?: string) => void,
): Promise<boolean> {
  const data = payload as BusinessDataPayload;
  const options: SaveBusinessDataOptions =
    typeof onSuccessOrOptions === "function"
      ? { onSuccess: onSuccessOrOptions, onError: onErrorFallback }
      : (onSuccessOrOptions ?? {});

  const url = id
    ? `/business-data/${resource}/${encodeURIComponent(id)}`
    : `/business-data/${resource}`;

  try {
    const res = id
      ? await axios.put(url, data, { headers: { Accept: "application/json" } })
      : await axios.post(url, data, { headers: { Accept: "application/json" } });

    toast.success(res.data?.message || "Data berhasil disimpan ke database.");
    options.onSuccess?.();

    // Reload businessData across Inertia in background without blocking modal close or UI flow
    router.reload({ only: ["businessData"] });
    return true;
  } catch (err: unknown) {
    const error = err as {
      response?: {
        status?: number;
        data?: {
          message?: string;
          errors?: Record<string, string[] | string>;
        };
      };
    };

    let errorMsg = "Data belum dapat disimpan. Periksa kembali isian formulir.";
    if (error.response?.data?.message) {
      errorMsg = error.response.data.message;
    } else if (error.response?.data?.errors) {
      const firstErr = Object.values(error.response.data.errors)[0];
      if (Array.isArray(firstErr) && firstErr.length > 0) {
        errorMsg = firstErr[0];
      } else if (typeof firstErr === "string") {
        errorMsg = firstErr;
      }
    } else if (error.response?.status === 403) {
      errorMsg = "Anda tidak memiliki hak akses untuk mengubah data ini.";
    } else if (error.response?.status === 429) {
      errorMsg = "Terlalu banyak permintaan (Error 429). Mohon tunggu beberapa detik sebelum mencoba kembali.";
    }

    toast.error(errorMsg);
    options.onError?.(errorMsg);
    return false;
  } finally {
    options.onFinally?.();
  }
}

export async function archiveBusinessData(
  resource: BusinessDataResource,
  id: string,
  reason?: string,
  onSuccess?: () => void,
): Promise<boolean> {
  const url = `/business-data/${resource}/${encodeURIComponent(id)}`;
  try {
    const res = await axios.delete(url, {
      data: { reason },
      params: { reason },
      headers: { Accept: "application/json" },
    });
    toast.success(res.data?.message || "Data berhasil dinonaktifkan.");
    onSuccess?.();
    router.reload({ only: ["businessData"] });
    return true;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number; data?: { message?: string } } };
    const errorMsg =
      error.response?.data?.message ||
      (error.response?.status === 403
        ? "Anda tidak memiliki hak akses untuk menonaktifkan data ini."
        : "Data belum dapat dinonaktifkan. Periksa hak akses dan relasi data.");
    toast.error(errorMsg);
    return false;
  }
}

export async function batchArchiveBusinessData(
  resource: BusinessDataResource,
  ids: string[],
  reason?: string,
  onSuccess?: () => void,
): Promise<boolean> {
  const url = `/business-data/${resource}/batch-destroy`;
  try {
    const res = await axios.post(
      url,
      { ids, reason },
      { headers: { Accept: "application/json" } }
    );
    toast.success(res.data?.message || `${ids.length} data berhasil dinonaktifkan.`);
    onSuccess?.();
    router.reload({ only: ["businessData"] });
    return true;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number; data?: { message?: string } } };
    const errorMsg =
      error.response?.data?.message ||
      (error.response?.status === 403
        ? "Anda tidak memiliki hak akses untuk menonaktifkan data ini."
        : "Gagal menghapus data secara masal.");
    toast.error(errorMsg);
    return false;
  }
}
