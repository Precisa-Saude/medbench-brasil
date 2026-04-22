import { TIER_COLOR } from '../data/models';
import type { ModelResult } from '../data/results';

export default function ModelSelector({
  models,
  onChange,
  selected,
}: {
  models: ModelResult[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(id: string) {
    if (selected.includes(id)) onChange(selected.filter((m) => m !== id));
    else onChange([...selected, id]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {models.map((m) => {
        const on = selected.includes(m.modelId);
        return (
          <button
            key={m.modelId}
            aria-pressed={on}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 font-sans text-xs transition ${
              on ? 'bg-card text-foreground' : 'bg-muted text-muted-foreground opacity-70'
            }`}
            type="button"
            onClick={() => toggle(m.modelId)}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: TIER_COLOR[m.tier] }}
            />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
