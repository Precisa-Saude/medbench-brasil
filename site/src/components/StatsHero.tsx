import { TYPE } from '../lib/typography';

export default function StatsHero({
  stats,
}: {
  stats: Array<{ hint?: string; label: string; value: string }>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 font-sans md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border bg-card p-4">
          <div className={TYPE.meta}>{s.label}</div>
          <div className={`mt-2 ${TYPE.stat}`}>{s.value}</div>
          {s.hint && <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div>}
        </div>
      ))}
    </div>
  );
}
