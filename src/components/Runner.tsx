import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, Flag, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import { spriteImage } from '../art';
import { localDay, stageOf, type Pet } from '../game';
import { PixelIcon } from './PixelIcon';

type Mode = 'ready' | 'running' | 'paused' | 'over';
type Obstacle = { x: number; w: number; h: number; kind: number };
type Seed = { x: number; y: number; taken: boolean };
type World = { y: number; velocity: number; time: number; distance: number; score: number; seeds: number; spawn: number; obstacles: Obstacle[]; pickups: Seed[] };
const freshWorld = (): World => ({ y: 0, velocity: 0, time: 0, distance: 0, score: 0, seeds: 0, spawn: 1.7, obstacles: [], pickups: [] });
export function Runner({ pet, boosted, onFinish }: { pet: Pet | null; boosted: boolean; onFinish: (score: number,seeds: number) => number }) {
  const canvas = useRef<HTMLCanvasElement>(null), world = useRef(freshWorld()), modeRef = useRef<Mode>('ready');
  const [mode,setMode] = useState<Mode>('ready'), [score,setScore] = useState(0), [seeds,setSeeds] = useState(0), [reward,setReward] = useState(0);
  const [image,setImage] = useState<HTMLImageElement | null>(null), [artError,setArtError] = useState(false);
  const [canvasWidth,setCanvasWidth] = useState(()=>window.innerWidth<730?500:840);
  const bonus = useRef(boosted), finish = useRef(onFinish);
  bonus.current = boosted; finish.current = onFinish;
  const changeMode = useCallback((value: Mode) => { modeRef.current = value; setMode(value); },[]);
  useEffect(() => { let alive = true; spriteImage(pet?.coat ?? 'honey',pet ? stageOf(pet) : 0).then(i => { if (alive) setImage(i); }).catch(() => { if (alive) setArtError(true); }); return () => { alive = false; }; },[pet?.coat,pet?.memories.length,pet?.xp]);
  const start = useCallback(() => { if (!image) return; world.current = freshWorld(); setScore(0); setSeeds(0); setReward(0); changeMode('running'); canvas.current?.focus(); },[image,changeMode]);
  const jump = useCallback(() => {
    if (modeRef.current !== 'running') return;
    if (world.current.y === 0) world.current.velocity = -675;
  },[]);
  useEffect(()=>{const element=canvas.current;if(!element)return;const observer=new ResizeObserver(entries=>setCanvasWidth(entries[0].contentRect.width<600?500:840));observer.observe(element);return()=>observer.disconnect();},[]);
  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      if ((event.code === 'Space' || event.code === 'ArrowUp') && !(event.target instanceof HTMLElement && event.target.closest('button,input,select,a'))) { event.preventDefault(); jump(); }
      if (event.code === 'Escape' && modeRef.current === 'running') changeMode('paused');
    };
    const visibility = () => { if (document.hidden && modeRef.current === 'running') changeMode('paused'); };
    window.addEventListener('keydown',keys); document.addEventListener('visibilitychange',visibility);
    return () => { window.removeEventListener('keydown',keys); document.removeEventListener('visibilitychange',visibility); };
  },[jump,changeMode]);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    let frame = 0, previous = 0, lastReadout = 0;
    const draw = (timestamp: number) => {
      const dt = previous ? Math.min(.035,(timestamp - previous)/1000) : 0; previous = timestamp;
      const w = world.current;
      if (modeRef.current === 'running') {
        const speed = Math.min(540,260 + w.time * 3.6);
        w.time += dt; w.distance += speed * dt;
        w.score += dt * 12 * (bonus.current ? 1.25 : 1);
        w.y = Math.min(0,w.y + w.velocity * dt); w.velocity += 1900 * dt;
        if (w.y === 0 && w.velocity > 0) w.velocity = 0;
        w.spawn -= dt;
        if (w.spawn <= 0) {
          const kind = Math.floor(Math.random()*3), h = [32,46,25][kind], width = [42,30,48][kind];
          w.obstacles.push({ x: canvasWidth+20, w: width, h, kind });
          w.pickups.push({ x: canvasWidth+160, y: 176 + Math.floor(Math.random()*2)*32, taken: false });
          w.spawn = Math.max(.95,1.85 - w.time*.008) + Math.random()*.35;
        }
        w.obstacles.forEach(o => o.x -= speed*dt); w.pickups.forEach(s => s.x -= speed*dt);
        w.obstacles = w.obstacles.filter(o => o.x > -80); w.pickups = w.pickups.filter(s => s.x > -40 && !s.taken);
        for (const s of w.pickups) if (!s.taken && s.x < 157 && s.x > 105 && s.y > 218 + w.y - 12 && s.y < 266 + w.y + 12) { s.taken = true; w.seeds++; w.score += bonus.current ? 12.5 : 10; }
        if (w.obstacles.some(o => o.x < 151 && o.x + o.w > 116 && 265 + w.y > 268 - o.h + 7)) {
          const total = Math.floor(w.score); setScore(total); setSeeds(w.seeds); setReward(finish.current(total,w.seeds)); changeMode('over');
        }
        if (timestamp-lastReadout > 100) { setScore(Math.floor(w.score)); setSeeds(w.seeds); lastReadout = timestamp; }
      }
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#d8e6cf'; ctx.fillRect(0,0,840,330);
      // Distant landscape scrolls gently behind the trail.
      ctx.fillStyle = '#f7f3d6'; ctx.fillRect(660,30,36,36); ctx.fillRect(650,40,56,16);
      for (let i=0;i<5;i++) { const x = ((i*223-w.distance*.1)%1115+1115)%1115-110; ctx.fillStyle='#f1f0d8';ctx.fillRect(x,45+i%2*33,65,14);ctx.fillRect(x+12,36+i%2*33,35,12); }
      for (let i=0;i<8;i++) {
        const x = ((i*155-w.distance*.18)%1240+1240)%1240-170;
        ctx.fillStyle = '#b2c6a2';ctx.fillRect(x,158+i%3*8,130,102);ctx.fillRect(x+20,137+i%3*8,90,30);ctx.fillRect(x+40,124+i%3*8,50,20);
      }
      for (let i=0;i<10;i++) {
        const x = ((i*113-w.distance*.45)%1130+1130)%1130-120;
        ctx.fillStyle='#8da87d';ctx.fillRect(x,214,90,47);ctx.fillRect(x+10,198,67,25);ctx.fillRect(x+26,187,34,20);
        ctx.fillStyle='#7b9669';ctx.fillRect(x+5,245,80,15);
      }
      ctx.fillStyle='#83976c';ctx.fillRect(0,261,840,8);ctx.fillStyle='#e0c89d';ctx.fillRect(0,269,840,61);ctx.fillStyle='#c5aa7d';ctx.fillRect(0,277,840,4);
      ctx.fillStyle='#b69b70';
      for(let i=0;i<20;i++) {const x=((i*57-w.distance)%1140+1140)%1140-50;ctx.fillRect(x,292+i%3*12,12,3);}
      for(const seed of w.pickups) if(!seed.taken){ctx.fillStyle='#8b7549';ctx.fillRect(seed.x,seed.y,12,18);ctx.fillStyle='#f0d78c';ctx.fillRect(seed.x+2,seed.y+2,8,12);ctx.fillStyle='#b99a5e';ctx.fillRect(seed.x+5,seed.y+3,2,10);}
      for(const o of w.obstacles){
        if(o.kind===0){ctx.fillStyle='#92704d';ctx.fillRect(o.x,268-o.h,o.w,o.h);ctx.fillStyle='#bb9569';ctx.fillRect(o.x+5,270-o.h,o.w-10,o.h-5);ctx.fillStyle='#896c49';ctx.fillRect(o.x+9,276-o.h,o.w-18,3);ctx.fillRect(o.x+o.w-10,273-o.h,3,o.h-10);}
        else if(o.kind===1){ctx.fillStyle='#b58f69';ctx.fillRect(o.x+8,268-o.h+16,14,o.h-16);ctx.fillStyle='#b47b68';ctx.fillRect(o.x-3,268-o.h+7,36,13);ctx.fillRect(o.x+4,268-o.h,22,10);ctx.fillStyle='#f2d9ac';ctx.fillRect(o.x+5,272-o.h,5,5);ctx.fillRect(o.x+22,278-o.h,5,4);}
        else{ctx.fillStyle='#929b85';ctx.fillRect(o.x,268-o.h+8,o.w,o.h-8);ctx.fillRect(o.x+8,268-o.h,o.w-15,10);ctx.fillStyle='#b3b9a4';ctx.fillRect(o.x+11,270-o.h,18,6);}
      }
      if(image) {
        ctx.fillStyle='rgba(72,78,47,.16)';ctx.fillRect(106,265,55,5);
        const bob = modeRef.current==='running' && w.y===0 ? Math.floor(w.time*10)%2*2 : 0;
        ctx.drawImage(image,104,211+w.y+bob,54,64);
      }
      if(modeRef.current==='running') frame=requestAnimationFrame(draw);
    };
    frame=requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  },[mode,image,changeMode,canvasWidth]);
  return <div className="runner-page">
    <div className="page-heading"><div><h1>Small paws. Big adventure.</h1><p>Hop the woodland trail. Bring home a pocketful of Acorns.</p></div><span className="page-tag"><Flag size={15} /> Wheel Runner</span></div>
    <div className="runner-readout"><span>Score <strong>{score.toString().padStart(4,'0')}</strong></span><span><PixelIcon name="seed" /> Seeds <strong>{seeds}</strong></span><span>Personal best <strong>{pet?.runner.best ?? '—'}</strong></span></div>
    <div className="runner-field"><canvas ref={canvas} width={canvasWidth} height="330" tabIndex={0} aria-label={`Wheel Runner. ${mode === 'running' ? 'Press Space or Arrow Up to jump. Escape pauses.' : 'Use the start or resume button to play.'}`} aria-describedby="runner-instructions" onPointerDown={e => { e.preventDefault(); canvas.current?.focus(); jump(); }} />
      {mode !== 'running' && <div className="runner-overlay"><div><PixelIcon name={mode === 'over' ? 'acorn' : 'exercise'} /><h2>{mode==='ready' ? 'Ready, little runner?' : mode==='paused' ? 'A little breather.' : 'What a little adventure!'}</h2><p>{mode==='ready' ? 'Jump over logs, dodge mushrooms, collect seeds.' : mode==='paused' ? 'Your trail will be right here.' : `${score} points · ${seeds} seeds${pet ? ` · +${reward} Acorns` : ''}`}</p><button className="primary-button" disabled={!image} onClick={mode==='paused' ? () => { changeMode('running'); canvas.current?.focus(); } : start}>{mode==='paused' ? <Play size={17} /> : mode==='over' ? <RotateCcw size={17} /> : <Play size={17} />}{mode==='paused' ? 'Resume run' : mode==='over' ? 'Run again' : image ? 'Start running' : artError ? 'Artwork unavailable' : 'Getting the trail ready…'}</button></div></div>}
    </div>
    <div className="runner-controls"><p id="runner-instructions"><kbd>Space</kbd> / <kbd>↑</kbd>, click the trail, or tap Jump.</p><div><button className="secondary-button" onClick={() => changeMode(mode==='paused' ? 'running' : 'paused')} disabled={mode==='ready' || mode==='over'}>{mode==='paused' ? <Play size={16} /> : <Pause size={16} />}{mode==='paused' ? 'Resume' : 'Pause'}</button><button className="primary-button jump-button" onPointerDown={e => { e.preventDefault(); jump(); }} onClick={jump} disabled={mode!=='running'}><ArrowUp size={18} /> Jump</button></div></div>
    <div className="runner-notes"><div><h2><PixelIcon name="acorn" /> A pocketful, fairly earned</h2><p>Every 40 points earns 1 Acorn, plus 1 per seed. Up to 20 per run and 60 per day. {pet ? `${pet.runner.rewardDay===localDay(Date.now())?pet.runner.earnedToday:0}/60 Acorns earned today.` : 'Adopt a hamster to save your rewards and personal best.'}</p></div><div><h2><Sparkles size={20} /> A breeze from the real world</h2><p>{boosted ? 'Verified hardware activity is giving you +25% score right now.' : 'Fresh hardware activity adds +25% to score while the real wheel is active. The trail is always open.'}</p></div></div>
    <p className="runner-announcement sr-only" role="status">{mode==='over' ? `Run complete. ${score} points, ${seeds} seeds, ${reward} Acorns earned.` : mode==='paused' ? 'Run paused.' : ''}</p>
  </div>;
}
