/**
 * Semantic Release Configuration
 * Automatiza versionamento e changelog a partir de Conventional Commits.
 *
 * Versões:
 * - fix:             patch (0.1.0 → 0.1.1)
 * - feat:            minor (0.1.0 → 0.2.0)
 * - BREAKING CHANGE: major (0.1.0 → 1.0.0)
 * - perf:            patch
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

    // Bump no root package.json (publicação em npm é feita pelo workflow).
    ['@semantic-release/npm', { npmPublish: false }],

    // Sincroniza a versão para todos os pacotes do workspace.
    ['@semantic-release/exec', { prepareCmd: 'node scripts/sync-versions.js' }],

    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'packages/*/package.json'],
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
