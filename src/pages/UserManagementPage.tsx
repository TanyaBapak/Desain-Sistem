import { router } from "@inertiajs/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ManagedUserRow } from "@/pages/ManagedUserRow";
import { UserCreateForm } from "@/pages/UserCreateForm";
import { DashboardTargetSettings } from "@/pages/DashboardTargetSettings";
import type { UserManagementData } from "@/pages/user-management-types";

interface UserManagementPageProps {
  adminUsers?: UserManagementData;
  currentUserId: string;
}

export function UserManagementPage({ adminUsers, currentUserId }: UserManagementPageProps) {
  if (!adminUsers) {
    return <p role="alert" className="text-sm text-destructive">Data pengguna tidak dapat dimuat. Muat ulang halaman atau hubungi administrator.</p>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Pengelola Pengguna</h1>
        <p className="mt-1 text-sm text-muted-foreground">Buat akun, atur status akses, dan uji tampilan melalui sesi pengguna.</p>
      </header>
      <DashboardTargetSettings
        targets={adminUsers.landingKpiTargets}
        countries={adminUsers.landingCountries}
        countryTargets={adminUsers.landingCountryTargets}
        countryPerformance={adminUsers.landingCountryPerformance}
      />
      <UserCreateForm data={adminUsers} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Daftar Akun</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{adminUsers.total} akun terdaftar</p>
          </div>
        </CardHeader>
        <CardContent>
          {adminUsers.data.length === 0 ? (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">Belum ada akun untuk ditampilkan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="border-b text-muted-foreground">
                  <tr>
                    <th className="p-3 font-medium">Pengguna</th>
                    <th className="p-3 font-medium">Peran</th>
                    <th className="p-3 font-medium">Lingkup</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {adminUsers.data.map((user) => (
                    <ManagedUserRow key={user.id} user={user} currentUserId={currentUserId} data={adminUsers} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Halaman {adminUsers.currentPage} dari {adminUsers.lastPage}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={adminUsers.currentPage <= 1}
                onClick={() => router.get("/app/rbac", { page: adminUsers.currentPage - 1 }, { preserveScroll: true })}
                aria-label="Halaman sebelumnya"
              ><ChevronLeft className="h-4 w-4" /></Button>
              <Button
                variant="outline"
                size="sm"
                disabled={adminUsers.currentPage >= adminUsers.lastPage}
                onClick={() => router.get("/app/rbac", { page: adminUsers.currentPage + 1 }, { preserveScroll: true })}
                aria-label="Halaman berikutnya"
              ><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
