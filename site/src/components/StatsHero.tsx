export default function StatsHero({
  stats,
}: {
  stats: Array<{ label: string; value: string; hint?: string }>;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="border rounded-lg p-4 bg-card">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
          <div className="mt-2 text-2xl font-sans font-semibold">{s.value}</div>
          {s.hint && <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div>}
        </div>
      ))}
    </div>
  );
}
