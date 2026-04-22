/**
 * Semantic Release Configuration
 * Automates versioning and changelog generation based on conventional commits
 *
 * Version bumps:
 * - fix: patch release (0.1.0 → 0.1.1)
 * - feat: minor release (0.1.0 → 0.2.0)
 * - BREAKING CHANGE: major release (0.1.0 → 1.0.0)
 * - perf: patch release (performance improvements)
 */

const presetConfig = {
  types: [
    { type: 'feat', section: 'Features' },
    { type: 'fix', section: 'Bug Fixes' },
    { type: 'perf', section: 'Performance' },
    { type: 'refactor', section: 'Refactoring' },
    { type: 'docs', section: 'Documentation' },
    { type: 'style', section: 'Styles' },
    { type: 'test', section: 'Tests' },
    { type: 'ci', section: 'CI/CD' },
    { type: 'chore', section: 'Chores' },
    { type: 'revert', section: 'Reverts' },
    { type: 'build', section: 'Build' },
  ],
};

const releaseRules = [
  { type: 'feat', release: 'minor' },
  { type: 'fix', release: 'patch' },
  { type: 'perf', release: 'patch' },
  { type: 'refactor', release: 'patch' },
  { type: 'docs', release: false },
  { type: 'style', release: false },
  { type: 'test', release: false },
  { type: 'ci', release: false },
  { type: 'chore', release: false },
  { type: 'revert', release: 'patch' },
  { type: 'build', release: false },
];

module.exports = {
  branches: ['main'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules,
      },
    ],

    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig,
      },
    ],

    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],

    // Bump root package.json version (no npm publish — handled by workflow)
    ['@semantic-release/npm', { npmPublish: false }],

    // Sync version to all workspace packages
    ['@semantic-release/exec', { prepareCmd: 'node scripts/sync-versions.cjs' }],

    [
      '@semantic-release/git',
      {
        // Assets computados a partir da mesma fonte do sync-versions.cjs —
        // um único lugar define o conjunto de pacotes publicáveis. O helper
        // é tolerante (nunca lança); em cenários de CWD errado ou
        // `packages/` ausente, retorna lista vazia e o release segue com
        // apenas CHANGELOG + root package.json.
        assets: (() => {
          try {
            const { listPublishablePackages } = require('./scripts/list-publishable-packages.cjs');
            const pkgAssets = listPublishablePackages().map((dir) => `${dir}/package.json`);
            return ['CHANGELOG.md', 'package.json', ...pkgAssets];
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn(
              `[releaserc] list-publishable-packages falhou (${err?.message ?? err}); usando só root package.json + CHANGELOG`,
            );
            return ['CHANGELOG.md', 'package.json'];
          }
        })(),
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],

    [
      '@semantic-release/github',
      {
        successCommentCondition: false,
        releasedLabels: false,
        failComment: false,
      },
    ],
  ],
};
