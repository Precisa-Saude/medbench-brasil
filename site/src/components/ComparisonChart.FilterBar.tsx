/**
 * Barra de filtros do ComparisonChart: dropdown de edição (opcional)
 * + chips de família de modelo (opt-in).
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@precisa-saude/ui/primitives';

export interface FilterBarProps {
  allFamilies: string[];
  editionId: string;
  editionOptions?: { id: string; label: string }[];
  selectedFamilies: Set<string>;
  onEditionChange?: (id: string) => void;
  onToggleFamily: (family: string) => void;
}

export default function FilterBar({
  allFamilies,
  editionId,
  editionOptions,
  onEditionChange,
  onToggleFamily,
  selectedFamilies,
}: FilterBarProps) {
  const showEditionDropdown =
    editionOptions !== undefined && editionOptions.length > 1 && onEditionChange !== undefined;
  const showFamilies = allFamilies.length > 1;

  if (!showEditionDropdown && !showFamilies) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showEditionDropdown && (
        <Select
          value={editionId}
          onValueChange={(v) => {
            if (v !== null) onEditionChange?.(v);
          }}
        >
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {editionOptions.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {showFamilies && (
        <>
          <span className={`text-xs text-muted-foreground ${showEditionDropdown ? 'ml-2' : ''}`}>
            Famílias:
          </span>
          {allFamilies.map((family) => {
            const active = selectedFamilies.has(family);
            return (
              <button
                key={family}
                aria-pressed={active}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                type="button"
                onClick={() => onToggleFamily(family)}
              >
                {family}
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}
