import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@precisa-saude/ui/primitives';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { allQuestions, getEdition } from '../data/dataset';
import type { ModelResult, PerQuestionResult } from '../data/results';
import { SPECIALTY_LABELS, specialtyLabel } from '../data/specialties';
import { Pagination } from './ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

type Filter = 'all' | 'divergent' | 'no-one-correct' | 'all-correct';

export default function QuestionsTable({ models }: { models: ModelResult[] }) {
  const questions = useMemo(() => allQuestions(), []);

  // Edições com dados de avaliação (ao menos um modelo tem perQuestion).
  // Só essas entram no dropdown — edições sem nenhum modelo avaliado geram
  // uma tabela 100% "—" sem valor de inspeção (ex.: enamed-2025,
  // revalida-2024-2). Se ainda não há nenhuma avaliação, cai no set completo
  // para não quebrar a renderização do filtro.
  const editions = useMemo(() => {
    const withData = new Set<string>();
    for (const m of models) for (const p of m.perQuestion ?? []) withData.add(p.editionId);
    if (withData.size === 0) {
      return [...new Set(questions.map((q) => q.editionId))].sort();
    }
    return [...withData].sort();
  }, [models, questions]);

  const [editionFilter, setEditionFilter] = useState<string>('all');

  // Quando o filtro é uma edição específica, esconde colunas de modelos sem
  // perQuestion para aquela edição — evita colunas inteiras de "—" (ex.:
  // Gemini 3.1 Pro foi avaliado só em 2024/1, então some em 2025/1).
  const visibleModels = useMemo(() => {
    if (editionFilter === 'all') return models;
    return models.filter((m) => (m.perQuestion ?? []).some((p) => p.editionId === editionFilter));
  }, [models, editionFilter]);

  // Handlers que resetam a página quando um filtro muda — senão, estar na
  // página 2 de um resultado grande e trocar pra um filtro com poucos resultados
  // deixa pageRows vazio, mostrando a tabela sem nenhuma linha renderizada.
  const onEditionChange = (v: string | null) => {
    if (v === null) return;
    setEditionFilter(v);
    setPage(1);
  };
  const onSpecialtyChange = (v: string | null) => {
    if (v === null) return;
    setSpecialtyFilter(v);
    setPage(1);
  };
  const onFilterChange = (v: Filter) => {
    setFilter(v);
    setPage(1);
  };
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filtros "divergente/todos-acertam/ninguém-acerta" avaliam sobre os
  // modelos que aparecem no grid — usar visibleModels evita que uma coluna
  // escondida (ex.: Gemini 3.1 Pro sem dados em 2025/1) afete o resultado
  // de uma questão cujos modelos visíveis todos concordam.
  const withPerQuestion = visibleModels.filter((m) => (m.perQuestion?.length ?? 0) > 0);

  const rows = useMemo(() => {
    const out: Array<{
      annulled: boolean;
      byModel: Record<string, PerQuestionResult | undefined>;
      correct: 'A' | 'B' | 'C' | 'D';
      editionId: string;
      hasImage: boolean;
      hasTable: boolean;
      number: number;
      questionId: string;
      specialty: string[];
    }> = [];
    const evaluatedEditions = new Set(editions);
    for (const q of questions) {
      // Mesmo quando editionFilter === 'all', não queremos poluir a tabela
      // com edições sem avaliação (ex.: enamed-2025) — todas as células
      // sairiam "—".
      if (!evaluatedEditions.has(q.editionId)) continue;
      if (editionFilter !== 'all' && q.editionId !== editionFilter) continue;
      if (specialtyFilter !== 'all' && !q.specialty.includes(specialtyFilter as never)) continue;
      const byModel: Record<string, PerQuestionResult | undefined> = {};
      for (const m of models) {
        byModel[m.modelId] = m.perQuestion?.find((p) => p.questionId === q.id);
      }
      if (filter !== 'all' && withPerQuestion.length > 0) {
        // Só considera modelos que efetivamente responderam esta questão.
        const answered = withPerQuestion.filter((m) => byModel[m.modelId] !== undefined);
        if (answered.length === 0) continue; // questão excluída (anulada/imagem/tabela)
        const answers = answered.map((m) => byModel[m.modelId]!.majority).filter(Boolean);
        const corrects = answered.map((m) => byModel[m.modelId]!.majorityCorrect);
        if (filter === 'divergent' && new Set(answers).size < 2) continue;
        if (filter === 'no-one-correct' && corrects.some(Boolean)) continue;
        if (filter === 'all-correct' && corrects.some((c) => !c)) continue;
      }
      out.push({
        annulled: q.annulled,
        byModel,
        correct: q.correct,
        editionId: q.editionId,
        hasImage: q.hasImage,
        hasTable: q.hasTable,
        number: q.number,
        questionId: q.id,
        specialty: q.specialty,
      });
    }
    return out;
  }, [questions, models, editions, editionFilter, specialtyFilter, filter, withPerQuestion]);

  const totalRows = rows.length;
  const start = (page - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 font-sans sm:gap-4">
        <FilterField label="Edição">
          <Select value={editionFilter} onValueChange={onEditionChange}>
            <SelectTrigger className="h-9 w-full sm:w-[calc(2*var(--col-w)+1rem)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {editions.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Especialidade">
          <Select value={specialtyFilter} onValueChange={onSpecialtyChange}>
            <SelectTrigger className="h-9 w-full sm:w-[calc(2*var(--col-w)+1rem)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(SPECIALTY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Filtro">
          <Select value={filter} onValueChange={(v) => onFilterChange(v as Filter)}>
            <SelectTrigger className="h-9 w-full sm:w-[calc(2*var(--col-w)+1rem)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as questões</SelectItem>
              <SelectItem value="divergent">Modelos divergem</SelectItem>
              <SelectItem value="no-one-correct">Ninguém acertou</SelectItem>
              <SelectItem value="all-correct">Todos acertaram</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="hidden md:block">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="sticky left-0 z-20 w-[110px] min-w-[110px] bg-muted">
                  Edição
                </TableHead>
                <TableHead className="sticky left-[110px] z-20 w-[56px] min-w-[56px] bg-muted">
                  #
                </TableHead>
                <TableHead className="sticky left-[166px] z-20 w-[200px] min-w-[200px] bg-muted after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-border">
                  Especialidade
                </TableHead>
                <TableHead className="text-center">Gabarito</TableHead>
                {visibleModels.map((m) => (
                  <TableHead
                    key={m.modelId}
                    className="text-center whitespace-nowrap"
                    title={m.label}
                  >
                    {m.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((row) => (
                <QuestionRow
                  key={row.questionId}
                  row={row}
                  models={visibleModels}
                  expanded={expanded === row.questionId}
                  onToggle={() =>
                    setExpanded((cur) => (cur === row.questionId ? null : row.questionId))
                  }
                />
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="divide-y divide-border md:hidden">
          {pageRows.map((row) => (
            <MobileQuestionCard
              key={row.questionId}
              row={row}
              models={visibleModels}
              expanded={expanded === row.questionId}
              onToggle={() =>
                setExpanded((cur) => (cur === row.questionId ? null : row.questionId))
              }
            />
          ))}
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          totalRows={totalRows}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          itemsLabel="questões"
        />
      </div>
    </div>
  );
}

function FilterField({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm sm:flex-initial">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function QuestionRow({
  expanded,
  models,
  onToggle,
  row,
}: {
  expanded: boolean;
  models: ModelResult[];
  onToggle: () => void;
  row: {
    annulled: boolean;
    byModel: Record<string, PerQuestionResult | undefined>;
    correct: 'A' | 'B' | 'C' | 'D';
    editionId: string;
    hasImage: boolean;
    hasTable: boolean;
    number: number;
    questionId: string;
    specialty: string[];
  };
}) {
  const question = useMemo(
    () => getEdition(row.editionId)?.questions.find((q) => q.id === row.questionId),
    [row.editionId, row.questionId],
  );
  const excluded = row.annulled || row.hasImage || row.hasTable;
  const excludeReason = row.annulled
    ? 'Questão anulada após recurso'
    : row.hasImage && row.hasTable
      ? 'Depende de imagem e tabela'
      : row.hasImage
        ? 'Depende de imagem'
        : row.hasTable
          ? 'Depende de tabela'
          : '';
  return (
    <>
      <TableRow className="group cursor-pointer" onClick={onToggle}>
        <TableCell className="sticky left-0 z-10 w-[110px] min-w-[110px] bg-background font-mono text-xs text-muted-foreground transition-colors group-hover:bg-muted">
          {row.editionId}
        </TableCell>
        <TableCell className="sticky left-[110px] z-10 w-[56px] min-w-[56px] bg-background font-mono transition-colors group-hover:bg-muted">
          {row.number}
        </TableCell>
        <TableCell className="sticky left-[166px] z-10 w-[200px] min-w-[200px] bg-background text-xs text-muted-foreground transition-colors group-hover:bg-muted after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-border">
          {row.specialty.map((s) => specialtyLabel(s)).join(', ')}
        </TableCell>
        <TableCell className="text-center font-mono font-semibold">{row.correct}</TableCell>
        {models.map((m) => {
          const p = row.byModel[m.modelId];
          if (!p) {
            const reasonLabel = row.annulled
              ? 'anulada'
              : row.hasImage && row.hasTable
                ? 'imagem + tabela'
                : row.hasImage
                  ? 'imagem'
                  : row.hasTable
                    ? 'tabela'
                    : null;
            return (
              <TableCell
                key={m.modelId}
                className="text-center"
                title={excluded ? excludeReason : 'Sem dados por questão deste modelo'}
              >
                {reasonLabel ? (
                  <ReasonBadge>{reasonLabel}</ReasonBadge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            );
          }
          const runsCorrect = p.runs.filter((r) => r.correct).length;
          const ratio = runsCorrect / p.runs.length;
          const tone =
            ratio === 1
              ? 'bg-emerald-600 text-white'
              : ratio === 0
                ? 'bg-red-600 text-white'
                : 'bg-amber-500 text-white';
          const pillTone =
            ratio === 1
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : ratio === 0
                ? 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400'
                : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400';
          return (
            <TableCell key={m.modelId} className="text-center">
              <div className="inline-flex items-center gap-1.5">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-bold ${tone}`}
                >
                  {p.majority ?? '?'}
                </span>
                <span
                  className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${pillTone}`}
                >
                  {runsCorrect}/{p.runs.length}
                </span>
              </div>
            </TableCell>
          );
        })}
      </TableRow>
      {expanded && question && (
        <tr className="border-b bg-muted/20">
          <td colSpan={4 + models.length} className="p-0">
            <div
              className="sticky left-0 space-y-3 px-4 py-4"
              style={{
                maxWidth: '100vw',
                width: 'calc(12 * var(--col-w) + 11rem)',
              }}
            >
              <div className="font-serif text-base leading-relaxed whitespace-pre-wrap">
                {question.stem}
              </div>
              <ul className="space-y-1.5 font-serif text-base leading-relaxed">
                {(['A', 'B', 'C', 'D'] as const).map((letter) => (
                  <li
                    key={letter}
                    className={`flex gap-2 ${letter === question.correct ? 'font-semibold' : ''}`}
                  >
                    <span className="font-mono">{letter})</span>
                    <span>{question.options[letter]}</span>
                  </li>
                ))}
              </ul>
              <div className="text-xs text-muted-foreground">Execuções por modelo:</div>
              <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-12">
                {models.map((m) => {
                  const p = row.byModel[m.modelId];
                  return (
                    <Link
                      key={m.modelId}
                      to={`/models/${m.modelId}`}
                      className="col-span-2 rounded-lg border bg-card p-4 font-sans transition-colors hover:border-ps-violet/40 hover:bg-muted/50 md:col-span-3"
                    >
                      <div className="font-semibold text-ps-violet">{m.label}</div>
                      {p ? (
                        <div className="mt-3 flex gap-1.5">
                          {p.runs.map((r, i) => (
                            <span
                              key={i}
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-bold ${
                                r.correct
                                  ? 'bg-emerald-600 text-white'
                                  : r.parsed
                                    ? 'bg-red-600 text-white'
                                    : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {r.parsed ?? '?'}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 text-muted-foreground">sem dados por questão</div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ReasonBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </span>
  );
}

function MobileQuestionCard({
  expanded,
  models,
  onToggle,
  row,
}: {
  expanded: boolean;
  models: ModelResult[];
  onToggle: () => void;
  row: {
    annulled: boolean;
    byModel: Record<string, PerQuestionResult | undefined>;
    correct: 'A' | 'B' | 'C' | 'D';
    editionId: string;
    hasImage: boolean;
    hasTable: boolean;
    number: number;
    questionId: string;
    specialty: string[];
  };
}) {
  const question = useMemo(
    () => getEdition(row.editionId)?.questions.find((q) => q.id === row.questionId),
    [row.editionId, row.questionId],
  );
  const excludedReason = row.annulled
    ? 'anulada'
    : row.hasImage && row.hasTable
      ? 'imagem + tabela'
      : row.hasImage
        ? 'imagem'
        : row.hasTable
          ? 'tabela'
          : null;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full space-y-2 bg-background px-4 py-3 text-left transition-colors active:bg-muted/40"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2 font-mono text-xs text-muted-foreground">
            <span>{row.editionId}</span>
            <span>·</span>
            <span className="font-semibold text-foreground">#{row.number}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Gabarito</span>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary font-mono text-sm font-bold text-primary-foreground">
              {row.correct}
            </span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {row.specialty.map((s) => specialtyLabel(s)).join(', ')}
        </div>
        <div className="-mx-1 flex flex-wrap gap-1.5 pt-1">
          {excludedReason ? (
            <ReasonBadge>{excludedReason}</ReasonBadge>
          ) : (
            models.map((m) => {
              const p = row.byModel[m.modelId];
              if (!p) {
                return (
                  <span
                    key={m.modelId}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    <span className="max-w-[8rem] truncate">{m.label}</span>
                    <span>—</span>
                  </span>
                );
              }
              const runsCorrect = p.runs.filter((r) => r.correct).length;
              const ratio = runsCorrect / p.runs.length;
              const tone =
                ratio === 1
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : ratio === 0
                    ? 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400'
                    : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400';
              const dot =
                ratio === 1
                  ? 'bg-emerald-600 text-white'
                  : ratio === 0
                    ? 'bg-red-600 text-white'
                    : 'bg-amber-500 text-white';
              return (
                <span
                  key={m.modelId}
                  className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-medium ${tone}`}
                >
                  <span className="max-w-[8rem] truncate">{m.label}</span>
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full font-mono text-[10px] font-bold ${dot}`}
                  >
                    {p.majority ?? '?'}
                  </span>
                  <span className="font-mono text-[10px]">
                    {runsCorrect}/{p.runs.length}
                  </span>
                </span>
              );
            })
          )}
        </div>
      </button>
      {expanded && question && (
        <div className="space-y-3 bg-muted/20 px-4 py-4">
          <div className="font-serif text-sm leading-relaxed whitespace-pre-wrap">
            {question.stem}
          </div>
          <ul className="space-y-1.5 font-serif text-sm leading-relaxed">
            {(['A', 'B', 'C', 'D'] as const).map((letter) => (
              <li
                key={letter}
                className={`flex gap-2 ${letter === question.correct ? 'font-semibold' : ''}`}
              >
                <span className="font-mono">{letter})</span>
                <span>{question.options[letter]}</span>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-1 gap-2 pt-1 font-sans">
            {models.map((m) => {
              const p = row.byModel[m.modelId];
              return (
                <Link
                  key={m.modelId}
                  to={`/models/${m.modelId}`}
                  className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-xs transition-colors hover:border-ps-violet/40"
                >
                  <span className="truncate font-semibold text-ps-violet">{m.label}</span>
                  {p ? (
                    <span className="flex shrink-0 gap-1">
                      {p.runs.map((r, i) => (
                        <span
                          key={i}
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                            r.correct
                              ? 'bg-emerald-600 text-white'
                              : r.parsed
                                ? 'bg-red-600 text-white'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {r.parsed ?? '?'}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="shrink-0 text-muted-foreground">sem dados</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
