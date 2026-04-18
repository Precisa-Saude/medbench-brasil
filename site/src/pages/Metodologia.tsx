import { SYSTEM_PROMPT } from '@precisa-saude/medbench-harness/prompt';

export default function Metodologia() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-sans text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          Metodologia
        </h1>
        <p className="mt-6 max-w-3xl font-serif text-lg leading-relaxed text-muted-foreground sm:text-xl">
          O medbench-brasil existe porque um leaderboard público só é útil se for reproduzível e
          honesto sobre suas limitações. Esta página documenta o protocolo exato usado para cada
          avaliação.
        </p>
      </header>

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">
          Protocolo de avaliação
        </h2>
        <ul className="mt-3 list-disc list-inside space-y-1 text-foreground">
          <li>Zero-shot, uma questão por requisição, sem histórico nem few-shot</li>
          <li>Nenhuma ferramenta, conector, capacidade de busca ou RAG</li>
          <li>Três execuções por modelo; média e IC 95% (Wilson score) reportados</li>
          <li>Questões com imagem, tabela ou anuladas excluídas por padrão</li>
          <li>
            Todos os parâmetros de API registrados em <code>results/</code>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">
          System prompt literal
        </h2>
        <pre className="mt-3 bg-card border rounded p-4 text-sm overflow-x-auto">
          <code>{SYSTEM_PROMPT}</code>
        </pre>
      </section>

      <section id="contaminacao">
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">
          Contaminação de treino
        </h2>
        <p className="mt-3">
          Toda prova pública do Revalida anterior ao corte de treino de um modelo é marcada como{' '}
          <em>provavelmente contaminada</em>. Relatamos precisão separadamente para edições limpas e
          contaminadas — a diferença entre as duas mede quanto memorização infla o escore.
        </p>
        <p className="mt-3">
          O recorte mais confiável é sempre a edição mais recente da INEP. A cada nova prova, o
          leaderboard ganha um ponto de dado limpo para todos os modelos avaliados antes daquela
          data.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">
          Linha de base humana
        </h2>
        <p className="mt-3">
          Mostramos três linhas em cada gráfico por edição: nota de corte oficial (publicada no
          edital da INEP), média humana estimada (retrocalculada a partir da taxa de aprovação,
          assumindo distribuição normal) e o escore do modelo. A nota de corte sozinha é uma linha
          de base ruim — a taxa de aprovação do Revalida fica na casa de 15–20%, então a média real
          dos candidatos está bem abaixo da nota de corte.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">Fontes</h2>
        <ul className="mt-3 list-disc list-inside space-y-1 text-foreground">
          <li>
            Provas e gabaritos:{' '}
            <a
              className="underline text-ps-violet"
              href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida/provas-e-gabaritos"
            >
              INEP Revalida
            </a>
          </li>
          <li>
            Taxas de aprovação: Painel Revalida INEP; pedidos via Lei de Acesso à Informação quando
            necessário
          </li>
          <li>Cortes de treino dos modelos: documentação oficial de cada fornecedor</li>
        </ul>
      </section>
    </div>
  );
}
