import { useState } from "react";
import { router } from "@inertiajs/react";
import { ArrowLeftRight, CheckCircle2, Clock, Trash2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { UserEditDialog } from "@/pages/UserEditDialog";
import { UserScopeDialog } from "@/pages/UserScopeDialog";
import type { ManagedUser, UserManagementData } from "@/pages/user-management-types";

export function ManagedUserRow({ user, currentUserId, data }: { user: ManagedUser; currentUserId: string; data: UserManagementData }) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const isProtected = user.id === currentUserId || user.roleName === "super_admin";
  const isUnverified = user.status === "Ditangguhkan" || user.status !== "Aktif";

  return (
    <tr className="hover:bg-muted/40 transition-colors">
      <td className="p-3">
        <p className="font-medium text-foreground">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.username} · {user.email}</p>
      </td>
      <td className="p-3 text-foreground">{user.roleTitle}</td>
      <td className="p-3 text-muted-foreground text-xs">{user.scopeName}</td>
      <td className="p-3">
        <div className="flex flex-col gap-1 items-start">
          {user.status === "Aktif" ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              Aktif / Terverifikasi
            </span>
          ) : user.status === "Ditangguhkan" ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400 animate-pulse" />
              Belum Terverifikasi
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Nonaktif
            </span>
          )}
          {user.emailVerifiedAt ? (
            <span className="text-[10px] text-muted-foreground font-mono">Diverifikasi: {user.emailVerifiedAt}</span>
          ) : (
            <span className="text-[10px] text-amber-600 dark:text-amber-400">Email belum verifikasi</span>
          )}
        </div>
      </td>
      <td className="p-3">
        <div className="flex justify-end gap-1.5 flex-wrap">
          {!isProtected && (
            <>
              {isUnverified && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-2.5 shadow-xs"
                  onClick={() => router.patch(`/admin/users/${user.id}/status`, { status: "Aktif" }, { preserveScroll: true, only: ["adminUsers"] })}
                >
                  <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                  Verifikasi Akun
                </Button>
              )}
              <UserEditDialog
                user={user}
                roles={data?.roles ?? []}
                provinces={data?.provinces ?? []}
                districts={data?.districts ?? []}
                institutions={data?.institutions ?? []}
                employers={data?.employers ?? []}
              />
              <UserScopeDialog user={user} data={data} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={user.status !== "Aktif"}
                onClick={() => router.post(`/admin/users/${user.id}/impersonate`)}
              >
                <ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" />
                Login sebagai
              </Button>
              {user.status === "Aktif" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => router.patch(`/admin/users/${user.id}/status`, { status: "Nonaktif" }, { preserveScroll: true, only: ["adminUsers"] })}
                >
                  Nonaktifkan
                </Button>
              ) : user.status === "Nonaktif" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => router.patch(`/admin/users/${user.id}/status`, { status: "Aktif" }, { preserveScroll: true, only: ["adminUsers"] })}
                >
                  Aktifkan
                </Button>
              ) : null}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-8 text-xs px-2"
                onClick={() => setDeleteModalOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={(reason) => router.delete(`/admin/users/${user.id}`, {
                  data: { reason },
                  preserveScroll: true,
                  only: ["adminUsers"],
                })}
                title="Hapus Akun Pengguna"
                entityName={user.name}
                entityId={user.id}
                description="Akun akan diarsipkan dan tidak bisa digunakan untuk masuk. Data akun dan riwayat audit tidak dihapus permanen."
                confirmText="Arsipkan Akun"
              />
            </>
          )}
          {isProtected && <span className="text-xs text-muted-foreground self-center">Dilindungi</span>}
        </div>
      </td>
    </tr>
  );
}
