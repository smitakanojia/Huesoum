import { useState } from 'react';
import { E } from '../state/store';

function ParamRow({ name, s }: { name: string; s: any }) {
  let mid: React.ReactNode;
  let val: React.ReactNode;
  if (s.type === 'float' || s.type === 'int') {
    const fx = (n: number) => (s.type === 'float' ? Number(n).toFixed(2) : n);
    const pos = Math.round(((s.default - s.min) / (s.max - s.min)) * 100);
    mid = (
      <div className="rng" role="img" aria-label={`${name}: permitted ${fx(s.min)} to ${fx(s.max)}, default ${fx(s.default)}`}>
        <i style={{ left: pos + '%' }} />
      </div>
    );
    val = (
      <>
        {fx(s.min)} to {fx(s.max)} <em>default {fx(s.default)}</em>
      </>
    );
  } else if (s.type === 'enum') {
    mid = (
      <div className="opts">
        {s.choices.map((c: any) => (
          <span key={c} className={c === s.default ? 'def' : ''}>
            {String(c)}
          </span>
        ))}
      </div>
    );
    val = <em>default {String(s.default)}</em>;
  } else if (s.type === 'bool') {
    mid = (
      <div className="opts">
        <span className={s.default ? 'def' : ''}>on</span>
        <span className={!s.default ? 'def' : ''}>off</span>
      </div>
    );
    val = <em>default {s.default ? 'on' : 'off'}</em>;
  } else {
    mid = (
      <div className="opts">
        <span>free text</span>
      </div>
    );
    val = <em>set by the controller</em>;
  }
  return (
    <li>
      <span className="pn mono">{name}</span>
      {mid}
      <span className="pv mono">{val}</span>
    </li>
  );
}

// Registry: a scientific directory of the tools the agent may use, and the only
// parameters it may set, within the ranges shown.
export default function Registry() {
  const [f, setF] = useState<'all' | 'P1' | 'P2'>('all');
  const list = E.REG.filter((r: any) => f === 'all' || r.owner === f);
  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Tool registry</p>
        <h1 className="h1">What the agent is allowed to do</h1>
        <p className="lead-sm">
          The controller uses only the tools listed here, and changes only the settings shown, within the ranges shown. A
          value outside its range is clamped, and the clamp is written in the trace.
        </p>
      </div>
      <div className="table-tools">
        <div className="seg" role="group" aria-label="Filter tools by group">
          {([
            ['all', 'All tools'],
            ['P1', 'Models'],
            ['P2', 'Geo engine'],
          ] as [any, string][]).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={f === k} onClick={() => setF(k)}>
              {l}
            </button>
          ))}
        </div>
        <span className="meta">
          {list.length} of {E.REG.length} tools
        </span>
      </div>
      <div className="reg-list">
        {list.map((tl: any) => (
          <article className="reg" key={tl.tool}>
            <div className="reg-id">
              <h2 className="mono">{tl.tool}</h2>
              <p className="mono model">{tl.model_id}</p>
              <span className="grp">{tl.owner === 'P1' ? 'Models' : 'Geo engine'}</span>
            </div>
            <div className="reg-main">
              <p>{tl.blurb}</p>
              <dl>
                <div>
                  <dt>Does</dt>
                  <dd>{tl.does.map((x: string) => <span key={x} className="chip sm">{x}</span>)}</dd>
                </div>
                <div>
                  <dt>Needs</dt>
                  <dd>{tl.needs.map((x: string) => <span key={x} className="chip sm">{x}</span>)}</dd>
                </div>
                <div>
                  <dt>Native pixel size</dt>
                  <dd className="mono">
                    {tl.native_pixel_m
                      ? tl.native_pixel_m[0] === tl.native_pixel_m[1]
                        ? tl.native_pixel_m[0] + ' m'
                        : tl.native_pixel_m[0] + ' to ' + tl.native_pixel_m[1] + ' m'
                      : 'not applicable'}
                  </dd>
                </div>
                {tl.fallback && (
                  <div>
                    <dt>Fallback</dt>
                    <dd className="mono">{tl.fallback}</dd>
                  </div>
                )}
              </dl>
            </div>
            <div className="reg-params">
              <h3 className="eyebrow">Permitted parameters</h3>
              <ul className="pl">
                {Object.entries(tl.params).map(([k, s]) => (
                  <ParamRow key={k} name={k} s={s} />
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
