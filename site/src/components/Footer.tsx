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

export function Footer() {
  return (
    <OpenFooter
      brand={{
        href: 'https://precisa-saude.com.br',
        logo: <PrecisaLogo />,
        name: 'Precisa Saúde',
      }}
      githubUrl="https://github.com/Precisa-Saude/medbench-brasil"
      npmUrl="https://www.npmjs.com/package/@precisa-saude/medbench-dataset"
    />
  );
}
