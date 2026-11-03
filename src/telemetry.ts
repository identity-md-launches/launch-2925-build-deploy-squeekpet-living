import { useEffect, useRef, useState } from 'react';
import type { Pet } from './game';

export const API = 'https://api.squeekchain.com';
export type Measurement = {
  freshness: 'online' | 'stale'; observedAt: string; receivedAt: string; staleAfterSeconds: number;
  provenance: 'hardware' | 'simulated' | 'replay' | 'derived'; coreStatus: 'IDLE' | 'ACTIVE' | 'COUNTER_FAULT';
  rpmMilli: number; distanceMm: number;
};
export type Status = { schemaVersion: number; installationId: string; measurement: Measurement | null };
export type WheelEvent = { id: string; type: string; occurredAt: string; source: {
  kind: string; installationId?: string; observedAt?: string; receivedAt?: string; disposition?: string;
}; payload: Record<string, unknown> };
export type Events = { schemaVersion: number; installationId: string; status: 'available'; events: WheelEvent[] };
export type WheelKind = 'loading' | 'unavailable' | 'stale' | 'simulated' | 'replay' | 'derived' | 'fault' | 'active' | 'idle';
const dateOK = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v));
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';
export function parseStatus(value: unknown): Status {
  if (!record(value) || value.schemaVersion !== 1 || typeof value.installationId !== 'string' || !('measurement' in value)) throw new Error('The wheel returned an unsupported response.');
  if (value.measurement === null) return value as Status;
  const m = value.measurement;
  if (!record(m) || !['online','stale'].includes(String(m.freshness)) || !['hardware','simulated','replay','derived'].includes(String(m.provenance))
    || !['IDLE','ACTIVE','COUNTER_FAULT'].includes(String(m.coreStatus)) || !dateOK(m.observedAt) || !dateOK(m.receivedAt)
    || !Number.isInteger(m.rpmMilli) || Number(m.rpmMilli) < 0 || !Number.isInteger(m.distanceMm) || Number(m.distanceMm) < 0
    || !Number.isFinite(m.staleAfterSeconds) || Number(m.staleAfterSeconds) <= 0) throw new Error('Wheel measurement is incomplete. No boost is active.');
  return value as Status;
}
export function parseEvents(value: unknown): Events {
  if (!record(value) || value.schemaVersion !== 3 || value.status !== 'available' || typeof value.installationId !== 'string' || !Array.isArray(value.events)) throw new Error(record(value) && value.status === 'unavailable' ? 'The event feed is unavailable. Your collection is safe.' : 'The event feed returned an unsupported response.');
  if (!value.events.every(e => record(e) && typeof e.id === 'string' && typeof e.type === 'string' && dateOK(e.occurredAt) && record(e.source) && typeof e.source.kind === 'string' && record(e.payload))) throw new Error('The event feed could not be read.');
  return value as Events;
}
export function wheelKind(status: Status | null, error: string | null, now: number): WheelKind {
  if (error) return 'unavailable';
  if (!status) return 'loading';
  const m = status.measurement;
  if (!m) return 'unavailable';
  // Both device and receipt clocks must still be fresh. Future clocks never enable rewards.
  const observed = now - Date.parse(m.observedAt), received = now - Date.parse(m.receivedAt);
  if (m.freshness !== 'online' || observed > m.staleAfterSeconds * 1000 || received > m.staleAfterSeconds * 1000 || observed < -5000 || received < -5000) return 'stale';
  if (m.provenance !== 'hardware') return m.provenance;
  if (m.coreStatus === 'COUNTER_FAULT') return 'fault';
  return m.coreStatus === 'ACTIVE' && m.rpmMilli > 0 ? 'active' : 'idle';
}
export function hasBoost(status: Status | null, error: string | null, now: number) {
  return wheelKind(status,error,now) === 'active' && now - Date.parse(status!.measurement!.observedAt) <= 60000;
}
export const EVENT_NAMES: Record<string,string> = {
  'measurement.distance_milestone': 'Little miles, big memories',
  'measurement.daily_distance_milestone': 'A day of tiny footsteps',
  'measurement.speed_milestone': 'A burst of hamster energy',
  'measurement.speed_record': 'Faster than yesterday',
  'measurement.distance_streak': 'Showing up, day after day',
};
export function collectMemories(p: Pet, status: Status | null, error: string | null, feed: Events | null, sessionStarted: number, now: number): Pet {
  if (!feed || !hasBoost(status,error,now) || feed.installationId !== status!.installationId) return p;
  const m = status!.measurement!;
  const processed = new Set(p.processedEventIds), memories = [...p.memories];
  for (const e of feed.events) {
    const at = Date.parse(e.occurredAt), observed = Date.parse(e.source.observedAt ?? ''), received = Date.parse(e.source.receivedAt ?? '');
    if (processed.has(e.id) || !EVENT_NAMES[e.type] || e.source.kind !== 'measurement' || e.source.disposition !== 'accepted'
      || e.source.installationId !== status!.installationId || at < Math.max(p.adoptedAt,sessionStarted)
      || at > now + 5000 || now - at > 120000 || !Number.isFinite(observed) || !Number.isFinite(received)
      || Math.abs(observed - Date.parse(m.observedAt)) > 120000 || Math.abs(observed - at) > 5000 || now - received > 120000 || received > now + 5000) continue;
    processed.add(e.id);
    memories.push({ id: e.id, type: e.type, occurredAt: e.occurredAt, rpm: m.rpmMilli / 1000, installationId: status!.installationId });
  }
  return memories.length === p.memories.length ? p : { ...p, memories, processedEventIds: [...processed] };
}

class ApiError extends Error { constructor(message: string, public delay = 0) { super(message); } }
export function retryDelay(value: string | null, now: number) {
  if (!value) return 0;
  const n = Number(value);
  return Math.max(0, Number.isFinite(n) ? n * 1000 : Date.parse(value) - now) || 0;
}
async function request<T>(path: string, parse: (v: unknown) => T, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${API}${path}`, { signal, cache: 'no-cache', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new ApiError(response.status === 429 ? 'The wheel API is busy. Waiting before trying again.' : `Wheel connection unavailable (HTTP ${response.status}).`, retryDelay(response.headers.get('Retry-After'),Date.now()));
  return parse(await response.json());
}
export function useSqueek() {
  const [status,setStatus] = useState<Status | null>(null), [events,setEvents] = useState<Events | null>(null);
  const [error,setError] = useState<string | null>(null), [eventsError,setEventsError] = useState<string | null>(null);
  const [nextAt,setNextAt] = useState(0), [checking,setChecking] = useState(true);
  const retry = useRef<() => void>(() => {});
  useEffect(() => {
    let stopped = false, blockedUntil = 0;
    const controllers = new Set<AbortController>();
    const jobs = [
      { path: '/v1/status', interval: 10000, due: 0, failures: 0, busy: false, run: async (signal: AbortSignal) => { const value = await request('/v1/status',parseStatus,signal); if (!stopped) { setStatus(value); setError(null); } }, fail: setError },
      { path: '/v1/events?category=measurement&limit=40', interval: 30000, due: 0, failures: 0, busy: false, run: async (signal: AbortSignal) => { const value = await request('/v1/events?category=measurement&limit=40',parseEvents,signal); if (!stopped) { setEvents(value); setEventsError(null); } }, fail: setEventsError },
    ];
    async function poll() {
      if (stopped || document.hidden || !navigator.onLine || Date.now() < blockedUntil) return;
      for (const job of jobs) {
        if (Date.now() < blockedUntil) break;
        if (job.busy || Date.now() < job.due) continue;
        job.busy = true;
        const controller = new AbortController(); controllers.add(controller);
        const timeout = window.setTimeout(() => controller.abort(),10000);
        if (job.path === '/v1/status') setChecking(true);
        try { await job.run(controller.signal); job.failures = 0; job.due = Date.now() + job.interval; }
        catch (e) {
          if (!stopped) {
            job.fail(e instanceof ApiError ? e.message : e instanceof Error && e.name !== 'AbortError' && e.message !== 'Failed to fetch' ? e.message : 'Cannot reach Squeektoshi right now. Pet care still works.');
            job.failures++;
            const delay = Math.max(job.interval,Math.min(300000,10000 * 2 ** Math.min(job.failures,5)),e instanceof ApiError ? e.delay : 0);
            job.due = Date.now() + delay;
            if (e instanceof ApiError) blockedUntil = Math.max(blockedUntil,job.due);
          }
        } finally {
          clearTimeout(timeout); controllers.delete(controller); job.busy = false;
          if (!stopped && job.path === '/v1/status') { setChecking(false); setNextAt(Math.max(job.due,blockedUntil)); }
        }
      }
    }
    retry.current = () => { if (Date.now() >= Math.max(jobs[0].due,blockedUntil)) void poll(); };
    const offline=()=>{setError('You’re offline. Pet care still works.');setChecking(false);controllers.forEach(c=>c.abort());};
    const timer = window.setInterval(() => void poll(),1000);
    document.addEventListener('visibilitychange',poll); window.addEventListener('online',poll);window.addEventListener('offline',offline);
    if(navigator.onLine)void poll();else offline();
    return () => { stopped = true; clearInterval(timer); controllers.forEach(c => c.abort()); document.removeEventListener('visibilitychange',poll); window.removeEventListener('online',poll);window.removeEventListener('offline',offline); };
  },[]);
  return { status, events, error, eventsError, checking, nextAt, retry: () => retry.current() };
}
