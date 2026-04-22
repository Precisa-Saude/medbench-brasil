import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

type AngleTick = {
  payload: { value: string };
  textAnchor: 'start' | 'middle' | 'end';
  x: number;
  y: number;
};
type RadiusTick = { payload: { value: number }; x: number; y: number };

export default function SpecialtyRadar({
  data,
}: {
  data: Array<{ accuracy: number; specialty: string }>;
}) {
  const chartData = data.map((d) => ({ accuracy: d.accuracy * 100, specialty: d.specialty }));
  return (
    <ResponsiveContainer height={320} width="100%">
      <RadarChart data={chartData} outerRadius="75%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="specialty"
          tick={(props) => {
            const { payload, textAnchor, x, y } = props as AngleTick;
            return (
              <text
                fill="var(--muted-foreground)"
                fontFamily="Roboto, system-ui, sans-serif"
                fontSize={12}
                textAnchor={textAnchor}
                x={x}
                y={y}
              >
                {payload.value}
              </text>
            );
          }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={(props) => {
            const { payload, x, y } = props as RadiusTick;
            if (payload.value === 0 || payload.value === 100) return <g />;
            return (
              <text
                fill="var(--muted-foreground)"
                fontFamily="Roboto, system-ui, sans-serif"
                fontSize={10}
                textAnchor="middle"
                x={x}
                y={y}
              >
                {payload.value}
              </text>
            );
          }}
        />
        <Radar
          dataKey="accuracy"
          fill="var(--ps-violet)"
          fillOpacity={0.3}
          stroke="var(--ps-violet)"
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
