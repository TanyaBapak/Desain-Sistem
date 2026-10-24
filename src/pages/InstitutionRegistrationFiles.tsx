import { FileUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type RegistrationDocumentField =
  | "operationalPermit"
  | "accreditationDocument"
  | "institutionProfile";

interface InstitutionRegistrationFilesProps {
  errors: Partial<Record<RegistrationDocumentField, string>>;
  onFileChange: (field: RegistrationDocumentField, file: File | null) => void;
}

export function InstitutionRegistrationFiles({
  errors,
  onFileChange,
}: InstitutionRegistrationFilesProps) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">Dokumen pendukung</h2>
        <p className="text-sm text-muted-foreground">Format PDF, JPG, atau PNG; ukuran maksimal 5 MB per berkas.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FileField
          field="operationalPermit"
          label="Izin operasional / bukti legalitas"
          required
          error={errors.operationalPermit}
          onChange={onFileChange}
        />
        <FileField
          field="institutionProfile"
          label="Profil lembaga"
          required
          error={errors.institutionProfile}
          onChange={onFileChange}
        />
        <FileField
          field="accreditationDocument"
          label="Sertifikat akreditasi (opsional)"
          error={errors.accreditationDocument}
          onChange={onFileChange}
        />
      </div>
    </section>
  );
}

function FileField({
  field,
  label,
  required = false,
  error,
  onChange,
}: {
  field: RegistrationDocumentField;
  label: string;
  required?: boolean;
  error?: string;
  onChange: (field: RegistrationDocumentField, file: File | null) => void;
}) {
  const fieldId = field;

  return (
    <div>
      <Label htmlFor={fieldId}>{label}{required ? " *" : ""}</Label>
      <div className="mt-1.5 flex items-center gap-2 rounded-md border border-input px-3 py-2">
        <FileUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <Input
          id={fieldId}
          required={required}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="h-auto border-0 p-0 shadow-none"
          onChange={(event) => onChange(field, event.target.files?.[0] ?? null)}
        />
      </div>
      {error && <p role="alert" className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
