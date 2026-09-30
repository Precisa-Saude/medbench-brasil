import { useState } from 'react';

import { ATUALIZACOES, formataData, TIPO_LABEL } from '../data/atualizacoes';
import { TYPE } from '../lib/typography';

const VISIVEIS = 5;

/**
 * Histórico do que mudou no benchmark, com data.
 *
 * Existe porque quem volta ao site precisa saber se um número mudou desde a
 * última visita, e o `CHANGELOG.md` não responde isso: ele mistura correção de
 * bug e ajuste de build com o que de fato altera resultado publicado.
 */
export default function Atualizacoes() {
  const [expandido, setExpandido] = useState(false);
  const lista = expandido ? ATUALIZACOES : ATUALIZACOES.slice(0, VISIVEIS);
  const restantes = ATUALIZACOES.length - VISIVEIS;

  return (
    <div className="space-y-6">
      <ol className="space-y-4">
        {lista.map((item) => (
          <li
            key={`${item.data}-${item.titulo}`}
            className="rounded-lg border border-border bg-card px-5 py-4"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <time className="font-mono text-sm text-foreground/60" dateTime={item.data}>
                {formataData(item.data)}
              </time>
              <span className="rounded border border-ps-violet/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ps-violet">
                {TIPO_LABEL[item.tipo]}
              </span>
            </div>
            <h3 className={`mt-2 text-foreground ${TYPE.h3}`}>{item.titulo}</h3>
            <p className={`mt-1 text-foreground/70 ${TYPE.cardBody}`}>
              {item.resumo}
              {item.pr !== undefined && (
                <>
                  {' '}
                  <a
                    className="font-medium text-primary underline underline-offset-4 hover:decoration-2"
                    href={`https://github.com/Precisa-Saude/medbench-brasil/pull/${item.pr}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Ver a mudança
                  </a>
                  .
                </>
              )}
            </p>
          </li>
        ))}
      </ol>

      {restantes > 0 && (
        <button
          className="font-sans text-sm underline underline-offset-4 hover:decoration-2"
          type="button"
          onClick={() => setExpandido((v) => !v)}
        >
          {expandido ? 'Mostrar menos' : `Mostrar mais ${restantes}`}
        </button>
      )}
    </div>
  );
}
