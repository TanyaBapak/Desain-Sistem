import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MultiSelectDropdownProps {
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export function MultiSelectDropdown({
  label,
  placeholder,
  options,
  selectedValues,
  onChange,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedLabels = options
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label);
  const selectionLabel =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels.length} dipilih`;

  return (
    <div className="min-w-0 space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-label={label}
            aria-expanded={open}
            disabled={options.length === 0}
            className="h-10 w-full justify-between gap-2 px-3 text-left font-normal"
          >
            <span className="truncate">{selectionLabel}</span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-2"
        >
          <div className="max-h-56 space-y-1 overflow-y-auto" aria-label={label}>
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-normal hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(event) => {
                      const nextValues = event.target.checked
                        ? [...selectedValues, option.value]
                        : selectedValues.filter(
                            (value) => value !== option.value,
                          );
                      onChange(nextValues);
                    }}
                    className="h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="min-w-0 truncate">{option.label}</span>
                </label>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
