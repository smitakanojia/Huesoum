// HTTP client for the SatQuery API server (server/app.py, Master F3.6).
// Only used in live mode; in demo mode the engine computes everything locally.
import { S, E } from '../state/store';

const base = () => S.apiBase || '';
const absUrl = (u: string) => E.absUrl(u);

export async function getHealth() {
  const r = await fetch(base() + '/api/health');
  if (!r.ok) throw new Error('health check failed');
  return r.json();
}

export async function getExamples() {
  const r = await fetch(base() + '/api/examples');
  if (!r.ok) throw new Error('could not load examples');
  return r.json();
}

export async function createJobFromExample(exampleId: string) {
  const r = await fetch(`${base()}/api/jobs/from-example/${encodeURIComponent(exampleId)}`, {
    method: 'POST',
  });
  if (!r.ok) throw new Error(`the server refused the request (${r.status})`);
  return r.json() as Promise<{ job_id: string }>;
}

export async function createJob(files: { file: File; name: string }[], question: string, inputMode: string, sessionId?: string) {
  const fd = new FormData();
  files.forEach((f) => fd.append('files', f.file, f.name));
  fd.append('question', question);
  fd.append('input_mode', inputMode);
  if (sessionId) fd.append('session_id', sessionId);
  const r = await fetch(`${base()}/api/jobs`, { method: 'POST', body: fd });
  if (!r.ok) throw new Error(`the server refused the request (${r.status})`);
  return r.json() as Promise<{ job_id: string }>;
}

export async function getStatus(jobId: string) {
  const r = await fetch(`${base()}/api/jobs/${jobId}`);
  return r.json();
}

export async function getResult(jobId: string) {
  const res = await (await fetch(`${base()}/api/jobs/${jobId}/result`)).json();
  await Promise.all(
    (res.layers || [])
      .filter((l: any) => l.kind === 'vector')
      .map(async (l: any) => {
        try {
          l.data = await (await fetch(absUrl(l.url))).json();
        } catch {
          l.data = null;
        }
      })
  );
  return res;
}
