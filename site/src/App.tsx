import { GridOverlay } from '@precisa-saude/ui/decorative';
import { Route, Routes } from 'react-router-dom';

import { Footer } from './components/Footer';
import { Nav } from './components/Nav';
import { TooltipProvider } from './components/ui/tooltip';
import Dataset from './pages/Dataset';
import EditionDetail from './pages/EditionDetail';
import Leaderboard from './pages/Leaderboard';
import Metodologia from './pages/Metodologia';
import ModelDetail from './pages/ModelDetail';
import Questoes from './pages/Questoes';
import Reproducao from './pages/Reproducao';

export default function App() {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen flex-col">
        <Nav />
        <GridOverlay enabled={import.meta.env.DEV} />

        <main className="flex-1 pt-16">
          <Routes>
            <Route element={<Leaderboard />} path="/" />
            <Route element={<ModelDetail />} path="/models/*" />
            <Route element={<EditionDetail />} path="/editions/:id" />
            <Route element={<Questoes />} path="/questoes" />
            <Route element={<Metodologia />} path="/metodologia" />
            <Route element={<Reproducao />} path="/reproducao" />
            <Route element={<Dataset />} path="/dataset" />
          </Routes>
        </main>

        <Footer />
      </div>
    </TooltipProvider>
  );
}
