import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { history, clearHistory, jobs, useStoreVersion, S, E } from '../state/store';

const fmtWhen = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

// History: a clean institutional table of runs (not a card grid). Opening a run
// rebuilds it from its saved spec (demo) and shows it in the workspace.
export default function History() {
  useStoreVersion();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const list = history().filter((h: any) => !q || h.question.toLowerCase().includes(q.toLowerCase()));

  const open = (h: any) => {
    let job = jobs()[h.job_id];
    if (!job && h.spec) {
      try {
        job = E.makeJob(h.spec, h.job_id, h.created_at);
      } catch {
        job = null;
      }
    }
    if (!job) {
      E.toast('This run is no longer available in this browser.', 'err');
      return;
    }
    S.openJob = job;
    nav('/app');
  };

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Records</p>
        <h1 className="h1">History</h1>
        <p className="lead-sm">Every analysis is recorded. Open a run to see its answer, map and trace again.</p>
      </div>
      <div className="table-tools">
        <label className="sr" htmlFor="hq">
          Search questions
        </label>
        <input id="hq" type="search" placeholder="Search questions" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="btn btn-secondary btn-sm" disabled={!history().length} onClick={() => clearHistory()}>
          Clear history
        </button>
      </div>
      <div className="tbl-wrap">
        <table className="tbl hist">
          <thead>
            <tr>
              <th scope="col">Question</th>
              <th scope="col">Field</th>
              <th scope="col">Task</th>
              <th scope="col">Result</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            {list.length ? (
              list.map((h: any) => {
                const d = h.spec && E.domainById(h.spec.domain);
                const lab = h.status === 'done' ? h.confidence_label : h.status === 'needs_input' ? 'Needs input' : 'Failed';
                return (
                  <tr key={h.job_id} className="hrow" onClick={() => open(h)}>
                    <td>
                      <button type="button" className="link-row" onClick={() => open(h)}>
                        {h.question}
                      </button>
                      <small className="mono">{h.job_id}</small>
                    </td>
                    <td>{d ? d.name : <span className="dim">Not specified</span>}</td>
                    <td className="mono">{h.task || 'no plan'}</td>
                    <td>
                      <span className={`res-tag ${(lab || '').toLowerCase().replace(' ', '-')}`}>{lab}</span>
                    </td>
                    <td className="mono nw">{fmtWhen(h.created_at)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="empty">
                  {history().length ? 'No run matches that search.' : 'No runs yet. Analyses you run are recorded here.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
