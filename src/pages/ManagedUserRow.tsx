import { useState } from "react";
import { router } from "@inertiajs/react";
import { ArrowLeftRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { UserEditDialog } from "@/pages/UserEditDialog";
import { UserScopeDialog } from "@/pages/UserScopeDialog";
import type { ManagedUser, UserManagementData } from "@/pages/user-management-types";

export function ManagedUserRow({ user, currentUserId, data }: { user: ManagedUser; currentUserId: string; data: UserManagementData }) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const isProtected = user.id === currentUserId || user.roleName === "super_admin";

  return (
    <tr>
      <td className="p-3">
        <p className="font-medium">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.username} · {user.email}</p>
      </td>
      <td className="p-3">{user.roleTitle}</td>
      <td className="p-3">{user.scopeName}</td>
      <td className="p-3">{user.status}</td>
      <td className="p-3">
        <div className="flex justify-end gap-2">
          {!isProtected && (
            <>
              <UserEditDialog
                user={user}
                roles={data?.roles ?? []}
                provinces={data?.provinces ?? []}
                districts={data?.districts ?? []}
                institutions={data?.institutions ?? []}
                employers={data?.employers ?? []}
              />
              <UserScopeDialog user={user} data={data} />
              <Button type="button" variant="outline" size="sm" disabled={user.status !== "Aktif"} onClick={() => router.post(`/admin/users/${user.id}/impersonate`)}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />Login sebagai
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => router.patch(`/admin/users/${user.id}/status`, { status: user.status === "Aktif" ? "Nonaktif" : "Aktif" })}>
                {user.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteModalOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />Hapus
              </Button>
              <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={(reason) => router.delete(`/admin/users/${user.id}`, {
                  data: { reason },
                  preserveScroll: true,
                })}
                title="Hapus Akun Pengguna"
                entityName={user.name}
                entityId={user.id}
                description="Akun akan diarsipkan dan tidak bisa digunakan untuk masuk. Data akun dan riwayat audit tidak dihapus permanen."
                confirmText="Arsipkan Akun"
              />
            </>
          )}
          {isProtected && <span className="text-xs text-muted-foreground">Dilindungi</span>}
        </div>
      </td>
    </tr>
  );
}
