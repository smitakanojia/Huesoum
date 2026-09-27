import { useEffect, useRef } from 'react';
import { E } from '../state/store';
import { TOOL_LABEL } from '../core/view';

export type ReceiptData = {
  job: any;
  step: string;
  label: string;
  value: string;
  unit: string;
  x: number;
  y: number;
};

// "Where did this number come from?" — the provenance receipt. Anchored to the
// clicked value, it names the tool, model, output and settings, and links to the
// step in the audit trace.
export default function Receipt({ data, onClose, onTrace }: { data: ReceiptData; onClose: () => void; onTrace: (step: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const tr = data.job.result.trace;
  const step = tr.steps.find((s: any) => s.step_id === data.step);
  const source = step ? TOOL_LABEL[step.tool] || step.tool : 'Evidence fusion';
  const model = step ? step.model_id : 'measured facts combined across steps';
  const output = step ? step.summary : `${data.label}: ${data.value} ${data.unit}`;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener('click', h), 0);
    return () => document.removeEventListener('click', h);
  }, [onClose]);

  const pw = 264;
  let left = data.x;
  if (left + pw + 12 > window.innerWidth) left = window.innerWidth - pw - 12;
  if (left < 8) left = 8;

  return (
    <div
      className="receipt-pop"
      ref={ref}
      role="dialog"
      aria-label="Where this number came from"
      style={{ left, top: data.y + 8, width: pw }}
    >
      <button type="button" className="receipt-close" aria-label="Close" onClick={onClose} dangerouslySetInnerHTML={{ __html: E.ic('x') }} />
      <h4>Source</h4>
      <dl>
        <div>
          <dt>Tool</dt>
          <dd>{source}</dd>
        </div>
        <div>
          <dt>Model</dt>
          <dd className="mono">{model}</dd>
        </div>
        <div>
          <dt>Output</dt>
          <dd>{output}</dd>
        </div>
      </dl>
      {step && (
        <button type="button" className="link" onClick={() => onTrace(data.step)}>
          View this step in the audit trace →
        </button>
      )}
    </div>
  );
}
