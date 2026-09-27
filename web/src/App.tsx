import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { getLang, connectCore, currentUser, useStoreVersion, S, E } from './state/store';
import LanguageGate from './components/LanguageGate';
import Splash from './components/Splash';
import AppShell from './components/AppShell';
import Home from './pages/Home';
import Login from './pages/Login';
import Workspace from './pages/Workspace';
import History from './pages/History';
import Registry from './pages/Registry';
import TracePage from './pages/TracePage';

// Pre-warm the synthetic imagery the landing page and the scene list use, so the
// first paint is not janky. Everything is generated in the browser (fixture F3.7).
// This mirrors the prototype's warmHero(): it builds S.hero (frames, grounded,
// optical, sar) and per-example thumbnails.
async function warm() {
  try {
    const url = (c: HTMLCanvasElement) => c.toDataURL('image/jpeg', 0.86);
    const job = E.makeJob(E.specFromExample(E.EXAMPLES[0]));
    const frames = await E.jobFrames(job);
    const wide = await E.composite(job.result.layers, ['base_T2'].concat(E.groundedIds(job.result)), 1280);
    S.hero = {
      job,
      frames: frames.map((f: any) => ({ title: f.title, url: url(f.canvas) })),
      grounded: wide.toDataURL('image/jpeg', 0.86),
      optical: url(E.cvOf(E.roleData('optical').rgba)),
      sar: url(E.cvOf(E.roleData('sar').rgba)),
    };
    S.thumbs = {};
    E.EXAMPLES.forEach((e: any) => {
      S.thumbs[e.example_id] = E.thumbOf(
        e.kind === 'cross-modal' ? 'optical' : e.kind === 'bi-temporal' ? 'T2' : 'single'
      );
    });
  } catch (e) {
    console.warn(e);
  }
}

function RequireAuth() {
  const loc = useLocation();
  if (!currentUser()) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return <Outlet />;
}

export default function App() {
  useStoreVersion();
  const [lang, setLangState] = useState<string | null>(getLang());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      await warm();
      await connectCore();
      if (alive) setTimeout(() => setReady(true), E.REDUCED ? 0 : 400);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!lang) {
    return <LanguageGate onPick={(l) => setLangState(l)} />;
  }
  if (!ready) return <Splash />;

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Workspace />} />
            <Route path="history" element={<History />} />
            <Route path="registry" element={<Registry />} />
            <Route path="trace" element={<TracePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
