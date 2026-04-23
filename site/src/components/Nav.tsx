import { Header } from '@precisa-saude/ui';
import { useWideGrid } from '@precisa-saude/ui/hooks';
import { cn } from '@precisa-saude/ui/utils';
import { Activity, BookOpen, Database, ExternalLink, Github, ListChecks, Play } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import pkg from '../../../package.json';

const NAV_LINKS = [
  { col: 5, href: '/questoes', icon: ListChecks, label: 'Questões', span: 2 },
  { col: 7, href: '/metodologia', icon: BookOpen, label: 'Metodologia', span: 2 },
  { col: 9, href: '/reproducao', icon: Play, label: 'Reprodução', span: 2 },
  { col: 11, href: '/dataset', icon: Database, label: 'Dataset', span: 2 },
] as const;

const GITHUB_URL = 'https://github.com/Precisa-Saude/medbench-brasil';

const logo = (
  <Link
    className="inline-flex h-full items-center gap-1.5 font-margem text-xl font-bold tracking-tight whitespace-nowrap text-white"
    to="/"
  >
    <Activity className="h-6 w-6 shrink-0 text-white" />
    medbench-brasil
  </Link>
);

const mobileNavLinkClass = (active: boolean): string =>
  cn(
    'flex w-full items-center gap-3 rounded-md px-3 py-2.5 font-margem text-base transition-colors',
    active ? 'bg-primary/10 font-medium text-primary' : 'text-foreground hover:bg-muted',
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
    <div className="flex min-h-0 flex-1 flex-col">
      <Link
        className="mb-2 flex cursor-pointer justify-center px-3 py-2"
        to="/"
        onClick={() => setOpen(false)}
      >
        <Activity className="size-8 text-primary" />
      </Link>
      <div className="mb-2 border-t border-border" />

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3">
        {NAV_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.href}
              className={({ isActive }) => mobileNavLinkClass(isActive)}
              to={link.href}
              onClick={() => setOpen(false)}
            >
              <Icon className="size-5" />
              {link.label}
            </NavLink>
          );
        })}
      </div>

      <div className="border-t border-border" />
      <div className="mt-auto px-3 pt-4 pb-4">
        <a
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 font-margem text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          href={GITHUB_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Github className="size-4" />
          GitHub
          <ExternalLink className="size-3.5" />
        </a>
      </div>

      <div className="border-t border-border" />
      <div
        className="pt-3 pb-6 text-center font-margem text-xs text-muted-foreground"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        v{pkg.version}
      </div>
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
