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
  label: string;
  modelId: string;
  provider: string;
  /** ISO YYYY-MM-DD do lançamento público do modelo. Usado no eixo X do scatter. */
  releaseDate: string;
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
