import { Link, Route, Routes } from 'react-router-dom';

import Dataset from './pages/Dataset';
import EditionDetail from './pages/EditionDetail';
import Leaderboard from './pages/Leaderboard';
import Metodologia from './pages/Metodologia';
import ModelDetail from './pages/ModelDetail';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-sans text-lg font-semibold text-primary">
            medbench-brasil
          </Link>
          <nav className="flex gap-6 text-sm font-sans">
            <Link to="/">Leaderboard</Link>
            <Link to="/metodologia">Metodologia</Link>
            <Link to="/dataset">Dataset</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <Routes>
          <Route path="/" element={<Leaderboard />} />
          <Route path="/models/:id" element={<ModelDetail />} />
          <Route path="/editions/:id" element={<EditionDetail />} />
          <Route path="/metodologia" element={<Metodologia />} />
          <Route path="/dataset" element={<Dataset />} />
        </Routes>
      </main>

      <footer className="border-t bg-card">
        <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-muted-foreground">
          medbench-brasil é um projeto de pesquisa aberta, Apache-2.0. Contrapartida de IA do{' '}
          <a
            href="https://fhir-brasil.dev.br"
            className="underline text-ps-violet"
            target="_blank"
            rel="noreferrer"
          >
            fhir-brasil
          </a>
          .
        </div>
      </footer>
    </div>
  );
}
