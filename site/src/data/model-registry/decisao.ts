import type { ModelMetadata } from './types.js';

/**
 * Modelos de decisão (API System One), medidos sob o protocolo do ADR 0004:
 * estado mais pergunta tipada entram, alternativa e vetor de probabilidades
 * saem, sem geração de texto e sem `parseLetter`.
 *
 * Agrupados por protocolo, e não por fornecedor como os demais módulos,
 * porque é o protocolo que muda como o número deve ser lido. Os dois
 * fornecedores aqui têm um modelo cada.
 *
 * O Laya (`convaiinnovations/laya-multilingual`) foi medido nesta edição e
 * **não** aparece aqui de propósito: serve de controle de protocolo, não de
 * linha do leaderboard. A seção 10 do ADR 0004 registra o motivo.
 */
export const DECISION_MODELS: Record<string, ModelMetadata> = {
  'jaredpalmer/kev-4b': {
    description:
      'Modelo de decisão de 4B parâmetros, adaptador LoRA sobre o Qwen3.5-4B-Base. Responde alternativa e probabilidades calibradas em um único passo, sem gerar texto.',
    homepage: 'https://huggingface.co/jaredpalmer/kev-4b',
    isDecisionModel: true,
    label: 'Kev 4B',
    modelId: 'jaredpalmer/kev-4b',
    provider: 'Jared Palmer',
    // Criação do repositório no Hugging Face (API `createdAt`,
    // 2026-09-19T03:59:43Z). O autor não publicou anúncio com data própria,
    // então registramos a data verificável, não uma inferida.
    releaseDate: '2026-09-19',
    tier: 'open-weight',
    // Corte de treino não publicado. O AGENTS.md proíbe inferir do modelo
    // base (Qwen3.5-4B-Base): o fine-tune posterior pode ter visto dado mais
    // novo. Fica `unknown`; ver seção 8 do ADR 0004.
    trainingCutoff: undefined,
    trainingCutoffSource: undefined,
  },
  'typesafe/jev-1.13-20260917': {
    description:
      'Modelo de decisão da Typesafe, servido pelo endpoint de decisões da OpenRouter. Snapshot fixado: o alias `latest` não é usado, para que a medição continue reproduzível.',
    homepage: 'https://openrouter.ai/typesafe/jev-router',
    isDecisionModel: true,
    label: 'Jev 1.13',
    modelId: 'typesafe/jev-1.13-20260917',
    provider: 'Typesafe',
    // Data do snapshot, codificada no próprio identificador fixado
    // (`jev-1.13-20260917`) e confirmada em `resolvedModel` nos 255
    // registros da rodada. A Typesafe não publica changelog com data de
    // lançamento por versão; o catálogo público da OpenRouter só lista o
    // alias `typesafe/jev-router`, não os snapshots.
    releaseDate: '2026-09-17',
    tier: 'proprietaria',
    // Corte de treino não publicado pela Typesafe. Não se infere de data de
    // release. Ver seção 8 do ADR 0004.
    trainingCutoff: undefined,
    trainingCutoffSource: undefined,
  },
};
