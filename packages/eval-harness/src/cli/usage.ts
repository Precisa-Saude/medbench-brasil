/* eslint-disable no-console */
export function printUsage(): void {
  console.log(`uso: medbench <comando> [opções]

Comandos:
  eval    Roda avaliação completa (todas as questões × --runs)
  smoke   Pré-flight: roda ~8 questões e valida parser. Aborta com código não-zero
          se taxa de parse correto ficar abaixo do threshold.
          Use SEMPRE antes de eval em um modelo novo.

Opções comuns (ambos os comandos):
  --backend <anthropic|openai|google|ollama|maritaca|together|openrouter>  (obrigatório)
  --model <id>                (obrigatório)
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
  --threshold 0.7             (padrão: 0.7 = exige ≥70% de parses corretos)`);
}
