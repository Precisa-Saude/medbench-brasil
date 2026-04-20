import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

export interface PaginationProps {
  itemsLabel?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  page: number;
  pageSize: number;
  pageSizeOptions?: number[];
  totalRows: number;
}

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

export function Pagination({
  itemsLabel = 'linhas',
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  totalRows,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const canPrev = current > 1;
  const canNext = current < totalPages;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-2 py-3 font-sans text-sm sm:flex-row">
      <div className="hidden items-center gap-2 sm:flex">
        <span className="text-muted-foreground">Mostrar</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-8 w-auto min-w-[5rem] px-2 py-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">por página</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">
          {totalRows} {itemsLabel}
        </span>
        <div className="flex items-center gap-1">
          <IconButton disabled={!canPrev} onClick={() => onPageChange(1)} label="Primeira página">
            <ChevronsLeft className="h-4 w-4" />
          </IconButton>
          <IconButton
            disabled={!canPrev}
            onClick={() => onPageChange(current - 1)}
            label="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <span className="min-w-[4rem] text-center font-mono text-muted-foreground">
            {current} / {totalPages}
          </span>
          <IconButton disabled={!canNext} onClick={() => onPageChange(current + 1)} label="Próxima">
            <ChevronRight className="h-4 w-4" />
          </IconButton>
          <IconButton
            disabled={!canNext}
            onClick={() => onPageChange(totalPages)}
            label="Última página"
          >
            <ChevronsRight className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-border p-1 text-foreground transition-colors hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
