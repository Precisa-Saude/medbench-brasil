import { GridOverlay } from '@precisa-saude/ui/decorative';
import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

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

/** Janela máxima de tentativas, e intervalo entre elas, em ms. */
const SCROLL_TIMEOUT = 2500;
const SCROLL_INTERVALO = 100;

/**
 * Rola até a âncora quando a URL traz hash.
 *
 * O React Router não faz isso sozinho: troca a rota e mantém a posição de
 * rolagem anterior. Um link como `/metodologia#modelos-de-decisao` levava o
 * leitor para onde ele estava na página de origem.
 *
 * A insistência não é exagero. Numa navegação entre rotas, o documento novo
 * ainda é curto quando o efeito roda, e o navegador limita a rolagem à altura
 * disponível: pedir 2937px num documento de 800px resulta em zero, sem erro
 * nenhum. A página de metodologia cresce depois, quando os gráficos montam.
 *
 * `behavior: 'instant'` é obrigatório aqui, não preferência. O `index.css`
 * declara `scroll-behavior: smooth`, e o valor `'auto'` manda usar o que o CSS
 * diz, então cada tentativa reiniciava a animação da anterior e a rolagem
 * nunca chegava ao destino. O deslocamento da nav fixa também sai do CSS, via
 * `scroll-padding-top`, então `scrollIntoView` já entrega o título abaixo dela
 * sem cálculo manual.
 *
 * Qualquer rolagem do usuário cancela o ciclo, para não disputar o controle
 * com quem já decidiu ir para outro lugar.
 */
function ScrollToHash() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) return;

    const alvoId = decodeURIComponent(hash.slice(1));
    const inicio = Date.now();
    let timer: number | undefined;
    let anterior = -1;

    const parar = () => {
      window.clearTimeout(timer);
      window.removeEventListener('wheel', parar);
      window.removeEventListener('touchstart', parar);
      window.removeEventListener('keydown', parar);
    };

    const tentar = () => {
      const alvo = document.getElementById(alvoId);
      if (alvo) {
        alvo.scrollIntoView({ behavior: 'instant', block: 'start' });
        // Duas leituras iguais seguidas significam que o documento parou de
        // crescer e a âncora está onde deve ficar.
        if (Math.abs(window.scrollY - anterior) < 2) {
          parar();
          return;
        }
        anterior = window.scrollY;
      }
      if (Date.now() - inicio > SCROLL_TIMEOUT) {
        parar();
        return;
      }
      timer = window.setTimeout(tentar, SCROLL_INTERVALO);
    };

    window.addEventListener('wheel', parar, { passive: true });
    window.addEventListener('touchstart', parar, { passive: true });
    window.addEventListener('keydown', parar);
    tentar();

    return parar;
  }, [hash, pathname]);

  return null;
}

export default function App() {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen flex-col">
        <Nav />
        <ScrollToHash />
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
