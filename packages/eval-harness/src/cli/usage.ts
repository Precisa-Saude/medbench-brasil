/* eslint-disable no-console */
export function printUsage(): void {
  console.log(`uso: medbench <comando> [opções]

Comandos:
  eval      Roda avaliação completa (todas as questões × --runs)
  smoke     Pré-flight: roda ~8 questões e valida parser. Aborta com código não-zero
            se taxa de parse correto ficar abaixo do threshold.
            Use SEMPRE antes de eval em um modelo novo.
  rescore   Recalcula métricas (Macro-F1, passesCutoff) sem chamar provider.
            Opera sobre artefatos já em results/ — grátis e determinístico.
  report    Imprime relatórios agregados por edição (Conceito Enade,
            erros de consenso) a partir dos scored JSONs existentes.

Opções de eval/smoke (exigem --backend e --model):
  --backend <anthropic|openai|google|ollama|maritaca|together|openrouter>
  --model <id>
  --edition revalida-2025-1   (padrão)
  --label "Nome legível"
  --cutoff YYYY-MM-DD
  --concurrency N             (padrão: 10 para APIs, 1 para ollama)

Opções de eval:
  --runs N                    (padrão: 3)
  --out DIR                   (padrão: results/)
  --no-raw-log                Desabilita JSONL bruto (por padrão ativado)
  --restart                   Descarta JSONL prévio e recomeça do zero
                              (padrão: retoma de onde parou)

Opções de smoke:
  --samples N                 (padrão: 8)
  --threshold 0.7             (padrão: 0.7 = exige ≥70% de parses corretos)

Opções de rescore:
  --edition <id>              (opcional — filtra por edição)
  --model <id>                (opcional — filtra por modelo)
  --out DIR                   (padrão: results/)
  --from-raw                  Reconstrói a partir de raw.jsonl em vez do
                              scored existente. Exige --edition, --model e
                              opcionalmente --cutoff/--runs.

Opções de report:
  --edition <id>              (obrigatório)
  --enade                     Imprime Conceito Enade agregado (padrão: true)
  --consensus-errors          Lista questões com distractor consensual
  --min-failing-count N       (padrão: 3)
  --min-failing-rate R        (padrão: 0.8)
  --limit N                   (padrão: 20 — top-N consensus errors)
  --out DIR                   (padrão: results/)`);
}
