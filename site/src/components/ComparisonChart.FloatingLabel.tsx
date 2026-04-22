/**
 * Posiciona o filho como coluna absoluta dentro da área de plotagem.
 * `leftPercent` é o valor (0–100) no domínio do eixo X; o pill sai
 * centralizado sobre essa coordenada.
 */

import type { ReactNode } from 'react';

export interface FloatingLabelProps {
  children: ReactNode;
  leftPercent: number;
  /** Linha vertical (0 = topo). Cada linha desce ~28px. */
  row?: number;
}

export default function FloatingLabel({ children, leftPercent, row = 0 }: FloatingLabelProps) {
  return (
    <div
      className="absolute flex -translate-x-1/2 items-start"
      style={{ left: `${leftPercent}%`, top: `${row * 28}px` }}
    >
      {children}
    </div>
  );
}
