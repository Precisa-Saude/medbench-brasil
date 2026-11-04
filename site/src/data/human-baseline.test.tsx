import { loadEdition } from '@precisa-saude/medbench-dataset';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import ComparisonChart from '../components/ComparisonChart';
import { TooltipProvider } from '../components/ui/tooltip';
import { getEditionMetadata } from './editions';
import { MODELS } from './results';

describe('baseline humano do snapshot oficial', () => {
  it.each(['revalida-2024-1', 'revalida-2024-2', 'revalida-2025-1'] as const)(
    'deriva %s do dataset e cita a data do snapshot',
    (id) => {
      const metadata = getEditionMetadata(id);
      const data = loadEdition(id);
      expect(metadata.passRate).toBe(data.passRate);
      expect(metadata.estimatedHumanSd).toBe(0.11);
      expect(metadata.estimatedHumanMean).toBeLessThan(metadata.cutoffScore!);
      expect(metadata.sources).toContainEqual(
        expect.objectContaining({
          title: 'Painel Revalida',
          url: data.passRateSource,
          snapshotAt: '4 nov. 2026',
        }),
      );
      expect(metadata.sources?.some((source) => source.url.includes('estrategia'))).toBe(false);
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <TooltipProvider>
            <ComparisonChart editionId={id} models={MODELS} />
          </TooltipProvider>
        </MemoryRouter>,
      );
      expect(html).toContain('Snapshot de 4 nov. 2026.');
      expect(html).toContain('painel-revalida');
    },
  );
});
