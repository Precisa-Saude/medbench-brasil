export default function StatsHero({
  stats,
}: {
  stats: Array<{ hint?: string; label: string; value: string }>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 font-sans md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border bg-card p-4">
          <div className="text-xs tracking-wide text-muted-foreground uppercase">{s.label}</div>
          <div className="mt-2 text-2xl font-semibold">{s.value}</div>
          {s.hint && <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div>}
        </div>
      ))}
    </div>
  );
}
