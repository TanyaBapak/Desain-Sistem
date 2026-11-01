import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, KeyRound, Loader2, Search, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ManagedUserRow } from "@/pages/ManagedUserRow";
import { UserCreateForm } from "@/pages/UserCreateForm";
import { UserCredentialsExportDialog } from "@/pages/UserCredentialsExportDialog";
import type { UserManagementData } from "@/pages/user-management-types";

interface UserManagementPageProps {
  adminUsers?: UserManagementData;
  currentUserId: string;
}

export function UserManagementPage({ adminUsers, currentUserId }: UserManagementPageProps) {
  const [selectedRole, setSelectedRole] = useState(adminUsers?.selectedRole ?? "");
  const [selectedStatus, setSelectedStatus] = useState(adminUsers?.selectedStatus ?? "");
  const [searchKeyword, setSearchKeyword] = useState(adminUsers?.search ?? "");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSelectedRole(adminUsers?.selectedRole ?? "");
    setSelectedStatus(adminUsers?.selectedStatus ?? "");
    setSearchKeyword(adminUsers?.search ?? "");
  }, [adminUsers?.selectedRole, adminUsers?.selectedStatus, adminUsers?.search]);

  if (!adminUsers) {
    return <p role="alert" className="text-sm text-destructive">Data pengguna tidak dapat dimuat. Muat ulang halaman atau hubungi administrator.</p>;
  }

  function navigateWithFilters(
    page = 1,
    role = selectedRole,
    status = selectedStatus,
    query = searchKeyword,
    perPage = adminUsers?.perPage ?? 50,
  ) {
    setIsLoading(true);
    const params: Record<string, string | number> = { page, per_page: perPage };
    if (role && role !== "all") {
      params.role = role;
    }
    if (status && status !== "all") {
      params.status = status;
    }
    if (query.trim()) {
      params.search = query.trim();
    }
    router.get("/app/rbac", params, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ["adminUsers"],
      onFinish: () => setIsLoading(false),
    });
  }

  function handleRoleChange(newRole: string) {
    setSelectedRole(newRole);
    navigateWithFilters(1, newRole, selectedStatus, searchKeyword);
  }

  function handleStatusChange(newStatus: string) {
    setSelectedStatus(newStatus);
    navigateWithFilters(1, selectedRole, newStatus, searchKeyword);
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    navigateWithFilters(1, selectedRole, selectedStatus, searchKeyword);
  }

  function handlePerPageChange(value: number) {
    navigateWithFilters(1, selectedRole, selectedStatus, searchKeyword, value);
  }

  function handleReset() {
    setSelectedRole("");
    setSelectedStatus("");
    setSearchKeyword("");
    setIsLoading(true);
    router.get("/app/rbac", {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ["adminUsers"],
      onFinish: () => setIsLoading(false),
    });
  }

  const roleOptions = adminUsers?.filterRoles ?? adminUsers?.roles ?? [];
  const hasActiveFilters = Boolean(selectedRole || selectedStatus || searchKeyword);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pengelola Pengguna</h1>
        <p className="mt-1 text-sm text-muted-foreground">Buat akun, atur status verifikasi akses, dan uji tampilan melalui sesi pengguna.</p>
      </header>
      <UserCreateForm data={adminUsers} />
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg text-foreground">Daftar Akun</CardTitle>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{adminUsers.total} akun terdaftar</p>
            </div>

            {/* Quick Segmented Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 dark:bg-muted/40 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => handleStatusChange("")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  selectedStatus === ""
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Semua</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-foreground font-mono">
                  {adminUsers.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange("unverified")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  selectedStatus === "unverified"
                    ? "bg-amber-500 text-white shadow-xs font-bold"
                    : (adminUsers.unverifiedCount ?? 0) > 0
                    ? "text-amber-600 dark:text-amber-400 font-semibold hover:bg-amber-500/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Belum Terverifikasi</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedStatus === "unverified"
                    ? "bg-amber-600 text-white"
                    : (adminUsers.unverifiedCount ?? 0) > 0
                    ? "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 font-bold"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {adminUsers.unverifiedCount ?? 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange("verified")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  selectedStatus === "verified"
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Terverifikasi / Aktif</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-foreground font-mono">
                  {adminUsers.activeCount ?? 0}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
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
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground"
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
            <select
              aria-label="Filter berdasarkan status verifikasi"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground font-medium"
              value={selectedStatus}
              onChange={(event) => handleStatusChange(event.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="unverified">⚠️ Belum Terverifikasi</option>
              <option value="verified">✅ Sudah Terverifikasi / Aktif</option>
              <option value="Ditangguhkan">Ditangguhkan</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
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
            {hasActiveFilters && (
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExportOpen(true)}
              className="h-9 gap-1.5 text-xs font-semibold text-primary border-primary/40 hover:bg-primary/10 shrink-0 cursor-pointer ml-auto"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Export Kredensial</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {adminUsers.data.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              {hasActiveFilters ? (
                <div className="space-y-2">
                  <p>Tidak ada akun yang cocok dengan kriteria pencarian atau filter status/peran yang dipilih.</p>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    Hapus Filter
                  </Button>
                </div>
              ) : (
                <p>Belum ada akun untuk ditampilkan.</p>
              )}
            </div>
          ) : (
            <div className={`overflow-x-auto transition-opacity duration-150 ${isLoading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="border-b text-muted-foreground">
                  <tr>
                    <th className="p-3 font-medium">Pengguna</th>
                    <th className="p-3 font-medium">Peran</th>
                    <th className="p-3 font-medium">Lingkup</th>
                    <th className="p-3 font-medium">Status & Verifikasi</th>
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
                disabled={adminUsers.currentPage <= 1 || isLoading}
                onClick={() => navigateWithFilters(adminUsers.currentPage - 1)}
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={adminUsers.currentPage >= adminUsers.lastPage || isLoading}
                onClick={() => navigateWithFilters(adminUsers.currentPage + 1)}
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <UserCredentialsExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        selectedRole={selectedRole}
        roleTitle={roleOptions.find((r) => r.name === selectedRole)?.title}
        searchKeyword={searchKeyword}
        totalUsers={adminUsers.total}
      />
    </div>
  );
}
