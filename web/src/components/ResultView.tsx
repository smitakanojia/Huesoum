import { useMemo, useState } from 'react';
import { t, E } from '../state/store';
import { baConfig, TOOL_LABEL } from '../core/view';
import MapView from './MapView';
import Receipt, { ReceiptData } from './Receipt';
import { Icon } from './Logo';
import Chat from './Chat';

const STYLES = E.STYLES;
const TABS: [string, string][] = [
  ['result', 'result'],
  ['summary', 'execution_summary'],
  ['trace', 'audit_trace'],
  ['downloads', 'downloads'],
];

function ClampChip({ k, v }: { k: string; v: any }) {
  const clamp = v && typeof v === 'object' && 'clamped_from' in v;
  if (clamp)
    return (
      <span className="pc clamp" title={`Permitted ${v.min} to ${v.max}`}>
        {k}={String(v.value)}
        <em>clamped from {String(v.clamped_from)}</em>
      </span>
    );
  const text = Array.isArray(v) ? v.join(',') : String(v);
  return <span className="pc">{k}={text.length > 40 ? text.slice(0, 38) + '…' : text}</span>;
}

function Section({ title, children, hl = false }: { title: string; children: React.ReactNode; hl?: boolean }) {
  return (
    <details className={`tr-sec ${hl ? 'hl' : ''}`} open>
      <summary>
        <h3>{title}</h3>
      </summary>
      <div className="tr-body">{children}</div>
    </details>
  );
}

export default function ResultView({
  job,
  turns,
  onFollowUp,
  onNew,
  goTrace,
}: {
  job: any;
  turns: { question: string; answer: string; label: string }[];
  onFollowUp: (q: string) => void;
  onNew: () => void;
  goTrace: () => void;
}) {
  const r = job.result;
  const [tab, setTab] = useState('result');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  if (r.status === 'needs_input')
    return (
      <section className="state">
        <p className="eyebrow warn">One more input is needed</p>
        <h1 className="h2">{r.message}</h1>
        <blockquote className="quote">{job.spec.question}</blockquote>
        <p>The question asks about change, and a single image cannot show change. Add a second image of the same area from a different date.</p>
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={onNew}>
            Change my question
          </button>
        </div>
      </section>
    );

  const f = r.fusion;
  const tr = r.trace;
  const synth = tr.steps.some((s: any) => s.source === 'fake');
  const d = E.domainById(job.spec.domain);
  const metaLine = [d?.name, E.KINDS[job.spec.kind]?.label, tr ? 'Task ' + tr.task : '', job.spec.synthetic ? 'Synthetic scene' : '']
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <div className="page-head res-head">
        <div>
          <p className="eyebrow">Analysis result</p>
          <p className="q-label">Question</p>
          <h1 className="res-q">{tr.question}</h1>
          <p className="meta">{metaLine}</p>
        </div>
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={onNew}>
            {t('new_analysis')}
          </button>
          <button className="btn btn-primary" onClick={() => E.exportPDF(job.id)}>
            <Icon name="download" />
            {t('export_report')}
          </button>
        </div>
      </div>
      {synth && (
        <p className="note warn">
          <b>Synthetic scene, fake mode.</b> Images and numbers are generated in your browser. They are not from a satellite.
        </p>
      )}

      <div className="tabs" role="tablist" aria-label="Result sections">
        {TABS.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            {t(l)}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'result' && <ResultTab job={job} onReceipt={setReceipt} />}
        {tab === 'summary' && <SummaryTab job={job} />}
        {tab === 'trace' && <TraceTab r={r} />}
        {tab === 'downloads' && <DownloadsTab job={job} />}
      </div>

      {/* Continue-the-same-chat: follow-up thread that reuses the uploaded imagery. */}
      {tab === 'result' && <Chat turns={turns} onSend={onFollowUp} />}

      {receipt && (
        <Receipt
          data={receipt}
          onClose={() => setReceipt(null)}
          onTrace={() => {
            setReceipt(null);
            setTab('trace');
            goTrace();
          }}
        />
      )}
    </>
  );
}

function ResultTab({ job, onReceipt }: { job: any; onReceipt: (r: ReceiptData) => void }) {
  const r = job.result;
  const f = r.fusion;
  const tr = r.trace;
  const conflict = f.confidence_label === 'Conflict';
  const pct = Math.round(f.confidence * 100);
  const rows = useMemo(() => E.evidenceRows(r), [r]);
  const ba = baConfig(r);
  const overlays = r.layers.filter((l: any) => l.style !== 'base');

  // map view state: baIdx (before/after) or custom visible set
  const [baIdx, setBaIdx] = useState(ba ? 2 : -1);
  const [ids, setIds] = useState<string[] | null>(ba ? ba.sets[2] : null);
  const measureNote = ['CHANGE_GROUNDING', 'CHANGE_VQA', 'COUNT', 'GROUNDING'].includes(tr.task) && f.model_description;

  return (
    <>
      <section className="result-flow" aria-labelledby="h-ans">
        <div className="rf-answer">
          <h2 id="h-ans" className="eyebrow">
            {t('answer')}
          </h2>
          <p className="answer-text">{f.answer}</p>
        </div>
        <div className={`rf-conf ${conflict ? 'conflict' : f.confidence_label.toLowerCase()}`}>
          <div className="conf-line">
            <span className="eyebrow" style={{ margin: '0 10px 0 0' }}>
              {t('confidence')}
            </span>
            <b>{f.confidence_label}</b>
            <span>{pct}%</span>
          </div>
          <div className="bar" role="img" aria-label={`Confidence ${pct} percent`}>
            <i style={{ width: pct + '%' }} />
          </div>
          {conflict && <span className="review">{t('review_required')}</span>}
        </div>
        <div className="rf-reasons">
          <h3 className="eyebrow">{t('evidence')} summary</h3>
          <ul className="reasons">
            {f.reasons.map((x: string, i: number) => {
              const ok = x.startsWith('✓');
              return (
                <li key={i} className={ok ? 'ok' : 'warn'}>
                  <Icon name={ok ? 'check' : 'warn'} />
                  <span>{x.replace(/^[✓⚠]\s*/, '')}</span>
                </li>
              );
            })}
          </ul>
          {conflict && (
            <div className="conflicts">
              <h3 className="eyebrow">Where the sources disagree</h3>
              <ul>
                {f.conflicts.map((c: any, i: number) => (
                  <li key={i}>
                    <b className="mono">
                      {c.between[0]} vs {c.between[1]}
                    </b>
                    <span>{c.description}</span>
                  </li>
                ))}
              </ul>
              <p className="fine">A person should check this result before it is used.</p>
            </div>
          )}
        </div>
        {f.model_description && (
          <div className="rf-note">
            <Icon name="info" />
            <span>
              <b>{t('model_description')}:</b> “{f.model_description}”
              {measureNote ? ' — ' + t('measured_not_guessed') : ''}
            </span>
          </div>
        )}
      </section>

      {/* Evidence table with provenance receipts */}
      <section className="findings" aria-labelledby="h-find">
        <h2 id="h-find" className="h2">
          {t('evidence')}
        </h2>
        <p className="sec-p">Every number below is measured by a tool. Click a value to see exactly which step and model produced it.</p>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Measurement</th>
                <th scope="col" className="r">
                  Value
                </th>
                <th scope="col">Unit</th>
                <th scope="col">Produced by</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((x: any) => (
                  <tr key={x.key}>
                    <th scope="row">{x.label}</th>
                    <td className="r mono">
                      <button
                        type="button"
                        className="receipt-btn"
                        onClick={(e) =>
                          onReceipt({ job, step: x.step, label: x.label, value: x.value, unit: x.unit, x: (e.target as HTMLElement).getBoundingClientRect().left, y: (e.target as HTMLElement).getBoundingClientRect().bottom })
                        }
                      >
                        {x.value}
                      </button>
                    </td>
                    <td>{x.unit}</td>
                    <td className="mono">
                      {x.step} · {x.tool}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>No measured facts for this run.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Visual evidence — landscape MapLibre map */}
      <section className="evidence" aria-labelledby="h-ev">
        <div className="sec-head">
          <h2 id="h-ev" className="h2">
            {t('visual_evidence')}
          </h2>
          <div className="map-tools">
            {ba && (
              <div className="seg" role="group" aria-label="Map view">
                {ba.names.map((n, i) => (
                  <button key={n} type="button" aria-pressed={baIdx === i} onClick={() => { setBaIdx(i); setIds(ba.sets[i]); }}>
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="map-frame" style={{ aspectRatio: '16 / 9' }}>
          <MapView layers={r.layers} ids={ids} />
        </div>
        <div className="map-cap">
          <ul className="legend-inline" aria-label="Active overlays">
            {overlays
              .filter((l: any) => (ids ? ids.includes(l.layer_id) : l.visible))
              .map((l: any) => (
                <li key={l.layer_id}>
                  <i className="sw-c" style={{ background: STYLES[l.style].color }} />
                  {l.name}
                </li>
              ))}
          </ul>
          <p className="meta">
            {tr.sensor_profile.images
              .map((i: any) => `${i.role} ${i.file} · ${i.sensor}${i.pixel_m ? ' · ' + i.pixel_m + ' m' : ''}${i.date ? ' · ' + i.date : ''}`)
              .join('  |  ')}
          </p>
        </div>
      </section>
    </>
  );
}

function SummaryTab({ job }: { job: any }) {
  const r = job.result;
  const tr = r.trace;
  const f = r.fusion;
  const total = tr.steps.reduce((s: number, x: any) => s + x.runtime_s, 0);
  const fake = tr.steps.some((s: any) => s.source === 'fake');
  const d = E.domainById(job.spec.domain);
  return (
    <section className="summary">
      <h2 className="h2">How the result was produced</h2>
      <dl className="spec">
        <div><dt>Task</dt><dd>{tr.task.replace(/_/g, ' ').toLowerCase()}</dd></div>
        <div><dt>Object and place</dt><dd>{(tr.parsed_query.target || 'none named')} · {tr.parsed_query.place_hint}</dd></div>
        <div><dt>Steps run</dt><dd>{tr.steps.filter((s: any) => s.status === 'ok').length} of {tr.plan.length}</dd></div>
        <div><dt>Tool time</dt><dd className="mono">{total.toFixed(2)} s</dd></div>
        <div><dt>Run mode</dt><dd>{fake ? 'fake (synthetic results)' : [...new Set(tr.steps.map((s: any) => s.source))].join(', ')}</dd></div>
        <div className={tr.adapter_id ? 'hl' : ''}><dt>Remote-sensing adapter</dt><dd className="mono">{tr.adapter_id || 'not used in this plan'}</dd></div>
        {d && <div><dt>Field of work</dt><dd>{d.name}</dd></div>}
        <div><dt>Confidence</dt><dd>{f.confidence_label} · {Math.round(f.confidence * 100)}%</dd></div>
        {tr.resolved_from_turn && <div className="hl"><dt>Follow-up</dt><dd>gaps resolved from {tr.resolved_from_turn}</dd></div>}
      </dl>
      <h3 className="h3">Models and tools, with the parameters used</h3>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Step</th><th>Tool and model</th><th>Permitted parameters</th><th>Result</th><th className="r">Time</th></tr></thead>
          <tbody>
            {tr.steps.map((s: any) => (
              <tr key={s.step_id}>
                <th scope="row" className="mono">{s.step_id}</th>
                <td><b>{TOOL_LABEL[s.tool] || s.tool}</b><br /><small className="mono">{s.model_id}</small></td>
                <td><div className="pcs">{Object.entries(s.params).map(([k, v]) => <ClampChip key={k} k={k} v={v} />)}</div></td>
                <td>{s.summary}</td>
                <td className="r mono">{E.tsec(s.runtime_s)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TraceTab({ r }: { r: any }) {
  const tr = r.trace;
  const pq = tr.parsed_query;
  const sp = tr.sensor_profile;
  const fake = tr.steps.some((s: any) => s.source === 'fake');
  return (
    <>
      <div className="trace-bar">
        <p>Every decision the controller made and every step it ran. This is the record that can be audited.</p>
      </div>
      <div className="trace">
        <Section title="Parsed query">
          <dl className="kv">
            <div><dt>Task</dt><dd className="mono">{pq.task}</dd></div>
            <div><dt>Target</dt><dd className="mono">{pq.target || 'none'}</dd></div>
            <div><dt>Place hint</dt><dd className="mono">{pq.place_hint}</dd></div>
            <div><dt>Looking for</dt><dd className="mono">{pq.looking_for || 'none'}</dd></div>
            {tr.resolved_from_turn && <div><dt>Resolved from</dt><dd className="mono">{tr.resolved_from_turn}</dd></div>}
          </dl>
          <p className="tq">{pq.question}</p>
        </Section>
        <Section title="Sensor profile">
          <div className="tbl-wrap">
            <table className="tbl sm">
              <thead><tr><th>Image</th><th>Sensor</th><th>Modality</th><th>Pixel</th><th>Date</th><th>CRS</th><th>Cloud</th></tr></thead>
              <tbody>
                {sp.images.map((i: any) => (
                  <tr key={i.image_id}>
                    <td className="mono">{i.image_id} · {i.role}<br /><small>{i.file}</small></td>
                    <td>{i.sensor}{i.sar_band ? ' · ' + i.sar_band + '-band' : ''}</td>
                    <td>{i.modality}</td>
                    <td className="mono">{i.pixel_m ? i.pixel_m + ' m' : 'n/a'}</td>
                    <td className="mono">{i.date || 'n/a'}</td>
                    <td className="mono">{i.crs || 'none'}</td>
                    <td className="mono">{i.cloud_pct == null ? 'n/a' : i.cloud_pct + '%'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="chips">
            {Object.entries(sp.can_compute).map(([k, v]) => (
              <span key={k} className={`chip ${v ? 'on' : 'off'}`}>{k} {v ? 'possible' : 'not possible'}</span>
            ))}
            <span className="chip">input mode {sp.input_mode}</span>
          </p>
        </Section>
        <Section title="Plan">
          <ol className="plan">
            {tr.plan.map((c: any) => (
              <li key={c.step_id}>
                <b className="mono">{c.step_id}</b> <span className="mono">{c.tool}</span>
                <small className="mono">{Object.entries(c.inputs).map(([k, v]) => `${k}: ${v}`).join(' · ')}</small>
              </li>
            ))}
          </ol>
        </Section>
        <Section title="Steps run">
          <div className="tbl-wrap">
            <table className="tbl sm">
              <thead><tr><th>Step</th><th>Tool and model</th><th>Parameters</th><th>Status</th><th>Result</th><th className="r">Time</th><th>Source</th></tr></thead>
              <tbody>
                {tr.steps.map((s: any) => (
                  <tr key={s.step_id}>
                    <td className="mono">{s.step_id}</td>
                    <td><b className="mono">{s.tool}</b><br /><small className="mono">{s.model_id}</small></td>
                    <td><div className="pcs">{Object.entries(s.params).map(([k, v]) => <ClampChip key={k} k={k} v={v} />)}</div></td>
                    <td><span className={`st st-${s.status}`}>{s.status}</span></td>
                    <td>{s.summary}</td>
                    <td className="r mono">{E.tsec(s.runtime_s)}</td>
                    <td><span className={`src src-${s.source}`}>{s.source}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
        <Section title="Skipped steps and notes">
          {tr.skipped.length ? (
            <ul className="notes">{tr.skipped.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>
          ) : (
            <p className="fine">Nothing was skipped.</p>
          )}
        </Section>
        <Section title="Remote-sensing adapter" hl={!!tr.adapter_id}>
          {tr.adapter_id ? (
            <p>
              <b className="mono big">{tr.adapter_id}</b> is loaded by the language model in this run. This is the
              adaptation the problem statement requires.{fake ? ' In fake mode the adapter is named but no model ran.' : ''}
            </p>
          ) : (
            <p>There is no language-model step in this plan, so no adapter was used.</p>
          )}
        </Section>
        <Section title="Versions">
          <dl className="kv mono">
            {Object.entries(tr.versions).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>
            ))}
          </dl>
        </Section>
      </div>
    </>
  );
}

function DownloadsTab({ job }: { job: any }) {
  return (
    <section className="downloads">
      <div className="dl-grid">
        <div>
          <h2 className="h2">Evidence report</h2>
          <p className="sec-p">
            A PDF with the question, answer, confidence and reasons, map figures, evidence table, the full trace, the
            sensor profile, the adapter and versions — in the language you chose.
          </p>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={() => E.exportPDF(job.id)}>
              <Icon name="download" />
              Download report (PDF)
            </button>
            <button className="btn btn-secondary" onClick={() => window.print()}>
              Print
            </button>
          </div>
        </div>
        <div>
          <h2 className="h2">GeoJSON</h2>
          <p className="sec-p">Outlines and boxes as GeoJSON in EPSG:4326, for QGIS or Bhuvan. Filled masks appear in the PDF figures.</p>
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => E.exportGeoJSON(job.id)}>
              <Icon name="map" />
              Download GeoJSON
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
