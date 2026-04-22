/**
 * Legenda do gradiente Jenks exibida no header do ComparisonChart.
 * Mostra quatro retângulos coloridos (menor → maior precisão) com um
 * tooltip explicando o algoritmo.
 */

import { JENKS_COLORS } from './ComparisonChart.helpers';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export default function ComparisonChartLegend() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground underline decoration-dotted decoration-muted-foreground/40 underline-offset-4">
          <span>menor</span>
          <span className="inline-flex gap-0.5">
            {JENKS_COLORS.map((_c, i) => (
              <span
                key={i}
                aria-hidden
                className="inline-block h-2.5 w-4"
                style={{ backgroundColor: JENKS_COLORS[JENKS_COLORS.length - 1 - i] }}
              />
            ))}
          </span>
          <span>maior</span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs font-sans text-sm">
        Cores agrupam os modelos em 4 classes naturais pelo algoritmo Jenks sobre as precisões
        observadas — classes mais escuras concentram as maiores precisões.
      </TooltipContent>
    </Tooltip>
  );
}
