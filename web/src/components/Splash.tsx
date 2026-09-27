import Logo from './Logo';

// Lightweight boot splash shown while imagery warms and the core is probed.
export default function Splash() {
  return (
    <main className="boot" aria-label="Loading SatQuery AI">
      <div className="boot-in">
        <Logo size={56} />
        <h1 className="boot-title">
          <b>SatQuery</b> AI
        </h1>
        <p className="boot-sub">Interactive vision-language assistant for multimodal remote sensing</p>
        <div className="boot-bar" role="progressbar" aria-label="Loading" aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: '100%', animation: 'none' }} />
        </div>
        <p className="boot-foot">
          Prototype for the ISRO / SAC SatQuery AI problem statement. Demonstration scenes are synthetic.
        </p>
      </div>
    </main>
  );
}
