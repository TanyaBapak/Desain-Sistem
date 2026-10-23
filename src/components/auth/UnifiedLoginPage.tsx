import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Fingerprint,
  Smartphone,
  ExternalLink,
  Info,
  Clock,
  Layers,
  Search,
  Check,
  Briefcase
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { mockUsers, UserAccount } from '../../data';

export const UnifiedLoginPage: React.FC = () => {
  const { loginWithAccount, setViewMode } = useAppStore();

  // Mode: 'card-select' (Pilih Akun Stakeholder) vs 'manual-form' (Form Login Mandiri)
  const [loginMode, setLoginMode] = useState<'card-select' | 'manual-form'>('card-select');

  // Form State
  const [selectedUser, setSelectedUser] = useState<UserAccount>(mockUsers[2]); // Default: Task Force
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [mfaCode, setMfaCode] = useState<string>('829104');
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'nasional' | 'daerah' | 'vokasi' | 'verifikasi'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Auto-detect matching user from usernameInput
  const detectedUser = mockUsers.find(
    (u) =>
      u.username.toLowerCase() === usernameInput.trim().toLowerCase() ||
      u.email.toLowerCase() === usernameInput.trim().toLowerCase() ||
      (u.nip && u.nip === usernameInput.trim())
  );

  // Directly login with a specific account (from Card Click)
  const handleDirectLogin = (user: UserAccount) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    setTimeout(() => {
      loginWithAccount(user, {
        mfaVerified: user.mfaEnabled,
        ipAddress: '10.24.120.88',
      });
      setIsSubmitting(false);
    }, 300);
  };

  // Submit manual login form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!usernameInput.trim()) {
      setErrorMessage('Username, Email, atau NIP wajib diisi.');
      return;
    }

    // Match account
    const matched = detectedUser || selectedUser;
    if (!matched) {
      setErrorMessage('Akun pengguna tidak ditemukan dalam database SSO.');
      return;
    }

    // Password validation (accepts matched.password or p2mi@2026 or demo)
    const validPassword = matched.password || 'p2mi@2026';
    if (passwordInput && passwordInput !== validPassword && passwordInput !== '••••••••••••') {
      setErrorMessage(`Kata sandi tidak cocok untuk akun @${matched.username}. (Petunjuk simulasi: p2mi@2026)`);
      return;
    }

    if (matched.mfaEnabled && mfaCode.length < 6) {
      setErrorMessage('Masukkan 6-digit kode OTP Multi-Factor Authentication.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      loginWithAccount(matched, {
        mfaVerified: matched.mfaEnabled,
        ipAddress: '10.24.120.88',
      });
      setIsSubmitting(false);
    }, 400);
  };

  // Filter accounts by category and search
  const filteredUsers = mockUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.landingTabTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.scope.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeCategory === 'nasional') {
      return ['USR-001', 'USR-002', 'USR-003', 'USR-004'].includes(u.id);
    }
    if (activeCategory === 'daerah') {
      return ['USR-005', 'USR-006', 'USR-007'].includes(u.id);
    }
    if (activeCategory === 'vokasi') {
      return ['USR-008', 'USR-009', 'USR-011'].includes(u.id);
    }
    if (activeCategory === 'verifikasi') {
      return ['USR-010', 'USR-012', 'USR-013'].includes(u.id);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-red-600 selection:text-white font-sans relative overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Bar Navigation */}
      <div className="w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3 flex items-center justify-between z-10">
        <button
          onClick={() => setViewMode('landing')}
          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Portal Publik</span>
        </button>

        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Protokol Keamanan Nasional: <strong>RBAC + Data Scope ISO/IEC 27001</strong></span>
          </div>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30">
            Single Sign-On (SSO) Terpadu
          </span>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 flex-1 flex flex-col justify-center">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Fingerprint className="w-3.5 h-3.5 text-red-400" />
            <span>Portal Autentikasi Tunggal (SSO) Terpadu</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            SMK GO GLOBAL COMMAND CENTER
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-2xl mx-auto">
            Setiap stakeholder login menggunakan akun pribadinya masing-masing. Sistem secara otomatis membuka dashboard kerja, batas kewenangan wilayah, dan hak akses CRUD sesuai rolenya.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl mt-5 shadow-inner">
            <button
              onClick={() => setLoginMode('card-select')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                loginMode === 'card-select'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pilih Akun Stakeholder (13 Role)</span>
            </button>
            <button
              onClick={() => setLoginMode('manual-form')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                loginMode === 'manual-form'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Input Mandiri (Username & Sandi)</span>
            </button>
          </div>
        </div>

        {/* ==================================================== */}
        {/* VIEW MODE 1: Pilih Akun Stakeholder (13 Role Mandiri) */}
        {/* ==================================================== */}
        {loginMode === 'card-select' && (
          <div className="space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
              {/* Category Filter & Search Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition ${
                      activeCategory === 'all'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua Stakeholder (13)
                  </button>
                  <button
                    onClick={() => setActiveCategory('nasional')}
                    className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition ${
                      activeCategory === 'nasional'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Pusat & Pimpinan (4)
                  </button>
                  <button
                    onClick={() => setActiveCategory('daerah')}
                    className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition ${
                      activeCategory === 'daerah'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Daerah & BP3MI (3)
                  </button>
                  <button
                    onClick={() => setActiveCategory('vokasi')}
                    className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition ${
                      activeCategory === 'vokasi'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Lembaga Vokasi & Demand (3)
                  </button>
                  <button
                    onClick={() => setActiveCategory('verifikasi')}
                    className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition ${
                      activeCategory === 'verifikasi'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Verifikasi & Audit (3)
                  </button>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari role, nama, wilayah..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Stakeholder Cards Grid */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/80 rounded-2xl p-4 transition-all flex flex-col justify-between group shadow-sm hover:shadow-xl"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Role #{user.no}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {user.mfaEnabled && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                              MFA Aktif
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                            @{user.username}
                          </span>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex items-start gap-2.5 mb-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                          {user.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-white truncate group-hover:text-blue-300 transition">
                            {user.name}
                          </h4>
                          <p className="text-[11px] font-bold text-amber-400 truncate">
                            {user.roleTitle}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {user.organization}
                          </p>
                        </div>
                      </div>

                      {/* Scope Badge */}
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-300 mb-2 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                        <span className="truncate">Scope: <strong>{user.scope.name}</strong></span>
                      </div>

                      {/* Destination Dashboard Ribbon */}
                      <div className="p-2 rounded-xl bg-blue-950/40 border border-blue-900/50 text-[11px] text-blue-300 flex items-center justify-between mb-3">
                        <span className="text-slate-400 text-[10px]">Langsung membuka:</span>
                        <span className="font-extrabold text-amber-300 flex items-center gap-1">
                          <span>{user.landingTabTitle}</span>
                        </span>
                      </div>
                    </div>

                    {/* Login Action Button */}
                    <button
                      onClick={() => handleDirectLogin(user)}
                      disabled={isSubmitting}
                      className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white transition flex items-center justify-center gap-1.5 shadow-sm group-hover:bg-gradient-to-r group-hover:from-red-600 group-hover:to-blue-600"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Masuk sebagai {user.roleTitle.split('/')[0].trim()}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW MODE 2: Form Input Mandiri (Username & Sandi)  */}
        {/* ==================================================== */}
        {loginMode === 'manual-form' && (
          <div className="max-w-xl mx-auto w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
            {/* Visual Accent */}
            <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 rounded-t-3xl" />

            {/* Ministry Branding */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
              <img
                src="/logo.png"
                alt="Logo Resmi"
                className="w-12 h-12 object-contain shrink-0"
              />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-red-500">
                  REPUBLIK INDONESIA
                </p>
                <h2 className="text-base font-black text-white leading-tight">
                  Kementerian P2MI & Kemnaker
                </h2>
                <p className="text-[11px] text-slate-400">
                  Sistem Autentikasi Elektronik Identitas Berhak
                </p>
              </div>
            </div>

            {/* Quick Stakeholder Selector Dropdown */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Pilih Stakeholder Terdaftar <span className="text-slate-400 font-normal">(Atau ketik sendiri di bawah)</span>:
              </label>
              <select
                value={detectedUser?.id || selectedUser.id}
                onChange={(e) => {
                  const user = mockUsers.find((u) => u.id === e.target.value);
                  if (user) {
                    setSelectedUser(user);
                    setUsernameInput(user.username);
                    setPasswordInput(user.password || 'p2mi@2026');
                    setErrorMessage(null);
                  }
                }}
                className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {mockUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    #{u.no} {u.roleTitle} — {u.name} (@{u.username})
                  </option>
                ))}
              </select>
            </div>

            {/* Active Account Identity Preview Card */}
            {(detectedUser || selectedUser) && (
              <div className="mb-5 p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                  {(detectedUser || selectedUser).avatarInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-white truncate">
                      {(detectedUser || selectedUser).name}
                    </h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                      Role #{(detectedUser || selectedUser).no}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-amber-400 truncate">
                    {(detectedUser || selectedUser).roleTitle}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 truncate">
                    <MapPin className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                    <span className="truncate">{(detectedUser || selectedUser).scope.name}</span>
                  </div>
                  <div className="mt-2 text-[10px] font-bold text-blue-300 flex items-center gap-1">
                    <span>Membuka:</span>
                    <span className="text-amber-300">{(detectedUser || selectedUser).landingTabTitle}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Username / NIP */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Username / Email / NIP
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => {
                      setUsernameInput(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Contoh: menteri / disnaker.bogor / superadmin / smkn1cibinong..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Kata Sandi Keamanan
                  </label>
                  <span className="text-[10px] text-blue-400">
                    Sandi default: <code className="font-mono text-amber-300">p2mi@2026</code>
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Masukkan sandi..."
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* MFA / 2FA Section */}
              {(detectedUser || selectedUser).mfaEnabled && (
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Multi-Factor Authentication (MFA)
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          Kode simulasi OTP aktif: 829104
                        </span>
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="829104"
                    className="w-full text-center tracking-[0.5em] font-mono font-bold text-sm py-2 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-red-600 hover:from-red-500 to-rose-600 hover:to-rose-500 shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi Kredensial SSO...</span>
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Masuk ke Dashboard {(detectedUser || selectedUser).landingTabTitle}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="w-full bg-slate-950 border-t border-slate-800/80 px-4 py-4 text-center text-xs text-slate-500">
        <p>
          © 2026 Kementerian Pelindungan Pekerja Migran Indonesia (P2MI) / Kemenaker RI • Sistem Masuk Tunggal Terpadu (SSO)
        </p>
      </div>
    </div>
  );
};
