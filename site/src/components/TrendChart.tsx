import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface EditionPoint {
  edition: string;
  estimatedHumanMean?: number;
  modelScore?: number;
  passingScore?: number;
}

export default function TrendChart({ data }: { data: EditionPoint[] }) {
  return (
    <div className="font-sans">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="edition" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number) => `${value.toFixed(1)}%`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="passingScore"
            name="Nota de corte"
            stroke="var(--ps-amber)"
            strokeDasharray="4 4"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="estimatedHumanMean"
            name="Média humana estimada"
            stroke="var(--ps-green)"
            strokeDasharray="2 4"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="modelScore"
            name="Modelo"
            stroke="var(--ps-violet)"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
