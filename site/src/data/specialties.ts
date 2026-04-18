/**
 * Espelho dos rótulos de especialidade definidos em
 * `@precisa-saude/medbench-dataset/specialty`. Mantido localmente para
 * evitar puxar o loader Node-only do pacote para o bundle do browser.
 */

export const SPECIALTY_LABELS: Record<string, string> = {
  cirurgia: 'Cirurgia',
  'clinica-medica': 'Clínica Médica',
  'ginecologia-obstetricia': 'Ginecologia e Obstetrícia',
  'medicina-familia-comunidade': 'Medicina de Família',
  pediatria: 'Pediatria',
  'saude-publica': 'Saúde Pública',
};

export function specialtyLabel(key: string): string {
  return SPECIALTY_LABELS[key] ?? key;
}
