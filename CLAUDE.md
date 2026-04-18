# Instruções para Claude neste repositório

## Idioma

Todos os artefatos versionados neste repositório são escritos em **pt-BR**: commits, README, docs, CONTRIBUTING, CHANGELOG, comentários voltados ao leitor e texto do site. Identificadores técnicos (nomes de tipos, funções, scripts, pacotes) permanecem em inglês técnico. Arquivos padrão da comunidade (`LICENSE`, `SECURITY.md`, `CITATION.cff`) mantêm o formato upstream.

## Integridade do benchmark — inegociável

Ao modificar o harness de avaliação (`packages/eval-harness/`), preserve rigorosamente estas garantias:

1. Nenhuma ferramenta, conector ou capacidade de busca nas chamadas de API
2. System prompt mínimo e literal: `"Responda a seguinte questão de múltipla escolha selecionando a letra correta (A, B, C ou D)."`
3. Uma questão por requisição HTTP — sem histórico, sem few-shot, sem contexto de outras questões
4. Três execuções por modelo; relatar média e IC 95%
5. Registrar todos os parâmetros de API em `results/` (model, temperature, max_tokens, system prompt verbatim)
6. Modelos locais rodam em modo completion puro, sem scaffolding de ferramentas

Qualquer mudança que afrouxe esses pontos exige ADR em `docs/development/adr/` e aprovação do mantenedor.

## Dados de prova

- Fonte única e exclusiva: portal oficial INEP
- Gabaritos pós-recurso (alterações marcadas em azul) sempre prevalecem sobre gabarito preliminar
- Questões com imagem, tabela ou anuladas devem ser marcadas mas não excluídas do JSON — a exclusão é decisão do scorer
- Nunca inventar valores; se um gabarito está ilegível, abra uma issue e aguarde

## Cortes de treino (contamination)

Toda definição de provider em `packages/eval-harness/src/providers/` deve declarar `trainingCutoff` — fonte obrigatoriamente a documentação oficial do fornecedor. Se o fornecedor não publicar o corte, usar a melhor estimativa pública e documentar a fonte no código.

## Git

- Sempre criar PR, nunca push direto em `main`
- Nunca usar `--no-verify` ou pular hooks
- Commits em pt-BR, Conventional Commits, escopos válidos listados em `CONVENTIONS.md`
