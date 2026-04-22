#!/usr/bin/env node
// Sanity check: probe cada modelo com 3 questões diversas do Revalida,
// aplica o parser atual e compara com o gabarito. Emite relatório por
// modelo indicando se o parser casa com os artefatos já armazenados.
//
// Uso: node scripts/sanity-check-parser.mjs
// Requer: .env.local com as chaves apropriadas (OpenRouter, Anthropic, etc.)

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Loads .env.local manually (no dotenv dep). Same pattern as platform apps use
// when they need to be runnable without full workspace install.
const envPath = join(process.cwd(), '.env.local');
try {
  const txt = readFileSync(envPath, 'utf8');
  for (const line of txt.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
} catch {
  // no-op se .env.local não existir
}

// Inlined — mesma lógica que packages/eval-harness/src/runner.ts#parseLetter.
function parseLetter(raw) {
  const text = raw.trim();
  const upper = text.toUpperCase();
  const commitWord = String.raw`(?:\bresposta\b|\balternativa\b|\bletra\b|\bop[cç][aã]o\b)`;
  const commitSuffix = String.raw`(?:\bcorreta\b|\bé\b|\bser[íi]a?\b|\bfoi\b)`;
  const strictPhrase = new RegExp(`${commitWord}[\\s,.:*\\-–]*${commitSuffix}`, 'gi');
  const loosePhrase = new RegExp(commitWord, 'gi');
  const strictMatches = [...text.matchAll(strictPhrase)];
  for (let i = strictMatches.length - 1; i >= 0; i--) {
    const m = strictMatches[i];
    if (m.index === undefined) continue;
    const lookahead = text.slice(m.index + m[0].length, m.index + m[0].length + 80);
    const first = lookahead.match(/\b([ABCD])\b/);
    if (first) return first[1];
  }
  const bold = upper.match(/\*\*\s*([ABCD])\s*\*\*/);
  if (bold) return bold[1];
  const looseMatches = [...text.matchAll(loosePhrase)];
  for (let i = looseMatches.length - 1; i >= 0; i--) {
    const m = looseMatches[i];
    if (m.index === undefined) continue;
    const lookahead = text.slice(m.index + m[0].length, m.index + m[0].length + 80);
    const first = lookahead.match(/\b([ABCD])\b/);
    if (first) return first[1];
  }
  const paren = [...upper.matchAll(/\b([ABCD])\)/g)];
  if (paren.length > 0) return paren[paren.length - 1][1];
  const lone = [...upper.matchAll(/\b([ABCD])\b/g)];
  if (lone.length > 0) return lone[lone.length - 1][1];
  return null;
}

const SYSTEM_PROMPT =
  'Responda a seguinte questão de múltipla escolha selecionando a letra correta (A, B, C ou D).';

// Amostra deliberadamente diversificada: uma de cada especialidade, diferentes formatos.
const SAMPLE_QUESTION_NUMBERS = [10, 25, 50, 75, 95];

// Aceita override via --edition; default permanece Revalida 2025/1 porque
// o sanity check existe para validar o parser contra artefatos já publicados.
const EDITION_ID = (() => {
  const idx = process.argv.indexOf('--edition');
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : 'revalida-2025-1';
})();

function renderUserPrompt(q) {
  const opts = ['A', 'B', 'C', 'D'].map((k) => `${k}) ${q.options[k]}`).join('\n');
  return `${q.stem}\n\n${opts}`;
}

function loadEdition(editionId) {
  const family = editionId.split('-')[0];
  const slug = editionId.slice(family.length + 1);
  const path = join(process.cwd(), 'packages', 'dataset', 'data', family, `${slug}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

// Definição dos alvos: cada entrada diz qual backend, API, e modelId usar.
const TARGETS = [
  { backend: 'anthropic', label: 'Claude Opus 4.7', model: 'claude-opus-4-7' },
  { backend: 'anthropic', label: 'Claude Opus 4.6', model: 'claude-opus-4-6' },
  { backend: 'anthropic', label: 'Claude Opus 4.5', model: 'claude-opus-4-5' },
  { backend: 'openai', label: 'GPT-5.4', model: 'gpt-5.4' },
  { backend: 'openai', label: 'GPT-5.2', model: 'gpt-5.2' },
  { backend: 'openai', label: 'GPT-5.1', model: 'gpt-5.1' },
  { backend: 'google', label: 'Gemini 2.5 Pro', model: 'gemini-2.5-pro' },
  { backend: 'maritaca', label: 'Sabiá 4', model: 'sabia-4' },
  { backend: 'maritaca', label: 'Sabiá 3', model: 'sabia-3' },
  { backend: 'openrouter', label: 'Llama 4 Maverick', model: 'meta-llama/llama-4-maverick' },
  { backend: 'openrouter', label: 'Llama 4 Scout', model: 'meta-llama/llama-4-scout' },
  { backend: 'openrouter', label: 'Llama 3.3 70B', model: 'meta-llama/llama-3.3-70b-instruct' },
  { backend: 'openrouter', label: 'DeepSeek R1', model: 'deepseek/deepseek-r1' },
  { backend: 'openrouter', label: 'DeepSeek V3.1', model: 'deepseek/deepseek-chat-v3.1' },
  { backend: 'openrouter', label: 'DeepSeek V3-0324', model: 'deepseek/deepseek-chat-v3-0324' },
  { backend: 'openrouter', label: 'Qwen 3 235B', model: 'qwen/qwen3-235b-a22b-2507' },
  { backend: 'openrouter', label: 'Mistral Large 2512', model: 'mistralai/mistral-large-2512' },
];

async function callAnthropic(model, userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const omitTemperature = /^claude-opus-[4-9]/i.test(model);
  const body = {
    max_tokens: 1024,
    messages: [{ content: userPrompt, role: 'user' }],
    model,
    system: SYSTEM_PROMPT,
    ...(omitTemperature ? {} : { temperature: 0 }),
  };
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    body: JSON.stringify(body),
    headers: {
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    method: 'POST',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
  return json.content.map((c) => (c.type === 'text' ? (c.text ?? '') : '')).join('');
}

async function callOpenAI(model, userPrompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  const usesNewParamName = /^gpt-5/i.test(model) || /^o[1-9]/i.test(model);
  const body = {
    ...(usesNewParamName ? { max_completion_tokens: 2048 } : { max_tokens: 2048 }),
    messages: [
      { content: SYSTEM_PROMPT, role: 'system' },
      { content: userPrompt, role: 'user' },
    ],
    model,
    temperature: 0,
  };
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    body: JSON.stringify(body),
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    method: 'POST',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
  return json.choices[0]?.message?.content ?? '';
}

async function callGoogle(model, userPrompt) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const body = {
    contents: [{ parts: [{ text: userPrompt }], role: 'user' }],
    generationConfig: { maxOutputTokens: 8192, temperature: 0 },
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
  };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    { body: JSON.stringify(body), headers: { 'content-type': 'application/json' }, method: 'POST' },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(`Google ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text ?? '').join('');
}

async function callOpenAICompat(baseUrl, apiKey, model, userPrompt) {
  const body = {
    max_tokens: 8192,
    messages: [
      { content: SYSTEM_PROMPT, role: 'system' },
      { content: userPrompt, role: 'user' },
    ],
    model,
    temperature: 0,
  };
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    body: JSON.stringify(body),
    headers: {
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      'content-type': 'application/json',
    },
    method: 'POST',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${baseUrl} ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
  return json.choices?.[0]?.message?.content ?? '';
}

async function callModel(target, userPrompt) {
  switch (target.backend) {
    case 'anthropic':
      return callAnthropic(target.model, userPrompt);
    case 'openai':
      return callOpenAI(target.model, userPrompt);
    case 'google':
      return callGoogle(target.model, userPrompt);
    case 'maritaca':
      return callOpenAICompat(
        'https://chat.maritaca.ai/api',
        process.env.MARITACA_API_KEY,
        target.model,
        userPrompt,
      );
    case 'openrouter':
      return callOpenAICompat(
        'https://openrouter.ai/api/v1',
        process.env.OPENROUTER_API_KEY,
        target.model,
        userPrompt,
      );
    default:
      throw new Error(`Backend desconhecido: ${target.backend}`);
  }
}

async function main() {
  const edition = loadEdition(EDITION_ID);
  const samples = SAMPLE_QUESTION_NUMBERS.map((n) =>
    edition.questions.find((q) => q.number === n),
  ).filter((q) => q && !q.annulled && !q.hasImage && !q.hasTable);

  const rows = [];
  for (const target of TARGETS) {
    process.stderr.write(`[probe] ${target.label}... `);
    const results = [];
    let failed = 0;
    for (const q of samples) {
      try {
        const raw = await callModel(target, renderUserPrompt(q));
        const parsed = parseLetter(raw);
        const ok = parsed === q.correct;
        results.push({
          number: q.number,
          correct: q.correct,
          parsed,
          ok,
          preview: raw.slice(-200).replace(/\n/g, ' '),
        });
        if (!ok) failed++;
      } catch (err) {
        results.push({
          number: q.number,
          correct: q.correct,
          parsed: 'ERR',
          ok: false,
          preview: err.message,
        });
        failed++;
      }
    }
    const status = failed === 0 ? 'OK' : failed === samples.length ? 'FAIL' : 'PARTIAL';
    process.stderr.write(`${status} (${samples.length - failed}/${samples.length})\n`);
    rows.push({ target, results, failed });
  }

  console.log('\n=== SANITY REPORT ===\n');
  for (const { target, results, failed } of rows) {
    const ok = samples.length - failed;
    const tag = failed === 0 ? '[OK]' : failed === samples.length ? '[FAIL]' : '[PARTIAL]';
    console.log(`${tag.padEnd(10)} ${target.label.padEnd(22)} ${ok}/${samples.length}`);
    for (const r of results) {
      const mark = r.ok ? '  ok' : '  FAIL';
      console.log(`    Q${r.number}: parsed=${r.parsed} correct=${r.correct} ${mark}`);
      if (!r.ok) console.log(`        ending: ...${r.preview.slice(-180)}`);
    }
  }

  const anyFailures = rows.some((r) => r.failed > 0);
  process.exit(anyFailures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
