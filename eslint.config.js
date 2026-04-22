import base from '@precisa-saude/eslint-config/base';
import reactConfig from '@precisa-saude/eslint-config/react';

export default [
  ...base,
  // React rules for site/** (Astro/Vite frontend). The preset's
  // REACT_PATHS already includes `site/**/*.{ts,tsx,jsx}`.
  ...reactConfig,
  {
    // eslint-plugin-react@7.37.5 crasha no ESLint 10 quando tenta detectar
    // a versão automaticamente (chama context.getFilename() removido na
    // v10). Fixa a versão explicitamente pra pular o auto-detect.
    settings: {
      react: { version: '19.0' },
    },
  },
  {
    // Test files are excluded from package tsconfigs (to keep tsc --noEmit tight),
    // so disable type-aware parsing for them or ESLint errors trying to locate a project.
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/__tests__/**'],
    languageOptions: {
      parserOptions: { project: false },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
