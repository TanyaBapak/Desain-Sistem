"use client";

import * as React from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Shield, User, MapPin, Building, Globe, Clock, ShieldCheck } from "lucide-react";
import { STAKEHOLDER_ROLES } from "@/lib/stakeholder-roles";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<string, React.ElementType> = {
  pimpinan: Shield,
  taskforce: Clock,
  direktorat: Building,
  "direktorat-terkait": Globe,
  pusdatin: ShieldCheck,
  bp3mi: MapPin,
  disnaker: User,
  vokasi: User,
};

const SCOPE_COLORS: Record<string, string> = {
  national: "bg-blue-100 text-blue-700 border-blue-200",
  provinsi: "bg-indigo-100 text-indigo-700 border-indigo-200",
  kabupaten: "bg-violet-100 text-violet-700 border-violet-200",
  lembaga: "bg-cyan-100 text-cyan-700 border-cyan-200",
  demand: "bg-rose-100 text-rose-700 border-rose-200",
};

export const RoleManagementPage: React.FC = () => {
  const { currentRole, currentUser, switchRoleContext, loginWithAccount } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Role & Akun Stakeholder</h1>
          <p className="text-sm text-muted-foreground">
            Kelola 8 peran stakeholder dalam ekosistem SMK Go Global danaturasi hak akses modul.
          </p>
        </div>
        <Button onClick={() => {}} variant="outline" size="sm" disabled>
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar 8 Peran Stakeholder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">No</TableHead>
                  <TableHead>Peran / Stakeholder</TableHead>
                  <TableHead className="text-left">Tanggung Jawab</TableHead>
                  <TableHead className="w-40">Scope / Lingkup</TableHead>
                  <TableHead className="w-32">Grup</TableHead>
                  <TableHead className="w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STAKEHOLDER_ROLES.map((role, idx) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-mono text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0`} style={{ backgroundColor: role.color.replace("bg-", "bg-").replace("500", "500") }}>
                          {role.name.charAt(0)}
                        </div>
                        <span>{role.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{role.responsibility}</TableCell>
                    <TableCell className="text-sm">
                      <Badge variant="outline" className={SCOPE_COLORS[role.scope as keyof typeof SCOPE_COLORS] || "bg-slate-100 text-slate-700"}>
                        {role.scope}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{role.group}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={currentRole === role.id ? "default" : "outline"}
                        onClick={() => {
                          // Simulasi pindah role context
                          const mockUser = {
                            no: idx + 1,
                            id: `USR-ROLE-${idx + 1}`,
                            username: role.id,
                            email: `${role.id}@p2mi.go.id`,
                            name: role.name,
                            role: role.id as any,
                            roleTitle: role.name,
                            badge: role.group,
                            organization: "Kementerian P2MI",
                            scope: { level: "national" as any, name: role.scope },
                            landingTab: "overview",
                            landingTabTitle: "Dashboard",
                            mfaEnabled: false,
                            avatarInitials: role.name.charAt(0),
                            status: "Aktif" as const,
                          };
                          loginWithAccount(mockUser);
                          switchRoleContext(role.scope);
                        }}
                      >
                        {currentRole === role.id ? "Aktif" : "Masuk sebagai"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Role detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAKEHOLDER_ROLES.map((role) => (
          <RoleCard key={role.id} role={role} isActive={currentRole === role.id} />
        ))}
      </div>
    </div>
  );
};

function RoleCard({ role, isActive }: { role: (typeof STAKEHOLDER_ROLES)[number]; isActive: boolean }) {
  const Icon = ROLE_ICONS[role.id] || Shield;
  return (
    <Card className={cn("overflow-hidden", isActive && "border-blue-500 bg-blue-50")}>
      <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${role.color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">{role.name}</CardTitle>
            <span className="text-xs text-slate-500">{role.group}</span>
          </div>
        </div>
        {isActive && <Badge>AKTIF</Badge>}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-xs text-slate-600 mb-3">{role.responsibility}</p>
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <MapPin className="h-3 w-3" /> <span>{role.scope}</span>
        </div>
      </CardContent>
    </Card>
  );
}
