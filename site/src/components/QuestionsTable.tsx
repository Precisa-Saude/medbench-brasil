import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@precisa-saude/ui/primitives';
import { useMemo, useState } from 'react';

import { allQuestions } from '../data/dataset';
import type { ModelResult, PerQuestionResult } from '../data/results';
import { SPECIALTY_LABELS } from '../data/specialties';
import { MobileQuestionCard, QuestionRow } from './QuestionsTable.views';
import { Pagination } from './ui/pagination';
import { Table, TableBody, TableHead, TableHeader, TableRow } from './ui/table';

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
                  expanded={expanded === row.questionId}
                  models={visibleModels}
                  row={row}
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
              expanded={expanded === row.questionId}
              models={visibleModels}
              row={row}
              onToggle={() =>
                setExpanded((cur) => (cur === row.questionId ? null : row.questionId))
              }
            />
          ))}
        </div>
        <Pagination
          itemsLabel="questões"
          page={page}
          pageSize={pageSize}
          totalRows={totalRows}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
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
