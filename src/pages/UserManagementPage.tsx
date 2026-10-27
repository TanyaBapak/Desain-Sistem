import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ManagedUserRow } from "@/pages/ManagedUserRow";
import { UserCreateForm } from "@/pages/UserCreateForm";
import type { UserManagementData } from "@/pages/user-management-types";

interface UserManagementPageProps {
  adminUsers?: UserManagementData;
  currentUserId: string;
}

export function UserManagementPage({ adminUsers, currentUserId }: UserManagementPageProps) {
  if (!adminUsers) {
    return <p role="alert" className="text-sm text-destructive">Data pengguna tidak dapat dimuat. Muat ulang halaman atau hubungi administrator.</p>;
  }

  const [selectedRole, setSelectedRole] = useState(adminUsers.selectedRole ?? "");
  const [searchKeyword, setSearchKeyword] = useState(adminUsers.search ?? "");

  useEffect(() => {
    setSelectedRole(adminUsers.selectedRole ?? "");
    setSearchKeyword(adminUsers.search ?? "");
  }, [adminUsers.selectedRole, adminUsers.search]);

  function navigateWithFilters(
    page = 1,
    role = selectedRole,
    query = searchKeyword,
    perPage = adminUsers?.perPage ?? 50,
  ) {
    const params: Record<string, string | number> = { page, per_page: perPage };
    if (role && role !== "all") {
      params.role = role;
    }
    if (query.trim()) {
      params.search = query.trim();
    }
    router.get("/app/rbac", params, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  }

  function handleRoleChange(newRole: string) {
    setSelectedRole(newRole);
    navigateWithFilters(1, newRole, searchKeyword);
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    navigateWithFilters(1, selectedRole, searchKeyword);
  }

  function handlePerPageChange(value: number) {
    navigateWithFilters(1, selectedRole, searchKeyword, value);
  }

  function handleReset() {
    setSelectedRole("");
    setSearchKeyword("");
    router.get("/app/rbac", {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  }

  const roleOptions = adminUsers.filterRoles ?? adminUsers.roles;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Pengelola Pengguna</h1>
        <p className="mt-1 text-sm text-muted-foreground">Buat akun, atur status akses, dan uji tampilan melalui sesi pengguna.</p>
      </header>
      <UserCreateForm data={adminUsers} />
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Daftar Akun</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{adminUsers.total} akun terdaftar</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="relative min-w-[200px] flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari nama, email, username…"
                className="h-9 pl-8 pr-3 text-sm"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
              />
            </form>
            <select
              aria-label="Filter berdasarkan peran"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={selectedRole}
              onChange={(event) => handleRoleChange(event.target.value)}
            >
              <option value="">Semua Peran</option>
              {roleOptions.map((role) => (
                <option key={role.name} value={role.name}>
                  {role.title}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Tampilkan</span>
              <select
                aria-label="Jumlah user per halaman"
                className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={adminUsers.perPage}
                onChange={(event) => handlePerPageChange(Number(event.target.value))}
              >
                {[15, 25, 50, 100].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>{pageSize}</option>
                ))}
              </select>
              <span>user</span>
            </label>
            {(selectedRole || searchKeyword) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-9 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {adminUsers.data.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              {selectedRole || searchKeyword ? (
                <div className="space-y-2">
                  <p>Tidak ada akun yang cocok dengan kriteria pencarian atau filter peran yang dipilih.</p>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    Hapus Filter
                  </Button>
                </div>
              ) : (
                <p>Belum ada akun untuk ditampilkan.</p>
              )}
            </div>
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
            <span className="text-muted-foreground">
              Menampilkan{" "}
              {adminUsers.total === 0
                ? 0
                : (adminUsers.currentPage - 1) * adminUsers.perPage + 1}
              –{Math.min(adminUsers.currentPage * adminUsers.perPage, adminUsers.total)} dari{" "}
              {adminUsers.total} user · Halaman {adminUsers.currentPage} dari {adminUsers.lastPage}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={adminUsers.currentPage <= 1}
                onClick={() => navigateWithFilters(adminUsers.currentPage - 1)}
                aria-label="Halaman sebelumnya"
              ><ChevronLeft className="h-4 w-4" /></Button>
              <Button
                variant="outline"
                size="sm"
                disabled={adminUsers.currentPage >= adminUsers.lastPage}
                onClick={() => navigateWithFilters(adminUsers.currentPage + 1)}
                aria-label="Halaman berikutnya"
              ><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
