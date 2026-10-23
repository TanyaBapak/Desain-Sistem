import { FormEvent, useState } from "react";
import { useForm, router } from "@inertiajs/react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { LOGO_URL } from "@/lib/assets";

export function UnifiedLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { data, setData, post, processing, errors } = useForm({
    identifier: "",
    password: "",
    remember: false,
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    post("/login");
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute left-1/3 top-0 h-[600px] w-[600px] rounded-full bg-red-600/10 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[150px]" />

      <header className="z-10 flex w-full items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-4 py-3 backdrop-blur-md sm:px-8">
        <button
          type="button"
          onClick={() => router.visit("/")}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Portal Publik
        </button>
        <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Autentikasi sesi terkelola server
        </div>
      </header>

      <main className="z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-12">
        <section className="relative rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl sm:p-9">
          <div className="absolute left-8 right-8 top-0 h-1 rounded-t-3xl bg-gradient-to-r from-red-600 via-amber-500 to-blue-600" />

          <div className="mb-6 flex items-center gap-3.5 border-b border-slate-800 pb-6">
            <img src={LOGO_URL} alt="Logo SMK Go Global" className="h-12 w-12 shrink-0 object-contain" />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-red-500">
                REPUBLIK INDONESIA
              </p>
              <h1 className="text-base font-black leading-tight text-white sm:text-lg">
                SMK GO GLOBAL COMMAND CENTER
              </h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Masuk menggunakan akun yang telah terdaftar
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {errors.identifier && (
              <p role="alert" className="rounded-xl border border-red-800 bg-red-950/80 p-3 text-sm text-red-300">
                {errors.identifier}
              </p>
            )}
            {errors.password && (
              <p role="alert" className="rounded-xl border border-red-800 bg-red-950/80 p-3 text-sm text-red-300">
                {errors.password}
              </p>
            )}

            <div>
              <label htmlFor="identifier" className="mb-1.5 block text-sm font-bold text-slate-300">
                Username, email, atau NIP
              </label>
              <div className="relative">
                <UserRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="identifier"
                  name="identifier"
                  autoComplete="username"
                  required
                  value={data.identifier}
                  onChange={(event) => setData("identifier", event.target.value)}
                  placeholder="Masukkan username, email, atau NIP"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-slate-300">
                Kata sandi
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={data.password}
                  onChange={(event) => setData("password", event.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-11 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={data.remember}
                onChange={(event) => setData("remember", event.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-ring"
              />
              Ingat sesi di perangkat ini
            </label>

            <button
              type="submit"
              disabled={processing}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-600/30 transition hover:from-red-500 hover:to-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-50"
            >
              {processing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Memverifikasi akun…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Masuk ke sistem
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </section>
      </main>

      <footer className="z-10 w-full border-t border-slate-800/80 bg-slate-950 px-4 py-4 text-center text-xs text-slate-500">
        © 2026 SMK Go Global · Portal autentikasi
      </footer>
    </div>
  );
}
