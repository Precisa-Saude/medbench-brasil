const gridStyle = {
  gridTemplateColumns: 'repeat(var(--grid-cols), 1fr)',
  maxWidth: 'var(--grid-max-w)',
  width: '100%',
} as const;

/**
 * Aplica o grid 14/16 colunas do sistema e restringe o conteúdo à coluna
 * principal (cols 2–13 em md; 3–14 em 3xl). Usado por todas as páginas
 * exceto pelo Hero da home, que vive fora do container para poder pintar
 * até a borda da viewport.
 */
export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid gap-4 px-4 py-10 md:px-0 lg:py-16" style={gridStyle}>
      <div className="col-span-full md:col-span-12 md:col-start-2 3xl:col-start-3">{children}</div>
    </div>
  );
}
