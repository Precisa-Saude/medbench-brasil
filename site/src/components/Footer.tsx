import { OpenFooter } from '@precisa-saude/ui';

function PrecisaLogo() {
  return (
    <svg
      aria-hidden="true"
      className="h-8 w-8 text-ps-violet-light"
      fill="currentColor"
      fillRule="evenodd"
      shapeRendering="geometricPrecision"
      viewBox="-46 267 969 969"
    >
      <g transform="matrix(4.166667,0,0,4.166667,-1513.302,-909)">
        <path
          d="M460.411 435.128c-21.211-8.385-44.654-20.828-52.035-44.37-1.49-4.832-2.32-2.728-3.237 1.026-12.309 43.08.491 101.357 50.583 106.243 11.43.984 24.006-4.632 28.734-15.457 9.12-20.011-4.005-41.99-23.808-48.347l-.237-.095z"
          fillRule="nonzero"
        />
        <path
          d="M479.026 299.26c-2.207-.327-4.42-.529-6.618-.598-15.131-.468-58.156-.074-64.872-.008-.496.004-.886.408-.886.905v60.679c0 .499.404.904.903.905l62.037.117c.499.001.903.405.903.905l.005 60.938c0 .519.44.94.957.914 4.34-.219 8.544-.879 12.587-1.908 27.979-6.146 48.924-31.066 48.924-60.891 0-18.962-8.854-37.194-23.733-48.944-8.5-6.712-19.298-11.395-30.208-13.014"
          fillRule="nonzero"
        />
      </g>
    </svg>
  );
}

const SOCIALS = [
  {
    href: 'https://github.com/Precisa-Saude/medbench-brasil',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5 fill-current" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
      </svg>
    ),
    label: 'GitHub',
  },
  {
    href: 'https://www.npmjs.com/org/precisa-saude',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5 fill-current" viewBox="0 0 24 24">
        <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0Zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331Zm4 0h-2.666V8.667h5.334v5.331h-2.668v-4h-1.332v4h1.332Zm10.668 0h-1.332v-4h-1.334v4h-1.332v-4h-1.334v4h-2.668V8.667h8.002v5.331h-.002Z" />
      </svg>
    ),
    label: 'npm',
  },
];

const DISCLAIMER =
  'Este software é fornecido exclusivamente para fins informativos, de pesquisa e educacionais. Não constitui aconselhamento médico, diagnóstico ou recomendação de tratamento. Os resultados de avaliação publicados não refletem competência clínica nem indicam que os modelos avaliados devam ser utilizados em decisões de saúde reais. Consulte sempre um profissional de saúde qualificado.';

export function Footer() {
  return (
    <OpenFooter
      brand={{
        href: 'https://precisa-saude.com.br',
        logo: <PrecisaLogo />,
        name: 'Precisa Saúde',
      }}
      disclaimer={DISCLAIMER}
      socials={SOCIALS}
    />
  );
}
