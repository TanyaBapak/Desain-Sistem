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
  Fingerprint,
  Smartphone,
  ChevronDown,
  Info
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { mockUsers, UserAccount } from '../../data';

export const UnifiedLoginPage: React.FC = () => {
  const { loginWithAccount, setViewMode } = useAppStore();

  // Form State
  const [usernameInput, setUsernameInput] = useState<string>('taskforce');
  const [passwordInput, setPasswordInput] = useState<string>('p2mi@2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [mfaCode, setMfaCode] = useState<string>('829104');
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-detect matching user from usernameInput
  const matchedUser: UserAccount | undefined = mockUsers.find(
    (u) =>
      u.username.toLowerCase() === usernameInput.trim().toLowerCase() ||
      u.email.toLowerCase() === usernameInput.trim().toLowerCase() ||
      (u.nip && u.nip === usernameInput.trim())
  );

  // Quick Account Select Handler
  const handleQuickSelect = (userId: string) => {
    const user = mockUsers.find((u) => u.id === userId);
    if (user) {
      setUsernameInput(user.username);
      setPasswordInput(user.password || 'p2mi@2026');
      setErrorMessage(null);
    }
  };

  // Submit login form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!usernameInput.trim()) {
      setErrorMessage('Username, Email, atau NIP wajib diisi.');
      return;
    }

    if (!matchedUser) {
      setErrorMessage('Akun pengguna tidak ditemukan dalam database SSO Kementerian.');
      return;
    }

    // Password validation (accepts matchedUser.password or default p2mi@2026)
    const validPassword = matchedUser.password || 'p2mi@2026';
    if (passwordInput && passwordInput !== validPassword && passwordInput !== '••••••••••••') {
      setErrorMessage(`Kata sandi tidak cocok untuk akun @${matchedUser.username}. (Petunjuk simulasi: p2mi@2026)`);
      return;
    }

    if (matchedUser.mfaEnabled && mfaCode.length < 6) {
      setErrorMessage('Masukkan 6-digit kode OTP Multi-Factor Authentication.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      loginWithAccount(matchedUser, {
        mfaVerified: matchedUser.mfaEnabled,
        ipAddress: '10.24.120.88',
      });
      setIsSubmitting(false);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-red-600 selection:text-white font-sans relative overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

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

      {/* Main Form Center Card */}
      <div className="max-w-xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-9 shadow-2xl backdrop-blur-xl relative">
          {/* Visual Accent */}
          <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 rounded-t-3xl" />

          {/* Ministry Branding Header */}
          <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-slate-800">
            <img
              src="/logo.png"
              alt="Logo Resmi"
              className="w-12 h-12 object-contain shrink-0"
            />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-red-500">
                REPUBLIK INDONESIA
              </p>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                SMK GO GLOBAL COMMAND CENTER
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Portal Autentikasi Elektronik Identitas Berhak (SSO)
              </p>
            </div>
          </div>

          {/* Fast Persona Switcher (Subtle Helper for testing without 13 cards) */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Pilih Akun Stakeholder Terdaftar:</span>
              <span className="text-[11px] text-slate-400 font-normal">Atau ketik username mandiri</span>
            </label>
            <div className="relative">
              <select
                value={matchedUser?.id || ''}
                onChange={(e) => handleQuickSelect(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none cursor-pointer pr-8"
              >
                {mockUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    #{u.no} {u.roleTitle} — {u.name} (@{u.username})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Active Account Identity Card Preview */}
          {matchedUser && (
            <div className="mb-5 p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                {matchedUser.avatarInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-white truncate">
                    {matchedUser.name}
                  </h4>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                    Role #{matchedUser.no}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-amber-400 truncate">
                  {matchedUser.roleTitle}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 truncate">
                  <MapPin className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                  <span className="truncate">Scope: {matchedUser.scope.name}</span>
                </div>
                <div className="mt-2 text-[10px] font-semibold text-blue-300 flex items-center gap-1.5 pt-1.5 border-t border-slate-700/60">
                  <span className="text-slate-400">Otomatis membuka:</span>
                  <span className="font-extrabold text-amber-300">{matchedUser.landingTabTitle}</span>
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
                  required
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Ketik username (menteri, disnaker.bogor, superadmin...)"
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
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan kata sandi..."
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

            {/* MFA / 2FA Section (Auto shown if required for account) */}
            {matchedUser?.mfaEnabled && (
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

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
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
              className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-red-600 hover:from-red-500 to-rose-600 hover:to-rose-500 shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Kredensial SSO...</span>
                </span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Masuk ke Dashboard {matchedUser ? matchedUser.landingTabTitle : 'Command Center'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
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
