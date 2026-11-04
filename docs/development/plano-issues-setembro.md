# Encerramento das issues de setembro

## Objetivo

Resolver #58, #60 e #68, conforme autorização do mantenedor em 04/11/2026.
Não encerrar pendências sem evidência nem transformar fonte secundária em
primária apenas mudando uma URL.

## Estado atual

- #58 encerrada: `npx --yes @precisa-saude/cli@3.0.0 doctor`, mesma versão
  fixada pelo CI, retornou zero requisitos pendentes. A migração v3 aposentou
  sync e tornou configuração local propriedade do repo. Não executar sync.
- #60 encerrada: datasets e primeiros resultados publicados no PR #89, com sucessores
  escolhidos pelo mantenedor em vez do backfill histórico. PR #92 adiciona
  seis avaliações completas de Terra, Haiku e Argon. As pendências
  de cadernos e reuso de ENAMED foram verificadas no comentário de encerramento:
  cadernos 1/2 de 2026/1 têm os mesmos 100 pares ITEM/versão. Os cinco
  sucessores escolhidos não possuem raws de ENAMED 2025 para reaproveitar.
- #68: correção implementada, commit autorizado pelo mantenedor em 04/11/2026.
  Publicação de PR pendente. A API
  pública do Power BI retornou inscritos/presentes/aprovados, conferidos
  entre histórico e cartões por edição. Snapshot e consultas preservados,
  com hashes. Nenhum login ou acesso a dados individuais.

## Especificação para #68

1. Extrair do painel oficial inscritos, participantes e aprovados na primeira
   etapa de 2024/1, 2024/2 e 2025/1. Usar somente endpoints públicos expostos
   pelo link do INEP, sem autenticação ou contorno de acesso restrito.
2. Preservar resposta bruta agregada, consulta/filtros e hash SHA-256 em
   evidência versionada; registrar data/hora do snapshot e fonte oficial.
3. Denominador canônico: participantes presentes na primeira etapa, pois a
   referência compara desempenho de quem fez a prova. Não misturar aprovação
   final das duas etapas com aprovação da primeira. Se esse recorte não for
   verificável, deixar a lacuna explícita e não alterar valores por suposição.
4. Atualizar metadata das três edições e suas referências editoriais, sem
   alterar questões, gabaritos, cutoffs ou resultados de modelos.
5. Documentar a natureza dinâmica e a data do snapshot. Testar a proporção
   aprovações/participantes, consistência dataset/site e ausência de efeito
   nos resultados dos modelos. Conferir mudança na média humana estimada.
6. Se houver bloqueio de extração, registrar evidência e pedir decisão antes
   de substituir a resolução por outra abordagem ou enviar pedido LAI.

## Próximos passos

- Concluído: recortes do Power BI, snapshot e correção das três taxas.
- Concluído: #58 e #60 encerradas com evidências.
- Verificações locais de #68 passaram. Criar o commit autorizado; PR pendente.
- Fechar #68 apenas após a correção ser integrada ou outra resolução explícita.

## Contagens oficiais preservadas

| Edição | Inscritos | Presentes | Aprovados | Taxa adotada |
| ------ | --------: | --------: | --------: | -----------: |
| 2024/1 |    10.049 |     9.532 |     2.550 |     26,7520% |
| 2024/2 |    10.821 |    10.335 |     2.509 |     24,2767% |
| 2025/1 |    17.118 |    15.949 |     4.499 |     28,2087% |

Timestamp da resposta do histórico: `2026-11-04T15:43:29.267Z`, preservado
no manifesto junto à data de carga e refresh do modelo. Snapshots não são
formatados pelo Prettier, pois os testes verificam seus bytes por SHA-256.
As três matrizes de questões permaneceram idênticas por hash, assim como
cutoffs e artefatos de modelos. Somente metadata estatística e referências
humanas do site mudaram.
