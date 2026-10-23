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
  MapPin
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { mockRoles, getRoleById } from '../../data';
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
    loginAsRole,
    setViewMode,
  } = useAppStore();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const activeRoleObj = getRoleById(currentRole);
  const pendingApprovalsCount = approvalRequests.filter((r) => r.approvalStatus === 'PENDING').length;

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

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      {/* Top Bar Status with Government Identity & Role Switcher */}
      <div className="bg-slate-950/90 px-4 sm:px-6 lg:px-8 py-1.5 border-b border-slate-800/80 text-xs flex items-center justify-between overflow-x-auto no-scrollbar text-slate-400 gap-3">
        <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
          {/* Back to Portal Landing Page Button */}
          <button
            onClick={() => setViewMode('landing')}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 transition font-semibold"
          >
            <Home className="w-3 h-3" />
            <span>Portal Beranda</span>
          </button>

          <span className="text-slate-700">|</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-slate-300 hidden sm:inline">Sistem SGG Command Center</span>

          {/* Active Scope Pill Indicator */}
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px]">
            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="text-slate-400">Scope:</span>
            <span className="font-semibold text-amber-300 truncate max-w-[200px]" title={currentScope.name}>
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
          {/* Active Role Selector Widget */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition font-bold"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Peran: <strong className="text-amber-400">{activeRoleObj.title}</strong></span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-1 w-80 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-50 animate-fade-in max-h-[80vh] overflow-y-auto">
                <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 flex items-center justify-between">
                  <span>PILIH ROLE PEMANGKU KEPENTINGAN:</span>
                  <span className="text-blue-600 font-bold">8 Role Inti</span>
                </div>
                {mockRoles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => {
                      loginAsRole(role.id);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-start justify-between mb-1 ${
                      currentRole === role.id
                        ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                          {role.number}
                        </span>
                        <span className="font-extrabold">{role.title}</span>
                      </div>
                      <span className="text-[10px] text-blue-600 block mt-0.5">{role.badge}</span>
                      <span className="text-[10px] text-slate-400 block line-clamp-1">{role.organization}</span>
                      <span className="text-[9px] text-slate-500 block font-mono mt-0.5">
                        Scope: {role.defaultScope.name}
                      </span>
                    </div>
                    {currentRole === role.id && (
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
                    <span>Lihat Matriks Lengkap RBAC</span>
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

      {/* Main Brand & Tab Navigation */}
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
  );
};
