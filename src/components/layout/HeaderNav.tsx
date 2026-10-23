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
import { mockRoles, getRoleById, mockUsers } from '../../data';
import { UserRole } from '../../types';

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
    loginWithAccount,
    logout,
    switchRoleContext,
    setViewMode,
  } = useAppStore();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const activeRoleObj = getRoleById(currentRole);
  const pendingApprovalsCount = approvalRequests.filter((r) => r.approvalStatus === 'PENDING').length;

  // Active User representation (fallback to matching mockUser if currentUser is not initialized)
  const activeUser = currentUser || {
    id: 'USR-003',
    name: 'Dr. Ir. Budi Santoso, M.Sc',
    email: 'taskforce.nasional@p2mi.go.id',
    role: currentRole,
    roleTitle: activeRoleObj.title,
    organization: activeRoleObj.organization,
    scope: currentScope,
    nip: '197508121999031003',
    mfaEnabled: true,
    mfaVerified: true,
    loginTimestamp: '2026-10-23 08:30:00 WIB',
    ipAddress: '10.24.120.88',
    avatarInitials: 'BS',
    authorizedScopes: ['Gugus Tugas Nasional', 'Satgas 5 Koridor Negara'],
  };

  // Comprehensive 9 Navigation Items
  const allNavItems = [
    { id: 'overview', label: 'Command Center', icon: Compass },
    { id: 'modul-a', label: 'Supply Calon', badge: candidates.length, icon: Users },
    { id: 'modul-b', label: 'Pelatihan', icon: GraduationCap },
    { id: 'modul-c', label: 'Kesiapan Lembaga', badge: providers.length, icon: Building2 },
    { id: 'modul-d', label: 'Demand Global', badge: demands.length, icon: Globe2 },
    { id: 'matching', label: 'Smart Matching', badge: allocations.length, highlight: true, icon: Workflow },
    { id: 'approvals', label: 'Verifikasi & Approval', badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined, icon: CheckCircle2 },
    { id: 'audit', label: 'Audit Log', icon: Terminal },
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
              onClick={() => setViewMode('landing')}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition font-semibold"
              title="Kunjungi Portal Publik Beranda"
            >
              <Home className="w-3 h-3 text-slate-400" />
              <span>Portal Publik</span>
            </button>

            <span className="text-slate-700">|</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200 hidden sm:inline">Sesi SSO Terotentikasi</span>

            {/* Scope Indicator with Switcher */}
            <span className="text-slate-700">|</span>
            <div className="relative">
              <button
                onClick={() => setScopeDropdownOpen(!scopeDropdownOpen)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] transition"
                title="Batas Wilayah / Data yang Diotorisasi (Klik untuk melihat konteks)"
              >
                <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="text-slate-400">Scope:</span>
                <span className="font-semibold text-amber-300 truncate max-w-[190px]">
                  {currentScope.name}
                </span>
                {activeUser.authorizedScopes && activeUser.authorizedScopes.length > 1 && (
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                )}
              </button>

              {/* Context Scope Switcher Dropdown */}
              {scopeDropdownOpen && activeUser.authorizedScopes && (
                <div className="absolute left-0 mt-1 w-72 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl shadow-2xl p-2 z-50 animate-fade-in text-xs">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1 flex items-center justify-between">
                    <span>GANTI KONTEKS WILAYAH:</span>
                    <span className="text-emerald-400">Tercatat Audit</span>
                  </div>
                  {activeUser.authorizedScopes.map((scopeName) => (
                    <button
                      key={scopeName}
                      onClick={() => {
                        switchRoleContext(scopeName);
                        setScopeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition text-xs ${
                        currentScope.name === scopeName
                          ? 'bg-blue-600/30 text-blue-300 font-bold border border-blue-500/40'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="truncate">{scopeName}</span>
                      {currentScope.name === scopeName && (
                        <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
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
            {/* Multi-Role Switcher (13 Stakeholder Accounts) */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition font-bold"
                title="Ganti akun stakeholder untuk simulasi pengujian"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Akun: <strong className="text-amber-400">{activeUser.roleTitle}</strong></span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-1 w-84 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-50 animate-fade-in max-h-[80vh] overflow-y-auto">
                  <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 flex items-center justify-between">
                    <span>13 ROLE PEMANGKU KEPENTINGAN:</span>
                    <span className="text-blue-600 font-bold">SSO Terpadu</span>
                  </div>
                  {mockUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        loginWithAccount(user);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs transition flex items-start justify-between mb-1 ${
                        activeUser.id === user.id
                          ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                            {user.no}
                          </span>
                          <span className="font-extrabold line-clamp-1">{user.roleTitle}</span>
                        </div>
                        <span className="text-[10px] text-blue-600 block mt-0.5 line-clamp-1">{user.name}</span>
                        <span className="text-[9px] text-slate-500 block font-mono mt-0.5">
                          Tujuan: {user.landingTabTitle}
                        </span>
                      </div>
                      {activeUser.id === user.id && (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1" />
                      )}
                    </button>
                  ))}

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between px-2 text-[11px]">
                    <button
                      onClick={() => {
                        onTabChange('rbac');
                        setRoleDropdownOpen(false);
                      }}
                      className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <Key className="w-3 h-3" />
                      <span>Lihat Matriks Hak Akses (RBAC)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

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
                src="/logo.png"
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
              Apakah Anda yakin ingin mengakhiri sesi kerja pada platform <strong>SMK Go Global Command Center</strong>?
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
              {activeUser.nip && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">NIP:</span>
                  <span className="font-mono text-slate-300">{activeUser.nip}</span>
                </div>
              )}
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
