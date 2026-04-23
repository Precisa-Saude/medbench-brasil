## [1.4.0](https://github.com/Precisa-Saude/medbench-brasil/compare/v1.3.0...v1.4.0) (2026-04-22)

### Features

- **ci:** adotar workflows canônicos split + doctor + publish-tag ([80a56ec](https://github.com/Precisa-Saude/medbench-brasil/commit/80a56ec4167db119d4764283795705994e9a6935))
- consumir @precisa-saude/agent-instructions + worktree-cli ([acc582c](https://github.com/Precisa-Saude/medbench-brasil/commit/acc582c66a2ef1aac3de946802618fa8b6502915))

### Bug Fixes

- **lint:** settings.react.version para compat com ESLint 10 ([fa3e618](https://github.com/Precisa-Saude/medbench-brasil/commit/fa3e618a33c778d34403730d6b6b1b64f0845142))
- **site:** favicon mostra marca Precisa, não letra "F" ([f185246](https://github.com/Precisa-Saude/medbench-brasil/commit/f185246d0e9ce5ed26cb2e92e4640c25aa163ed3))

### Refactoring

- **site:** quebrar componentes longos sob limite de 400 linhas ([84d5a4f](https://github.com/Precisa-Saude/medbench-brasil/commit/84d5a4f1754c1b084e5c5592b01639de192e1e88))

### Styles

- **site:** ordenar props JSX (perfectionist/sort-jsx-props auto-fix) ([560c653](https://github.com/Precisa-Saude/medbench-brasil/commit/560c653661abe6c73bc777d471aa9f938a306933))

### Tests

- fechar gaps de cobertura em dataset + harness + ingestion ([e076091](https://github.com/Precisa-Saude/medbench-brasil/commit/e0760912adb96d0fdc046d832a28dcddc7f4205f))

### Chores

- alinhar hooks husky e turbo.json ao template compartilhado ([a68db11](https://github.com/Precisa-Saude/medbench-brasil/commit/a68db11f651e274576aa1cd2198bf04835341a95))
- **deps:** sync dotfiles + pre-push hook + Radix→Base UI Select ([#30](https://github.com/Precisa-Saude/medbench-brasil/issues/30)) ([9beb857](https://github.com/Precisa-Saude/medbench-brasil/commit/9beb85751f892d0d1ac55f34bd50e20f10528dac))

## [1.3.0](https://github.com/Precisa-Saude/medbench-brasil/compare/v1.2.1...v1.3.0) (2026-04-21)

### Features

- **scripts:** sanity-check-raws e diff de IC95 (PRE-194) ([#21](https://github.com/Precisa-Saude/medbench-brasil/issues/21)) ([63bdfd8](https://github.com/Precisa-Saude/medbench-brasil/commit/63bdfd88eb46fe0d50b51b681a5f2f1bcfba21f1))
- **site:** contrapesos de escopo no hero e redesenho do leaderboard ([#27](https://github.com/Precisa-Saude/medbench-brasil/issues/27)) ([34013f4](https://github.com/Precisa-Saude/medbench-brasil/commit/34013f476bade7d08deaa21283cd399d97faaf0c))
- **site:** metodologia explica variância entre execuções e deriva de fornecedor ([#24](https://github.com/Precisa-Saude/medbench-brasil/issues/24)) ([8efa9b4](https://github.com/Precisa-Saude/medbench-brasil/commit/8efa9b4ca3cd2f40bf103a8dd17bd24b2d8e3a9e))
- **site:** polish do heatmap, questões no mobile, cards de pacotes e tooltips ([#19](https://github.com/Precisa-Saude/medbench-brasil/issues/19)) ([97e53eb](https://github.com/Precisa-Saude/medbench-brasil/commit/97e53eb26b08f4e41c67c85eb7d9762f38276abc))
- **site:** revisar metodologia com TOC, debate institucional e legenda de elegibilidade ([#26](https://github.com/Precisa-Saude/medbench-brasil/issues/26)) ([cbbd314](https://github.com/Precisa-Saude/medbench-brasil/commit/cbbd3149d56c1aac1075911889c874a65f5c752b)), closes [#exames](https://github.com/Precisa-Saude/medbench-brasil/issues/exames) [#protocolo](https://github.com/Precisa-Saude/medbench-brasil/issues/protocolo) [#prompt](https://github.com/Precisa-Saude/medbench-brasil/issues/prompt) [#variancia](https://github.com/Precisa-Saude/medbench-brasil/issues/variancia) [#contaminacao](https://github.com/Precisa-Saude/medbench-brasil/issues/contaminacao) [#linha-de-base](https://github.com/Precisa-Saude/medbench-brasil/issues/linha-de-base) [#fontes](https://github.com/Precisa-Saude/medbench-brasil/issues/fontes)

### Bug Fixes

- cortes de treino a partir de fontes oficiais dos fornecedores ([#20](https://github.com/Precisa-Saude/medbench-brasil/issues/20)) ([329e27f](https://github.com/Precisa-Saude/medbench-brasil/commit/329e27faccd7ef2ff8ed351e9f92fafa80210962))
- **results:** backfill raws ausentes em revalida-2024-1 (16 modelos) ([#22](https://github.com/Precisa-Saude/medbench-brasil/issues/22)) ([2edf2e9](https://github.com/Precisa-Saude/medbench-brasil/commit/2edf2e91367479973eec3a26b5cba9dd28971caa))
- **results:** backfill raws ausentes em revalida-2025-1 (12 modelos) ([#23](https://github.com/Precisa-Saude/medbench-brasil/issues/23)) ([a936c31](https://github.com/Precisa-Saude/medbench-brasil/commit/a936c318d06ab40677b569496c22be3c326911b5))
- **site:** CTAs do hero alinhados e sem clipping em viewports estreitos ([dbd636d](https://github.com/Precisa-Saude/medbench-brasil/commit/dbd636d9fbe4cb4f9e44cf85a37ba540b7eaf2d6))

### Documentation

- **claude:** polling automático de PRs após push ([#28](https://github.com/Precisa-Saude/medbench-brasil/issues/28)) ([abdbed8](https://github.com/Precisa-Saude/medbench-brasil/commit/abdbed868ee99d81c6777e98c0e0a53c7411006f))

### CI/CD

- plugar sanity-check-raws no job Build & Test ([#25](https://github.com/Precisa-Saude/medbench-brasil/issues/25)) ([4b7f99c](https://github.com/Precisa-Saude/medbench-brasil/commit/4b7f99cd2ef3f30646648096970be091e663dc35)), closes [#21](https://github.com/Precisa-Saude/medbench-brasil/issues/21) [#22](https://github.com/Precisa-Saude/medbench-brasil/issues/22) [#23](https://github.com/Precisa-Saude/medbench-brasil/issues/23)

### Chores

- **deps:** adotar configs e UI compartilhados [@precisa-saude](https://github.com/precisa-saude) ([#29](https://github.com/Precisa-Saude/medbench-brasil/issues/29)) ([a4b1f2d](https://github.com/Precisa-Saude/medbench-brasil/commit/a4b1f2de406fb4e5f9933a0caafc1ce7204c2348))

## [1.2.1](https://github.com/Precisa-Saude/medbench-brasil/compare/v1.2.0...v1.2.1) (2026-04-20)

### Bug Fixes

- consumo dos pacotes npm (CJS do dataset, polish do CLI) ([#18](https://github.com/Precisa-Saude/medbench-brasil/issues/18)) ([ab28a88](https://github.com/Precisa-Saude/medbench-brasil/commit/ab28a88e7dfae633a8ab555b4505b28d59c62952))

## [1.2.0](https://github.com/Precisa-Saude/medbench-brasil/compare/v1.1.1...v1.2.0) (2026-04-20)

### Features

- métricas PROPOR 2026 (Macro-F1, passesCutoff, Conceito Enade, consenso) ([#17](https://github.com/Precisa-Saude/medbench-brasil/issues/17)) ([6131216](https://github.com/Precisa-Saude/medbench-brasil/commit/6131216bc55e361fd796d618b845e89df98fd29a))
- **scripts:** worktree.sh com alocação de porta do site ([#16](https://github.com/Precisa-Saude/medbench-brasil/issues/16)) ([874dd3d](https://github.com/Precisa-Saude/medbench-brasil/commit/874dd3dfd94a2ea90232c4f74c768ae2f3128c65))
- **site:** visualizações de specialty, contaminação e tendência ([#15](https://github.com/Precisa-Saude/medbench-brasil/issues/15)) ([aff7f44](https://github.com/Precisa-Saude/medbench-brasil/commit/aff7f44984d4525b83f605aa8510c58ae9515e9d))

## [1.1.1](https://github.com/Precisa-Saude/medbench-brasil/compare/v1.1.0...v1.1.1) (2026-04-20)

### Refactoring

- dedupe providers, split CLI e cleanup geral ([#12](https://github.com/Precisa-Saude/medbench-brasil/issues/12)) ([5997181](https://github.com/Precisa-Saude/medbench-brasil/commit/599718121c3b8503fb2e81222c621d996bd0bd05))

### CI/CD

- **ci:** [skip ci] no commit empty injetado para forçar release ([#13](https://github.com/Precisa-Saude/medbench-brasil/issues/13)) ([ff4b06f](https://github.com/Precisa-Saude/medbench-brasil/commit/ff4b06f41a578e85ed0e4183b288155923e921d8))
- **ci:** substitui force_release path por workflow publish-tag standalone ([#14](https://github.com/Precisa-Saude/medbench-brasil/issues/14)) ([eaaaecf](https://github.com/Precisa-Saude/medbench-brasil/commit/eaaaecf94f1822657bd9409cc83ec79a9b4cedb7)), closes [#11](https://github.com/Precisa-Saude/medbench-brasil/issues/11) [#13](https://github.com/Precisa-Saude/medbench-brasil/issues/13)

## [1.1.0](https://github.com/Precisa-Saude/medbench-brasil/compare/v1.0.0...v1.1.0) (2026-04-20)

### Features

- **results:** revalida-2024-2 sweep (20 de 21 modelos) ([#10](https://github.com/Precisa-Saude/medbench-brasil/issues/10)) ([d315df7](https://github.com/Precisa-Saude/medbench-brasil/commit/d315df70bc891e27932b3ae36fc0d08e209fc960))

### Bug Fixes

- manual release trigger via workflow_dispatch ([e208418](https://github.com/Precisa-Saude/medbench-brasil/commit/e2084189e882ce4e1c848f962865bc35cb74a858))

### Documentation

- adiciona READMEs para medbench-dataset e medbench-harness ([#9](https://github.com/Precisa-Saude/medbench-brasil/issues/9)) ([2eb9f32](https://github.com/Precisa-Saude/medbench-brasil/commit/2eb9f3237100b351b9e7762cdf5c97da87c48954))
- reescreve motivação e adiciona referências acadêmicas ([#8](https://github.com/Precisa-Saude/medbench-brasil/issues/8)) ([a6622a2](https://github.com/Precisa-Saude/medbench-brasil/commit/a6622a2bde95082290b5be35a838be6e72beb183))

### CI/CD

- **ci:** adiciona workflow_dispatch com force_release para release manual ([#11](https://github.com/Precisa-Saude/medbench-brasil/issues/11)) ([c064ce4](https://github.com/Precisa-Saude/medbench-brasil/commit/c064ce426f1f0335dc006140b2ba093c6228f29f)), closes [6/#7](https://github.com/6/medbench-brasil/issues/7) [#9](https://github.com/Precisa-Saude/medbench-brasil/issues/9)

### Chores

- atualiza domínio de medbench-brasil.dev.br para .ia.br ([#5](https://github.com/Precisa-Saude/medbench-brasil/issues/5)) ([610af9e](https://github.com/Precisa-Saude/medbench-brasil/commit/610af9e529a4fe8ce68f3b918e534a5b65b2337b))

## 1.0.0 (2026-04-19)

### Features

- convergência Revalida + ENAMED — generaliza schema, ingesta ENAMED 2025 ([#3](https://github.com/Precisa-Saude/medbench-brasil/issues/3)) ([3f205b6](https://github.com/Precisa-Saude/medbench-brasil/commit/3f205b6c5e99a0dcb47c982f099d600c3f2cc602))
- **dataset:** adicionar edições Revalida 2024/1 e 2024/2 ([c0b7db6](https://github.com/Precisa-Saude/medbench-brasil/commit/c0b7db691814cab28b698211dfac1dcd6f72f0f9))
- **harness,results:** validar safeguards com GPT-5 nano + fix temperature ([2d7053b](https://github.com/Precisa-Saude/medbench-brasil/commit/2d7053b8444381aa820cc424aead2bf3cd5394c7))
- **harness,site:** adicionar backend Maritaca (Sabiá 4) ([24ed2ac](https://github.com/Precisa-Saude/medbench-brasil/commit/24ed2ac026da9e1fb981597641f3e115d002b48f))
- **harness,site:** backend OpenRouter como primário para open-weight ([42dc8de](https://github.com/Precisa-Saude/medbench-brasil/commit/42dc8deef3972a123aa8c0237978702aa53c1a3b))
- **harness,site:** backend Together AI para Qwen, Llama 4 e DeepSeek ([f593a42](https://github.com/Precisa-Saude/medbench-brasil/commit/f593a4280201a576193a7539fcdc04489f74cece))
- **harness,site:** layout por edição para artefatos de resultado ([1848c8b](https://github.com/Precisa-Saude/medbench-brasil/commit/1848c8b7bbc47c4bf778b5f963eb3ee0f4b4e080))
- **harness:** medbench smoke + raw JSONL log para cada chamada ([d45fa54](https://github.com/Precisa-Saude/medbench-brasil/commit/d45fa54e19bfb3ab1a28409bf7b1bce2ff89a444))
- **harness:** providers OpenAI, Google e OpenAI-compat (Ollama) + CLI multi-backend ([1fc1998](https://github.com/Precisa-Saude/medbench-brasil/commit/1fc1998d956085bcdd45f7d1b5fe92b88567f4aa))
- **harness:** retomar eval a partir do JSONL bruto ([a0afd0d](https://github.com/Precisa-Saude/medbench-brasil/commit/a0afd0d5fdc5240e970e2952d1afe6de5b7e5b18))
- **ingestion,dataset:** extração real de Revalida 2025/1 via Bedrock Haiku 4.5 ([ab4cb3f](https://github.com/Precisa-Saude/medbench-brasil/commit/ab4cb3f6de1e525edf08d2002d4a1443aeb670e5))
- **ingestion:** pipeline de extração Revalida com @kreuzberg/node + Claude tool_use ([ff68d5a](https://github.com/Precisa-Saude/medbench-brasil/commit/ff68d5a93e9b907fc57649c7f2d6f776ae2e1950))
- **results,site:** Llama 4 Scout em revalida-2024-1 + rota wildcard para modelIds com barra ([83b2e62](https://github.com/Precisa-Saude/medbench-brasil/commit/83b2e629c8be76e73367a3d4880f5dfb4f98d1e7))
- **results:** adicionar avaliações de Llama 3.3, Llama 4 Maverick, Sabiá 3, DeepSeek V3-0324 ([7b29e98](https://github.com/Precisa-Saude/medbench-brasil/commit/7b29e988a6502882baeb95371a00673261519f40))
- **results:** DeepSeek R1 em Revalida 2024/1 (85.9%) ([764b861](https://github.com/Precisa-Saude/medbench-brasil/commit/764b861cfc618bbd6f9bc76ec2cbb9eb0eb00f5d))
- **results:** Gemini 3.1 Pro em Revalida 2024/1 (96.5%, contaminada) ([707c49b](https://github.com/Precisa-Saude/medbench-brasil/commit/707c49b99b80188f82d7952b2c46864f9dcb1818))
- **results:** Qwen 3 235B + DeepSeek V3.1/R1 em revalida-2024-1 e 2025-1 ([322017f](https://github.com/Precisa-Saude/medbench-brasil/commit/322017ff7ee43f279b5322014e43ace107b08470))
- **results:** Qwen 3.6 Plus, Qwen 3.5 122B, V3-0324, Mistral Large (2411+2512) ([57c1bed](https://github.com/Precisa-Saude/medbench-brasil/commit/57c1bedeb7e1a079ae1910fb7f6e0d94e79147de))
- **site,harness:** redesign do site alinhado ao fhir-brasil + resultados 2024-1 ([4cbdb4e](https://github.com/Precisa-Saude/medbench-brasil/commit/4cbdb4ec648e8d63d20db9c7781207118f9d0e4f))
- **site:** adicionar Mistral Large (2512 + 2411) ao leaderboard ([22b6742](https://github.com/Precisa-Saude/medbench-brasil/commit/22b6742142c2c58bc40915f42ba0dae4a869d76c))
- **site:** agrupa barras do ComparisonChart por Jenks natural breaks ([bf00e49](https://github.com/Precisa-Saude/medbench-brasil/commit/bf00e49f8c92d81f0d1b12e638458f03dae1b910))
- **site:** cards de execução por modelo no grid de 12 col com link pro detalhe ([694149f](https://github.com/Precisa-Saude/medbench-brasil/commit/694149f8a343a89231a444e557390135a2092662))
- **site:** filtro por família no ComparisonChart + barras de altura fixa ([6f09d91](https://github.com/Precisa-Saude/medbench-brasil/commit/6f09d91d91dc8338a746416fdd39a93c08f348df))
- **site:** metadados para Opus 4.5/4.6, GPT-5.1/5.2, Gemini 2.5/3.1, Qwen 3.6 ([5453cb6](https://github.com/Precisa-Saude/medbench-brasil/commit/5453cb65361bed06e0dd4e9d5e64bb6ee4091b79))
- **site:** metadata para versões anteriores imediatas dos flagships open-weight ([17d5d52](https://github.com/Precisa-Saude/medbench-brasil/commit/17d5d524cfe9e04cae940672bf927a652370fc2c))
- **site:** trocar Qwen 3.6 local por Qwen 3.6 Plus via OpenRouter ([9c86887](https://github.com/Precisa-Saude/medbench-brasil/commit/9c8688776cba6d82a0adbc45048cbb7b3c49310c))

### Bug Fixes

- **dataset:** publishedAt real para 2024/1 e 2024/2 ([3222b0e](https://github.com/Precisa-Saude/medbench-brasil/commit/3222b0e30e741293cde36f32af75700e1a456929))
- **harness:** AbortController timeout por request + log de progresso ([166d508](https://github.com/Precisa-Saude/medbench-brasil/commit/166d508dc1a02b66a8956743f544af5f28154652))
- **harness:** Anthropic timeout 180s + retry em AbortError ([6f0fb45](https://github.com/Precisa-Saude/medbench-brasil/commit/6f0fb4546714b53336f14dbce7c988536a666219))
- **harness:** parser de letra pega PRIMEIRA maiúscula após frase de compromisso ([38cdef4](https://github.com/Precisa-Saude/medbench-brasil/commit/38cdef49caff80616996c5c46645332d84bf8b1d))
- **harness:** parser resolve commit final + re-run DeepSeek V3.1 com score corrigido ([1fd86f3](https://github.com/Precisa-Saude/medbench-brasil/commit/1fd86f36f1b81e6475158e6828b428d048354b95))
- **harness:** parser robusto de letra + max_tokens suficiente para modelos com reasoning ([e765c98](https://github.com/Precisa-Saude/medbench-brasil/commit/e765c9825ce367b2be1466d6f880134fe21b9b62))
- **harness:** retry com backoff exponencial em erros transientes + OpenAI max_completion_tokens + Opus 4 sem temperature ([f2442cc](https://github.com/Precisa-Saude/medbench-brasil/commit/f2442cc846f27a9a89818ea8902ecb8f4607b3b4))
- **harness:** retry reconhece undici 'terminated' + cause.message ([f0dbd37](https://github.com/Precisa-Saude/medbench-brasil/commit/f0dbd3772490959c817a05294cb2b297338976b5))
- **ingestion,harness:** marcadores anulada unicode + budget suficiente para Gemini thoughts ([d2f9ebd](https://github.com/Precisa-Saude/medbench-brasil/commit/d2f9ebd788757d76760afbdcf4c1f687afc1b310))
- **ingestion:** download via curl para lidar com cadeia ICP-Brasil + tipo metadata ([06c4521](https://github.com/Precisa-Saude/medbench-brasil/commit/06c4521a361e2392ea8befb9769312dafabf9d96))
- **results:** corrigir Mistral Large com parser final ([ddf0145](https://github.com/Precisa-Saude/medbench-brasil/commit/ddf01456ce42917cbe66097a6494390deb5c340a))
- **site:** backfill accuracyByEdition a partir do path para artefatos v0 ([41c0e6e](https://github.com/Precisa-Saude/medbench-brasil/commit/41c0e6e91dd12f13c94375c1df8edaa86464003f))
- **site:** contenimination panel sem contagem bruta de runs ([312cf04](https://github.com/Precisa-Saude/medbench-brasil/commit/312cf04e919b9bc2bf8217f68ccd4b6ee22fa03f))
- **site:** trocar por modelos serverless do Together (Llama 3.3, Qwen 3-235B) ([2fdd171](https://github.com/Precisa-Saude/medbench-brasil/commit/2fdd1718e7c6399ea519e24f285dc42dd1fd5b0d))

### Styles

- **site:** 'Apenas limpas' como visão default do ranking ([a95eee4](https://github.com/Precisa-Saude/medbench-brasil/commit/a95eee4e06d1a8b62ad89a86aa9e5ae5720a6b58))
- **site:** ajustes de tipografia, scrollbar, radar e página de modelo ([9a54d14](https://github.com/Precisa-Saude/medbench-brasil/commit/9a54d1454bb1a796d45ca49b92dc65847612a408))
- **site:** ajustes finos no leaderboard, metodologia e chart de comparação ([400bd05](https://github.com/Precisa-Saude/medbench-brasil/commit/400bd05d1a1b392e915b432f6306a0451d9548b6))
- **site:** precisão em vez de acurácia no ContaminationPanel ([5b14dc4](https://github.com/Precisa-Saude/medbench-brasil/commit/5b14dc48d5dd3617bd7c29a0263e4c4704425997))
- **site:** tweaks no ranking, chart e reprodução + citation + reorder models ([3c891ff](https://github.com/Precisa-Saude/medbench-brasil/commit/3c891ff6d3f6262ad99657a98e03901c84b5a2df))

### CI/CD

- pipeline de release via GitHub App + publish npm + notify Slack ([#4](https://github.com/Precisa-Saude/medbench-brasil/issues/4)) ([6b77b9f](https://github.com/Precisa-Saude/medbench-brasil/commit/6b77b9fb3b8e5d6380dd51f0cadcfcc8e24f1e5e))
- review automatizado de PRs via Claude Opus 4.6 no Bedrock ([86b4e56](https://github.com/Precisa-Saude/medbench-brasil/commit/86b4e56e7ce619f8ca7d0015dfb534796e4e126e))

### Chores

- build loop limpo, subpath export e rodapé Precisa ([21b0555](https://github.com/Precisa-Saude/medbench-brasil/commit/21b05551affeb6f8a8bc4262732efaad7384dd48))
- **config:** husky hooks + commitlint scopes + index.html SEO ([68c9b9a](https://github.com/Precisa-Saude/medbench-brasil/commit/68c9b9a35b5b77d37dc9902b73423efa025ad5ed))
- scaffold inicial do medbench-brasil ([6f0a48a](https://github.com/Precisa-Saude/medbench-brasil/commit/6f0a48adcbbf777d32fb4ad8cc0f93b2a1c94332))

# Changelog

## Não lançado

- Bootstrap do repositório: toolchain pnpm + turbo, pacotes `dataset` e `eval-harness`, site React + Vite + Tailwind + Recharts, workflow de CI e deploy no Cloudflare Pages, documentação de metodologia em pt-BR
