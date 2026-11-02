import { useState } from "react";
import { router } from "@inertiajs/react";
import {
  ArrowLeftRight,
  Building2,
  CheckCircle2,
  Clock,
  MapPinned,
  MoreHorizontal,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { UserEditDialog } from "@/pages/UserEditDialog";
import { UserScopeDialog } from "@/pages/UserScopeDialog";
import type { ManagedUser, UserManagementData } from "@/pages/user-management-types";

export function ManagedUserRow({ user, currentUserId, data }: { user: ManagedUser; currentUserId: string; data: UserManagementData }) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const isProtected = user.id === currentUserId || user.roleName === "super_admin";
  const isUnverified = user.status === "Ditangguhkan" || user.status !== "Aktif";

  return (
    <tr className="hover:bg-muted/40 transition-colors">
      <td className="p-3">
        <p className="font-medium text-foreground">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.username} · {user.email}</p>
      </td>
      <td className="p-3 text-foreground whitespace-nowrap">{user.roleTitle}</td>
      <td className="p-3 text-xs">
        <div className="flex flex-col gap-1 items-start">
          <span className="font-medium text-foreground">{user.scopeName || "-"}</span>
          {user.institutionId ? (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Building2 className="h-3 w-3" />
              ID: {user.institutionId}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground capitalize">
              {user.scopeLevel || "Nasional"}
            </span>
          )}
        </div>
      </td>
      <td className="p-3">
        <div className="flex flex-col gap-1 items-start whitespace-nowrap">
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
      <td className="p-3 text-right">
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
          {!isProtected ? (
            <>
              {isUnverified && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-2.5 shadow-xs"
                  onClick={() => router.patch(`/admin/users/${user.id}/status`, { status: "Aktif" }, { preserveScroll: true, only: ["adminUsers"] })}
                  title="Verifikasi dan aktifkan akun ini"
                >
                  <UserCheck className="mr-1 h-3.5 w-3.5" />
                  Verifikasi
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs font-medium"
                onClick={() => setEditDialogOpen(true)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                Edit
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label="Menu aksi pengguna"
                  >
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs">Aksi Pengguna</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setEditDialogOpen(true)} className="cursor-pointer text-xs">
                    <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <span>Edit Profil & Peran</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setScopeDialogOpen(true)} className="cursor-pointer text-xs">
                    <Building2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <span>Atur ID Vokasi & Lingkup</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={user.status !== "Aktif"}
                    onClick={() => router.post(`/admin/users/${user.id}/impersonate`)}
                    className="cursor-pointer text-xs"
                  >
                    <ArrowLeftRight className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <span>Login sebagai Akun Ini</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {user.status === "Aktif" ? (
                    <DropdownMenuItem
                      onClick={() => router.patch(`/admin/users/${user.id}/status`, { status: "Nonaktif" }, { preserveScroll: true, only: ["adminUsers"] })}
                      className="cursor-pointer text-xs text-amber-600 dark:text-amber-400 focus:text-amber-600 dark:focus:text-amber-400"
                    >
                      <PowerOff className="mr-2 h-3.5 w-3.5" />
                      <span>Nonaktifkan Akun</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => router.patch(`/admin/users/${user.id}/status`, { status: "Aktif" }, { preserveScroll: true, only: ["adminUsers"] })}
                      className="cursor-pointer text-xs text-emerald-600 dark:text-emerald-400 focus:text-emerald-600 dark:focus:text-emerald-400"
                    >
                      <Power className="mr-2 h-3.5 w-3.5" />
                      <span>Aktifkan Akun</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => setDeleteModalOpen(true)}
                    className="cursor-pointer text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    <span>Hapus / Arsipkan</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <UserEditDialog
                user={user}
                roles={data?.roles ?? []}
                provinces={data?.provinces ?? []}
                districts={data?.districts ?? []}
                institutions={data?.institutions ?? []}
                employers={data?.employers ?? []}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                trigger={null}
              />

              <UserScopeDialog
                user={user}
                data={data}
                open={scopeDialogOpen}
                onOpenChange={setScopeDialogOpen}
                trigger={null}
              />

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
          ) : (
            <span className="text-xs text-muted-foreground pr-2">Dilindungi</span>
          )}
        </div>
      </td>
    </tr>
  );
}
