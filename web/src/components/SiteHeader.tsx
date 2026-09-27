import { Link, useNavigate } from 'react-router-dom';
import { t, getLang, setLang, currentUser, E } from '../state/store';
import Logo, { Icon } from './Logo';

function jump(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: E.REDUCED ? 'auto' : 'smooth', block: 'start' });
}

// Landing-page header: a compact government/scientific portal bar over a clean
// nav. Includes the language switch and the primary "Open analysis" action.
export default function SiteHeader() {
  const nav = useNavigate();
  const l = getLang() || 'en';
  const user = currentUser();
  const openAnalysis = () => nav(user ? '/app' : '/login');
  return (
    <>
      <div className="gov-bar">
        <div className="container gov-bar-in">
          <span>
            {E.DICT.en.brand_tag} · {E.DICT.en.dept_tag}
          </span>
          <span className="mono">{l === 'hi' ? 'भारत सरकार' : 'Government of India'}</span>
        </div>
      </div>
      <header className="site-nav">
        <div className="container nav-in">
          <Link className="brand" to="/" aria-label="SatQuery AI home">
            <Logo size={26} />
            <span className="wm">
              <b>SatQuery</b> AI
            </span>
          </Link>
          <nav aria-label="Primary" className="nav-links">
            <button type="button" className="link-nav" onClick={() => jump('platform')}>
              {t('nav_platform')}
            </button>
            <button type="button" className="link-nav" onClick={() => jump('capabilities')}>
              {t('nav_capabilities')}
            </button>
            <button type="button" className="link-nav" onClick={() => jump('methodology')}>
              {t('nav_methodology')}
            </button>
            <button type="button" className="link-nav" onClick={() => jump('about')}>
              {t('nav_about')}
            </button>
          </nav>
          <div className="nav-r">
            <button
              type="button"
              className="lang-switch"
              onClick={() => setLang(l === 'hi' ? 'en' : 'hi')}
              aria-label="Change language"
            >
              <Icon name="globe" />
              <span>{l === 'hi' ? 'हिं' : 'EN'}</span>
            </button>
            {!user && (
              <Link className="link" to="/login">
                {t('sign_in')}
              </Link>
            )}
            <button type="button" className="btn btn-primary btn-sm" onClick={openAnalysis}>
              {t('open_analysis')}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
