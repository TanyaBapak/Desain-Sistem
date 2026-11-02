import { useState, useMemo } from "react";
import { Building2, Check, ChevronsUpDown, Copy, Search, Users, X } from "lucide-react";
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
  value: string;
  onChange: (id: string) => void;
  institutions: InstitutionOption[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

export function InstitutionIdField({
  label = "ID Vokasi / Lembaga",
  value,
  onChange,
  institutions = [],
  error,
  required = false,
  disabled = false,
  helperText = "Cari berdasarkan ID Vokasi (mis. VOC-DEMO-001, INS-...) atau nama lembaga vokasi.",
}: InstitutionIdFieldProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Find currently selected institution
  const selectedInstitution = useMemo(() => {
    if (!value) return null;
    return institutions.find((inst) => inst.id === value) ?? { id: value, name: value, candidateCount: 0 };
  }, [value, institutions]);

  // Filter institutions based on search query
  const filteredInstitutions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      // Prioritize institutions that have candidates, followed by the rest
      return [...institutions]
        .sort((a, b) => (b.candidateCount ?? 0) - (a.candidateCount ?? 0) || a.name.localeCompare(b.name))
        .slice(0, 30);
    }
    return institutions
      .filter((inst) => inst.id.toLowerCase().includes(q) || inst.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aIdMatch = a.id.toLowerCase() === q;
        const bIdMatch = b.id.toLowerCase() === q;
        if (aIdMatch && !bIdMatch) return -1;
        if (!aIdMatch && bIdMatch) return 1;
        return (b.candidateCount ?? 0) - (a.candidateCount ?? 0) || a.name.localeCompare(b.name);
      })
      .slice(0, 30);
  }, [institutions, search]);

  const copyToClipboard = (text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      toast.success(`ID Vokasi disalin: ${text}`);
    }
  };

  return (
    <div className="space-y-1.5 text-sm font-medium">
      <div className="flex items-center justify-between">
        <label className="text-foreground flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-primary" />
          <span>{label}</span>
          {required && <span className="text-destructive">*</span>}
        </label>
        {selectedInstitution && (
          <span className="text-[11px] font-normal text-muted-foreground">
            {selectedInstitution.candidateCount ?? 0} peserta terdaftar
          </span>
        )}
      </div>

      {/* When an institution is selected */}
      {selectedInstitution && !isOpen ? (
        <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {selectedInstitution.id}
                </span>
                {(selectedInstitution.candidateCount ?? 0) > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <Users className="h-3 w-3" />
                    {selectedInstitution.candidateCount} Calon Peserta
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Belum ada peserta
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground leading-snug">
                {selectedInstitution.name}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => copyToClipboard(selectedInstitution.id)}
                title="Salin ID Vokasi"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              {!disabled && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs font-normal"
                  onClick={() => {
                    setIsOpen(true);
                    setSearch("");
                  }}
                >
                  Ganti
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* When searching or no institution is selected */
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              className="pl-9 pr-9 h-10 font-sans"
              placeholder="Cari ID Vokasi (VOC-..., INS-...) atau nama..."
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
                  onClick={() => {
                    onChange(search.trim().toUpperCase());
                    setIsOpen(false);
                    setSearch("");
                  }}
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
                  const isSelected = inst.id === value;
                  const candidateCount = inst.candidateCount ?? 0;
                  return (
                    <div
                      key={inst.id}
                      className={`p-2 rounded text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "hover:bg-muted text-foreground"
                      }`}
                      onClick={() => {
                        onChange(inst.id);
                        setIsOpen(false);
                        setSearch("");
                      }}
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-mono text-[11px] px-1.5 py-0.2 rounded font-semibold ${
                              isSelected
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-muted text-foreground border border-border"
                            }`}
                          >
                            {inst.id}
                          </span>
                          {candidateCount > 0 && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                                isSelected
                                  ? "bg-primary-foreground/30 text-primary-foreground"
                                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                              }`}
                            >
                              {candidateCount} Peserta
                            </span>
                          )}
                        </div>
                        <p className="line-clamp-1">{inst.name}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 shrink-0" />}
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
                Tutup Pilihan
              </Button>
            </div>
          )}
        </div>
      )}

      {error ? (
        <span role="alert" className="block text-xs font-normal text-destructive">
          {error}
        </span>
      ) : helperText && !isOpen ? (
        <span className="block text-xs font-normal text-muted-foreground">{helperText}</span>
      ) : null}
    </div>
  );
}
