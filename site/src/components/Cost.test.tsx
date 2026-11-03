import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { type ModelResult, MODELS } from '../data/results';
import type { CostResult } from '../lib/cost';
import CostAccuracyScatter from './CostAccuracyScatter';
import CostMethodology from './CostMethodology';
import CostValue from './CostValue';
import LeaderboardTable from './LeaderboardTable';
import { TooltipProvider } from './ui/tooltip';

const estimate: CostResult = {
  status: 'available',
  perQuestionUSD: 0.003,
  perResponseUSD: 0.001,
  totalUSD: 0.006,
  totalCalls: 6,
  questions: 2,
  pricing: {
    priceAsOf: '2026-11-03',
    pricePerMTokInputUSD: 2,
    pricePerMTokOutputUSD: 10,
    priceProvider: 'Fixture API',
    priceQuote: 'fixture',
    priceSource: 'https://example.org/pricing',
  },
};
const gap: CostResult = { status: 'unknown', reason: 'no-usage' };
const model: ModelResult = {
  ...MODELS[0]!,
  modelId: 'fixture',
  label: 'Fixture Model',
  accuracy: 0.8,
  cleanAccuracy: 0.8,
  accuracyByEdition: { 'enamed-2026': { accuracy: 0.8, n: 6 } },
  costByScope: { all: estimate, clean: estimate, contaminated: gap },
  costByEdition: { 'enamed-2026': { all: estimate, clean: estimate, contaminated: gap } },
};

describe('interface de custo', () => {
  it('explica ausência e fonte de estimativa no rótulo acessível', () => {
    const missing = renderToStaticMarkup(
      <TooltipProvider>
        <CostValue cost={gap} />
      </TooltipProvider>,
    );
    expect(missing).toContain('anteriores à captura de tokens');
    expect(missing).toContain('tabindex="0"');
    const available = renderToStaticMarkup(
      <TooltipProvider>
        <CostValue cost={estimate} />
      </TooltipProvider>,
    );
    expect(available).toContain('0,0030');
    expect(available).toContain('Fixture API');
    expect(available).toContain('incluindo 3 execuções');
  });

  it('tabela usa custo do mesmo escopo selecionado', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <TooltipProvider>
          <LeaderboardTable contaminationScope="clean" models={[model]} />
        </TooltipProvider>
      </MemoryRouter>,
    );
    expect(html).toContain('US$/questão');
    expect(html).toContain('0,0030');
  });

  it('gráfico vazio explica lacunas, sem inventar pontos', () => {
    const html = renderToStaticMarkup(
      <CostAccuracyScatter editionId="enamed-2026" models={[]} scope="clean" />,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('Ainda não há modelos');
  });

  it('dados de fixture são acessíveis fora do gráfico e incluem fontes', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <CostAccuracyScatter editionId="enamed-2026" models={[model]} scope="all" />
      </MemoryRouter>,
    );
    expect(html).toContain('Dados do gráfico e fontes');
    expect(html).toContain('Fixture Model');
    expect(html).toContain('https://example.org/pricing');
    expect(html).toContain('80.0%');
    const zero = { ...estimate, perQuestionUSD: 0, perResponseUSD: 0, totalUSD: 0 };
    const htmlZero = renderToStaticMarkup(
      <MemoryRouter>
        <CostAccuracyScatter
          editionId="fixture-edition"
          scope="contaminated"
          models={[
            {
              ...model,
              accuracyByEdition: { 'fixture-edition': { accuracy: 0.8, n: 6 } },
              costByEdition: { 'fixture-edition': { all: zero, clean: zero, contaminated: zero } },
            },
          ]}
        />
      </MemoryRouter>,
    );
    expect(htmlZero).toContain('Custos zero não cabem');
    expect(htmlZero).toContain('fixture-edition');
  });

  it('metodologia disponibiliza tarifa, data e fonte mesmo sem usage histórico', () => {
    const html = renderToStaticMarkup(<CostMethodology />);
    expect(html).toContain('2026-11-03');
    expect(html).toContain('Tarifas de referência e fontes verificadas');
    expect(html).toContain('Raciocínio já pertence');
    expect(html).toContain('BRL');
  });
});
