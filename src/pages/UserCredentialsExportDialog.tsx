import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, KeyRound, Loader2, ShieldAlert } from "lucide-react";

interface UserCredentialsExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRole?: string;
  roleTitle?: string;
  searchKeyword?: string;
  totalUsers: number;
}

interface ExportedUserRecord {
  id: string;
  name: string;
  username: string;
  email: string;
  roleTitle: string;
  scopeName: string;
  status: string;
  password: string;
}

export function UserCredentialsExportDialog({
  isOpen,
  onClose,
  selectedRole,
  roleTitle,
  searchKeyword,
  totalUsers,
}: UserCredentialsExportDialogProps) {
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");
  const [isLoading, setIsLoading] = useState(false);

  async function handleExport() {
    try {
      setIsLoading(true);
      const response = await axios.post<{
        success: boolean;
        message: string;
        count: number;
        data: ExportedUserRecord[];
      }>("/admin/users/export-credentials", {
        role: selectedRole,
        search: searchKeyword,
      });

      const usersData = response.data?.data;
      if (!usersData || usersData.length === 0) {
        toast.error("Tidak ada akun pengguna yang dapat diekspor.");
        return;
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Kredensial_Akun_Pengguna_${timestamp}`;

      if (format === "xlsx") {
        const rows = usersData.map((u, idx) => ({
          No: idx + 1,
          "Nama Lengkap": u.name,
          Email: u.email,
          Username: u.username,
          "Peran / Role": u.roleTitle,
          "Lingkup Kerja": u.scopeName,
          "Status Akun": u.status,
          "Password Baru (Sementara)": u.password,
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);
        worksheet["!cols"] = [
          { wch: 5 },
          { wch: 26 },
          { wch: 30 },
          { wch: 20 },
          { wch: 22 },
          { wch: 25 },
          { wch: 12 },
          { wch: 25 },
        ];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Kredensial Pengguna");
        XLSX.writeFile(workbook, `${filename}.xlsx`);
      } else {
        const headers = [
          "No",
          "Nama Lengkap",
          "Email",
          "Username",
          "Peran / Role",
          "Lingkup Kerja",
          "Status Akun",
          "Password Baru (Sementara)",
        ];
        const csvRows = [
          headers.join(","),
          ...usersData.map((u, idx) =>
            [
              idx + 1,
              `"${(u.name || "").replace(/"/g, '""')}"`,
              `"${(u.email || "").replace(/"/g, '""')}"`,
              `"${(u.username || "").replace(/"/g, '""')}"`,
              `"${(u.roleTitle || "").replace(/"/g, '""')}"`,
              `"${(u.scopeName || "").replace(/"/g, '""')}"`,
              `"${(u.status || "").replace(/"/g, '""')}"`,
              `"${(u.password || "").replace(/"/g, '""')}"`,
            ].join(",")
          ),
        ];
        const blob = new Blob(["\uFEFF" + csvRows.join("\r\n")], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }

      toast.success(
        `Berhasil meng-generate password baru dan mengunduh ${usersData.length} kredensial akun.`
      );
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(
        error.response?.data?.message || "Gagal meng-generate kredensial pengguna."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <KeyRound className="h-5 w-5" />
            <DialogTitle className="text-base font-bold text-foreground">
              Export Kredensial Pengguna
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Generate password sementara baru untuk akun pengguna dan unduh dalam format dokumen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Peringatan Konsekuensi */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-800 dark:text-amber-300">
                  Perhatian: Tindakan Mengubah Password
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Karena password asli terenkripsi satu arah di database, proses export ini akan{" "}
                  <strong className="text-foreground">membuatkan password sementara baru</strong> dan langsung menyimpannya ke database.
                </p>
                <p className="text-muted-foreground text-[11px]">
                  * Akun Super Admin Anda saat ini tidak akan diubah password-nya demi keamanan.
                </p>
              </div>
            </div>
          </div>

          {/* Cakupan Target Export */}
          <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Target Akun:</span>
              <span className="font-semibold text-foreground">
                {totalUsers} akun terfilter
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Filter Peran:</span>
              <span className="font-semibold text-foreground">
                {selectedRole ? (roleTitle || selectedRole) : "Semua Peran"}
              </span>
            </div>
            {searchKeyword && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Kata Kunci:</span>
                <span className="font-mono text-foreground font-semibold">
                  "{searchKeyword}"
                </span>
              </div>
            )}
          </div>

          {/* Pilihan Format Dokumen */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              Format Dokumen Unduhan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat("xlsx")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition ${
                  format === "xlsx"
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <Download className="h-3.5 w-3.5" />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition ${
                  format === "csv"
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <Download className="h-3.5 w-3.5" />
                <span>CSV (.csv)</span>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleExport}
            disabled={isLoading}
            className="text-xs font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Memproses & Mengunduh...
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Generate & Unduh Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
