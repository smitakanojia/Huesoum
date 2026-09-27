// Thin reactive layer over the ported engine's global `S` object. The engine
// (tools, fusion, report) reads S.jobs / S.mode / S.apiBase directly, so we use
// S as the single data store and add a tiny subscribe/emit for React to re-render
// when global things (language, mode, session, jobs, history) change.
import { useSyncExternalStore } from 'react';
import * as Engine from '../core/engine';

// The engine is ported vanilla JS; its functions declare optional params as required,
// so expose it as `any` to keep call sites ergonomic (types live in api/types.ts).
const E: any = Engine;
const S: any = E.S;

// ---- defaults ----
const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';
S.apiBase = API_BASE;
S.mode = S.mode || 'demo';
S.jobs = S.jobs || {};
S.examples = S.examples || [];
S.maps = S.maps || [];
S.timers = S.timers || [];
try {
  S.history = E.store.get('history', []) || [];
} catch {
  S.history = [];
}

// Register the new multi-temporal (time series) analysis type so its label resolves
// wherever KINDS is read. Its handling (pairwise change + trend) lives in the
// workspace/engine wrappers.
if (!S.__kindsPatched) {
  E.KINDS['multi-temporal'] = {
    label: 'Time series',
    help: 'Three or more dates of the same area, ordered by acquisition. Change is measured between consecutive dates and summarised as a trend.',
    roles: ['T1', 'T2', 'T3'],
    n: 0,
  };
  S.__kindsPatched = true;
}

let user: { name: string; email: string } | null = null;
try {
  const raw = localStorage.getItem('sq.user');
  user = raw ? JSON.parse(raw) : null;
} catch {
  user = null;
}
S.user = user;

// ---- pub/sub ----
const listeners = new Set<() => void>();
let version = 0;
export function emit() {
  version++;
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export function useStoreVersion() {
  return useSyncExternalStore(subscribe, () => version);
}

// ---- language ----
export type Lang = 'en' | 'hi';
export function getLang(): Lang | null {
  return E.getLang() as Lang | null;
}
export function setLang(l: Lang) {
  E.setLang(l);
  emit();
}
export const t = (k: string) => E.t(k);

// ---- session ----
export function currentUser() {
  return S.user;
}
export function signIn(name: string, email: string) {
  S.user = { name, email };
  try {
    localStorage.setItem('sq.user', JSON.stringify(S.user));
  } catch {
    /* ignore */
  }
  emit();
}
export function signOut() {
  S.user = null;
  try {
    localStorage.removeItem('sq.user');
  } catch {
    /* ignore */
  }
  emit();
}

// ---- run mode / core connection ----
export function runMode(): 'demo' | 'live' {
  return S.mode;
}
export function health() {
  return S.health || null;
}
export async function connectCore() {
  if (!S.apiBase) {
    S.mode = 'demo';
    return;
  }
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 2500);
    const r = await fetch(S.apiBase + '/api/health', { signal: ctl.signal });
    clearTimeout(timer);
    if (r.ok) {
      S.health = await r.json();
      S.mode = 'live';
    }
  } catch {
    S.mode = 'demo';
  }
  emit();
}

// ---- jobs & history ----
export function jobs() {
  return S.jobs;
}
export function saveJob(job: any) {
  S.jobs[job.id] = job;
  const r = job.result;
  const item = {
    job_id: job.id,
    question: job.spec.question,
    task: r.trace ? r.trace.task : null,
    status: r.status,
    confidence_label: r.fusion ? r.fusion.confidence_label : null,
    created_at: job.createdAt,
    spec: job.spec,
  };
  S.history = [item].concat((S.history || []).filter((h: any) => h.job_id !== job.id)).slice(0, 40);
  try {
    E.store.set('history', S.history);
  } catch {
    /* ignore */
  }
  emit();
}
export function history() {
  return S.history || [];
}
export function clearHistory() {
  S.history = [];
  try {
    E.store.set('history', []);
  } catch {
    /* ignore */
  }
  emit();
}

export { S, E };
