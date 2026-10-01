/**
 * Tipos compartilhados pelos módulos de metadados por fornecedor.
 *
 * Vivem aqui (e não em `../models.ts`) para que os arquivos do registry
 * possam importá-los sem criar ciclo com o barrel que os agrega.
 */

export type ModelTier = 'proprietaria' | 'open-weight';

interface ModelMetadataBase {
  /** Resumo curto (1–2 frases) para o header da página de detalhe. */
  description?: string;
  /** URL da página oficial do modelo no site do fornecedor. */
  homepage?: string;
  /**
   * Modelo de decisão (API System One): recebe estado mais pergunta tipada e
   * devolve alternativa com vetor de probabilidades, sem gerar texto. Medido
   * sob protocolo diferente do resto do roster — ver ADR 0004. A flag existe
   * para sinalizar isso na tabela; sem ela o leitor compararia precisões
   * obtidas por caminhos distintos como se fossem equivalentes.
   */
  isDecisionModel?: boolean;
  label: string;
  modelId: string;
  provider: string;
  /** ISO YYYY-MM-DD do lançamento público do modelo. Usado no eixo X do scatter. */
  releaseDate: string;
  /**
   * URL publicada pelo fornecedor que fixa `releaseDate` (anúncio, notas de
   * lançamento ou o commit dos pesos no repositório oficial do HF).
   *
   * Só é exigida quando a data decide classificação: em open-weight sem corte
   * declarado, a data de publicação dos pesos vira limite superior do corte, e
   * prova aplicada depois dela conta como limpa. Sem esta fonte o fallback não
   * se aplica — data de lançamento sem procedência não pode virar "limpo".
   * Ver docs/contamination.md.
   */
  releaseDateSource?: string;
  tier: ModelTier;
}

/**
 * `trainingCutoff` e `trainingCutoffSource` sempre andam juntos: ou ambos têm
 * valor (corte publicado pelo fornecedor + URL da fonte) ou ambos são
 * `undefined` (corte não publicado → contaminação `unknown`). Modelado como
 * union discriminada para que o type system impeça estados inválidos (ex.:
 * corte sem fonte). Ver docs/contamination.md.
 */
type TrainingCutoffFields =
  | { trainingCutoff: string; trainingCutoffSource: string }
  | { trainingCutoff: undefined; trainingCutoffSource: undefined };

export type ModelMetadata = ModelMetadataBase & TrainingCutoffFields;
