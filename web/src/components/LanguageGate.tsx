import { setLang, E } from '../state/store';
import Logo from './Logo';

// The very first screen on a first visit (reference image 1). White institutional
// card over a subtle navy field. The choice persists (localStorage) and drives the
// whole UI and the language of the generated PDF report.
export default function LanguageGate({ onPick }: { onPick: (l: 'en' | 'hi') => void }) {
  const pick = (l: 'en' | 'hi') => {
    setLang(l);
    onPick(l);
  };
  const D = E.DICT.en;
  return (
    <main className="langgate" aria-label="Choose language">
      <div className="lg-bar">
        <div className="container">
          <span className="lg-tag">{D.brand_tag}</span>
          <span className="lg-dot">·</span>
          <span className="lg-tag">{D.dept_tag}</span>
        </div>
      </div>
      <div className="lg-card">
        <div className="lg-head">
          <Logo size={32} />
          <div>
            <p className="lg-hi">भारतीय अंतरिक्ष अनुसंधान संगठन</p>
            <p className="lg-en">SATQUERY AI · Indian Space Research Organisation</p>
          </div>
        </div>
        <h1 className="lg-title">
          भाषा चुनें <span>/</span> Choose your language
        </h1>
        <div className="lg-opts">
          <button type="button" className="lg-opt" onClick={() => pick('hi')}>
            <b>हिंदी</b>
            <span>स्वागत है</span>
          </button>
          <button type="button" className="lg-opt" onClick={() => pick('en')}>
            <b>English</b>
            <span>Welcome</span>
          </button>
        </div>
        <p className="lg-note">
          यह चयन पूरी वेबसाइट और डाउनलोड की गई रिपोर्ट पर लागू होता है। This choice applies across the site and any
          report you download. You can change it later from the header.
        </p>
      </div>
    </main>
  );
}
