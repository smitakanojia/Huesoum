import { useEffect, useRef, useState } from 'react';
import { E } from '../state/store';

type Stage = { label: string; sub: string };

// Editorial process bar used on the landing page for the agentic-orchestration and
// methodology sections. It auto-advances only while on screen, so the animation
// helps explain the pipeline rather than decorate it. Respects reduced motion.
export default function StageBar({ stages, ms = 1700 }: { stages: Stage[]; ms?: number }) {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const n = stages.length;

  useEffect(() => {
    if (E.REDUCED) return;
    const host = ref.current;
    if (!host) return;
    let timer: any = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => setI((x) => (x + 1) % n), ms);
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => (e.isIntersecting ? start() : stop())),
      { threshold: 0.4 }
    );
    io.observe(host);
    return () => {
      stop();
      io.disconnect();
    };
  }, [n, ms]);

  const pct = ((i + 1) / n) * 100;
  return (
    <div className="stagebar" ref={ref} data-n={n}>
      <div className="sb-track">
        <div className="sb-fill" style={{ width: pct + '%' }} />
        <div className="sb-ticks">
          {stages.map((_, k) => (
            <i key={k} />
          ))}
        </div>
        <div className="sb-pulse" style={{ left: pct + '%' }} />
      </div>
      <div className="sb-labels">
        {stages.map((s, k) => (
          <div key={k} className={k === i ? 'on' : k < i ? 'done' : ''}>
            <b>{s.label}</b>
            <small>{s.sub}</small>
          </div>
        ))}
      </div>
      <div className="sb-current">
        <b>{stages[i].label}</b>
        <span>{stages[i].sub}</span>
      </div>
    </div>
  );
}
