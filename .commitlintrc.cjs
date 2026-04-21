const base = require('@precisa-saude/commitlint-config');

/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  ...base,
  rules: {
    ...base.rules,
    'scope-enum': [
      2,
      'always',
      [
        'dataset',
        'harness',
        'ingestion',
        'canary',
        'site',
        'results',
        'scripts',
        'docs',
        'ci',
        'deps',
        'lint',
        'config',
      ],
    ],
  },
};
