import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

export default function SpecialtyRadar({
  data,
}: {
  data: Array<{ accuracy: number; specialty: string }>;
}) {
  const chartData = data.map((d) => ({ accuracy: d.accuracy * 100, specialty: d.specialty }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={chartData} outerRadius="75%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="specialty"
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
        />
        <Radar
          dataKey="accuracy"
          stroke="var(--ps-violet)"
          fill="var(--ps-violet)"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
