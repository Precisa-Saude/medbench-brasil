export type ContaminationScope = 'all' | 'clean' | 'contaminated';

const OPTIONS: Array<{ label: string; value: ContaminationScope }> = [
  { label: 'Todas as edições', value: 'all' },
  { label: 'Apenas limpas', value: 'clean' },
  { label: 'Apenas contaminadas', value: 'contaminated' },
];

export default function ContaminationToggle({
  onChange,
  value,
}: {
  onChange: (v: ContaminationScope) => void;
  value: ContaminationScope;
}) {
  return (
    <div className="inline-flex rounded-md border bg-card p-1 text-sm font-sans">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded ${
            value === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
