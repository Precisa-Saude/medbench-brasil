import { Route, Routes } from 'react-router-dom';

import { Footer } from './components/Footer';
import { GridOverlay } from './components/GridOverlay';
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
        <GridOverlay />

        <main className="flex-1 pt-16">
          <Routes>
            <Route path="/" element={<Leaderboard />} />
            <Route path="/models/:id" element={<ModelDetail />} />
            <Route path="/editions/:id" element={<EditionDetail />} />
            <Route path="/questoes" element={<Questoes />} />
            <Route path="/metodologia" element={<Metodologia />} />
            <Route path="/reproducao" element={<Reproducao />} />
            <Route path="/dataset" element={<Dataset />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </TooltipProvider>
  );
}
