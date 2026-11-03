export type Coat = 'honey' | 'snow' | 'cocoa';
export type Action = 'feed' | 'play' | 'sleep' | 'clean' | 'exercise';
export type Stats = { hunger: number; happiness: number; energy: number; cleanliness: number };
export type Memory = { id: string; type: string; occurredAt: string; rpm: number; installationId: string };
export type Pet = {
  version: 1; name: string; coat: Coat; adoptedAt: number; updatedAt: number;
  stats: Stats; xp: number; acorns: number; sleeping: boolean;
  cooldowns: Partial<Record<Action, number>>; counts: Record<Action, number>;
  inventory: Record<string, number>; equipped: string[];
  memories: Memory[]; processedEventIds: string[];
  runner: { best: number; runs: number; seeds: number; rewardDay: string; earnedToday: number };
};
export const COATS: { id: Coat; label: string; color: string }[] = [
  { id: 'honey', label: 'Honey', color: '#d8a15b' },
  { id: 'snow', label: 'Snow', color: '#e8e5d9' },
  { id: 'cocoa', label: 'Cocoa', color: '#9b7462' },
];
export const ACTIONS: { id: Action; label: string; cooldown: number; xp: number; reward: number; description: string }[] = [
  { id: 'feed', label: 'Feed', cooldown: 8, xp: 12, reward: 3, description: '+22 fullness · free seeds' },
  { id: 'play', label: 'Play', cooldown: 15, xp: 15, reward: 5, description: '+20 happiness · −10 energy' },
  { id: 'sleep', label: 'Sleep', cooldown: 5, xp: 0, reward: 0, description: '+2 energy per minute of rest' },
  { id: 'clean', label: 'Clean', cooldown: 20, xp: 12, reward: 3, description: '+40 cleanliness · −3 energy' },
  { id: 'exercise', label: 'Exercise', cooldown: 25, xp: 20, reward: 7, description: '+12 happiness · −12 energy' },
];
export const ITEMS = [
  { id: 'carrot', name: 'Crunchy carrot', price: 6, type: 'food', description: '+35 fullness, +5 happiness', icon: 'carrot' },
  { id: 'berry', name: 'Berry picnic', price: 10, type: 'food', description: '+25 fullness, +15 happiness', icon: 'berry' },
  { id: 'sunflower', name: 'Sunflower mix', price: 8, type: 'food', description: '+30 fullness, +8 energy', icon: 'seed' },
  { id: 'fern', name: 'Fern friend', price: 25, type: 'decor', description: 'A leafy little corner companion.', icon: 'plant' },
  { id: 'garland', name: 'Star garland', price: 35, type: 'decor', description: 'A sprinkle of stars above the bed.', icon: 'star' },
  { id: 'rug', name: 'Berry patch rug', price: 40, type: 'decor', description: 'Soft paws deserve a softer landing.', icon: 'rug' },
  { id: 'lamp', name: 'Mushroom lamp', price: 50, type: 'decor', description: 'The coziest glow after sunset.', icon: 'mushroom' },
] as const;
export const STAGES = [
  { name: 'Little sprout', memories: 0, level: 1, description: 'Every friendship starts with a little care.' },
  { name: 'Clover companion', memories: 3, level: 3, description: 'A tiny clover grows between those ears.' },
  { name: 'Starlight explorer', memories: 8, level: 6, description: 'A starry scarf for a world of adventures.' },
];
export const levelOf = (p: Pet) => 1 + Math.floor(p.xp / 100);
export const stageOf = (p: Pet) => STAGES.reduce((s, rule, i) => p.memories.length >= rule.memories && levelOf(p) >= rule.level ? i : s, 0);
export const localDay = (now: number) => new Date(now).toLocaleDateString('en-CA');
export function adopt(name: string, coat: Coat, now = Date.now()): Pet {
  return {
    version: 1, name: name.trim(), coat, adoptedAt: now, updatedAt: now,
    stats: { hunger: 75, happiness: 80, energy: 85, cleanliness: 90 },
    xp: 0, acorns: 30, sleeping: false, cooldowns: {},
    counts: { feed: 0, play: 0, sleep: 0, clean: 0, exercise: 0 },
    inventory: {}, equipped: [], memories: [], processedEventIds: [],
    runner: { best: 0, runs: 0, seeds: 0, rewardDay: localDay(now), earnedToday: 0 },
  };
}
const clamp = (v: number) => Math.max(0, Math.min(100, v));
export function advance(p: Pet, now = Date.now()): Pet {
  const minutes = Math.min(4320, Math.max(0, now - p.updatedAt) / 60000);
  if (!minutes) return p;
  return { ...p, updatedAt: now, stats: {
    hunger: clamp(p.stats.hunger - minutes * 0.05),
    happiness: clamp(p.stats.happiness - minutes * 0.035),
    energy: clamp(p.stats.energy + minutes * (p.sleeping ? 2 : -0.065)),
    cleanliness: clamp(p.stats.cleanliness - minutes * 0.04),
  } };
}
export function care(pet: Pet, action: Action, boosted: boolean, food = 'seeds', now = Date.now()): { pet: Pet; message: string; ok: boolean } {
  const p = advance(pet, now), rule = ACTIONS.find(a => a.id === action)!;
  const fail = (message: string) => ({ pet: p, message, ok: false });
  if ((p.cooldowns[action] ?? 0) > now) return fail('A tiny breather! This action will be ready soon.');
  if (p.sleeping && action !== 'sleep') return fail('Your hamster is resting. Wake them first.');
  const cost = action === 'play' ? 10 : action === 'exercise' ? 12 : action === 'clean' ? 3 : 0;
  if (p.stats.energy < cost) return fail(`A sleepy little friend. Rest to recover energy before ${action === 'play' ? 'playing' : action === 'clean' ? 'cleaning' : 'exercising'}.`);
  const s = { ...p.stats }, inventory = { ...p.inventory };
  let message = '', sleeping = p.sleeping;
  if (action === 'feed') {
    if (food !== 'seeds' && !(inventory[food] > 0)) return fail('That snack is all gone. Free seeds are always available.');
    if (food !== 'seeds') inventory[food]--;
    s.hunger += food === 'carrot' ? 35 : food === 'berry' ? 25 : food === 'sunflower' ? 30 : 22;
    s.happiness += food === 'berry' ? 15 : food === 'carrot' ? 5 : 3;
    if (food === 'sunflower') s.energy += 8;
    s.cleanliness -= 2;
    message = `${p.name} says: more tiny crunches, please!`;
  } else if (action === 'play') { s.happiness += 20; s.energy -= 10; s.hunger -= 4; s.cleanliness -= 3; message = `${p.name} did a happy little hop!`; }
  else if (action === 'clean') { s.cleanliness += 40; s.energy -= 3; message = 'Fresh bedding, fresh start. Squeaky clean!'; }
  else if (action === 'exercise') { s.happiness += 12; s.energy -= 12; s.hunger -= 6; s.cleanliness -= 8; message = 'Tiny paws, big zoomies!'; }
  else { sleeping = !sleeping; message = sleeping ? 'All tucked in. Recovering 2 energy each minute.' : 'Good morning, little sunshine!'; }
  const xp = Math.floor(rule.xp * (boosted ? 1.5 : 1));
  return { ok: true, message: `${message}${xp ? ` +${xp} XP · +${rule.reward} Acorns` : ''}`, pet: {
    ...p, stats: Object.fromEntries(Object.entries(s).map(([k,v]) => [k,clamp(v)])) as Stats,
    sleeping, inventory, xp: p.xp + xp, acorns: p.acorns + rule.reward,
    counts: { ...p.counts, [action]: p.counts[action] + 1 },
    cooldowns: { ...p.cooldowns, [action]: now + rule.cooldown * 1000 },
  } };
}
export function buy(p: Pet, id: string): { pet: Pet; message: string } {
  const item = ITEMS.find(x => x.id === id);
  if (!item) return { pet: p, message: 'Item unavailable.' };
  if (item.type === 'decor' && p.inventory[id]) return { pet: p, message: 'This decoration is already yours.' };
  if (p.acorns < item.price) return { pet: p, message: `Earn ${item.price - p.acorns} more Acorns through care or Wheel Runner.` };
  return { pet: { ...p, acorns: p.acorns - item.price, inventory: { ...p.inventory, [id]: (p.inventory[id] ?? 0) + 1 }, equipped: item.type === 'decor' ? [...p.equipped, id] : p.equipped }, message: `${item.name} ${item.type === 'decor' ? 'is now in your room' : 'added to your snack cupboard'}!` };
}
export function finishRun(p: Pet, score: number, seeds: number, now = Date.now()): { pet: Pet; earned: number } {
  const day = localDay(now), earnedToday = p.runner.rewardDay === day ? p.runner.earnedToday : 0;
  const earned = Math.max(0, Math.min(20, 60 - earnedToday, Math.floor(score / 40) + seeds));
  return { earned, pet: { ...p, acorns: p.acorns + earned, xp: p.xp + Math.min(20, Math.floor(score / 20)),
    runner: { best: Math.max(p.runner.best, score), runs: p.runner.runs + 1, seeds: p.runner.seeds + seeds, rewardDay: day, earnedToday: earnedToday + earned } } };
}
export function achievements(p: Pet): string[] {
  return [p.counts.feed > 0 && 'First little crunch', p.counts.clean > 0 && 'Squeaky clean', p.runner.runs > 0 && 'Off to the races', p.runner.best >= 100 && 'Trail explorer', p.memories.length > 0 && 'A shared memory', levelOf(p) >= 3 && 'Growing together'].filter((a): a is string => !!a);
}
