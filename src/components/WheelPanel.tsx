import { CircleHelp, Radio, RefreshCw } from 'lucide-react';
import { hasBoost, wheelKind, type useSqueek, type WheelKind } from '../telemetry';
const LABELS: Record<WheelKind,string> = { loading: 'Connecting to Squeektoshi', unavailable: 'Connection unavailable', stale: 'Reading is stale', simulated: 'Simulated reading', replay: 'Replayed reading', derived: 'Derived reading', fault: 'Wheel sensor fault', active: 'Squeektoshi is running!', idle: 'Squeektoshi is taking a breather' };
export function WheelPanel({ api, now, onHelp }: { api: ReturnType<typeof useSqueek>; now: number; onHelp: () => void }) {
  const kind = wheelKind(api.status,api.error,now), m = api.status?.measurement;
  const boosted = hasBoost(api.status,api.error,now);
  const waiting = Math.max(0,Math.ceil((api.nextAt - now)/1000));
  return <section className="wheel-panel" aria-labelledby="wheel-heading">
    <div className="section-top"><h2 id="wheel-heading"><Radio size={16} /> The real little runner</h2><button className="icon-button small" onClick={onHelp} aria-label="About the real wheel connection"><CircleHelp size={17} /></button></div>
    <div className="wheel-reading"><div className={`telemetry-wheel ${kind === 'active' ? 'spinning' : ''}`} aria-hidden="true"><div className="wheel-spokes" /><span /></div><div><p className={`wheel-state ${kind === 'active' || kind === 'idle' ? 'verified' : ''}`}><i />{kind === 'loading' ? 'Connecting' : kind === 'idle' || kind === 'active' ? 'Hardware · fresh' : kind === 'unavailable' ? 'Unavailable' : kind === 'stale' ? `${m?.provenance ?? 'Unknown'} · stale` : kind === 'fault' ? 'Hardware · sensor fault' : `${kind[0].toUpperCase()}${kind.slice(1)} · no boosts`}</p><div className="rpm-value">{m ? (m.rpmMilli/1000).toLocaleString(undefined,{ maximumFractionDigits: 2 }) : '—'} <span>RPM{kind === 'unavailable' || kind === 'stale' ? ' · last known' : ''}</span></div></div></div>
    <p className="wheel-description">{LABELS[kind]}</p>
    <dl className="telemetry-details"><div><dt>Distance today</dt><dd>{m ? `${(m.distanceMm/1000000).toLocaleString(undefined,{ maximumFractionDigits: 3 })} km` : 'Unknown'}</dd></div><div><dt>Measured</dt><dd>{m ? <time dateTime={m.observedAt} title={new Date(m.observedAt).toISOString()}>{new Date(m.observedAt).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</time> : 'Awaiting a reading'}</dd></div></dl>
    <p className={`boost-note ${boosted ? 'is-boosted' : ''}`}>{boosted ? 'Wheel breeze is here: +50% care XP and +25% runner score.' : 'When the real wheel runs, your little world gets a boost.'}</p>
    {api.error && <div className="connection-error"><p>{api.error}</p><button className="text-button" disabled={waiting > 0 || api.checking} onClick={api.retry}><RefreshCw size={14} />{api.checking ? 'Checking…' : waiting ? `Auto-retry in ${waiting}s` : 'Try connection again'}</button></div>}
    <a className="source-link" href="https://docs.squeekchain.com/developers/api/" target="_blank" rel="noreferrer">From the Squeekchain public API <span aria-hidden="true">↗</span></a>
  </section>;
}
