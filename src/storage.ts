import type { Pet } from './game';

let db: Promise<IDBDatabase> | undefined;
function open() {
  return db ??= new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open('squeekpet-living-evolution', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('progress');
    r.onsuccess = () => { r.result.onversionchange = () => r.result.close(); resolve(r.result); };
    r.onerror = () => { db = undefined; reject(r.error); };
    r.onblocked = () => { db = undefined; reject(new Error('Please close older SqueekPet tabs and reload.')); };
  });
}
export function validPet(value: unknown): value is Pet {
  if (!value || typeof value !== 'object') return false;
  const p = value as Pet;
  return p.version === 1 && typeof p.name === 'string' && p.name.trim().length > 0 && p.name.length <= 20 && ['honey','snow','cocoa'].includes(p.coat)
    && Number.isFinite(p.adoptedAt) && Number.isFinite(p.updatedAt)
    && ['hunger','happiness','energy','cleanliness'].every(k => Number.isFinite(p.stats?.[k as keyof Pet['stats']]) && p.stats[k as keyof Pet['stats']] >= 0 && p.stats[k as keyof Pet['stats']] <= 100)
    && Number.isFinite(p.xp) && p.xp >= 0 && Number.isFinite(p.acorns) && p.acorns >= 0
    && typeof p.sleeping === 'boolean' && !!p.cooldowns && !!p.counts && !!p.inventory
    && Array.isArray(p.equipped) && Array.isArray(p.memories) && Array.isArray(p.processedEventIds)
    && !!p.runner && Number.isFinite(p.runner.best) && Number.isFinite(p.runner.runs) && Number.isFinite(p.runner.earnedToday);
}
export async function loadPet(): Promise<Pet | null> {
  const database = await open();
  const value = await new Promise<unknown>((resolve,reject) => {
    const r = database.transaction('progress').objectStore('progress').get('pet');
    r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
  });
  if (value == null) return null;
  if (!validPet(value)) throw new Error('This saved pet could not be read. Export your browser data before resetting it.');
  return value;
}
export async function savePet(pet: Pet): Promise<void> {
  const database = await open();
  return new Promise((resolve,reject) => {
    const tx = database.transaction('progress','readwrite');
    tx.objectStore('progress').put(pet,'pet');
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
  });
}
