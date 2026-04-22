import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        '**/dist/**',
        '**/tsup.config.ts',
        '**/src/cli.ts',
        // Build-time scripts (convert-to-model-format, rescore.mjs) não
        // fazem parte do runtime publicado dos pacotes.
        '**/scripts/**',
        // Arquivos só-de-tipo TypeScript apagam no build e sempre reportam
        // 0/0/0, puxando a média agregada pra baixo.
        '**/types.ts',
        // Entry points CLI — glue de argv/stdout, testado via fluxo
        // ponta-a-ponta e não unit tests.
        '**/src/cli/**',
      ],
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
