import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { ModelResult } from '../data/results';
import { specialtyLabel } from '../data/specialties';
import { perSpecialtyForScope, poolSpecialtyMean } from '../lib/metrics';
import type { ContaminationScope } from './ContaminationToggle';

type Row = {
  modelAcc: number | null;
  poolAcc: number;
  specialty: string;
  specialtyKey: string;
};

export default function SpecialtyDifficultyBar({
  allModels,
  contaminationScope = 'all',
  model,
}: {
  allModels: ModelResult[];
  /** Respeita o mesmo escopo que outras visualizações da página, se houver toggle. */
  contaminationScope?: ContaminationScope;
  model: ModelResult;
}) {
  const rows = useMemo<Row[]>(() => {
    const pool = poolSpecialtyMean(allModels, {
      excludeModelId: model.modelId,
      scope: contaminationScope,
    });
    const mineBucket = perSpecialtyForScope(model, contaminationScope);
    const result: Row[] = [];
    for (const [sp, pb] of Object.entries(pool)) {
      const mine = mineBucket[sp];
      result.push({
        modelAcc: mine ? mine.accuracy * 100 : null,
        poolAcc: pb.accuracy * 100,
        specialty: specialtyLabel(sp),
        specialtyKey: sp,
      });
    }
    return result.sort((a, b) => a.poolAcc - b.poolAcc);
  }, [allModels, contaminationScope, model]);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        Sem dados de pool para comparar.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 font-sans">
      <ResponsiveContainer width="100%" height={Math.max(240, rows.length * 56)}>
        <BarChart data={rows} layout="vertical" margin={{ bottom: 8, left: 8, right: 24, top: 16 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            unit="%"
          />
          <YAxis
            type="category"
            dataKey="specialty"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            width={160}
          />
          <RechartsTooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0]?.payload as Row | undefined;
              if (!row) return null;
              return (
                <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow">
                  <div className="font-semibold">{row.specialty}</div>
                  <div>
                    Este modelo:{' '}
                    {row.modelAcc !== null ? `${row.modelAcc.toFixed(1)}%` : 'sem dados'}
                  </div>
                  <div className="text-muted-foreground">
                    Média do pool: {row.poolAcc.toFixed(1)}%
                  </div>
                </div>
              );
            }}
          />
          <Legend
            formatter={(value) => <span className="text-xs">{value}</span>}
            wrapperStyle={{ paddingTop: 8 }}
          />
          <Bar
            dataKey="poolAcc"
            name="Média dos demais modelos"
            fill="var(--muted-foreground)"
            fillOpacity={0.35}
            barSize={10}
            isAnimationActive={false}
          />
          <Bar
            dataKey="modelAcc"
            name={model.label}
            fill="var(--ps-violet)"
            barSize={16}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-base text-muted-foreground">
        Áreas ordenadas da mais difícil (topo) para a mais fácil, medida pela média dos demais
        modelos no pool.
      </p>
    </div>
  );
}
