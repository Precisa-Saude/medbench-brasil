import { useMemo, useState } from 'react';

import { allQuestions, getEdition } from '../data/dataset';
import type { ModelResult, PerQuestionResult } from '../data/results';
import { SPECIALTY_LABELS, specialtyLabel } from '../data/specialties';
import { Pagination } from './ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

type Filter = 'all' | 'divergent' | 'no-one-correct' | 'all-correct';

export default function QuestionsTable({ models }: { models: ModelResult[] }) {
  const questions = useMemo(() => allQuestions(), []);
  const editions = useMemo(() => {
    const ids = new Set(questions.map((q) => q.editionId));
    return [...ids].sort();
  }, [questions]);

  const [editionFilter, setEditionFilter] = useState<string>('all');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const withPerQuestion = models.filter((m) => (m.perQuestion?.length ?? 0) > 0);

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
    for (const q of questions) {
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
  }, [questions, models, editionFilter, specialtyFilter, filter, withPerQuestion]);

  const totalRows = rows.length;
  const start = (page - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 font-sans">
        <FilterField label="Edição">
          <Select value={editionFilter} onValueChange={setEditionFilter}>
            <SelectTrigger className="h-9 w-40">
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
          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger className="h-9 w-56">
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
          <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <SelectTrigger className="h-9 w-56">
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
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Edição</TableHead>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Especialidade</TableHead>
              <TableHead className="text-center">Gabarito</TableHead>
              {models.map((m) => (
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
                models={models}
                expanded={expanded === row.questionId}
                onToggle={() =>
                  setExpanded((cur) => (cur === row.questionId ? null : row.questionId))
                }
              />
            ))}
          </TableBody>
        </Table>
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
    <label className="flex flex-col gap-1 text-sm">
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
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell className="font-mono text-xs text-muted-foreground">{row.editionId}</TableCell>
        <TableCell className="font-mono">{row.number}</TableCell>
        <TableCell className="text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>{row.specialty.map((s) => specialtyLabel(s)).join(', ')}</span>
            {row.annulled && <ReasonBadge>anulada</ReasonBadge>}
            {row.hasImage && <ReasonBadge>imagem</ReasonBadge>}
            {row.hasTable && <ReasonBadge>tabela</ReasonBadge>}
          </div>
        </TableCell>
        <TableCell className="text-center font-mono font-semibold">{row.correct}</TableCell>
        {models.map((m) => {
          const p = row.byModel[m.modelId];
          if (!p)
            return (
              <TableCell
                key={m.modelId}
                className="text-center text-muted-foreground"
                title={excluded ? excludeReason : 'Sem dados por questão deste modelo'}
              >
                —
              </TableCell>
            );
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
                ? 'border-destructive/20 bg-destructive/10 text-destructive'
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
          <td colSpan={4 + models.length} className="px-4 py-4">
            <div className="max-w-3xl space-y-3">
              <div className="font-serif text-sm leading-relaxed whitespace-pre-wrap">
                {question.stem}
              </div>
              <ul className="space-y-1 font-serif text-sm">
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
              <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
                {models.map((m) => {
                  const p = row.byModel[m.modelId];
                  return (
                    <div key={m.modelId} className="rounded border p-2">
                      <div className="font-sans font-semibold">{m.label}</div>
                      {p ? (
                        <div className="mt-1 flex gap-1 font-mono">
                          {p.runs.map((r, i) => (
                            <span
                              key={i}
                              className={`inline-block rounded px-1.5 py-0.5 font-semibold ${
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
                        <div className="mt-1 text-muted-foreground">sem dados por questão</div>
                      )}
                    </div>
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
