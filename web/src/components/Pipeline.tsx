import { useEffect, useState } from 'react';
import { E } from '../state/store';
import { STAGES, TASK_MAP, TOOL_LABEL } from '../core/view';
import { Icon } from './Logo';

const TASK_NAMES: Record<string, string> = {
  CHANGE: 'Change detection',
  GROUND: 'Grounding',
  VQA: 'Visual question answering',
  COUNT: 'Counting',
  FUSION: 'Optical–SAR fusion',
  DESC: 'Scene description',
};
const MOD_TAGS = ['Optical', 'SAR', 'Multispectral'];

// The signature loading experience: a visual representation of the real execution
// trace, not a spinner. Stages activate in order; the analysis stage steps through
// the actual TraceStep list the core produced. Demo mode replays at reading pace.
export default function Pipeline({ job, onDone }: { job: any; onDone: () => void }) {
  const trace = job.result?.trace || null;
  const profile = job.profile || trace?.sensor_profile || null;
  const parsed = job.parsed || trace?.parsed_query || null;
  const steps: any[] = trace?.steps || [];
  const [stage, setStage] = useState(0);
  const [stepIdx, setStepIdx] = useState(-1);

  useEffect(() => {
    let cancelled = false;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, E.REDUCED ? Math.min(ms, 120) : ms));
    (async () => {
      for (let s = 0; s < STAGES.length; s++) {
        if (cancelled) return;
        setStage(s);
        if (s === 4 && steps.length) {
          for (let k = 0; k < steps.length; k++) {
            if (cancelled) return;
            setStepIdx(k);
            await wait(520);
          }
        } else {
          await wait(720);
        }
      }
      if (!cancelled) {
        await wait(300);
        onDone();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);

  const chips = [job.spec?.domain && E.domainById(job.spec.domain)?.name, E.KINDS[job.spec?.kind]?.label, job.spec?.synthetic ? 'Synthetic scene' : '']
    .filter(Boolean)
    .join(' · ');
  const taskTags = parsed ? TASK_MAP[trace.task] || [] : [];
  const detectedMods = new Set((profile?.images || []).map((i: any) => (i.modality === 'sar' ? 'SAR' : i.bands?.length > 3 ? 'Multispectral' : 'Optical')));

  return (
    <section className="pipe" aria-label="Analysis pipeline">
      <div className="pipe-head">
        <p className="eyebrow">Analysing satellite imagery</p>
        <h1 className="pipe-q">{job.spec.question}</h1>
        <p className="meta">{chips}</p>
      </div>
      <ol className="pipe-track" aria-label="Analysis stages">
        {STAGES.map((s, i) => (
          <li key={s.id} className={`node ${i < stage ? 'done' : i === stage ? 'active' : 'waiting'}`}>
            <span className="node-dot" aria-hidden="true">
              {i < stage ? <Icon name="check" /> : null}
            </span>
            <span className="node-t">{s.label}</span>
            <span className="node-s">{s.sub}</span>
          </li>
        ))}
      </ol>
      <div className="pipe-body">
        <div className="pipe-visual">
          {stage <= 1 && (
            <div className="vframe">
              <div className="vf-thumbs">
                {(job.thumbs || []).map((t: any) => (
                  <figure className="th" key={t.role}>
                    <img src={t.url} alt="" />
                    <figcaption className="mono">{t.role}</figcaption>
                  </figure>
                ))}
              </div>
              <div className="scan" />
            </div>
          )}
          {stage === 1 && (
            <div className="mod-tags">
              {MOD_TAGS.map((m) => (
                <span key={m} className={`chip ${detectedMods.has(m) ? 'on' : 'off'}`}>
                  {m}
                </span>
              ))}
            </div>
          )}
          {stage === 2 && (
            <div className="tasktags">
              {taskTags.map((tk) => (
                <span key={tk} className="chip on big">
                  {TASK_NAMES[tk] || tk}
                </span>
              ))}
            </div>
          )}
          {stage === 3 && (
            <ol className="tool-pick">
              {(trace?.plan || []).map((c: any) => (
                <li key={c.step_id} className="chip on">
                  {TOOL_LABEL[c.tool] || c.tool}
                </li>
              ))}
            </ol>
          )}
          {stage === 4 && (
            <div className="vframe">
              <div className="vf-thumbs">
                {(job.thumbs || []).slice(0, 1).map((t: any) => (
                  <img key={t.role} src={t.url} alt="" style={{ width: '100%', borderRadius: 4 }} />
                ))}
              </div>
              <div className="scan run" />
            </div>
          )}
          {stage >= 5 && (
            <div className="fuse-streams">
              {['Image', 'Mask', 'Detections', 'Model'].map((s) => (
                <span key={s} className="chip on">
                  {s}
                </span>
              ))}
              <b className="mono">→ evidence-grounded result</b>
            </div>
          )}
        </div>
        <div className="pipe-detail" aria-live="polite">
          {stage === 4 && stepIdx >= 0 && steps[stepIdx] ? (
            <>
              <p className="eyebrow">Running {TOOL_LABEL[steps[stepIdx].tool] || steps[stepIdx].tool}</p>
              <p className="mono">{steps[stepIdx].model_id}</p>
              <p>{steps[stepIdx].summary}</p>
            </>
          ) : (
            <>
              <p className="eyebrow">{STAGES[stage].label}</p>
              <p>{STAGES[stage].sub}</p>
            </>
          )}
        </div>
      </div>
      <p className="fine">
        The stages above are driven by this run's real execution trace — the task, the tools chosen, and their outputs —
        not a fixed animation.
      </p>
    </section>
  );
}
