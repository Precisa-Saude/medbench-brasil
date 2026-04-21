import { useDesktop, useWideGrid } from '@precisa-saude/ui/hooks';
import { cn } from '@precisa-saude/ui/utils';
import { Activity, ExternalLink, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const NAV_LINKS = [
  { col: 5, href: '/questoes', label: 'Questões', span: 2 },
  { col: 7, href: '/metodologia', label: 'Metodologia', span: 2 },
  { col: 9, href: '/reproducao', label: 'Reprodução', span: 2 },
  { col: 11, href: '/dataset', label: 'Dataset', span: 2 },
] as const;

const gridStyle = {
  gridTemplateColumns: 'repeat(var(--grid-cols), 1fr)',
  maxWidth: 'var(--grid-max-w)',
  width: '100%',
} as const;

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const desktop = useDesktop();
  const wide = useWideGrid();
  const offset = wide ? 1 : 0;

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-ps-violet-dark/95 backdrop-blur-md">
      <div
        className="mx-auto flex h-16 items-center justify-between px-4 md:grid md:items-stretch md:gap-4 md:px-0"
        style={gridStyle}
      >
        <Link
          to="/"
          className="inline-flex h-full items-center gap-1.5 font-margem text-xl font-bold tracking-tight text-white md:col-span-3"
          style={desktop ? { gridColumnStart: 2 + offset } : undefined}
        >
          <Activity className="h-6 w-6 shrink-0 text-white" />
          medbench-brasil
        </Link>

        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.href}
            to={link.href}
            className={({ isActive }) =>
              cn(
                'hidden h-full items-center justify-center border-b-2 font-margem text-base font-medium transition-colors md:flex',
                isActive
                  ? 'border-white text-white'
                  : 'border-transparent text-white/70 hover:border-white hover:text-white',
              )
            }
            style={{ gridColumn: `${link.col + offset} / span ${link.span}` }}
          >
            {link.label}
          </NavLink>
        ))}

        <a
          href="https://github.com/Precisa-Saude/medbench-brasil"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center justify-center gap-1.5 self-center rounded-full bg-white/15 px-4 py-2 font-margem text-sm font-medium text-white transition-colors hover:bg-white/25 md:inline-flex"
          style={{ gridColumn: `${13 + offset} / span 2` }}
        >
          GitHub
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-md p-2 text-white md:hidden"
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          'overflow-hidden border-t border-white/10 bg-ps-violet-dark/95 backdrop-blur-md transition-all duration-200 md:hidden',
          mobileOpen ? 'max-h-80' : 'max-h-0 border-t-0',
        )}
      >
        <div className="flex flex-col gap-4 px-6 py-4">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'font-margem text-base font-medium transition-colors',
                  isActive ? 'text-white' : 'text-white/70 hover:text-white',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          <a
            href="https://github.com/Precisa-Saude/medbench-brasil"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-margem text-sm font-medium text-white/70"
          >
            GitHub
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </nav>
  );
}
