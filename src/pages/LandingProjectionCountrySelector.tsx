import { Button } from "@/components/ui/button";

interface LandingProjectionCountrySelectorProps {
  countries: string[];
  selectedCountries: string[];
  onChange: (countryNames: string[]) => void;
}

export function LandingProjectionCountrySelector({
  countries,
  selectedCountries,
  onChange,
}: LandingProjectionCountrySelectorProps) {
  function toggleCountry(countryName: string, checked: boolean) {
    onChange(
      checked
        ? [...new Set([...selectedCountries, countryName])]
        : selectedCountries.filter((selectedName) => selectedName !== countryName),
    );
  }

  return (
    <section className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">Negara yang ditampilkan di proyeksi publik</h2>
          <p className="text-xs text-muted-foreground">
            Pilih negara yang boleh terlihat pada bagian Proyeksi Internasional dan Sektor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange(countries)}
            disabled={selectedCountries.length === countries.length}
          >
            Pilih semua
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange([])}
            disabled={selectedCountries.length === 0}
          >
            Hapus pilihan
          </Button>
        </div>
      </div>

      {countries.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          Daftar negara tujuan belum tersedia.
        </p>
      ) : (
        <fieldset className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          <legend className="sr-only">Negara yang ditampilkan di proyeksi publik</legend>
          {countries.map((country) => (
            <label
              key={country}
              className="flex items-center gap-2 rounded-md border border-border p-2.5 text-sm"
            >
              <input
                type="checkbox"
                checked={selectedCountries.includes(country)}
                onChange={(event) => toggleCountry(country, event.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {country}
            </label>
          ))}
        </fieldset>
      )}
      <p className="text-xs text-muted-foreground">
        {selectedCountries.length} dari {countries.length} negara dipilih. Pilihan berlaku untuk
        semua periode.
      </p>
    </section>
  );
}
