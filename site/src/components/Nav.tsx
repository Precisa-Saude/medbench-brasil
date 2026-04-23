import { Header } from '@precisa-saude/ui';
import { useWideGrid } from '@precisa-saude/ui/hooks';
import { cn } from '@precisa-saude/ui/utils';
import { Activity, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const NAV_LINKS = [
  { col: 5, href: '/questoes', label: 'Questões', span: 2 },
  { col: 7, href: '/metodologia', label: 'Metodologia', span: 2 },
  { col: 9, href: '/reproducao', label: 'Reprodução', span: 2 },
  { col: 11, href: '/dataset', label: 'Dataset', span: 2 },
] as const;

const GITHUB_URL = 'https://github.com/Precisa-Saude/medbench-brasil';

const logo = (
  <Link
    className="inline-flex h-full items-center gap-1.5 font-margem text-xl font-bold tracking-tight text-white"
    to="/"
  >
    <Activity className="h-6 w-6 shrink-0 text-white" />
    medbench-brasil
  </Link>
);

export function Nav() {
  const [open, setOpen] = useState(false);
  const wide = useWideGrid();
  const offset = wide ? 1 : 0;

  const navItems = (
    <>
      {NAV_LINKS.map((link) => (
        <NavLink
          key={link.href}
          className={({ isActive }) =>
            cn(
              'hidden h-full items-center justify-center border-b-2 font-margem text-base font-medium transition-colors lg:flex',
              isActive
                ? 'border-white text-white'
                : 'border-transparent text-white/70 hover:border-white hover:text-white',
            )
          }
          style={{ gridColumn: `${link.col + offset} / span ${link.span}` }}
          to={link.href}
        >
          {link.label}
        </NavLink>
      ))}
    </>
  );

  const actions = (
    <a
      className="hidden items-center justify-center gap-1.5 self-center rounded-full bg-white/15 px-4 py-2 font-margem text-sm font-medium text-white transition-colors hover:bg-white/25 lg:inline-flex"
      href={GITHUB_URL}
      rel="noopener noreferrer"
      style={{ gridColumn: `${13 + offset} / span 2` }}
      target="_blank"
    >
      GitHub
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );

  const mobileNavItems = (
    <div className="flex flex-col gap-4 px-6 py-6">
      {NAV_LINKS.map((link) => (
        <NavLink
          key={link.href}
          className={({ isActive }) =>
            cn(
              'font-margem text-base font-medium transition-colors',
              isActive ? 'text-foreground' : 'text-foreground/70 hover:text-foreground',
            )
          }
          to={link.href}
          onClick={() => setOpen(false)}
        >
          {link.label}
        </NavLink>
      ))}
      <a
        className="inline-flex items-center gap-1.5 font-margem text-sm font-medium text-foreground/70"
        href={GITHUB_URL}
        rel="noopener noreferrer"
        target="_blank"
      >
        GitHub
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );

  return (
    <Header
      actions={actions}
      className="border-b border-white/10 bg-ps-violet-dark/95 backdrop-blur-md"
      containerClassName="mx-auto px-4 md:px-0"
      contentClassName="grid h-16 items-center gap-4"
      iconClassName="text-white"
      isMobileMenuOpen={open}
      logo={logo}
      mobileNavItems={mobileNavItems}
      navItems={navItems}
      onToggleMobileMenu={setOpen}
    />
  );
}
