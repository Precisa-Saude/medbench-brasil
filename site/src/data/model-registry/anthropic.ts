import type { ModelMetadata } from './types.js';

// Anthropic publica dois cutoffs por modelo: "training data cutoff" (janela
// ampla do corpus) e "reliable knowledge cutoff" (data em que o
// conhecimento é considerado confiável). Usamos o training data cutoff —
// é o mais conservador para contaminação (qualquer dado dentro da janela
// pode ter sido memorizado). Fonte única para toda a família: tabela Models
// overview em platform.claude.com (mais estável e canônica que o Help
// Center, que também publica os mesmos valores).
const OVERVIEW = 'https://platform.claude.com/docs/en/about-claude/models/overview';

export const ANTHROPIC_MODELS: Record<string, ModelMetadata> = {
  // Fable 5: no lançamento (jun/2026) a Anthropic não publicava training data
  // cutoff para este modelo. A tabela do Models overview passou a declarar
  // "Training data cutoff Jan 2026" (verificado em 2026-08-03), então o campo
  // foi preenchido e o resultado de enamed-2025 foi reprocessado com
  // `medbench rescore --from-raw --edition enamed-2025 --model claude-fable-5
  // --cutoff 2026-01-01`, conforme a regra do AGENTS.md.
  'claude-fable-5': {
    description:
      'Modelo mais capaz da Anthropic (junho/2026), novo tier acima do Opus, com adaptive thinking sempre ativo.',
    homepage:
      'https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5',
    label: 'Claude Fable 5',
    modelId: 'claude-fable-5',
    provider: 'Anthropic',
    releaseDate: '2026-06-09',
    tier: 'proprietaria',
    // "Claude Fable 5 ... Training data cutoff Jan 2026" — Models overview.
    trainingCutoff: '2026-01-01',
    trainingCutoffSource: OVERVIEW,
  },
  'claude-opus-4-5': {
    description:
      'Modelo flagship da Anthropic da geração Claude 4, lançado em meados de 2025 com foco em raciocínio e uso agêntico.',
    homepage: 'https://www.anthropic.com/claude/opus',
    label: 'Claude Opus 4.5',
    modelId: 'claude-opus-4-5',
    provider: 'Anthropic',
    releaseDate: '2025-07-01',
    tier: 'proprietaria',
    // "Claude Opus 4.5 ... Training data cutoff Aug 2025" — Models overview.
    trainingCutoff: '2025-08-01',
    trainingCutoffSource: OVERVIEW,
  },
  'claude-opus-4-6': {
    description:
      'Refresh intermediário do Opus 4 com janela de contexto maior e melhorias em tarefas longas de raciocínio.',
    homepage: 'https://www.anthropic.com/claude/opus',
    label: 'Claude Opus 4.6',
    modelId: 'claude-opus-4-6',
    provider: 'Anthropic',
    releaseDate: '2025-10-01',
    tier: 'proprietaria',
    // "Claude Opus 4.6 ... Training data cutoff Aug 2025" — Models overview.
    trainingCutoff: '2025-08-01',
    trainingCutoffSource: OVERVIEW,
  },
  'claude-opus-4-7': {
    description:
      'Flagship atual da Anthropic (2026), com thinking estendido e ganhos substanciais em benchmarks de saúde e ciência.',
    homepage: 'https://www.anthropic.com/claude/opus',
    label: 'Claude Opus 4.7',
    modelId: 'claude-opus-4-7',
    provider: 'Anthropic',
    releaseDate: '2026-02-01',
    tier: 'proprietaria',
    // "Claude Opus 4.7 ... Training data cutoff Jan 2026" — Models overview.
    trainingCutoff: '2026-01-01',
    trainingCutoffSource: OVERVIEW,
  },
  'claude-opus-4-8': {
    description:
      'Sucessor do Opus 4.7 (maio/2026), com adaptive thinking e ganhos em raciocínio agêntico e uso de ferramentas.',
    homepage: 'https://www.anthropic.com/news/claude-opus-4-8',
    label: 'Claude Opus 4.8',
    modelId: 'claude-opus-4-8',
    provider: 'Anthropic',
    releaseDate: '2026-05-28',
    tier: 'proprietaria',
    // "Claude Opus 4.8 ... Training data cutoff Jan 2026" — Models overview.
    trainingCutoff: '2026-01-01',
    trainingCutoffSource: OVERVIEW,
  },
  'claude-opus-5': {
    description:
      'Sucessor do Opus 4.8 na linha Opus (julho/2026), focado em código agêntico e trabalho corporativo, com thinking ativo por padrão.',
    homepage: 'https://www.anthropic.com/news/claude-opus-5',
    label: 'Claude Opus 5',
    modelId: 'claude-opus-5',
    provider: 'Anthropic',
    releaseDate: '2026-07-24',
    tier: 'proprietaria',
    // "Claude Opus 5 ... Training data cutoff May 2026" — Models overview.
    trainingCutoff: '2026-05-01',
    trainingCutoffSource: OVERVIEW,
  },
  'claude-sonnet-5': {
    description:
      'Tier intermediário da geração Claude 5 (junho/2026), qualidade próxima de Opus em código e tarefas agênticas com menor custo e latência.',
    homepage: 'https://www.anthropic.com/news/claude-sonnet-5',
    label: 'Claude Sonnet 5',
    modelId: 'claude-sonnet-5',
    provider: 'Anthropic',
    releaseDate: '2026-06-30',
    tier: 'proprietaria',
    // "Claude Sonnet 5 ... Training data cutoff Jan 2026" — Models overview.
    trainingCutoff: '2026-01-01',
    trainingCutoffSource: OVERVIEW,
  },
};
