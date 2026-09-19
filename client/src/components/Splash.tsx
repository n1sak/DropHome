import { useApp } from '../store/store';

export function Splash() {
  const booting = useApp((s) => s.booting);
  if (!booting) return null;
  const pct = booting.total ? Math.round((booting.done / booting.total) * 100) : 8;
  return (
    <div className="splash" role="status">
      <svg viewBox="0 0 64 64" width="72" height="72" aria-hidden="true">
        <path d="M8 30 32 8l24 22" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 28v26h34V28" fill="var(--lamp)" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
        <path d="M27 54V40h10v14" fill="var(--panel)" stroke="currentColor" strokeWidth="3.500" strokeLinejoin="round" />
      </svg>
      <h1>Roomy</h1>
      <p>{booting.step}{booting.total ? ` · ${booting.done} of ${booting.total}` : '…'}</p>
      <div className="splash-bar">
        <i style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
