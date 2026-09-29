import { cn } from '@precisa-saude/ui/utils';
import { useEffect, useState } from 'react';

import { TYPE } from '../lib/typography';
import { PageContainer } from './PageContainer';

export interface TocItem {
  /** Id da `<section>` de destino, sem `#`. */
  id: string;
  label: string;
}

/** Id da última seção cujo topo já passou da faixa do cabeçalho fixo. */
function useActiveSection(items: readonly TocItem[]): string {
  const [active, setActive] = useState('');
  useEffect(() => {
    const update = () => {
      // No fim da página a última seção não chega ao topo; marcá-la direto.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActive(items[items.length - 1]?.id ?? '');
        return;
      }
      // 96 px: cabeçalho de 64 px mais a folga do `top-24` do sumário.
      const current = [...items]
        .reverse()
        .find((item) => (document.getElementById(item.id)?.getBoundingClientRect().top ?? 1) <= 96);
      setActive(current?.id ?? '');
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [items]);
  return active;
}

function TableOfContents({
  items,
  variant,
}: {
  items: readonly TocItem[];
  variant: 'inline' | 'rail';
}) {
  const active = useActiveSection(items);
  const rail = variant === 'rail';

  return (
    <nav
      aria-label="Sumário desta página"
      className={cn(
        'rounded-md p-4 sm:p-5',
        rail
          ? 'bg-card shadow-[0_0_0_1px_#463c6d24,0_6px_16px_#463c6d12]'
          : 'border border-border/60 bg-muted/30',
      )}
    >
      <p className={TYPE.label}>Nesta página</p>
      <ul
        className={cn(
          'mt-3 text-sm',
          rail ? 'space-y-0.5 border-l border-border' : 'grid gap-x-6 gap-y-1 sm:grid-cols-2',
        )}
      >
        {items.map((item) => {
          const isActive = rail && active === item.id;
          return (
            <li key={item.id}>
              <a
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  'transition-colors duration-200',
                  rail
                    ? '-ml-px block border-l-2 py-1.5 pl-3 leading-snug'
                    : 'text-primary hover:underline',
                  rail &&
                    (isActive
                      ? 'border-primary font-medium text-primary'
                      : 'border-transparent text-foreground/70 hover:border-ps-violet hover:text-primary'),
                )}
                href={`#${item.id}`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Sumário no fluxo do texto, para telas abaixo de 1280 px. */
export function InlineToc({ items }: { items: readonly TocItem[] }) {
  return (
    <div className="xl:hidden">
      <TableOfContents items={items} variant="inline" />
    </div>
  );
}

/**
 * Página de documento (Metodologia, Reprodução, Dataset). A partir de 1280 px
 * o sumário sai do fluxo e vira um cartão fixo nas três últimas colunas úteis;
 * o texto fica nas oito primeiras, com uma coluna de respiro entre os dois.
 * Abaixo disso a página coloca `<InlineToc>` logo depois do cabeçalho.
 */
export function DocLayout({
  children,
  toc,
}: {
  children: React.ReactNode;
  toc: readonly TocItem[];
}) {
  return (
    <PageContainer>
      <div className="xl:grid xl:grid-cols-12 xl:gap-4">
        <aside className="hidden xl:col-span-3 xl:col-start-10 xl:row-start-1 xl:block">
          <div className="sticky top-24">
            <TableOfContents items={toc} variant="rail" />
          </div>
        </aside>
        <div className="doc-prose space-y-16 xl:col-span-8 xl:row-start-1">{children}</div>
      </div>
    </PageContainer>
  );
}
