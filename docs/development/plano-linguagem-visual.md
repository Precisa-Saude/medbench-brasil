# Plano — linguagem visual da /laudos no site

## Objetivo

Aproximar o visual de `medbench-brasil.ia.br` da landing de Precisa Laudos
(`precisa-saude.com.br/laudos`), referência atual da linguagem visual da
Precisa. Atualização **só visual**: nenhum texto, dado ou página novos.

Referência normativa: `platform/docs/design/linguagem-visual.md` (v0.1,
10/09/2026) e a implementação em `platform/apps/landing/src/components/laudos/`.

## Decisões

- **Fontes.** Margem (texto, dados, interface) e Pausa 300 (títulos) carregadas
  de `https://www.precisa-saude.com.br/fonts/`, que já responde com
  `Access-Control-Allow-Origin: *`. Os arquivos não entram neste repositório,
  que é público. Roboto, Roboto Serif e Roboto Mono saem; código usa o mono do
  sistema, como na /laudos.
- **Papéis invertidos.** Hoje o corpo é serifado e os títulos são sem serifa.
  Passa a ser o contrário: Pausa leve nos títulos, Margem no resto.
- **Hero da home.** Sai o bloco roxo centralizado. Entra o campo neutro com
  texto à esquerda (5 colunas), painel de números à direita (6 colunas) e o
  `SectionBackdrop` portado da /laudos. As pílulas viram a linha de base do
  hero. "Para que serve" e "O que não mede" viram itens numerados, como em
  "O problema".
- **Cabeçalho.** Roxo sólido, sem blur, com o botão GitHub em contorno branco
  e hover menta, igual ao "Vamos Conversar".
- **Seções.** Títulos alinhados à esquerda, divisória de 1px entre seções,
  alternância entre fundo neutro e `muted`. Fundos geométricos só no hero: nas
  seções de tabela e gráfico eles competiriam com os dados.
- **Sem sobretítulos inventados.** O sobretítulo aparece só onde já existe
  texto que cumpre esse papel (nome do produto no hero).

## Etapas

- [x] Fontes e tokens (`index.html`, `index.css`, `tailwind.config.js`)
- [x] Escala tipográfica compartilhada (`lib/typography.ts`)
- [x] Cabeçalho
- [x] Hero e seções da home
- [x] Páginas internas: cabeçalho de página, h2/h3, blocos
- [x] Componentes: tabelas, cartões, toggles, gráficos
- [ ] Verificação em 1440 e 375 px feita; faltam 1024, 768, movimento reduzido e foco por teclado

## Fora de escopo

- Conteúdo novo, páginas novas, mudanças de dados.
- Porta do dev server: `vite.config.ts` fixa 4321 e ignora a porta alocada
  pelo `precisa-worktree`.
