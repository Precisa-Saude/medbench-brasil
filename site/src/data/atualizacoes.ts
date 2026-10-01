/**
 * Histórico público do que mudou no benchmark.
 *
 * Isto não é o `CHANGELOG.md`. Lá entra tudo que o `semantic-release` vê,
 * inclusive correção de bug, refatoração e ajuste de build, que não alteram
 * nenhum número publicado. Aqui entra só o que muda o que o leitor vê: edição
 * nova, modelo novo, remedição, gabarito atualizado, critério de exclusão.
 *
 * A lista é curada à mão de propósito. Derivar de commits traria ruído de
 * implementação junto, e a distinção entre "mudou o dado" e "mudou o código"
 * é justamente o que dá valor à página.
 *
 * Ao acrescentar entrada: data em ISO, `resumo` numa frase que faça sentido
 * para quem não acompanha o repositório, e `pr` quando existir, porque
 * verificar é metade do ponto de um benchmark aberto.
 */

export type TipoDeAtualizacao = 'edicao' | 'modelos' | 'medicao' | 'dados';

export interface Atualizacao {
  /** ISO YYYY-MM-DD. Data em que a mudança entrou na `main`. */
  data: string;
  /** Número do PR no GitHub, quando a mudança veio por um. */
  pr?: number;
  /** Uma frase, para quem não acompanha o repositório. */
  resumo: string;
  tipo: TipoDeAtualizacao;
  titulo: string;
}

export const TIPO_LABEL: Record<TipoDeAtualizacao, string> = {
  dados: 'Dados',
  edicao: 'Edição',
  medicao: 'Medição',
  modelos: 'Modelos',
};

/** Mais recente primeiro. */
export const ATUALIZACOES: readonly Atualizacao[] = [
  {
    data: '2026-09-30',
    resumo:
      'Nove medições de modelos abertos sem corte de treino publicado deixam de ser "unknown": a prova foi aplicada depois da publicação dos pesos, então não pode estar no treino. Provas anteriores ao lançamento seguem "unknown".',
    tipo: 'medicao',
    titulo: 'Data de lançamento dos pesos como limite do corte',
  },
  {
    data: '2026-09-30',
    resumo:
      'O DeepSeek V4 Pro tira 95,7% na ENAMED 2026, medido sobre os mesmos pesos de abril avaliados na ENAMED 2025.',
    tipo: 'modelos',
    titulo: 'DeepSeek V4 Pro na ENAMED 2026',
  },
  {
    data: '2026-09-30',
    resumo:
      'Os provedores deixaram de servir o R1 original; o único que resta devolve a resposta vazia em boa parte das chamadas. Os escores das edições anteriores continuam publicados, mas não são reproduzíveis hoje.',
    tipo: 'modelos',
    titulo: 'DeepSeek R1 fica fora da ENAMED 2026',
  },
  {
    data: '2026-09-29',
    pr: 74,
    resumo:
      'Primeira rodada completa da edição, com 23 modelos no leaderboard. O gabarito ainda é o preliminar da INEP, então os escores são provisórios até sair o definitivo.',
    tipo: 'edicao',
    titulo: 'ENAMED 2026 entra no benchmark',
  },
  {
    data: '2026-09-29',
    pr: 74,
    resumo:
      'Jev 1.13 e Kev 4B passam a aparecer com o selo de decisão. Recebem a questão como pergunta tipada e devolvem a alternativa com vetor de probabilidades, sem gerar texto.',
    tipo: 'modelos',
    titulo: 'Modelos de decisão no leaderboard',
  },
  {
    data: '2026-09-29',
    pr: 74,
    resumo:
      'O Claude Opus 5.5 rodava com o esforço no default do fornecedor, um nível abaixo dos outros modelos da família. Passou a 89,4% depois de remedido com o esforço fixado.',
    tipo: 'medicao',
    titulo: 'Opus 5.5 remedido com esforço fixado',
  },
  {
    data: '2026-09-27',
    pr: 67,
    resumo:
      'A nota de corte passou a ter uma fonte só, no dataset, e as quatro edições anteriores foram preenchidas com os valores oficiais. Antes o site e o dataset declaravam o corte em lugares separados e divergiram.',
    tipo: 'dados',
    titulo: 'Nota de corte unificada nas quatro edições',
  },
  {
    data: '2026-09-27',
    pr: 65,
    resumo:
      'As 100 questões entraram no dataset com o gabarito preliminar, conferidas contra uma leitura independente do PDF.',
    tipo: 'edicao',
    titulo: 'ENAMED 2026 ingerida',
  },
  {
    data: '2026-08-13',
    pr: 57,
    resumo:
      'O checkpoint com reinforcement learning sobre Protocolos Clínicos do SUS entra na Revalida 2025/1, ao lado do CPT-4gen que já estava no roster.',
    tipo: 'modelos',
    titulo: 'Qwen RL-4gen 14B na Revalida 2025/1',
  },
  {
    data: '2026-08-06',
    pr: 52,
    resumo: 'O modelo de raciocínio da Maritaca passa a ser avaliado junto com o Sabiá 4.',
    tipo: 'modelos',
    titulo: 'Sabiá 4 Thinking entra no roster',
  },
  {
    data: '2026-08-03',
    pr: 48,
    resumo:
      'GPT-5.6 Sol, Qwen 3.7 Max, DeepSeek V4 Pro, Kimi K3, Grok 4.5, Gemini 3.6 Flash, Claude Opus 5 e Sonnet 5 entram na ENAMED 2025.',
    tipo: 'modelos',
    titulo: 'Oito modelos de fronteira na ENAMED 2025',
  },
  {
    data: '2026-05-12',
    pr: 37,
    resumo:
      'Baseline do Qwen 2.5 14B e o checkpoint com continued pretraining em Protocolos Clínicos do SUS, para medir transferência de diretriz para prova.',
    tipo: 'modelos',
    titulo: 'Qwen 2.5 14B e CPT-4gen via MLX local',
  },
  {
    data: '2026-04-20',
    pr: 20,
    resumo:
      'Os cortes de treino passaram a sair de documentação publicada pelo fornecedor. Modelo sem corte publicado ficou sem classificação, em vez de receber estimativa.',
    tipo: 'dados',
    titulo: 'Cortes de treino a partir de fontes oficiais',
  },
  {
    data: '2026-04-19',
    pr: 3,
    resumo:
      'O schema do dataset passou a cobrir as duas provas, e a ENAMED 2025 entrou ao lado das edições do Revalida.',
    tipo: 'edicao',
    titulo: 'ENAMED 2025 entra ao lado do Revalida',
  },
];

/** Data da entrada mais recente, para o destaque na abertura. */
export function ultimaAtualizacao(): string | undefined {
  return ATUALIZACOES[0]?.data;
}

/** `2026-09-29` para `29 set 2026`, sem depender de fuso. */
export function formataData(iso: string): string {
  const meses = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
  ];
  const [ano, mes, dia] = iso.split('-');
  const nome = meses[Number(mes) - 1];
  if (!ano || !dia || !nome) return iso;
  return `${Number(dia)} ${nome} ${ano}`;
}
