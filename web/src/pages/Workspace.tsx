import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t, runMode, saveJob, useStoreVersion, S, E } from '../state/store';
import Pipeline from '../components/Pipeline';
import ResultView from '../components/ResultView';
import { Icon } from '../components/Logo';
import { createJob, createJobFromExample, getResult, getStatus } from '../api/client';

const ALLOWED = ['.tif', '.tiff'];
const MAX_BYTES = 2 * 1024 * 1024 * 1024;
const humanSize = (b: number | null) =>
  b == null ? 'synthetic' : b > 1e9 ? (b / 1e9).toFixed(2) + ' GB' : b > 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB';

// Analysis type options — includes the new multi-temporal (time series) type.
const KIND_OPTS: [string, string][] = [
  ['single', 'Single image'],
  ['bi-temporal', 'Before / after pair'],
  ['multi-temporal', 'Time series (3+ dates)'],
  ['cross-modal', 'Optical + SAR pair'],
];
const KIND_HELP: Record<string, string> = {
  single: 'One optical or radar image. Ask a question, find something, or count it.',
  'bi-temporal': 'Two dates of the same area. Ask what changed and where.',
  'multi-temporal': 'Three or more dates of the same area, ordered by acquisition. Change is measured between consecutive dates and summarised as a trend.',
  'cross-modal': 'Co-registered optical and SAR images. Water and built-up areas, even under cloud.',
};
const kindN = (k: string) => (k === 'single' ? 1 : k === 'multi-temporal' ? 3 : 2);

type Composer = { kind: string; files: any[]; synth: boolean; q: string; domain: string; notice: string };
function newComposer(preset?: Partial<Composer>): Composer {
  const c: Composer = { kind: 'bi-temporal', files: [], synth: false, q: '', domain: '', notice: '' };
  if (preset) Object.assign(c, preset);
  fillSynth(c);
  return c;
}
function fillSynth(c: Composer) {
  c.synth = true;
  if (c.kind === 'multi-temporal') {
    c.files = ['T1', 'T2', 'T3'].map((r, i) => ({ synthetic: true, role: r, name: `series_${i + 1}.tif`, size: null }));
  } else {
    const roles = E.KINDS[c.kind].roles;
    c.files = roles.map((r: string) => ({ synthetic: true, role: r, name: E.META[r].file, size: null }));
  }
}

// Multi-temporal (N>2) demo: run the representative interval on the synthetic pair,
// then summarise a trend across the series. Clearly labelled synthetic.
function runSeries(q: string, domain: string, nDates: number) {
  const spec: any = { question: q, kind: 'bi-temporal', inputMode: 'geotiff', roles: ['T1', 'T2'], variant: null, params: {}, domain, synthetic: true };
  const job = E.makeJob(spec);
  job.spec.kind = 'multi-temporal';
  const f = job.result.fusion;
  const intervals = Math.max(2, nDates) - 1;
  const changed = f.facts.changed_area || f.facts.water_loss || f.facts.new_buildings || 0;
  const net = typeof changed === 'number' ? changed * intervals : 0;
  f.reasons.unshift(
    `✓ Trend across ${intervals} intervals of a ${nDates}-date series: the measured change repeats each interval; net change over the series ≈ ${E.fmt(net)}${typeof changed === 'number' && String(f.facts.changed_area || f.facts.water_loss) ? ' m²' : ''} (synthetic series — each interval reuses the demonstration pair, and is labelled synthetic).`
  );
  return job;
}

export default function Workspace() {
  useStoreVersion();
  const nav = useNavigate();
  const mode = runMode();
  const [composer, setComposer] = useState<Composer>(() => newComposer(S.pendingDomain ? domainPreset(S.pendingDomain) : undefined));
  const [view, setView] = useState<'compose' | 'running' | 'result'>('compose');
  const [job, setJob] = useState<any>(null);
  const [turns, setTurns] = useState<{ question: string; answer: string; label: string }[]>([]);
  const baseSpec = useRef<any>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (S.pendingDomain) S.pendingDomain = null;
    if (S.openJob) {
      const oj = S.openJob;
      S.openJob = null;
      baseSpec.current = { ...oj.spec };
      setJob(oj);
      const f = oj.result.fusion;
      setTurns(f ? [{ question: oj.spec.question, answer: f.answer, label: f.confidence_label }] : []);
      setView('result');
    }
  }, []);

  const update = (patch: Partial<Composer>) => setComposer((c) => ({ ...c, ...patch, notice: patch.notice ?? '' }));
  const setKind = (kind: string) => {
    const c: Composer = { ...composer, kind, notice: '' };
    fillSynth(c);
    setComposer(c);
  };
  const addFiles = (list: FileList) => {
    const c = { ...composer };
    const n = kindN(c.kind);
    if (c.synth) {
      c.files = [];
      c.synth = false;
    }
    c.notice = '';
    for (const f of Array.from(list)) {
      const ext = '.' + f.name.split('.').pop()!.toLowerCase();
      if (!ALLOWED.includes(ext)) {
        c.notice = `${f.name}: only GeoTIFF or TIFF files (.tif, .tiff) can be analysed.`;
        continue;
      }
      if (f.size > MAX_BYTES) {
        c.notice = `${f.name} is larger than 2 GB.`;
        continue;
      }
      if (c.files.length >= (c.kind === 'multi-temporal' ? 8 : n)) {
        c.notice = 'Remove a file before adding another for this analysis type.';
        break;
      }
      c.files.push({ name: f.name, size: f.size, file: f });
    }
    setComposer(c);
  };

  const launchDemo = (mkJob: () => any) => {
    let created: any;
    try {
      created = mkJob();
    } catch (e: any) {
      update({ notice: 'The demonstration core hit an error: ' + e.message });
      return;
    }
    baseSpec.current = { ...created.spec };
    setJob(created);
    setTurns([]);
    setView('running');
    window.scrollTo(0, 0);
  };

  const run = () => {
    const q = composer.q.trim();
    if (!q) return update({ notice: 'Type the question you want answered.' });
    const n = kindN(composer.kind);
    if (composer.files.length < n)
      return update({ notice: `This analysis needs ${n} image${n > 1 ? 's' : ''}. Add ${n > 1 ? 'them' : 'one'}, or use a demonstration scene.` });
    const real = composer.files.some((f) => !f.synthetic);
    if (real && mode === 'live') {
      liveRun(q);
      return;
    }
    if (real) {
      update({
        notice:
          'The demonstration core cannot read real imagery — no analysis backend is connected. Use a demonstration scene, or run the app with the SatQuery server (VITE_API_BASE).',
      });
      return;
    }
    if (composer.kind === 'multi-temporal') launchDemo(() => runSeries(q, composer.domain, composer.files.length));
    else
      launchDemo(() =>
        E.makeJob({ question: q, kind: composer.kind, inputMode: 'geotiff', roles: E.KINDS[composer.kind].roles, variant: null, params: {}, domain: composer.domain, synthetic: true })
      );
  };

  const runExample = (ex: any) => {
    if (mode === 'live') {
      liveExample(ex.example_id);
      return;
    }
    launchDemo(() => E.makeJob(E.specFromExample(ex)));
  };

  // Continue-the-same-chat: reuse the base spec/imagery; carry over object + place
  // from the previous turn when the new question omits them (recorded in the trace).
  const followUp = (q: string) => {
    const spec = { ...baseSpec.current, question: q };
    const prior = job?.result?.trace?.parsed_query;
    const created =
      spec.kind === 'multi-temporal'
        ? runSeries(q, spec.domain, 3)
        : E.makeJob(spec);
    const pq = created.result?.trace?.parsed_query;
    if (pq && prior) {
      let carried = false;
      for (const k of ['target', 'place_hint', 'looking_for']) {
        const empty = !pq[k] || pq[k] === 'none';
        if (empty && prior[k] && prior[k] !== 'none') {
          pq[k] = prior[k];
          carried = true;
        }
      }
      if (carried) {
        created.result.trace.resolved_from_turn = `turn_${turns.length}`;
        created.result.fusion.reasons.push(`✓ Follow-up: object/place carried over from the previous question (turn ${turns.length}).`);
      }
    }
    setJob(created);
    setView('running');
    window.scrollTo(0, 0);
  };

  const onPipelineDone = () => {
    saveJob(job);
    const f = job.result.fusion;
    setTurns((ts) => ts.concat([{ question: job.spec.question, answer: f ? f.answer : job.result.message || '', label: f ? f.confidence_label : 'Needs input' }]));
    setView('result');
    window.scrollTo(0, 0);
  };

  const newAnalysis = () => {
    setComposer(newComposer());
    setTurns([]);
    setJob(null);
    setView('compose');
    baseSpec.current = null;
    window.scrollTo(0, 0);
  };

  // ---- live mode (minimal): POST, poll, fetch result ----
  const [liveErr, setLiveErr] = useState('');
  async function liveRun(q: string) {
    try {
      setView('running');
      const { job_id } = await createJob(composer.files, q, 'geotiff');
      await pollAndShow(job_id, q);
    } catch (e: any) {
      setLiveErr(e.message);
      setView('compose');
    }
  }
  async function liveExample(id: string) {
    try {
      setView('running');
      const { job_id } = await createJobFromExample(id);
      await pollAndShow(job_id, '');
    } catch (e: any) {
      setLiveErr(e.message);
      setView('compose');
    }
  }
  async function pollAndShow(jobId: string, q: string) {
    for (;;) {
      const st = await getStatus(jobId);
      if (['done', 'failed', 'needs_input'].includes(st.status)) break;
      await new Promise((r) => setTimeout(r, 1000));
    }
    const res = await getResult(jobId);
    const created = { id: jobId, spec: { question: q || (res.trace ? res.trace.question : ''), kind: composer.kind, domain: composer.domain, synthetic: false }, result: res, status: res.status, createdAt: new Date().toISOString() };
    baseSpec.current = { ...created.spec };
    saveJob(created);
    setJob(created);
    setTurns(res.fusion ? [{ question: created.spec.question, answer: res.fusion.answer, label: res.fusion.confidence_label }] : []);
    setView('result');
  }

  if (view === 'running' && job && mode === 'demo') return <Pipeline job={job} onDone={onPipelineDone} />;
  if (view === 'running') return <div className="pad">Running analysis…</div>;
  if (view === 'result' && job)
    return <ResultView job={job} turns={turns} onFollowUp={followUp} onNew={newAnalysis} goTrace={() => {}} />;

  // ---- compose ----
  const demo = mode === 'demo';
  const dom = E.domainById(composer.domain);
  const sugs = dom ? dom.sug : ([] as any[]).concat(...E.DOMAINS.slice(0, 3).map((x: any) => x.sug.slice(0, 1)));
  return (
    <>
      <div className="page-head">
        <p className="eyebrow">{t('workspace_title')}</p>
        <h1 className="h1">Analyse satellite imagery</h1>
        <p className="lead-sm">
          Add one image, two dates, a longer time series, or an optical + radar pair, and ask a question in plain
          language.
        </p>
      </div>
      {liveErr && <p className="note warn">{liveErr}</p>}
      <div className="wk">
        <div className="wk-main">
          <section className="fs">
            <h2 className="fs-h">{t('imagery')}</h2>
            <div className="seg kind-seg" role="group" aria-label="Analysis type">
              {KIND_OPTS.map(([k, l]) => (
                <button key={k} type="button" aria-pressed={composer.kind === k} onClick={() => setKind(k)}>
                  {l}
                </button>
              ))}
            </div>
            <p className="fine kind-help">{KIND_HELP[composer.kind]}</p>
            <div
              className="drop"
              role="button"
              tabIndex={0}
              onClick={() => fileInput.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInput.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                (e.currentTarget as HTMLElement).classList.add('over');
              }}
              onDragLeave={(e) => (e.currentTarget as HTMLElement).classList.remove('over')}
              onDrop={(e) => {
                e.preventDefault();
                (e.currentTarget as HTMLElement).classList.remove('over');
                if (e.dataTransfer?.files.length) addFiles(e.dataTransfer.files);
              }}
            >
              <span className="drop-ic">
                <Icon name="upload" />
              </span>
              <div>
                <b>
                  Drop {composer.kind === 'single' ? 'a file' : composer.kind === 'multi-temporal' ? 'your dated images' : 'two files'} here, or browse
                </b>
                <small>.tif, .tiff only · up to 2 GB per file{composer.kind !== 'single' ? ' · ordered by acquisition date at ingest' : ''}</small>
              </div>
              <input ref={fileInput} type="file" hidden multiple accept=".tif,.tiff,image/tiff" onChange={(e) => e.target.files && addFiles(e.target.files)} />
            </div>
            {composer.notice && (
              <p className="err" role="alert">
                {composer.notice}
              </p>
            )}
            <ul className="files" aria-label="Chosen files">
              {composer.files.length ? (
                composer.files.map((f, i) => (
                  <li key={i}>
                    <span className="fbadge">TIFF</span>
                    <div>
                      <b className="mono">{f.name}</b>
                      <small>
                        {f.synthetic ? <span className="tag">Synthetic</span> : null} {humanSize(f.size)} · the sensor is
                        identified when the analysis starts
                      </small>
                    </div>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Remove ${f.name}`}
                      onClick={() => {
                        const c = { ...composer, files: composer.files.filter((_, k) => k !== i) };
                        setComposer(c);
                      }}
                    >
                      <Icon name="x" />
                    </button>
                  </li>
                ))
              ) : (
                <li className="empty">No file chosen yet.</li>
              )}
            </ul>
            {demo && (
              <p className="alt-row">
                No imagery to hand? Load a synthetic scene:{' '}
                <button type="button" className="link" onClick={() => setKind('bi-temporal')}>
                  two dates of a lake shore
                </button>
                ,{' '}
                <button type="button" className="link" onClick={() => setKind('multi-temporal')}>
                  a three-date series
                </button>
                ,{' '}
                <button type="button" className="link" onClick={() => setKind('cross-modal')}>
                  optical and radar
                </button>
                , or{' '}
                <button type="button" className="link" onClick={() => setKind('single')}>
                  a single image
                </button>
                .
              </p>
            )}
          </section>

          <section className="fs">
            <label htmlFor="q" className="fs-h">
              {t('question')}
            </label>
            <textarea
              id="q"
              rows={3}
              placeholder="For example: Has anything been built on the southern lake shore since last year?"
              value={composer.q}
              onChange={(e) => update({ q: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run();
              }}
            />
            <ul className="sugs" aria-label="Suggested questions">
              {sugs.map((s: any, i: number) => (
                <li key={i}>
                  <button type="button" className="sug" onClick={() => update({ q: s.q })}>
                    {s.q}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="fs">
            <label htmlFor="dom" className="fs-h">
              {t('field_of_work')} <span className="opt">optional, saved with the run and the report</span>
            </label>
            <select id="dom" value={composer.domain} onChange={(e) => update({ domain: e.target.value })}>
              <option value="">Not specified</option>
              {E.DOMAINS.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </section>

          <div className="run-row">
            <button type="button" className="btn btn-primary btn-lg" onClick={run}>
              {t('run_analysis')}
            </button>
            <span className="fine">You can also press Ctrl/Cmd + Enter in the question box.</span>
          </div>
        </div>

        <aside className="wk-side" aria-label="Scenes">
          <h2 className="fs-h">{demo ? 'Demonstration scenes' : 'Examples'}</h2>
          <p className="side-p">
            {demo ? 'Complete analyses on synthetic scenes generated in this browser. One click runs one.' : 'Examples provided by the server.'}
          </p>
          <ul className="scene-list">
            {E.EXAMPLES.map((e: any) => (
              <li key={e.example_id}>
                <button type="button" className="scene" onClick={() => runExample(e)}>
                  {S.thumbs && S.thumbs[e.example_id] ? <img src={S.thumbs[e.example_id]} alt="" /> : <span className="scene-ph" />}
                  <span>
                    <b>{e.title}</b>
                    <small>{e.question}</small>
                    <span className="tags">
                      {demo && <span className="tag">Synthetic</span>}
                      <span className="meta">
                        Story {e.story}
                        {E.KINDS[e.kind] ? ' · ' + E.KINDS[e.kind].label : ''}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}

function domainPreset(id: string): Partial<Composer> {
  const d = E.domainById(id);
  if (!d) return {};
  const sug = d.sug[0];
  const kind = sug.kind === 'cross-modal' ? 'cross-modal' : sug.kind === 'bi-temporal' ? 'bi-temporal' : 'single';
  return { kind, q: sug.q, domain: id };
}
