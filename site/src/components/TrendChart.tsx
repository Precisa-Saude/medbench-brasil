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
      <ResponsiveContainer height={320} width="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
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
            wrapperStyle={{ transition: 'none' }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            dataKey="passingScore"
            dot={false}
            name="Nota de corte"
            stroke="var(--ps-amber)"
            strokeDasharray="4 4"
            type="monotone"
          />
          <Line
            dataKey="estimatedHumanMean"
            dot={false}
            name="Média humana estimada"
            stroke="var(--ps-green)"
            strokeDasharray="2 4"
            type="monotone"
          />
          <Line
            dataKey="modelScore"
            name="Modelo"
            stroke="var(--ps-violet)"
            strokeWidth={2}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
