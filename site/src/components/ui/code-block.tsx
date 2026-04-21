import { cn } from '@precisa-saude/ui/utils';

type Language = 'json' | 'bash' | 'plain';

export function CodeBlock({
  children,
  className,
  language = 'plain',
  maxHeight,
}: {
  children: string;
  className?: string;
  language?: Language;
  /** Ativa scroll vertical interno quando o conteúdo excede (ex.: "32rem"). */
  maxHeight?: string | number;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-ps-violet-dark/10 bg-[#282a36]',
        className,
      )}
    >
      <pre
        className="overflow-auto p-6 font-mono text-sm leading-relaxed text-white/80"
        style={maxHeight ? { maxHeight } : undefined}
      >
        <code>{renderTokens(children, language)}</code>
      </pre>
    </div>
  );
}

function renderTokens(source: string, language: Language): React.ReactNode {
  if (language === 'json') return highlightJson(source);
  if (language === 'bash') return highlightBash(source);
  return source;
}

// Dracula-adjacent palette; contrasta bem sobre #282a36.
const COLORS = {
  bracket: 'text-white/60',
  command: 'text-[#50fa7b]',
  comment: 'text-white/40 italic',
  flag: 'text-[#ff79c6]',
  key: 'text-[#8be9fd]',
  literal: 'text-[#bd93f9]',
  number: 'text-[#ffb86c]',
  operator: 'text-[#ff79c6]',
  string: 'text-[#f1fa8c]',
  variable: 'text-[#bd93f9]',
};

function span(key: number, cls: string, text: string): React.ReactNode {
  return (
    <span key={key} className={cls}>
      {text}
    </span>
  );
}

/**
 * Tokenizer JSON minimalista. Reconhece strings, números, literais e
 * pontuação. Detecta chaves olhando o próximo caractere não-whitespace.
 */
function highlightJson(source: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const re =
    /("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(true|false|null)|([{}[\],:])|(\s+)|([^\s"\d{}[\],:]+)/g;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(source)) !== null) {
    const [match, str, num, lit, punct, ws, other] = m;
    if (str !== undefined) {
      const after = source.slice(re.lastIndex).match(/^\s*:/);
      tokens.push(span(key++, after ? COLORS.key : COLORS.string, str));
    } else if (num !== undefined) {
      tokens.push(span(key++, COLORS.number, num));
    } else if (lit !== undefined) {
      tokens.push(span(key++, COLORS.literal, lit));
    } else if (punct !== undefined) {
      tokens.push(span(key++, COLORS.bracket, punct));
    } else if (ws !== undefined) {
      tokens.push(ws);
    } else if (other !== undefined) {
      tokens.push(other);
    } else {
      tokens.push(match);
    }
  }
  return tokens;
}

const BASH_COMMANDS = new Set([
  'cd',
  'cp',
  'curl',
  'echo',
  'export',
  'git',
  'grep',
  'ls',
  'mkdir',
  'mv',
  'node',
  'npm',
  'npx',
  'ollama',
  'pnpm',
  'rm',
  'sudo',
  'wget',
  'yarn',
]);

const BASH_KEYWORDS = new Set([
  'case',
  'do',
  'done',
  'elif',
  'else',
  'esac',
  'fi',
  'for',
  'function',
  'if',
  'in',
  'return',
  'then',
  'while',
]);

/**
 * Tokenizer bash/shell. Reconhece comentários, strings, variáveis,
 * flags (--foo / -f), comandos comuns, operadores e literais numéricos.
 * Também cobre linhas de `.env` (KEY=value) via o mesmo parser.
 */
function highlightBash(source: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  // ordem: comentário, string dupla, string simples, variável, flag,
  //        operador/continuação, número, identificador, whitespace, resto
  const re =
    /(#[^\n]*)|("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')|(\$\{[^}]+\}|\$[A-Za-z_][A-Za-z0-9_]*)|(--?[A-Za-z][A-Za-z0-9_-]*)|(\\$|&&|\|\||;|\||&)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_.:/-]*)|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  let key = 0;
  let atStart = true;
  while ((m = re.exec(source)) !== null) {
    const [, comment, dq, sq, variable, flag, op, num, ident, ws, rest] = m;
    if (comment !== undefined) {
      tokens.push(span(key++, COLORS.comment, comment));
    } else if (dq !== undefined) {
      tokens.push(span(key++, COLORS.string, dq));
      atStart = false;
    } else if (sq !== undefined) {
      tokens.push(span(key++, COLORS.string, sq));
      atStart = false;
    } else if (variable !== undefined) {
      tokens.push(span(key++, COLORS.variable, variable));
      atStart = false;
    } else if (flag !== undefined) {
      tokens.push(span(key++, COLORS.flag, flag));
      atStart = false;
    } else if (op !== undefined) {
      tokens.push(span(key++, COLORS.operator, op));
      atStart = true; // depois de && / | / ; o próximo identificador é comando
    } else if (num !== undefined) {
      tokens.push(span(key++, COLORS.number, num));
      atStart = false;
    } else if (ident !== undefined) {
      if (BASH_KEYWORDS.has(ident)) {
        tokens.push(span(key++, COLORS.literal, ident));
      } else if (atStart && BASH_COMMANDS.has(ident)) {
        tokens.push(span(key++, COLORS.command, ident));
      } else if (atStart && /^[A-Z_][A-Z0-9_]*=/.test(source.slice(m.index))) {
        // heurística: LINHA=valor (env) — destaca a chave
        tokens.push(span(key++, COLORS.key, ident));
      } else {
        tokens.push(ident);
      }
      atStart = false;
    } else if (ws !== undefined) {
      if (ws.includes('\n')) atStart = true;
      tokens.push(ws);
    } else if (rest !== undefined) {
      if (rest === '=') tokens.push(span(key++, COLORS.operator, rest));
      else tokens.push(rest);
      atStart = false;
    }
  }
  return tokens;
}
