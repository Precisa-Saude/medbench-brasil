import { useMemo, useState } from 'react';

import { allQuestions, getEdition } from '../data/dataset';
import type { ModelResult, PerQuestionResult } from '../data/results';
import { SPECIALTY_LABELS, specialtyLabel } from '../data/specialties';

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

  const withPerQuestion = models.filter((m) => (m.perQuestion?.length ?? 0) > 0);
  const allHavePerQuestion = models.length > 0 && withPerQuestion.length === models.length;

  const rows = useMemo(() => {
    const out: Array<{
      byModel: Record<string, PerQuestionResult | undefined>;
      correct: 'A' | 'B' | 'C' | 'D';
      editionId: string;
      editionLabel: string;
      number: number;
      questionId: string;
      specialty: string[];
    }> = [];
    for (const q of questions) {
      if (q.annulled) continue;
      if (editionFilter !== 'all' && q.editionId !== editionFilter) continue;
      if (specialtyFilter !== 'all' && !q.specialty.includes(specialtyFilter as never)) continue;
      const byModel: Record<string, PerQuestionResult | undefined> = {};
      for (const m of models) {
        byModel[m.modelId] = m.perQuestion?.find((p) => p.questionId === q.id);
      }
      if (filter !== 'all' && withPerQuestion.length > 0) {
        const answers = withPerQuestion.map((m) => byModel[m.modelId]?.majority).filter(Boolean);
        const corrects = withPerQuestion.map((m) => byModel[m.modelId]?.majorityCorrect ?? false);
        if (filter === 'divergent' && new Set(answers).size < 2) continue;
        if (filter === 'no-one-correct' && corrects.some(Boolean)) continue;
        if (filter === 'all-correct' && corrects.some((c) => !c)) continue;
      }
      out.push({
        byModel,
        correct: q.correct,
        editionId: q.editionId,
        editionLabel: getEdition(q.editionId)?.id ?? q.editionId,
        number: q.number,
        questionId: q.id,
        specialty: q.specialty,
      });
    }
    return out;
  }, [questions, models, editionFilter, specialtyFilter, filter, withPerQuestion]);

  return (
    <div className="space-y-4">
      {!allHavePerQuestion && (
        <div className="border rounded-lg bg-amber-50 dark:bg-amber-950/20 border-amber-300/40 p-3 text-sm">
          {withPerQuestion.length === 0
            ? 'Nenhum artefato em `results/` contém dados por questão ainda. Re-execute o harness com a versão atual do scorer para popular esta tabela.'
            : `${models.length - withPerQuestion.length} modelo(s) sem dados por questão — re-execute o harness para incluí-los.`}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 font-sans text-sm">
        <Select
          label="Edição"
          value={editionFilter}
          onChange={setEditionFilter}
          options={[
            { label: 'Todas', value: 'all' },
            ...editions.map((e) => ({ label: e, value: e })),
          ]}
        />
        <Select
          label="Especialidade"
          value={specialtyFilter}
          onChange={setSpecialtyFilter}
          options={[
            { label: 'Todas', value: 'all' },
            ...Object.entries(SPECIALTY_LABELS).map(([k, v]) => ({ label: v, value: k })),
          ]}
        />
        <Select
          label="Filtro"
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          options={[
            { label: 'Todas as questões', value: 'all' },
            { label: 'Modelos divergem', value: 'divergent' },
            { label: 'Ninguém acertou', value: 'no-one-correct' },
            { label: 'Todos acertaram', value: 'all-correct' },
          ]}
        />
        <div className="text-muted-foreground ml-auto">{rows.length} questões</div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full font-sans text-sm">
          <thead className="bg-muted text-muted-foreground font-sans text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2">Edição</th>
              <th className="text-left px-3 py-2">#</th>
              <th className="text-left px-3 py-2">Especialidade</th>
              <th className="text-center px-3 py-2">Gabarito</th>
              {models.map((m) => (
                <th key={m.modelId} className="text-center px-3 py-2" title={m.label}>
                  {m.label.split(' ')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
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
          </tbody>
        </table>
      </div>
    </div>
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
    byModel: Record<string, PerQuestionResult | undefined>;
    correct: 'A' | 'B' | 'C' | 'D';
    editionId: string;
    number: number;
    questionId: string;
    specialty: string[];
  };
}) {
  const question = useMemo(
    () => getEdition(row.editionId)?.questions.find((q) => q.id === row.questionId),
    [row.editionId, row.questionId],
  );
  return (
    <>
      <tr className="border-t hover:bg-muted/30 cursor-pointer" onClick={onToggle}>
        <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{row.editionId}</td>
        <td className="px-3 py-2 font-mono">{row.number}</td>
        <td className="px-3 py-2 text-muted-foreground text-xs">
          {row.specialty.map((s) => specialtyLabel(s)).join(', ')}
        </td>
        <td className="px-3 py-2 text-center font-mono font-semibold">{row.correct}</td>
        {models.map((m) => {
          const p = row.byModel[m.modelId];
          if (!p)
            return (
              <td key={m.modelId} className="px-3 py-2 text-center text-muted-foreground">
                —
              </td>
            );
          const runsCorrect = p.runs.filter((r) => r.correct).length;
          const ratio = runsCorrect / p.runs.length;
          const bg =
            ratio === 1
              ? 'bg-green-500/20 text-green-700 dark:text-green-300'
              : ratio === 0
                ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300';
          return (
            <td key={m.modelId} className="px-3 py-2 text-center">
              <span className={`inline-block px-2 py-0.5 rounded font-mono text-xs ${bg}`}>
                {p.majority ?? '?'} · {runsCorrect}/{p.runs.length}
              </span>
            </td>
          );
        })}
      </tr>
      {expanded && question && (
        <tr className="border-t bg-muted/20">
          <td colSpan={4 + models.length} className="px-4 py-4">
            <div className="space-y-3 max-w-3xl">
              <div className="whitespace-pre-wrap text-sm">{question.stem}</div>
              <ul className="space-y-1 text-sm">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {models.map((m) => {
                  const p = row.byModel[m.modelId];
                  return (
                    <div key={m.modelId} className="border rounded p-2">
                      <div className="font-sans font-semibold">{m.label}</div>
                      {p ? (
                        <div className="flex gap-1 mt-1 font-mono">
                          {p.runs.map((r, i) => (
                            <span
                              key={i}
                              className={`inline-block px-1.5 py-0.5 rounded ${
                                r.correct
                                  ? 'bg-green-500/20'
                                  : r.parsed
                                    ? 'bg-red-500/20'
                                    : 'bg-muted'
                              }`}
                            >
                              {r.parsed ?? '?'}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted-foreground mt-1">sem dados por questão</div>
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

function Select<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (v: T) => void;
  options: Array<{ label: string; value: string }>;
  value: T;
}) {
  return (
    <label className="inline-flex items-center gap-2">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="border rounded-md bg-card px-2 py-1 font-sans"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
