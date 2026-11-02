import { useState, useMemo } from "react";
import { Building2, Check, ChevronsUpDown, Copy, Plus, Search, Trash2, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export interface InstitutionOption {
  id: string;
  name: string;
  candidateCount?: number;
}

interface InstitutionIdFieldProps {
  label?: string;
  value?: string;
  values?: string[];
  onChange?: (id: string) => void;
  onChangeValues?: (ids: string[]) => void;
  institutions: InstitutionOption[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

export function InstitutionIdField({
  label = "Institusi Vokasi / Lembaga Pengelola",
  value,
  values,
  onChange,
  onChangeValues,
  institutions = [],
  error,
  required = false,
  disabled = false,
  helperText = "Cari berdasarkan ID Vokasi (mis. GRD-..., INS-..., CSV-..., VOC-...) atau nama lembaga. Anda dapat memilih lebih dari satu institusi.",
}: InstitutionIdFieldProps) {
  const [search, setSearch] = useState("");
  const [prefixFilter, setPrefixFilter] = useState<string>("ALL");
  const [isOpen, setIsOpen] = useState(false);

  // Normalize selected IDs (support both array values and single value)
  const selectedIds = useMemo(() => {
    if (values && Array.isArray(values)) {
      return Array.from(new Set(values.filter(Boolean)));
    }
    return value ? [value] : [];
  }, [values, value]);

  // Find all selected institutions with metadata
  const selectedInstitutions = useMemo(() => {
    return selectedIds.map((id) => {
      const found = institutions.find((inst) => inst.id === id);
      return found ?? { id, name: id, candidateCount: 0 };
    });
  }, [selectedIds, institutions]);

  // Filter institutions based on search query & prefix filter
  const filteredInstitutions = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byPrefix = prefixFilter === "ALL"
      ? institutions
      : institutions.filter((inst) => inst.id.toUpperCase().startsWith(prefixFilter));

    if (!q) {
      return [...byPrefix]
        .sort((a, b) => (b.candidateCount ?? 0) - (a.candidateCount ?? 0) || a.name.localeCompare(b.name))
        .slice(0, 45);
    }
    return byPrefix
      .filter((inst) => inst.id.toLowerCase().includes(q) || inst.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aIdMatch = a.id.toLowerCase() === q;
        const bIdMatch = b.id.toLowerCase() === q;
        if (aIdMatch && !bIdMatch) return -1;
        if (!aIdMatch && bIdMatch) return 1;
        return (b.candidateCount ?? 0) - (a.candidateCount ?? 0) || a.name.localeCompare(b.name);
      })
      .slice(0, 45);
  }, [institutions, search, prefixFilter]);

  const copyToClipboard = (text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      toast.success(`ID Vokasi disalin: ${text}`);
    }
  };

  const handleSelect = (id: string) => {
    const cleanId = id.trim();
    if (!cleanId) return;

    if (onChangeValues) {
      const next = Array.from(new Set([...selectedIds, cleanId]));
      onChangeValues(next);
      onChange?.(next[0] ?? "");
    } else {
      onChange?.(cleanId);
    }

    setSearch("");
    // Close dropdown only if single-mode or if user added one
    setIsOpen(false);
  };

  const handleRemove = (idToRemove: string) => {
    if (onChangeValues) {
      const next = selectedIds.filter((id) => id !== idToRemove);
      onChangeValues(next);
      onChange?.(next[0] ?? "");
    } else if (value === idToRemove) {
      onChange?.("");
    }
  };

  const totalCandidateCount = useMemo(() => {
    return selectedInstitutions.reduce((acc, curr) => acc + (curr.candidateCount ?? 0), 0);
  }, [selectedInstitutions]);

  return (
    <div className="space-y-2 text-sm font-medium">
      <div className="flex items-center justify-between">
        <label className="text-foreground flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-primary" />
          <span>{label}</span>
          {required && <span className="text-destructive">*</span>}
        </label>
        {selectedInstitutions.length > 0 && (
          <span className="text-[11px] font-normal text-muted-foreground">
            {selectedInstitutions.length} institusi dipilih ({totalCandidateCount} calon peserta)
          </span>
        )}
      </div>

      {/* Selected institutions list */}
      {selectedInstitutions.length > 0 && (
        <div className="space-y-2">
          {selectedInstitutions.map((inst, index) => (
            <div
              key={inst.id}
              className="rounded-md border border-border bg-muted/40 p-3 flex items-start justify-between gap-2 transition-all hover:border-primary/40"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {inst.id}
                  </span>
                  {index === 0 && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      Utama
                    </span>
                  )}
                  {(inst.candidateCount ?? 0) > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <Users className="h-3 w-3" />
                      {inst.candidateCount} Peserta
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Belum ada peserta
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-foreground leading-snug">
                  {inst.name}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => copyToClipboard(inst.id)}
                  title="Salin ID Institusi"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(inst.id)}
                    title="Hapus institusi ini"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Button to open search or the search bar itself */}
      {!disabled && (
        <div className="space-y-2">
          {!isOpen && selectedInstitutions.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs w-full sm:w-auto"
              onClick={() => {
                setIsOpen(true);
                setSearch("");
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Institusi Lain (misal data GRD, INS, atau CSV)
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: "ALL", label: "Semua Kode" },
                  { key: "GRD-", label: "GRD- (Gardata)" },
                  { key: "INS-", label: "INS-" },
                  { key: "CSV-", label: "CSV-" },
                  { key: "VOC-", label: "VOC-" },
                ].map((pf) => (
                  <button
                    key={pf.key}
                    type="button"
                    onClick={() => {
                      setPrefixFilter(pf.key);
                      setIsOpen(true);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition ${
                      prefixFilter === pf.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {pf.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  className="pl-9 pr-9 h-10 font-sans"
                  placeholder="Cari ID Vokasi (GRD-..., INS-..., CSV-..., VOC-...) atau nama lembaga..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (!isOpen) setIsOpen(true);
                  }}
                  onFocus={() => setIsOpen(true)}
                  disabled={disabled}
                />
                {search ? (
                  <button
                    type="button"
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearch("")}
                    aria-label="Bersihkan pencarian"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <ChevronsUpDown className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                )}
              </div>

              {isOpen && (
                <div className="rounded-md border border-border bg-popover shadow-md max-h-60 overflow-y-auto p-1 space-y-0.5 z-50">
                  {/* Option to use custom direct ID if typed query does not match any ID exactly */}
                  {search.trim() && !institutions.some((inst) => inst.id.toLowerCase() === search.trim().toLowerCase()) && (
                    <div
                      className="p-2 text-xs rounded hover:bg-muted/80 cursor-pointer border border-dashed border-primary/40 bg-primary/5 flex items-center justify-between"
                      onClick={() => handleSelect(search.trim().toUpperCase())}
                    >
                      <div>
                        <span className="font-semibold text-primary">Gunakan ID ini langsung:</span>{" "}
                        <span className="font-mono font-bold">{search.trim().toUpperCase()}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">Kustom</span>
                    </div>
                  )}

                  {filteredInstitutions.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      Tidak ditemukan lembaga vokasi yang cocok dengan kata kunci &quot;{search}&quot;.
                    </div>
                  ) : (
                    filteredInstitutions.map((inst) => {
                      const isSelected = selectedIds.includes(inst.id);
                      const candidateCount = inst.candidateCount ?? 0;
                      return (
                        <div
                          key={inst.id}
                          className={`p-2 rounded text-xs cursor-pointer flex items-center justify-between transition-colors ${
                            isSelected
                              ? "bg-muted text-foreground opacity-75"
                              : "hover:bg-primary/10 text-foreground"
                          }`}
                          onClick={() => {
                            if (!isSelected) {
                              handleSelect(inst.id);
                            }
                          }}
                        >
                          <div className="space-y-0.5 pr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded font-semibold bg-muted text-foreground border border-border">
                                {inst.id}
                              </span>
                              {candidateCount > 0 && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                  {candidateCount} Peserta
                                </span>
                              )}
                              {isSelected && (
                                <span className="text-[10px] font-semibold text-primary px-1.5 py-0.2 rounded bg-primary/10">
                                  Sudah Terpilih
                                </span>
                              )}
                            </div>
                            <p className="line-clamp-1">{inst.name}</p>
                          </div>
                          {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {isOpen && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => setIsOpen(false)}
                  >
                    Selesai Memilih
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error ? (
        <span role="alert" className="block text-xs font-normal text-destructive">
          {error}
        </span>
      ) : helperText && !isOpen && selectedInstitutions.length === 0 ? (
        <span className="block text-xs font-normal text-muted-foreground">{helperText}</span>
      ) : null}
    </div>
  );
}
