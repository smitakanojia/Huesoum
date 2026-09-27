import { useState } from 'react';
import { Link } from 'react-router-dom';
import { jobs, useStoreVersion, E } from '../state/store';
import { TOOL_LABEL } from '../core/view';
import { Icon } from '../components/Logo';

function copyText(txt: string) {
  const done = () => E.toast('Trace JSON copied.');
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(txt).then(done, () => E.toast('Copying is blocked here.', 'err'));
  else E.toast('Copying is not available here.', 'err');
}

// Technical audit interface: the full execution record for any run in this session.
export default function TracePage() {
  useStoreVersion();
  const list = Object.values(jobs()).filter((j: any) => j.result && j.result.trace).reverse();
  const [sel, setSel] = useState<string>(list[0] ? (list[0] as any).id : '');
  const head = (
    <div className="page-head">
      <p className="eyebrow">Audit</p>
      <h1 className="h1">Execution trace</h1>
      <p className="lead-sm">
        The parsed query, sensor profile, plan, tools, model identifiers, parameters, skipped steps, adapter and versions
        of a run.
      </p>
    </div>
  );
  if (!list.length)
    return (
      <>
        {head}
        <section className="state">
          <h2 className="h2">No trace yet</h2>
          <p>Run an analysis and its full trace appears here.</p>
          <div className="btn-row">
            <Link className="btn btn-primary" to="/app">
              Open the Analysis Workspace
            </Link>
          </div>
        </section>
      </>
    );
  const job: any = (jobs() as any)[sel] || list[0];
  const r = job.result;
  const tr = r.trace;
  const pq = tr.parsed_query;
  const sp = tr.sensor_profile;
  return (
    <>
      {head}
      <div className="trace-bar">
        <label className="sel">
          Run
          <select value={job.id} onChange={(e) => setSel(e.target.value)}>
            {list.map((j: any) => (
              <option key={j.id} value={j.id}>
                {j.spec.question.slice(0, 64)} · {j.id}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => copyText(JSON.stringify(tr, null, 2))}>
          <Icon name="copy" />
          Copy JSON
        </button>
      </div>
      <div className="trace">
        <details className="tr-sec" open>
          <summary>
            <h3>Parsed query</h3>
          </summary>
          <div className="tr-body">
            <dl className="kv">
              <div><dt>Task</dt><dd className="mono">{pq.task}</dd></div>
              <div><dt>Target</dt><dd className="mono">{pq.target || 'none'}</dd></div>
              <div><dt>Place hint</dt><dd className="mono">{pq.place_hint}</dd></div>
              <div><dt>Looking for</dt><dd className="mono">{pq.looking_for || 'none'}</dd></div>
              {tr.resolved_from_turn && <div><dt>Resolved from</dt><dd className="mono">{tr.resolved_from_turn}</dd></div>}
            </dl>
            <p className="tq">{pq.question}</p>
          </div>
        </details>
        <details className="tr-sec" open>
          <summary>
            <h3>Sensor profile</h3>
          </summary>
          <div className="tr-body">
            <div className="tbl-wrap">
              <table className="tbl sm">
                <thead>
                  <tr><th>Image</th><th>Sensor</th><th>Modality</th><th>Pixel</th><th>Date</th><th>CRS</th></tr>
                </thead>
                <tbody>
                  {sp.images.map((i: any) => (
                    <tr key={i.image_id}>
                      <td className="mono">{i.role} · {i.file}</td>
                      <td>{i.sensor}</td>
                      <td>{i.modality}</td>
                      <td className="mono">{i.pixel_m ? i.pixel_m + ' m' : 'n/a'}</td>
                      <td className="mono">{i.date || 'n/a'}</td>
                      <td className="mono">{i.crs || 'none'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>
        <details className="tr-sec" open>
          <summary>
            <h3>Plan and steps</h3>
          </summary>
          <div className="tr-body">
            <div className="tbl-wrap">
              <table className="tbl sm">
                <thead>
                  <tr><th>Step</th><th>Tool and model</th><th>Status</th><th>Result</th><th className="r">Time</th><th>Source</th></tr>
                </thead>
                <tbody>
                  {tr.steps.map((s: any) => (
                    <tr key={s.step_id}>
                      <td className="mono">{s.step_id}</td>
                      <td><b>{TOOL_LABEL[s.tool] || s.tool}</b><br /><small className="mono">{s.model_id}</small></td>
                      <td><span className={`st st-${s.status}`}>{s.status}</span></td>
                      <td>{s.summary}</td>
                      <td className="r mono">{E.tsec(s.runtime_s)}</td>
                      <td><span className={`src src-${s.source}`}>{s.source}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tr.skipped.length > 0 && (
              <ul className="notes">
                {tr.skipped.map((x: string, i: number) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            )}
          </div>
        </details>
        <details className="tr-sec hl" open>
          <summary>
            <h3>Adapter and versions</h3>
          </summary>
          <div className="tr-body">
            <p>
              {tr.adapter_id ? (
                <>
                  <b className="mono big">{tr.adapter_id}</b> — the remote-sensing adaptation the problem statement requires.
                </>
              ) : (
                'No language-model step in this plan, so no adapter was used.'
              )}
            </p>
            <dl className="kv mono">
              {Object.entries(tr.versions).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{String(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </details>
      </div>
    </>
  );
}
