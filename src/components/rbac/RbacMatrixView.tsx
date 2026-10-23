import React, { useState } from 'react';
import {
  ShieldCheck,
  Key,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Minus,
  Layers,
  Users,
  Eye,
  PlusCircle,
  Edit3,
  FileCheck2,
  Trash2,
  Download,
  Info,
  ExternalLink,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { mockRoles, stakeholderRoles13, getRoleById } from '../../data';
import { UserRole, MenuModuleId, AccessLevel } from '../../types';

export const RbacMatrixView: React.FC = () => {
  const { currentRole, currentScope, loginAsRole, setCurrentScope } = useAppStore();
  const [selectedRoleForDetail, setSelectedRoleForDetail] = useState<UserRole>(currentRole);
  const [viewTab, setViewTab] = useState<'matrix' | 'layers' | 'roles13'>('matrix');

  const selectedRoleObj = getRoleById(selectedRoleForDetail);
  const activeRoleObj = getRoleById(currentRole);

  const menuRows: { id: MenuModuleId; label: string; description: string }[] = [
    { id: 'overview', label: 'Dashboard Nasional', description: 'Capaian target 50.000, agregat supply-demand, & drill-down wilayah' },
    { id: 'modul-a', label: 'Data Calon Peserta', description: 'Biodata CPMI vokasi, NIK Dukcapil, kompetensi, & bahasa' },
    { id: 'modul-b', label: 'Program Pelatihan', description: 'Katalog upskilling/reskilling, JP silabus, & sertifikasi SSW' },
    { id: 'modul-c', label: 'Data Lembaga Vokasi', description: 'Profil SMK/BLK, akreditasi e-Vokasi, & kapasitas bengkel kerja' },
    { id: 'modul-d', label: 'Demand Luar Negeri', description: 'Permintaan tenaga kerja resmi Jepang, Jerman, Korea, Taiwan' },
    { id: 'matching', label: 'Matching & Penempatan', description: 'Komputasi algoritma kecocokan kandidat & penetapan batch' },
    { id: 'approvals', label: 'Alur Persetujuan Data', description: 'Pemeriksaan validitas data, persetujuan, penolakan, & revisi' },
    { id: 'audit', label: 'Audit Log & Riwayat', description: 'Pencatatan jejak mutasi data, aktor, waktu, & nilai sebelum/sesudah' },
    { id: 'rbac', label: 'Manajemen Akun & Role', description: 'Konfigurasi kredensial pengguna, assignment role, & batasan scope' },
  ];

  const coreRolesForMatrix: { id: UserRole; shortName: string; color: string }[] = [
    { id: 'pimpinan', shortName: 'Pimpinan', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { id: 'taskforce', shortName: 'Task Force', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: 'disnaker', shortName: 'Disnaker', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { id: 'vokasi', shortName: 'Lembaga', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { id: 'demand', shortName: 'Demand LN', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    { id: 'verifikator', shortName: 'Verifikator', color: 'bg-rose-100 text-rose-800 border-rose-200' },
    { id: 'matching', shortName: 'Matching', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { id: 'superadmin', shortName: 'Super Admin', color: 'bg-slate-200 text-slate-800 border-slate-300' },
  ];

  const renderAccessIcon = (level: AccessLevel) => {
    if (level === 'full') {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-xs" title="Akses Utama (Full)">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span className="text-xs">● Utama</span>
        </span>
      );
    }
    if (level === 'limited') {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-xs" title="Akses Terbatas / Ter-Scope">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span className="text-xs">◐ Terbatas</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center font-bold text-slate-400 text-xs" title="Tidak Ada Akses">
        —
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Arsitektur Keamanan 3 Lapisan (3-Layer RBAC)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Matriks Hak Akses, Permission & Batasan Scope
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Prinsip integritas data SGG Command Center: <em>"Menteri fokus memantau, Task Force mengendalikan program, sedangkan dinas dan lembaga menginput serta memvalidasi data sesuai kewenangan wilayahnya."</em>
            </p>
          </div>

          {/* Active Role Status & Switcher Card */}
          <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 text-xs space-y-3 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Peran Aktif Anda:</span>
              <span className="px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {activeRoleObj.title}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Scope Wilayah:</span>
              <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                {currentScope.name}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-indigo-300">
              <span>Tingkat Scope: <strong className="uppercase">{currentScope.level}</strong></span>
              <span className="text-emerald-400 font-bold">● Terautentikasi</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setViewTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              viewTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Matriks Akses Menu (8 Role Utama)</span>
          </button>
          <button
            onClick={() => setViewTab('layers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              viewTab === 'layers'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Konsep 3 Lapisan (Role, Permission, Scope)</span>
          </button>
          <button
            onClick={() => setViewTab('roles13')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              viewTab === 'roles13'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Daftar 13 Stakeholder Lengkap</span>
          </button>
        </div>
      </div>

      {/* VIEW TAB 1: Matriks Akses Menu Aplikasi */}
      {viewTab === 'matrix' && (
        <div className="space-y-6">
          {/* Interactive Role Switcher Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Simulasikan & Uji Hak Akses Sebagai Stakeholder:
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih role di bawah untuk melihat aplikasi secara langsung dari sudut pandang stakeholder tersebut.
                </p>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Klik tombol peran untuk berganti sesi:
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {mockRoles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    loginAsRole(role.id);
                    setSelectedRoleForDetail(role.id);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold text-left transition border flex flex-col justify-between ${
                    currentRole === role.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="text-[10px] opacity-80 block truncate">
                    No. {role.number}
                  </span>
                  <span className="font-extrabold truncate block">
                    {role.title.split('/')[0]}
                  </span>
                  <span className="text-[9px] mt-1 block truncate opacity-75">
                    {currentRole === role.id ? '✓ Sedang Aktif' : 'Ganti Role'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Matrix Table matching Blueprint Section 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Tabel Matriks Hak Akses per Modul Menu Aplikasi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Keterangan: <strong className="text-emerald-700 font-bold">● Akses utama</strong> (Full CRUD/Approval), <strong className="text-amber-700 font-bold">◐ Akses terbatas</strong> (Scoped sesuai wilayah/lembaga), <strong className="text-slate-400 font-bold">— Tidak ada akses</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                  ● Utama
                </span>
                <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                  ◐ Terbatas
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 border border-slate-200 font-bold text-[11px]">
                  — Tidak Ada
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700">
                    <th className="py-3 px-4 font-extrabold w-64 sticky left-0 bg-slate-100 z-10 shadow-xs">
                      Menu Aplikasi
                    </th>
                    {coreRolesForMatrix.map((r) => (
                      <th
                        key={r.id}
                        className={`py-3 px-3 text-center font-bold whitespace-nowrap cursor-pointer hover:bg-slate-200 transition ${
                          selectedRoleForDetail === r.id ? 'bg-blue-50 text-blue-900 ring-1 ring-blue-300' : ''
                        }`}
                        onClick={() => setSelectedRoleForDetail(r.id)}
                        title={`Klik untuk melihat rincian permission ${r.shortName}`}
                      >
                        <div className="flex flex-col items-center">
                          <span>{r.shortName}</span>
                          {currentRole === r.id && (
                            <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full font-black mt-0.5">
                              Aktif
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {menuRows.map((menu) => (
                    <tr key={menu.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 sticky left-0 bg-white font-medium text-slate-900 shadow-xs">
                        <div className="font-bold text-slate-800">{menu.label}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{menu.description}</div>
                      </td>
                      {coreRolesForMatrix.map((r) => {
                        const roleObj = getRoleById(r.id);
                        const perm = roleObj.permissions[menu.id];
                        const isSelectedCol = selectedRoleForDetail === r.id;
                        return (
                          <td
                            key={r.id}
                            className={`py-3 px-3 text-center transition ${
                              isSelectedCol ? 'bg-blue-50/30 font-bold' : ''
                            }`}
                          >
                            {perm ? renderAccessIcon(perm.accessLevel) : <span className="text-slate-300">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Granular Permission Breakdown for Selected Role */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-lg">
                  {selectedRoleObj.number}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      Rincian Hak Akses & Scope: {selectedRoleObj.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {selectedRoleObj.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedRoleObj.organization} — {selectedRoleObj.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentRole !== selectedRoleObj.id && (
                  <button
                    onClick={() => loginAsRole(selectedRoleObj.id)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center gap-1.5"
                  >
                    <span>Masuk sebagai {selectedRoleObj.title.split('/')[0]}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scope Badge Summary */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span>
                  <strong>Batasan Scope Wilayah Default:</strong> {selectedRoleObj.defaultScope.name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <span>Tingkat: <strong className="text-slate-800 uppercase">{selectedRoleObj.defaultScope.level}</strong></span>
                <span>•</span>
                <span>Tab Awal: <strong className="text-blue-700 font-bold">{selectedRoleObj.defaultTab}</strong></span>
              </div>
            </div>

            {/* Granular Table (View, Create, Edit, Verify, Approve, Delete, Export) */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Menu Modul</th>
                    <th className="py-2.5 px-2 text-center">Lihat</th>
                    <th className="py-2.5 px-2 text-center">Input Baru</th>
                    <th className="py-2.5 px-2 text-center">Ubah Data</th>
                    <th className="py-2.5 px-2 text-center">Verifikasi</th>
                    <th className="py-2.5 px-2 text-center">Persetujuan</th>
                    <th className="py-2.5 px-2 text-center">Hapus</th>
                    <th className="py-2.5 px-2 text-center">Export</th>
                    <th className="py-2.5 px-3">Aturan Batasan Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.values(selectedRoleObj.permissions).map((p) => (
                    <tr key={p.moduleId} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-800">
                        {p.moduleName}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {p.canView ? <Check className="w-3.5 h-3.5 text-emerald-600 mx-auto" /> : <Minus className="w-3 h-3 text-slate-300 mx-auto" />}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {p.canCreate ? <Check className="w-3.5 h-3.5 text-emerald-600 mx-auto" /> : <Minus className="w-3 h-3 text-slate-300 mx-auto" />}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {p.canEdit ? <Check className="w-3.5 h-3.5 text-emerald-600 mx-auto" /> : <Minus className="w-3 h-3 text-slate-300 mx-auto" />}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {p.canVerify ? <Check className="w-3.5 h-3.5 text-emerald-600 mx-auto" /> : <Minus className="w-3 h-3 text-slate-300 mx-auto" />}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {p.canApprove ? <Check className="w-3.5 h-3.5 text-emerald-600 mx-auto" /> : <Minus className="w-3 h-3 text-slate-300 mx-auto" />}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {p.canDelete ? <Check className="w-3.5 h-3.5 text-rose-600 mx-auto" /> : <Minus className="w-3 h-3 text-slate-300 mx-auto" />}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {p.canExport ? <Check className="w-3.5 h-3.5 text-emerald-600 mx-auto" /> : <Minus className="w-3 h-3 text-slate-300 mx-auto" />}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-600">
                        {p.scopeRule}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 2: Konsep 3 Lapisan (Role, Permission, Scope) */}
      {viewTab === 'layers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Layer 1: Role */}
            <div className="bg-white rounded-2xl p-6 border-t-4 border-t-blue-600 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Lapisan 1: Role (Jenis Pengguna)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Identitas pemangku kepentingan yang mengelompokkan pengguna berdasarkan fungsi kelembagaannya (misal: Menteri, Task Force, Disnaker, Lembaga Vokasi, Employer, Verifikator).
                </p>
                <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-xs text-blue-900">
                  <strong>Penerapan:</strong> Menentukan modul utama yang muncul di navigasi dan halaman beranda pertama setelah login.
                </div>
              </div>
            </div>

            {/* Layer 2: Permission */}
            <div className="bg-white rounded-2xl p-6 border-t-4 border-t-indigo-600 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Lapisan 2: Permission (Tindakan)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Batasan tindakan granular yang boleh dieksekusi pada data: <strong>Lihat (Read)</strong>, <strong>Input (Create)</strong>, <strong>Ubah (Update)</strong>, <strong>Verifikasi (Validate)</strong>, <strong>Persetujuan (Approve)</strong>, dan <strong>Export</strong>.
                </p>
                <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-900">
                  <strong>Penerapan:</strong> Operator Disnaker boleh menginput tapi tidak boleh menyetujui. Verifikator boleh menyetujui tapi tidak boleh mengubah data substantif.
                </div>
              </div>
            </div>

            {/* Layer 3: Scope */}
            <div className="bg-white rounded-2xl p-6 border-t-4 border-t-rose-600 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Lapisan 3: Scope (Lingkup Data/Wilayah)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pembatas baris data (Row-Level Security) berdasarkan yurisdiksi: <strong>Nasional</strong>, <strong>Provinsi</strong>, <strong>Kabupaten/Kota</strong>, <strong>Lembaga ID</strong>, atau <strong>Demand ID</strong>.
                </p>
                <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100 text-xs text-rose-900">
                  <strong>Penerapan:</strong> Disnaker Kab. Bogor hanya melihat data calon asal Bogor; SMK hanya mengelola kelas milik lembaganya sendiri.
                </div>
              </div>
            </div>
          </div>

          {/* Flow Diagram Banner */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <h4 className="text-base font-extrabold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Bagaimana Permintaan Data Diproses Melalui 3 Lapisan:</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <span className="text-indigo-400 font-extrabold block text-sm mb-1">Step 1: Autentikasi</span>
                <p className="text-slate-300">Pengguna login & sistem mendeteksi Role (contoh: <code>disnaker</code>).</p>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <span className="text-indigo-400 font-extrabold block text-sm mb-1">Step 2: Cek Permission</span>
                <p className="text-slate-300">Sistem memverifikasi apakah Role memiliki hak <code>canCreate</code> atau <code>canView</code> pada modul.</p>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <span className="text-indigo-400 font-extrabold block text-sm mb-1">Step 3: Injeksi Filter Scope</span>
                <p className="text-slate-300">Sistem otomatis menambahkan klausa filter: <code>WHERE kabupaten = 'Kabupaten Bogor'</code>.</p>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <span className="text-emerald-400 font-extrabold block text-sm mb-1">Step 4: Catat ke Audit Log</span>
                <p className="text-slate-300">Setiap mutasi data disimpan lengkap dengan nama aktor, waktu, dan alasan.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 3: Daftar 13 Stakeholder Lengkap */}
      {viewTab === 'roles13' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-base font-extrabold text-slate-900">
                Daftar 13 Stakeholder SGG Command Center (Blueprint Lengkap)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemetaan kewenangan lengkap dan pengelompokan ke dalam 8 core group MVP.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {stakeholderRoles13.map((stk) => (
                <div key={stk.no} className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center shrink-0">
                      {stk.no}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-sm">{stk.name}</h4>
                        <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                          Scope: {stk.scopeType}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed">
                        {stk.primaryAccess}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 sm:self-center">
                    <span className="text-[10px] text-slate-400">Grup MVP:</span>
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {stk.coreGroup}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
