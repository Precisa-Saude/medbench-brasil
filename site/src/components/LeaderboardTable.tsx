import { Link } from 'react-router-dom';

import type { ModelResult } from '../data/results';
import type { ContaminationScope } from './ContaminationToggle';

function pickAccuracy(m: ModelResult, scope: ContaminationScope): number | null {
  if (scope === 'clean') return m.cleanAccuracy;
  if (scope === 'contaminated') return m.contaminatedAccuracy;
  return m.accuracy;
}

const TIER_LABEL: Record<ModelResult['tier'], string> = {
  brasileira: 'Brasileira',
  'open-weight': 'Open-weight',
  proprietaria: 'Proprietária',
};

export default function LeaderboardTable({
  contaminationScope,
  models,
}: {
  contaminationScope: ContaminationScope;
  models: ModelResult[];
}) {
  const rows = models
    .map((m) => ({ acc: pickAccuracy(m, contaminationScope), model: m }))
    .filter((r): r is { acc: number; model: ModelResult } => r.acc !== null)
    .sort((a, b) => b.acc - a.acc);

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-muted text-muted-foreground font-sans">
          <tr>
            <th className="text-left px-4 py-3">#</th>
            <th className="text-left px-4 py-3">Modelo</th>
            <th className="text-left px-4 py-3">Fornecedor</th>
            <th className="text-left px-4 py-3">Tier</th>
            <th className="text-right px-4 py-3">Acurácia</th>
            <th className="text-right px-4 py-3">IC 95%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ acc, model }, idx) => (
            <tr key={model.modelId} className="border-t">
              <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
              <td className="px-4 py-3">
                <Link to={`/models/${model.modelId}`} className="font-medium text-ps-violet hover:underline">
                  {model.label}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{model.provider}</td>
              <td className="px-4 py-3 text-muted-foreground">{TIER_LABEL[model.tier]}</td>
              <td className="px-4 py-3 text-right font-mono">{(acc * 100).toFixed(1)}%</td>
              <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                {(model.ci95[0] * 100).toFixed(1)} – {(model.ci95[1] * 100).toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
