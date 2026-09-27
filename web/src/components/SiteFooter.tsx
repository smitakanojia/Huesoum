import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="container foot-grid">
        <div>
          <Link className="brand" to="/">
            <Logo size={26} />
            <span className="wm">
              <b>SatQuery</b> AI
            </span>
          </Link>
          <p className="meta">Built for the ISRO / SAC SatQuery AI problem statement. Not an official ISRO product.</p>
        </div>
        <p className="meta">
          Data contract 1.0 · Demonstration scenes are synthetic · Satellite imagery: Landsat 5 TM (USGS / NASA,
          public domain), processed for this page. See assets/MANIFEST.md.
        </p>
      </div>
    </footer>
  );
}
