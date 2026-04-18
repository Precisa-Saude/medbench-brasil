import { Route, Routes } from 'react-router-dom';

import { Footer } from './components/Footer';
import { GridOverlay } from './components/GridOverlay';
import { Nav } from './components/Nav';
import Dataset from './pages/Dataset';
import EditionDetail from './pages/EditionDetail';
import Leaderboard from './pages/Leaderboard';
import Metodologia from './pages/Metodologia';
import ModelDetail from './pages/ModelDetail';
import Questoes from './pages/Questoes';
import Replicacao from './pages/Replicacao';

const gridStyle = {
  gridTemplateColumns: 'repeat(var(--grid-cols), 1fr)',
  maxWidth: 'var(--grid-max-w)',
  width: '100%',
} as const;

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <GridOverlay />

      <main className="flex-1 pt-16">
        <div className="mx-auto grid gap-4 px-4 py-10 md:px-0 lg:py-16" style={gridStyle}>
          <div className="col-span-full md:col-span-12 md:col-start-2 3xl:col-start-3">
            <Routes>
              <Route path="/" element={<Leaderboard />} />
              <Route path="/models/:id" element={<ModelDetail />} />
              <Route path="/editions/:id" element={<EditionDetail />} />
              <Route path="/questoes" element={<Questoes />} />
              <Route path="/metodologia" element={<Metodologia />} />
              <Route path="/replicacao" element={<Replicacao />} />
              <Route path="/dataset" element={<Dataset />} />
            </Routes>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
