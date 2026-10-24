import React, { useState } from 'react';
import {
  Compass,
  Users,
  GraduationCap,
  Building2,
  Globe2,
  Workflow,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Home,
  UserCheck,
  ChevronDown,
  CheckCircle2,
  Terminal,
  Key,
  MapPin,
  LogOut,
  AlertTriangle,
  Clock,
  Shield,
  Layers,
  Check
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { mockRoles, getRoleById } from '../../data';
import { UserRole } from '../../types';
import { LOGO_URL } from '@/lib/assets';
import { visitPath } from '@/lib/navigation';

interface HeaderNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ currentTab, onTabChange }) => {
  const {
    candidates,
    providers,
    demands,
    allocations,
    approvalRequests,
    resetToDefaultData,
    currentRole,
    currentScope,
    currentUser,
    logout,
  } = useAppStore();

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const activeRoleObj = getRoleById(currentRole);
  const pendingApprovalsCount = approvalRequests.filter((r) => r.approvalStatus === 'PENDING').length;

  // The server session is the source of the active identity.
  const activeUser = currentUser || {
    id: '',
    name: 'Pengguna',
    email: '',
    role: currentRole,
    roleTitle: activeRoleObj.title,
    organization: activeRoleObj.organization,
    scope: currentScope,
    mfaEnabled: false,
    mfaVerified: false,
    loginTimestamp: '',
    ipAddress: '',
  };

  // Comprehensive 9 Navigation Items
  const allNavItems = [
    { id: 'overview', label: 'Dasbor Utama', icon: Compass },
    { id: 'modul-a', label: 'Pencari Kerja', badge: candidates.length, icon: Users },
    { id: 'modul-b', label: 'Pelatihan', icon: GraduationCap },
    { id: 'modul-c', label: 'Lembaga Vokasi', badge: providers.length, icon: Building2 },
    { id: 'modul-d', label: 'Permintaan Tenaga Kerja', badge: demands.length, icon: Globe2 },
    { id: 'matching', label: 'Pencocokan Peserta', badge: allocations.length, highlight: true, icon: Workflow },
    { id: 'approvals', label: 'Verifikasi & Persetujuan', badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined, icon: CheckCircle2 },
    { id: 'audit', label: 'Riwayat Audit', icon: Terminal },
    { id: 'rbac', label: 'Matriks Hak Akses', icon: Key },
  ];

  // Filter accessible tabs by role
  const navItems = allNavItems.filter((item) =>
    activeRoleObj.accessibleModules.includes(item.id)
  );

  // Safeguard: Automatically navigate to role default tab if current tab is not accessible
  React.useEffect(() => {
    if (activeRoleObj && !activeRoleObj.accessibleModules.includes(currentTab)) {
      onTabChange(activeRoleObj.defaultTab || 'overview');
    }
  }, [currentRole, currentTab, activeRoleObj, onTabChange]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
        {/* TOP STATUS BAR: Government SSO Session & Security Indicators */}
        <div className="bg-slate-950/95 px-4 sm:px-6 lg:px-8 py-1.5 border-b border-slate-800/80 text-xs flex items-center justify-between overflow-x-auto no-scrollbar text-slate-400 gap-3">
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            {/* Back to Public Portal Link */}
            <button
              onClick={() => visitPath('/')}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition font-semibold"
              title="Kunjungi Portal Publik Beranda"
            >
              <Home className="w-3 h-3 text-slate-400" />
              <span>Portal Publik</span>
            </button>

            <span className="text-slate-700">|</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200 hidden sm:inline">Sesi SSO Terotentikasi</span>

            {/* Scope comes from the authenticated server session. */}
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] text-slate-300">
                <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="text-slate-400">Scope:</span>
                <span className="font-semibold text-amber-300 truncate max-w-[190px]">
                  {currentScope.name}
                </span>
            </div>

            <span className="text-slate-700 hidden lg:inline">|</span>
            <a
              href="https://gardata.sippmi.com"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1 text-[11px] text-blue-300 hover:text-white transition font-semibold"
              title="Kunjungi Portal Feeder Pelatihan CPMI"
            >
              <ExternalLink className="w-3 h-3 text-blue-400" />
              <span>gardata.sippmi.com</span>
            </a>
          </div>

          <div className="flex items-center gap-3 text-xs whitespace-nowrap shrink-0">
            <span className="px-2.5 py-1 font-bold text-slate-200">
              Akun: <strong className="text-amber-400">{activeUser.roleTitle}</strong>
            </span>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => {
                if (confirm('Kembalikan semua dataset ke sampel default?')) {
                  resetToDefaultData();
                }
              }}
              title="Reset Mock Data"
              className="flex items-center gap-1 text-slate-400 hover:text-amber-300 transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset Data</span>
            </button>
          </div>
        </div>

        {/* MAIN BRAND BAR & NAVIGATION TABS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            {/* Logo & Platform Name */}
            <div
              className="flex items-center gap-2.5 cursor-pointer group shrink-0"
              onClick={() => onTabChange(activeRoleObj.defaultTab)}
            >
              <img
                src={LOGO_URL}
                alt="Logo Resmi Kemnaker & Vokasi Indonesia"
                className="w-9 h-9 object-contain drop-shadow-sm group-hover:scale-105 transition-transform shrink-0"
              />
              <div className="shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white whitespace-nowrap">SMK GO GLOBAL</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-600 text-white uppercase tracking-wider">
                    {activeRoleObj.id.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden xl:block whitespace-nowrap leading-none mt-0.5">
                  Kementerian Pelindungan Pekerja Migran Indonesia
                </p>
                <p className="text-[10px] text-slate-400 hidden sm:block xl:hidden whitespace-nowrap leading-none mt-0.5">
                  Kementerian P2MI RI
                </p>
              </div>
            </div>

            {/* Role-Filtered Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar py-1 shrink-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`whitespace-nowrap flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      isActive
                        ? item.highlight
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                          : 'bg-slate-800 text-blue-400 ring-1 ring-slate-700'
                        : item.highlight
                        ? 'text-blue-300 hover:bg-blue-950/60 hover:text-white border border-blue-800/50'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* User Session Profile & Prominent Logout Button */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* User Avatar & Mini Profile */}
              <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-left">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {activeUser.avatarInitials || 'US'}
                </div>
                <div className="leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white max-w-[120px] truncate">
                      {activeUser.name.split(',')[0]}
                    </span>
                    {activeUser.mfaVerified && (
                      <span title="MFA Aktif">
                        <Shield className="w-3 h-3 text-emerald-400" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-amber-300 font-medium block truncate max-w-[120px]">
                    {activeUser.roleTitle}
                  </span>
                </div>
              </div>

              {/* Official Logout Button (Section 4 Compliance) */}
              <button
                onClick={() => setLogoutModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 transition shadow-sm"
                title="Keluar dari sistem dan akhiri sesi autentikasi"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400 group-hover:text-white" />
                <span className="hidden sm:inline">Keluar / Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile Subnav Scrollable */}
          <div className="flex md:hidden overflow-x-auto py-2 space-x-2 border-t border-slate-800 no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                    isActive ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-white/20 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* OFFICIAL LOGOUT CONFIRMATION MODAL */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800 flex items-center justify-center mb-4">
              <LogOut className="w-6 h-6 text-red-400" />
            </div>

            <h3 className="text-lg font-black text-white">
              Konfirmasi Selesai Bertugas (Logout)
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Apakah Anda yakin ingin mengakhiri sesi kerja pada platform <strong>SGG-AC</strong>?
            </p>

            {/* Active Session Info Box */}
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pengguna:</span>
                <span className="font-bold text-white">{activeUser.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Jabatan/Role:</span>
                <span className="font-bold text-amber-300">{activeUser.roleTitle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Lingkup Scope:</span>
                <span className="font-semibold text-slate-300 truncate max-w-[200px]">{currentScope.name}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Token autentikasi akan dinonaktifkan dan aktivitas logout dicatat dalam Audit Trail nasional.</span>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoutModalOpen(false);
                  logout();
                }}
                className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/30 transition flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Ya, Keluar Sesi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
