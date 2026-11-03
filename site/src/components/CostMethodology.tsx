import { MODEL_PRICING } from '../data/model-registry/pricing';
import { getModelMetadata } from '../data/models';
import { TYPE } from '../lib/typography';

export default function CostMethodology() {
  return (
    <section id="custo">
      <h2 className={TYPE.h2}>Como estimamos o custo</h2>
      <p className="mt-3">
        A coluna US$/questão usa tokens declarados pela API e uma tarifa padrão de referência com
        fonte e data de verificação. Inclui as três execuções por questão. Raciocínio já pertence ao
        total de saída; cache já pertence à entrada.
      </p>
      <p className="mt-3">
        <code>
          USD = (tokens de entrada × tarifa de entrada + tokens de saída × tarifa de saída) /
          1.000.000
        </code>
      </p>
      <p className="mt-3">
        <code>USD/questão = USD / (chamadas pontuadas / execuções por questão)</code>
      </p>
      <p className="mt-3">
        É uma estimativa à tabela registrada, sem descontos de cache ou batch, taxas, câmbio ou
        condições negociadas. O fornecedor de referência pode não ser a rota usada na execução
        histórica. Não é fatura: tentativas com erro, smoke e chamadas sem resposta precisam ser
        contabilizadas pelos ledgers e conciliadas com o fornecedor.
      </p>
      <p className="mt-3">
        O traço indica consumo ou preço desconhecido, nunca gratuidade. Avaliações antigas sem usage
        não recebem tokens estimados pelo comprimento do texto. Uma única edição sem consumo
        completo impede estimativa completa daquele agregado. Na visão limpa, só entram edições
        limpas; o gráfico compara uma edição por vez.
      </p>
      <p className="mt-3">
        Tarifas com validade encerrada deixam de produzir estimativas. Se a tarifa depende do
        tamanho do prompt, só usamos a faixa registrada quando a entrada agregada inteira cabe nela.
        Acima disso, o agregado não revela o maior prompt e o custo permanece desconhecido. Preços
        de Sabiá publicados em BRL e execução local não recebem conversão ou tarifa de API
        presumida.
      </p>
      <p className="mt-3">
        A fronteira de Pareto é descritiva: nenhum outro ponto observado tem menor ou igual custo e
        maior ou igual precisão, com melhora em ao menos um eixo. Não é teste de significância.
        Modelos de decisão ficam fora desse gráfico por seguirem outro protocolo; sua marcação na
        tabela é preservada.
      </p>
      <p className="mt-3">
        <a
          className="underline text-ps-violet"
          href="https://github.com/Precisa-Saude/medbench-brasil/blob/main/docs/development/adr/0005-metodologia-de-custo.md"
          rel="noreferrer"
          target="_blank"
        >
          ADR 0005: consumo observado e estimativas de custo
        </a>
      </p>
      <details className="mt-6 rounded-lg border p-4">
        <summary className="cursor-pointer font-medium">
          Tarifas de referência e fontes verificadas
        </summary>
        <p className="my-3 text-sm text-muted-foreground">
          USD por milhão de tokens, sem cache/batch. Data de verificação não é data de lançamento
          nem prova do preço cobrado no passado.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Tarifas padrão de referência com procedência</caption>
            <thead>
              <tr>
                <th scope="col">Modelo</th>
                <th scope="col">Entrada/saída</th>
                <th scope="col">Referência</th>
                <th scope="col">Verificação e validade</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(MODEL_PRICING).map(([id, p]) => (
                <tr key={id} className="border-t align-top">
                  <th className="py-3 font-normal" scope="row">
                    {getModelMetadata(id).label}
                  </th>
                  <td className="py-3 font-mono">
                    {p.pricePerMTokInputUSD} / {p.pricePerMTokOutputUSD}
                  </td>
                  <td className="max-w-sm py-3">
                    <a
                      className="underline text-ps-violet"
                      href={p.priceSource}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {p.priceProvider}
                    </a>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Trechos da fonte: {p.priceQuote}
                    </div>
                  </td>
                  <td className="py-3">
                    {p.priceAsOf}
                    {p.priceValidThrough && <div>Até {p.priceValidThrough}</div>}
                    {p.priceMaxInputTokens !== undefined && (
                      <div>
                        Faixa: até {p.priceMaxInputTokens.toLocaleString('pt-BR')} tokens de entrada
                        por chamada
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
