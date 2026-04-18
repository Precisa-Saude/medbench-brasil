# Contaminação de treino

## O problema

Todas as provas do Revalida são publicadas pela INEP e estão indexadas publicamente. É praticamente certo que fazem parte do corpus de treino de todo modelo de fronteira. Não é possível eliminar essa contaminação; é possível e obrigatório **medi-la e reportá-la com transparência**.

## Classificação por edição

Para cada modelo, cada edição é classificada em:

- **`likely-clean`** — edição publicada após o corte de treino declarado do modelo
- **`likely-contaminated`** — edição publicada antes ou na mesma data do corte
- **`unknown`** — corte de treino não declarado pelo fornecedor

A implementação está em `packages/dataset/src/contamination.ts`.

## Reporte duplo obrigatório

Toda visualização no site apresenta o escore nos dois recortes quando ambos existem:

- precisão em edições limpas (medida mais confiável de capacidade real)
- precisão em edições contaminadas (baseline histórico, útil para comparação com estudos anteriores)

A diferença entre os dois é um dado em si: mede o quanto memorização infla o escore.

## Cortes de treino dos modelos

Declarados em cada provider (`packages/eval-harness/src/providers/<modelo>.ts`) como `trainingCutoff`. Fonte **obrigatoriamente** a documentação oficial do fornecedor. Quando o fornecedor não publica o corte, usamos a melhor estimativa pública e documentamos a fonte no comentário acima da declaração.

## A vantagem do benchmark vivo

A cada nova edição publicada pela INEP, o conjunto de provas limpas cresce para todos os modelos avaliados antes daquela data. Com o tempo, as edições mais recentes (2–3 últimas) tornam-se os números de referência e as antigas viram baseline histórico de contaminação.

## Canary tests (roadmap v2)

Para v2, planejamos três testes adicionais (opcional, por modelo):

1. **Completion test** — dar os primeiros 10–15 tokens do enunciado e pedir o restante; reprodução verbatim indica contaminação forte
2. **Shuffled options** — reordenar A/B/C/D; queda grande de precisão sugere memorização posicional
3. **Paraphrase** — reformular enunciado preservando conteúdo clínico; queda sugere memorização sobre compreensão

Os resultados desses testes serão publicados por modelo e por edição quando implementados.
