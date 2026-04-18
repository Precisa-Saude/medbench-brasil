import type { Specialty } from './types.js';

export const SPECIALTIES: Record<Specialty, { description: string; label: string }> = {
  cirurgia: {
    description: 'Cirurgia geral e áreas correlatas',
    label: 'Cirurgia',
  },
  'clinica-medica': {
    description: 'Clínica médica e especialidades médicas não cirúrgicas',
    label: 'Clínica Médica',
  },
  'ginecologia-obstetricia': {
    description: 'Ginecologia e Obstetrícia',
    label: 'Ginecologia e Obstetrícia',
  },
  'medicina-familia-comunidade': {
    description: 'Medicina de Família e Comunidade, atenção primária',
    label: 'Medicina de Família',
  },
  pediatria: {
    description: 'Pediatria e neonatologia',
    label: 'Pediatria',
  },
  'saude-publica': {
    description: 'Saúde pública, epidemiologia, medicina preventiva',
    label: 'Saúde Pública',
  },
};
