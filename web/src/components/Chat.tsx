import { useState } from 'react';
import { Icon } from './Logo';

// Continue-the-same-chat: the conversation thread for the current imagery. Each
// answered turn is shown; a follow-up reuses the uploaded images and inherits the
// previous turn's target/place when the new question leaves them out.
export default function Chat({
  turns,
  onSend,
}: {
  turns: { question: string; answer: string; label: string }[];
  onSend: (q: string) => void;
}) {
  const [q, setQ] = useState('');
  const send = () => {
    const text = q.trim();
    if (!text) return;
    onSend(text);
    setQ('');
  };
  return (
    <section className="chat" aria-label="Follow-up conversation">
      <div className="chat-head">
        <h2 className="h3" style={{ margin: 0 }}>
          Continue this analysis
        </h2>
        <p className="fine" style={{ margin: 0 }}>
          Ask a follow-up about the same imagery. The system keeps your uploaded images and carries over the object and
          place from the previous question when you don't repeat them.
        </p>
      </div>
      {turns.length > 1 && (
        <ol className="chat-thread">
          {turns.map((tn, i) => (
            <li key={i} className="chat-turn">
              <p className="chat-q">
                <span className="chat-badge">Turn {i + 1}</span>
                {tn.question}
              </p>
              <p className="chat-a">
                {tn.answer} <span className={`res-tag ${(tn.label || '').toLowerCase()}`}>{tn.label}</span>
              </p>
            </li>
          ))}
        </ol>
      )}
      <div className="chat-input">
        <textarea
          rows={2}
          value={q}
          placeholder="For example: What about just the northern side?"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
          }}
          aria-label="Follow-up question"
        />
        <button type="button" className="btn btn-primary" onClick={send} disabled={!q.trim()}>
          <Icon name="right" />
          Ask follow-up
        </button>
      </div>
    </section>
  );
}
