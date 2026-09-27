import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, E } from '../state/store';
import Logo from './../components/Logo';

const CREDIT =
  'Landsat 5 TM, 2011. False-colour composite (SWIR1, near-infrared, red). USGS / NASA, public domain.';

// Clean, category-free sign in (P3 brief). Accounts are client-side only, since the
// API in F3.6 has no account server; guests are allowed too.
export default function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const su = mode === 'signup';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = /^\S+@\S+\.\S+$/.test(email);
    if (su && !name.trim()) return setErr('Enter your name.');
    if (!valid) return setErr('Enter a valid email address.');
    if (su && pw.length < 8) return setErr('Use at least 8 characters.');
    if (!su && !pw) return setErr('Enter your password.');
    signIn(name.trim() || email.split('@')[0], email.toLowerCase());
    nav('/app');
  };
  const guest = () => {
    signIn('Guest', 'guest@local');
    nav('/app');
  };

  return (
    <main className="auth" id="main">
      <figure className="auth-img">
        <img
          src={E.IMG.login}
          alt="Satellite image of Hyderabad, India, with the heart-shaped Hussain Sagar lake in the city centre"
        />
        <figcaption>Hyderabad, Telangana. {CREDIT}</figcaption>
      </figure>
      <section className="auth-main">
        <div className="auth-box">
          <Link className="brand" to="/" aria-label="Back to the home page">
            <Logo size={34} />
            <span className="wm">
              <b>SatQuery</b> AI
            </span>
          </Link>
          <h1 className="h1">{su ? 'Create an account' : 'Welcome'}</h1>
          <p className="lead-sm">
            {su ? 'Your details stay in this browser.' : 'Sign in to continue to Earth Observation Analysis.'}
          </p>
          <form className="form" noValidate onSubmit={submit}>
            {su && (
              <div className="f">
                <label htmlFor="name">Full name</label>
                <input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div className="f">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="f">
              <label htmlFor="pw">Password</label>
              <input
                id="pw"
                type="password"
                autoComplete={su ? 'new-password' : 'current-password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
              {su && <small>At least 8 characters.</small>}
            </div>
            {err && (
              <p className="err" role="alert">
                {err}
              </p>
            )}
            <button type="submit" className="btn btn-primary btn-lg block">
              {su ? 'Create account' : 'Sign in'}
            </button>
          </form>
          <p className="auth-alt">
            {su ? 'Already have an account?' : 'New here?'}{' '}
            <button type="button" className="link" onClick={() => { setMode(su ? 'signin' : 'signup'); setErr(''); }}>
              {su ? 'Sign in' : 'Create an account'}
            </button>{' '}
            ·{' '}
            <button type="button" className="link" onClick={guest}>
              Continue as guest
            </button>
          </p>
          <p className="auth-foot meta">
            SatQuery AI · prototype · data contract 1.0. This prototype has no account server.
          </p>
        </div>
      </section>
    </main>
  );
}
