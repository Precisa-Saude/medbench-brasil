import type { CostResult } from '../lib/cost';
import { COST_GAP_LABEL, formatCostUSD } from '../lib/cost';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export default function CostValue({ cost }: { cost: CostResult }) {
  const description =
    cost.status === 'unknown'
      ? COST_GAP_LABEL[cost.reason]
      : `Estimativa por questão, incluindo ${cost.totalCalls / cost.questions} execuções. ` +
        `Tabela de ${cost.pricing.priceProvider}, verificada em ${cost.pricing.priceAsOf}. ` +
        'Sem descontos de cache ou batch; não é cobrança histórica.';
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={description}
          className="cursor-help font-mono text-muted-foreground"
          tabIndex={0}
        >
          {cost.status === 'available' ? formatCostUSD(cost.perQuestionUSD) : '—'}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs space-y-2 font-sans text-sm">
        <p>{description}</p>
        {cost.status === 'available' && (
          <>
            <p>
              {formatCostUSD(cost.perResponseUSD)} por resposta; {formatCostUSD(cost.totalUSD)} no
              escopo exibido.
            </p>
            <a
              className="underline"
              href={cost.pricing.priceSource}
              rel="noreferrer"
              target="_blank"
            >
              Fonte da tarifa
            </a>
          </>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
