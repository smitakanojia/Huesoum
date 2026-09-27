import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { t, currentUser, signOut, runMode, health, useStoreVersion } from '../state/store';
import { NAV } from '../core/view';
import Logo from './Logo';

// Authenticated application shell: compact nav, run-mode status, footer.
export default function AppShell() {
  useStoreVersion();
  const nav = useNavigate();
  const user = currentUser() || { name: 'Guest' };
  const live = runMode() === 'live';
  const h = health() || {};
  return (
    <div className="app">
      <a className="skip" href="#view">
        Skip to content
      </a>
      <header className="app-nav">
        <div className="container app-nav-in">
          <Link className="brand" to="/" aria-label="SatQuery AI home">
            <Logo size={28} />
            <span className="wm">
              <b>SatQuery</b> AI
            </span>
          </Link>
          <nav aria-label="Application">
            {NAV.map(([slug, label]) => (
              <NavLink
                key={slug || 'console'}
                to={slug ? `/app/${slug}` : '/app'}
                end={!slug}
                className={({ isActive }) => (isActive ? 'on' : '')}
              >
                {t(label)}
              </NavLink>
            ))}
          </nav>
          <div className="app-nav-r">
            <span className={`core ${live ? 'live' : 'demo'}`} role="status">
              <i />
              <span>
                {live ? 'Core online' : 'Demonstration core'}
                <small>
                  {(h.run_mode || 'fake')} mode · contract {h.contract_version || '1.0'}
                </small>
              </span>
            </span>
            <span className="who">{user.name}</span>
            <button
              type="button"
              className="link"
              onClick={() => {
                signOut();
                nav('/');
              }}
            >
              {t('sign_out')}
            </button>
          </div>
        </div>
      </header>
      <main id="main" className="app-main">
        <div className="container" id="view" tabIndex={-1}>
          <Outlet />
        </div>
      </main>
      <footer className="app-foot">
        <div className="container">
          <span>SatQuery AI · built for the ISRO / SAC SatQuery AI problem statement</span>
          <span>
            {live ? 'Live analysis core' : 'Demonstration data is synthetic'} · data contract{' '}
            {h.contract_version || '1.0'}
          </span>
        </div>
      </footer>
    </div>
  );
}
