/**
 * Fundo abstrato portado de `platform/apps/landing/src/components/laudos/
 * SectionBackdrop.tsx`. Campo de 1440 × 700 unidades: círculo preenchido,
 * bloco de canto arredondado, contorno deslocado, um conjunto de linhas de
 * movimento, matriz de pontos e um acento coral. As posições são fixas para
 * a composição não mudar entre renderizações.
 */
export interface SectionBackdropProps {
  cx?: number;
  cy?: number;
  flip?: boolean;
  /** Troca lavanda por menta no círculo principal. */
  mint?: boolean;
}

const ROW_OFFSETS = [32, 4, 57, 19, 71, 0, 43];
const FRAGMENT_COLORS = ['#463C6D', '#8E8BD8', '#9EF2E2'];

export function SectionBackdrop({ cx = 1210, cy = 430, flip, mint }: SectionBackdropProps) {
  return (
    <svg
      aria-hidden="true"
      className="brand-backdrop"
      focusable="false"
      preserveAspectRatio="xMidYMax slice"
      viewBox="0 0 1440 700"
    >
      <g transform={flip ? 'translate(1440 0) scale(-1 1)' : undefined}>
        <circle cx={cx} cy={cy} fill={mint ? '#9EF2E2' : '#8E8BD8'} r="300" />
        <path
          d={`M${cx - 120} ${cy + 110}h360v280h-180a180 180 0 0 1-180-180Z`}
          fill={mint ? '#8E8BD8' : '#9EF2E2'}
        />
        <circle cx={cx - 120} cy={cy + 25} fill="none" r="350" stroke="#8E8BD8" strokeWidth="2" />
        <g fill="#463C6D">
          {Array.from({ length: 20 }, (_, i) => (
            <circle key={i} cx={1320 + (i % 4) * 15} cy={100 + Math.floor(i / 4) * 15} r="2.5" />
          ))}
        </g>
        <g>
          {ROW_OFFSETS.map((offset, row) => (
            <g key={row} transform={`translate(${990 + offset} ${178 + row * 15})`}>
              <path d="M0 3h410" opacity=".2" stroke="#8E8BD8" strokeWidth="1" />
              {Array.from({ length: 10 }, (_, col) => (
                <rect
                  key={col}
                  fill={FRAGMENT_COLORS[(col + row * 2) % 3]}
                  height={2 + ((col + row) % 3) * 2}
                  opacity={0.45 + ((col * 3 + row) % 4) * 0.15}
                  width={8 + ((col * 7 + row * 11) % 27)}
                  x={col * 40 + ((col * 17 + row * 23 + col * row * 7) % 23) - 11}
                  y={(col % 2) * 2}
                />
              ))}
            </g>
          ))}
        </g>
        <circle cx="1400" cy="310" fill="#F47A5C" r="9" />
      </g>
    </svg>
  );
}
