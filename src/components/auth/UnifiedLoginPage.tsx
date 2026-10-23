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
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { mockUsers, UserAccount } from '../../data';

export const UnifiedLoginPage: React.FC = () => {
  const { loginWithAccount, setViewMode } = useAppStore();

  // Form State
  const [selectedUser, setSelectedUser] = useState<UserAccount>(mockUsers[2]); // Default: Task Force Nasional
  const [usernameInput, setUsernameInput] = useState<string>(mockUsers[2].username);
  const [passwordInput, setPasswordInput] = useState<string>('••••••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [mfaCode, setMfaCode] = useState<string>('829104');
  const [mfaActive, setMfaActive] = useState<boolean>(mockUsers[2].mfaEnabled);
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'nasional' | 'daerah' | 'vokasi' | 'verifikasi'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Handle selecting quick demo stakeholder
  const handleSelectAccount = (user: UserAccount) => {
    setSelectedUser(user);
    setUsernameInput(user.username);
    setPasswordInput('••••••••••••');
    setMfaActive(user.mfaEnabled);
    setErrorMessage(null);
  };

  // Submit login form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!usernameInput.trim()) {
      setErrorMessage('Username atau NIP wajib diisi.');
      return;
    }

    if (mfaActive && mfaCode.length < 6) {
      setErrorMessage('Masukkan 6-digit kode OTP Multi-Factor Authentication.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Find matching account by username or fallback to selected
      const matched =
        mockUsers.find(
          (u) =>
            u.username.toLowerCase() === usernameInput.toLowerCase() ||
            u.email.toLowerCase() === usernameInput.toLowerCase() ||
            u.nip === usernameInput
        ) || selectedUser;

      loginWithAccount(matched, {
        mfaVerified: mfaActive,
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
      u.landingTabTitle.toLowerCase().includes(searchQuery.toLowerCase());

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
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex-1 flex flex-col justify-center">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Fingerprint className="w-3.5 h-3.5 text-red-400" />
            <span>Pintu Masuk Terpadu Seluruh Stakeholder</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            SMK GO GLOBAL COMMAND CENTER
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            1 Portal Login Terpusat untuk 13 Kelompok Role & Pemangku Kepentingan Nasional. Sistem otomatis mengarahkan ke dashboard dan batas kewenangan Anda.
          </p>
        </div>

        {/* 2-Column Layout: Left (Official Login Form), Right (Stakeholder Directory) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Unified Login Form (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
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
                  Autentikasi Elektronik Identitas Berhak
                </p>
              </div>
            </div>

            {/* Selected User Snapshot Info Card */}
            <div className="mb-6 p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                {selectedUser.avatarInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-white truncate">
                    {selectedUser.name}
                  </h4>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                    Role #{selectedUser.no}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-amber-400 truncate">
                  {selectedUser.roleTitle}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 truncate">
                  <MapPin className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                  <span className="truncate">{selectedUser.scope.name}</span>
                </div>
              </div>
            </div>

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
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Masukkan username atau NIP..."
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
                  <span className="text-[10px] text-blue-400 cursor-pointer hover:underline">
                    Lupa sandi?
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••••••"
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
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Multi-Factor Authentication (MFA)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {selectedUser.mfaEnabled
                          ? 'Wajib untuk hak akses strategis & nasional'
                          : 'Opsional untuk role operasional'}
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mfaActive}
                      onChange={(e) => setMfaActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {mfaActive && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Kode OTP Authenticator:</span>
                      <span className="text-emerald-400 font-mono font-bold">Simulasi Aktif: 829104</span>
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
              </div>

              {/* Target Redirect Indicator */}
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Halaman awal setelah login:</span>
                <span className="font-extrabold text-blue-300 flex items-center gap-1">
                  <span>{selectedUser.landingTabTitle}</span>
                  <ArrowRight className="w-3 h-3 text-blue-400" />
                </span>
              </div>

              {/* Remember Me & Policy */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Ingat sesi di perangkat ini</span>
                </label>
                <span className="text-[11px] text-slate-500">Masa sesi: 30 menit</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-red-600 hover:from-red-500 to-rose-600 hover:to-rose-500 shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memvalidasi Kredensial SSO...</span>
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Masuk ke Dashboard ({selectedUser.roleTitle})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RIGHT: Quick Stakeholder Role Selector (All 13 Roles) (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      Daftar 13 Stakeholder Resmi
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Klik salah satu akun untuk auto-fill & demonstrasi redirect otomatis ke dashboardnya:
                  </p>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari role/nama..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-3 border-b border-slate-800/80 text-xs">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                    activeCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Semua (13 Role)
                </button>
                <button
                  onClick={() => setActiveCategory('nasional')}
                  className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                    activeCategory === 'nasional'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Pusat & Pimpinan (4)
                </button>
                <button
                  onClick={() => setActiveCategory('daerah')}
                  className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                    activeCategory === 'daerah'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Daerah & BP3MI (3)
                </button>
                <button
                  onClick={() => setActiveCategory('vokasi')}
                  className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                    activeCategory === 'vokasi'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Lembaga & Demand (3)
                </button>
                <button
                  onClick={() => setActiveCategory('verifikasi')}
                  className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                    activeCategory === 'verifikasi'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Verifikasi & Audit (3)
                </button>
              </div>

              {/* Accounts Grid */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUser.id === user.id;
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleSelectAccount(user)}
                      className={`p-3 rounded-2xl border cursor-pointer transition text-left relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-900/30 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                          : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        {/* Top Tag & Number */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                            #{user.no}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider truncate ${
                              user.mfaEnabled
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {user.mfaEnabled ? 'MFA Wajib' : 'Standar'}
                          </span>
                        </div>

                        {/* Role Title & Name */}
                        <h4 className="text-xs font-black text-white line-clamp-1">
                          {user.roleTitle}
                        </h4>
                        <p className="text-[11px] text-slate-300 font-medium line-clamp-1 mt-0.5">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {user.organization}
                        </p>
                      </div>

                      {/* Initial Landing Page Badge */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Tujuan Login:</span>
                        <span className="font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/60 truncate max-w-[170px]">
                          {user.landingTabTitle}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Architecture Explanatory Box (Principles 1, 2, 4) */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Rancangan Alur Keamanan SSO & Sesi Mandiri</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-slate-300">
                <li>
                  <strong>1 Pintu Masuk Terpadu:</strong> Seluruh 13 role menggunakan mekanisme autentikasi dan form login yang sama.
                </li>
                <li>
                  <strong>Redirect Otomatis:</strong> Selesai login, sistem membaca atribut role & scope lalu langsung mengarahkan pengguna ke dashboard kewenangannya.
                </li>
                <li>
                  <strong>Pencegahan Tombol Back:</strong> Saat logout, token sesi dihancurkan. Pengguna tidak dapat menekan 'Back' untuk melihat data internal tanpa login ulang.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer System Disclaimer */}
      <div className="w-full bg-slate-950 border-t border-slate-900 py-4 px-4 text-center text-xs text-slate-500">
        <p>
          Sistem Komando SGG-CC © 2026 Kementerian Pelindungan Pekerja Migran Indonesia & Kementerian Ketenagakerjaan RI.
        </p>
        <p className="text-[11px] text-slate-600 mt-0.5">
          Akses tidak sah terhadap data internal dilindungi UU ITE No. 1 Tahun 2024 dan UU PDP No. 27 Tahun 2022.
        </p>
      </div>
    </div>
  );
};
