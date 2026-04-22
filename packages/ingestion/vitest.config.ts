import { defineConfig } from 'vitest/config';

/**
 * Override do root vitest.config — este pacote (`@medbench-brasil/ingestion`)
 * é `private: true`: pipeline interno de ingestão, não publicado em npm.
 * A regra compartilhada de cobertura mínima de 80% é explicitamente
 * "per **publishable** package" (AGENTS.md → Code conventions).
 *
 * Os caminhos não-cobertos são majoritariamente adapters externos:
 *   - `extractor.ts` — wrapper sobre `@kreuzberg/node` (PDF/OCR)
 *   - `parser-bedrock.ts` — cliente AWS Bedrock
 *   - `parser.ts` — orquestrador que chama o Bedrock via tool_use
 *
 * Esses são integração ponta-a-ponta (pago por chamada + segredos) e não
 * têm lógica própria que valha unit test além da já coberta em
 * `parser-schema.ts` + `gabarito.ts`. Coverage continua sendo coletada e
 * reportada; só não falha a build.
 */
export default defineConfig({
  test: {
    coverage: {
      exclude: [
        '**/dist/**',
        '**/tsup.config.ts',
        '**/src/cli.ts',
        '**/src/extractor.ts',
        '**/src/parser-bedrock.ts',
        '**/src/parser.ts',
      ],
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // Sem thresholds: pacote privado, não publicado.
    },
  },
});
