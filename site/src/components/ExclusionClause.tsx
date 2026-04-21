import { Fragment, type ReactNode } from 'react';

export type ExclusionCounts = {
  insufficientSplit: number;
  noCutoff: number;
};

export function ExclusionClause({ excluded }: { excluded: ExclusionCounts }) {
  const reasons: ReactNode[] = [];
  if (excluded.noCutoff > 0) {
    reasons.push(
      <>
        {excluded.noCutoff} sem corte de treino declarado pelo fornecedor (classificados como{' '}
        <em>unknown</em>)
      </>,
    );
  }
  if (excluded.insufficientSplit > 0) {
    reasons.push(
      <>
        {excluded.insufficientSplit} com edições só de um lado (todas limpas ou todas contaminadas)
        e portanto sem comparação interna
      </>,
    );
  }
  if (reasons.length === 0) return null;
  return <> Ficam de fora {joinPtBr(reasons)}.</>;
}

// Junta com vírgulas e "e" antes do último item, seguindo pt-BR:
//   [A]           → A
//   [A, B]        → A e B
//   [A, B, C]     → A, B e C
function joinPtBr(nodes: ReactNode[]): ReactNode {
  const last = nodes.length - 1;
  return (
    <>
      {nodes.map((node, i) => (
        <Fragment key={i}>
          {i === 0 ? '' : i === last ? ' e ' : ', '}
          {node}
        </Fragment>
      ))}
    </>
  );
}
