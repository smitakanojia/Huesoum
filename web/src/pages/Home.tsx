import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t, currentUser, useStoreVersion, S, E } from '../state/store';
import { STAGES, AGENTIC_STAGES, TOOL_LABEL } from '../core/view';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import StageBar from '../components/StageBar';
import { Icon } from '../components/Logo';

const CREDIT =
  'Landsat 5 TM, 2011. False-colour composite (SWIR1, near-infrared, red). USGS / NASA, public domain. Illustrative imagery, not a SatQuery output.';
const QUERIES = [
  'Describe the land-cover and major objects visible in this image.',
  'Highlight the water body referred to in the query.',
  'What changed between these two dates, and where did the change occur?',
  'Use the optical and SAR images together to identify built-up and water-covered regions.',
  'Has the built-up area increased, decreased, or remained unchanged?',
];

function Fig({ src, alt, cap, extra = '' }: { src: string; alt: string; cap: React.ReactNode; extra?: string }) {
  return (
    <figure className={`fig ${extra}`}>
      <img src={src} alt={alt} />
      <figcaption>{cap}</figcaption>
    </figure>
  );
}

export default function Home() {
  useStoreVersion();
  const nav = useNavigate();
  const IMG = E.IMG;
  const h = S.hero;
  const tr = h ? h.job.result.trace : null;
  const fu = h ? h.job.result.fusion : null;
  const [swipe, setSwipe] = useState(50);
  const start = () => nav(currentUser() ? '/app' : '/login');
  const tryDomain = (id: string) => {
    S.intent = null;
    S.pendingDomain = id;
    nav(currentUser() ? '/app' : '/login');
  };

  return (
    <>
      <SiteHeader />
      <main id="main" className="home">
        {/* Hero */}
        <section className="hero" id="platform">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">SatQuery AI · {t('hero_eyebrow')}</p>
              <h1 className="display">{t('hero_title')}</h1>
              <p className="lead">{t('hero_lead')}</p>
              <div className="cta">
                <button className="btn btn-primary btn-lg" onClick={start}>
                  {t('hero_cta')}
                </button>
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Explore capabilities
                </button>
              </div>
            </div>
            <figure className="hero-fig">
              <div className="hero-frame">
                <img src={IMG.hero} alt="Satellite image of Bengaluru, India, with the dense urban core, lakes and surrounding farmland" />
                <i className="gridov" aria-hidden="true" />
                <span className="corner tl mono">Bengaluru region</span>
                <span className="corner br mono">Landsat 5 TM · 30 m</span>
                <div className="scalebar" style={{ width: '20.8%' }}>
                  <i />
                  <span className="mono">10 km</span>
                </div>
              </div>
              <figcaption>Bengaluru, Karnataka. {CREDIT}</figcaption>
            </figure>
          </div>
        </section>

        {/* About */}
        <section className="about" id="about">
          <div className="container about-grid">
            <div>
              <h2 className="h2">Built for the ISRO / SAC SatQuery AI problem statement.</h2>
              <p className="lead-sm">
                Remote-sensing AI is usually built for one task and assumes you know sensors, GIS workflows and model
                settings. A general vision-language model, without adaptation to remote-sensing imagery, cannot be
                trusted to answer specialised questions. SatQuery AI is an agent: it chooses and runs specialist tools,
                combines what they measure, and returns an answer that can be checked.
              </p>
              <p className="meta">SatQuery AI is a prototype for the problem statement. It is not an official ISRO product.</p>
            </div>
            <dl className="facts">
              <div>
                <dt>Inputs</dt>
                <dd>Single image · bi-temporal pair · multi-temporal series · co-registered optical and SAR pair, as GeoTIFF or TIFF</dd>
              </div>
              <div>
                <dt>Returns</dt>
                <dd>Answer · visual evidence · confidence · execution trace · report</dd>
              </div>
              <div>
                <dt>Demonstration scenes</dt>
                <dd>Synthetic, and labelled as synthetic wherever they appear</dd>
              </div>
            </dl>
          </div>
        </section>

        <div id="capabilities" />
        {/* Multimodal banner */}
        <section className="cap cap-banner" aria-labelledby="c1">
          <figure className="bleed">
            <img src={IMG.banner} alt="Wide satellite view of Bengaluru and its surrounding tanks and farmland" />
            <figcaption className="container">
              <span>Bengaluru and surroundings. {CREDIT}</span>
            </figcaption>
          </figure>
          <div className="container">
            <div className="cap-over">
              <h2 id="c1" className="h2">
                Multimodal Earth observation
              </h2>
              <p>
                SatQuery AI works on the imagery types the problem statement defines: a single optical, multispectral or
                SAR image; a bi-temporal pair of the same area from two dates; and a co-registered optical and SAR pair.
                Inputs are GeoTIFF or TIFF, so coordinates, pixel size and acquisition date travel with the data.
              </p>
              <ul className="pills">
                <li>Single image</li>
                <li>Bi-temporal pair</li>
                <li>Multi-temporal series</li>
                <li>Optical + SAR pair</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Natural-language queries */}
        <section className="cap" aria-labelledby="c2">
          <div className="container split">
            <div className="split-t">
              <h2 id="c2" className="h2">
                Natural-language queries
              </h2>
              <p>
                Questions are written in plain language. The controller interprets the query, classifies the task, and
                checks that the images supplied can answer it. If they cannot, it says what is missing instead of
                guessing.
              </p>
              <ul className="qlist">
                {QUERIES.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
              <p className="meta">Representative queries from the problem statement.</p>
            </div>
            <Fig src={IMG.queries} alt="Satellite image of the Hyderabad region with large reservoirs" cap={<>Hyderabad region. {CREDIT}</>} />
          </div>
        </section>

        {/* Single-image */}
        <section className="cap tint" aria-labelledby="c3">
          <div className="container split rev">
            <Fig src={IMG.single} alt="Satellite image of north-east Bengaluru with lakes and a green corridor" cap={<>North-east Bengaluru. {CREDIT}</>} />
            <div className="split-t">
              <h2 id="c3" className="h2">
                Single-image analysis
              </h2>
              <p>
                Visual question answering is the baseline. Text-guided region grounding returns a phrase as a region on
                the image, not only a sentence. Counting and locating questions go to an object detector, so a count is
                the number of boxes on the map, not an estimate.
              </p>
              <ul className="ruled">
                <li>
                  <b>Visual question answering</b>
                  <span>What is the main land cover in this image?</span>
                </li>
                <li>
                  <b>Region grounding</b>
                  <span>Highlight the water body referred to in the query.</span>
                </li>
                <li>
                  <b>Counting by detection</b>
                  <span>Every object counted is boxed on the map.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Bi-temporal swipe */}
        <section className="cap" aria-labelledby="c4">
          <div className="container">
            <div className="cap-head">
              <h2 id="c4" className="h2">
                Bi-temporal change detection
              </h2>
              <p>
                Two spatially corresponding images are ordered by acquisition date. The answer is written from measured
                facts, and the exact pixels that changed are drawn on the map, tied to the region the question refers to.
              </p>
            </div>
            {h && (
              <figure className="swipe">
                <div className="swipe-stage" style={{ ['--p' as any]: swipe + '%' }}>
                  <img src={h.frames[0].url} alt="Before image, T1" />
                  <img className="top" src={h.frames[1].url} alt="After image, T2" style={{ clipPath: `inset(0 0 0 ${swipe}%)` }} />
                  <span className="sl l mono">T1 · 2024-02-11</span>
                  <span className="sl r mono">T2 · 2025-02-08</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={swipe}
                  onChange={(e) => setSwipe(+e.target.value)}
                  aria-label="Slide between the before image on the left and the after image on the right"
                />
                <figcaption>
                  Synthetic scene, generated for this demonstration. Slide to compare the two dates. The lake has shrunk
                  and six new structures stand on the exposed shore.
                </figcaption>
              </figure>
            )}
          </div>
        </section>

        {/* Optical + SAR */}
        <section className="cap tint" aria-labelledby="c5">
          <div className="container">
            <div className="cap-head">
              <h2 id="c5" className="h2">
                Optical and SAR reasoning
              </h2>
              <p>
                Optical imagery carries spectral and contextual information but needs daylight and clear sky. SAR records
                structure and works at night and through cloud. When cloud covers the optical view, the answer switches
                to radar and reports how much of it came from radar alone. SAR water follows the tile-based Otsu method
                published by NRSC and is accepted only where HAND is 15 m or less, so radar shadow is not mistaken for
                water.
              </p>
            </div>
            {h && (
              <div className="pair">
                <Fig src={h.optical} alt="Synthetic optical image with cloud" cap="Optical, with cloud. Synthetic scene." />
                <Fig src={h.sar} alt="Synthetic SAR image of the same area" cap="SAR, same area. Synthetic scene." />
              </div>
            )}
          </div>
        </section>

        {/* Evidence grounding */}
        <section className="cap" aria-labelledby="c6">
          <div className="container">
            <div className="cap-head">
              <h2 id="c6" className="h2">
                Evidence grounding
              </h2>
              <p>
                Every claim is tied to something that can be pointed at: a mask, a box or a measured number. The language
                model’s own sentence is shown separately, as the model’s description.
              </p>
            </div>
            {h && (
              <figure className="wide-fig">
                <img src={h.grounded} alt="Grounded view: water lost is shaded, new buildings are boxed" />
                <figcaption>
                  Synthetic scene. Water lost since the first date is shaded; new buildings are boxed. The answer for
                  this run: {fu.answer}
                </figcaption>
              </figure>
            )}
          </div>
        </section>

        {/* Agentic orchestration */}
        <section className="cap tint" aria-labelledby="c7">
          <div className="container">
            <div className="cap-head">
              <h2 id="c7" className="h2">
                Agentic orchestration
              </h2>
              <p>
                The controller selects, sequences and runs specialist tools from a predefined registry, configuring only
                permitted parameters within their declared ranges. This is the process every query passes through, shown
                here as a continuous system rather than a fixed list of steps.
              </p>
            </div>
            <StageBar stages={AGENTIC_STAGES} ms={1500} />
            {tr && (
              <div className="agentic-real">
                <p className="eyebrow sp">As run for the synthetic lake-shore question</p>
                <ol className="plan-list">
                  {tr.plan.map((c: any) => (
                    <li key={c.step_id}>
                      <span className="mono">{c.step_id}</span>
                      <b>{TOOL_LABEL[c.tool] || c.tool}</b>
                      <span>{E.regOf(c.tool).blurb.split('.')[0]}.</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </section>

        {/* Confidence */}
        <section className="cap" aria-labelledby="c8">
          <div className="container split">
            <div className="split-t">
              <h2 id="c8" className="h2">
                Confidence and verification
              </h2>
              <p>
                Confidence is calculated, never self-reported by a model. When a conflict rule fires, the result is
                labelled Conflict, confidence is capped at 0.5, and the disagreement is listed for a person to review.
                The interface never implies certainty when the sources disagree.
              </p>
            </div>
            <div className="weights" aria-label="How confidence is weighted">
              {([
                ['Model score', 30],
                ['Agreement between sources', 30],
                ['Spatial fit', 25],
                ['Input quality', 15],
              ] as [string, number][]).map(([l, w]) => (
                <div key={l}>
                  <span>{l}</span>
                  <i style={{ width: w * 3 + '%' }} />
                  <b className="mono">{w}%</b>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Auditable trace */}
        <section className="cap tint" aria-labelledby="c9">
          <div className="container split rev">
            {tr && (
              <div className="doc">
                <p className="doc-h mono">trace.json · synthetic run</p>
                <dl>
                  <div>
                    <dt>task</dt>
                    <dd>{tr.task}</dd>
                  </div>
                  <div>
                    <dt>parsed_query</dt>
                    <dd>
                      target “{tr.parsed_query.target}” · place hint {tr.parsed_query.place_hint} · looking for{' '}
                      {tr.parsed_query.looking_for}
                    </dd>
                  </div>
                  <div>
                    <dt>adapter_id</dt>
                    <dd>{tr.adapter_id}</dd>
                  </div>
                </dl>
              </div>
            )}
            <div className="split-t">
              <h2 id="c9" className="h2">
                Auditable execution trace
              </h2>
              <p>
                Each run records the parsed query, the sensor profile, the plan, every step with its tool, model
                identifier and parameters, anything skipped, the adapter identifier and version information. Out-of-range
                parameters are clamped, and the clamp is written down.
              </p>
            </div>
          </div>
        </section>

        {/* Fields of application */}
        <section className="fields" id="fields">
          <div className="container">
            <div className="sec-head">
              <div>
                <h2 className="h2">Fields of application</h2>
                <p className="lead-sm">
                  Start from a question a field asks. The field is saved with each run and printed in the report.
                </p>
              </div>
            </div>
          </div>
          <div className="track" tabIndex={0} aria-label="Fields of application. Scroll sideways.">
            {E.DOMAINS.map((d: any) => (
              <article className="field-col" key={d.id}>
                {IMG['field_' + d.id] && <img src={IMG['field_' + d.id]} alt="" />}
                {d.src === 'isro' && <span className="field-badge">ISRO priority</span>}
                <div className="field-col-in">
                  <h3>{d.name}</h3>
                  <p>{d.blurb}</p>
                  {d.note && <p className="note-t">{d.note}</p>}
                  <p className="fq">{d.sug[0].q}</p>
                  <button type="button" className="link" onClick={() => tryDomain(d.id)}>
                    Open in the workspace →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Methodology */}
        <section className="method" id="methodology">
          <div className="container">
            <h2 className="h2">Methodology</h2>
            <p className="lead-sm">
              Every run passes through the same observable stages, in the same order, whether it takes half a second in
              demonstration mode or several minutes against live models.
            </p>
            <StageBar stages={STAGES} ms={1700} />
            <div className="cols3">
              <div>
                <h3>Sensor-aware ingest</h3>
                <p>Reads GeoTIFF metadata, identifies the sensor, checks that pairs match, and aligns them to one grid.</p>
              </div>
              <div>
                <h3>Agentic controller</h3>
                <p>Parses the question, plans the steps, validates parameters, runs, retries or falls back, and records everything.</p>
              </div>
              <div>
                <h3>Evidence fusion</h3>
                <p>Cross-checks the tools, calculates confidence, and flags conflicts before anything is said.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="close">
          <div className="container">
            <h2 className="h2">Try it on a synthetic scene.</h2>
            <p className="lead-sm">
              No upload is needed. Choose a demonstration scene, read the answer, inspect the map, export the report.
            </p>
            <button className="btn btn-primary btn-lg" onClick={start}>
              <Icon name="console" /> Open Analysis Workspace
            </button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
