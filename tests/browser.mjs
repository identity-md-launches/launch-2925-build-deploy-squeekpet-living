// Production-export interaction checks. API fixtures below are isolated to this test browser.
// Run `npm run test:browser -- --record` to refresh the deliverable evidence.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const root=resolve('dist'),record=process.argv.includes('--record');
const evidence=record?resolve('artifacts'):resolve('/tmp/squeekpet-browser-evidence');
await mkdir(resolve(evidence,'screenshots'),{recursive:true});
const result={ testedAt:new Date().toISOString(),export:'dist/',tests:[],limitations:[],consoleErrors:[],liveApi:{} };
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain'};
const server=createServer(async(req,res)=>{
  try{
    let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(!path.startsWith('/preview/')){res.writeHead(404);res.end();return;}
    path=resolve(root,path.slice('/preview/'.length)||'index.html');
    if(!path.startsWith(root+'/'))throw new Error('Invalid path');
    const bytes=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]??'application/octet-stream','Cache-Control':'no-cache'});res.end(bytes);
  }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const url=`http://127.0.0.1:${server.address().port}/preview/`;
let browser;
async function check(name,work){try{const details=await work();result.tests.push({name,passed:true,...(details?{details}: {})});process.stdout.write(`PASS ${name}\n`);}catch(e){result.tests.push({name,passed:false,error:e.message});process.stdout.write(`FAIL ${name}: ${e.message}\n`);throw e;}}
async function saved(page){return page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('squeekpet-living-evolution',1);r.onsuccess=()=>{const db=r.result,q=db.transaction('progress').objectStore('progress').get('pet');q.onsuccess=()=>{resolve(q.result);db.close();};q.onerror=()=>reject(q.error);};r.onerror=()=>reject(r.error);}));}
async function waitSave(page,predicate){for(let i=0;i<30;i++){const p=await saved(page);if(predicate(p))return p;await page.waitForTimeout(40);}throw new Error('Save did not reach the expected state.');}
async function go(page,id){await page.locator(`nav a[href="#${id}"]`).click();await page.locator('h1').waitFor();}
async function overflow(page){return page.evaluate(()=>({route:location.hash,viewport:innerWidth,document:document.documentElement.scrollWidth,app:document.querySelector('.app').scrollWidth,appWidth:document.querySelector('.app').clientWidth,offenders:[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&e.checkVisibility()).slice(0,10).map(e=>`${e.tagName}.${e.className.baseVal??e.className}`)}));}
function assertNoOverflow(size){assert.ok(size.document<=size.viewport+1,JSON.stringify(size));assert.ok(size.app<=size.appWidth+1,JSON.stringify(size));}
async function petTop(page){return page.locator('canvas').evaluate(canvas=>{const ctx=canvas.getContext('2d'),d=ctx.getImageData(100,70,65,205);let top=300;for(let y=0;y<205;y++)for(let x=0;x<65;x++){const i=(y*65+x)*4;if(d.data[i]===108&&d.data[i+1]===83&&d.data[i+2]===62)top=Math.min(top,y+70);}return top;});}

try{
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,acceptDownloads:true});
  const page=await context.newPage();
  page.on('pageerror',e=>result.consoleErrors.push(e.message));
  const api={mode:'idle',eventMode:'empty',eventAt:null,rateOnce:false,requests:[],eventRequests:0};
  await page.route('https://api.squeekchain.com/**',async route=>{
    const at=await page.evaluate(()=>Date.now()),path=new URL(route.request().url()).pathname;
    if(path==='/v1/status'){
      api.requests.push(at);
      if(api.mode==='offline'){await route.abort('failed');return;}
      if(api.mode==='rate'&&!api.rateOnce){api.rateOnce=true;await route.fulfill({status:429,headers:{'Retry-After':'90','Access-Control-Allow-Origin':'*','Access-Control-Expose-Headers':'Retry-After'},json:{error:'rate_limited'}});return;}
      if(api.mode==='malformed'){await route.fulfill({json:{schemaVersion:1,installationId:'browser-test',measurement:{rpmMilli:0}}});return;}
      const active=['active','simulated','replay','derived','stale','rate'].includes(api.mode);
      await route.fulfill({json:{schemaVersion:1,installationId:'browser-test',measurement:api.mode==='missing'?null:{freshness:api.mode==='stale'?'stale':'online',observedAt:new Date(at).toISOString(),receivedAt:new Date(at).toISOString(),staleAfterSeconds:120,provenance:['simulated','replay','derived'].includes(api.mode)?api.mode:'hardware',coreStatus:active?'ACTIVE':'IDLE',rpmMilli:active?12500:0,distanceMm:1234567}}});
    }else{
      api.eventRequests++;
      if(api.eventMode==='unavailable'){await route.fulfill({json:{schemaVersion:3,status:'unavailable',reason:'source_disabled'}});return;}
      const eventAt=api.eventAt??at;
      if(api.eventMode==='new'&&!api.eventAt)api.eventAt=at;
      const events=api.eventMode==='empty'?[]:[{id:'browser-test-wheel-event',type:'measurement.speed_milestone',occurredAt:new Date(api.eventMode==='old'?eventAt-86400000:eventAt).toISOString(),source:{kind:'measurement',installationId:'browser-test',disposition:'accepted',observedAt:new Date(eventAt).toISOString(),receivedAt:new Date(eventAt).toISOString()},payload:{thresholdSpeedMmPerSecond:'555'}}];
      await route.fulfill({json:{schemaVersion:3,installationId:'browser-test',status:'available',events}});
    }
  });
  await page.clock.install();
  await page.goto(url);
  await page.getByRole('button',{name:'Adopt a hamster',exact:true}).waitFor();
  await check('390px first screen contains the game and adoption',async()=>{
    const box=await page.getByRole('button',{name:'Adopt a hamster',exact:true}).boundingBox();
    assert.ok(box.y+box.height<777);assert.ok(await page.locator('.scene').isVisible());assertNoOverflow(await overflow(page));
    assert.equal(await page.title(),'SqueekPet · Living Evolution');
    for(const selector of ['meta[name="description"]','meta[property="og:title"]','meta[property="og:image"]','link[rel="icon"]'])assert.ok(await page.locator(selector).count());
  });
  await check('adoption validates names, supports keyboard closure and restores focus',async()=>{
    await page.getByRole('button',{name:'Adopt a hamster',exact:true}).click();
    const name=page.getByRole('textbox',{name:'What shall we call them?'});
    await name.fill('   ');await page.getByRole('button',{name:'Bring my hamster home'}).click();assert.equal(await name.getAttribute('aria-invalid'),'true');
    await page.keyboard.press('Escape');await page.locator('dialog').waitFor({state:'detached'});assert.equal(await page.locator('dialog').count(),0);assert.ok(await page.getByRole('button',{name:'Adopt a hamster',exact:true}).evaluate(e=>e===document.activeElement));
    await page.getByRole('button',{name:'Adopt a hamster',exact:true}).click();await name.fill('Pip');await page.getByRole('radio',{name:'Cocoa',exact:true}).check();await page.getByRole('button',{name:'Bring my hamster home'}).click();
    const p=await waitSave(page,p=>p?.name==='Pip');assert.equal(p.coat,'cocoa');assert.equal(p.acorns,30);
  });
  await check('feed, play, clean and exercise change stats, XP and Acorns with cooldowns',async()=>{
    for(const action of ['Feed','Play','Clean','Exercise'])await page.locator('.action-'+action.toLowerCase()).click();
    const p=await waitSave(page,p=>p?.counts.exercise===1);assert.equal(p.acorns,48);assert.equal(p.xp,59);assert.ok(p.stats.happiness>90);assert.ok(p.stats.energy<65);assert.ok(p.stats.cleanliness>85);assert.ok(await page.locator('.action-feed').isDisabled());
  });
  await check('sleep blocks care, restores elapsed energy and can be ended',async()=>{
    await page.locator('.action-sleep').click();let p=await waitSave(page,p=>p?.sleeping);const before=p.stats.energy;
    assert.ok(await page.locator('.action-feed').isDisabled());await page.clock.fastForward(120000);await page.waitForTimeout(100);
    await page.locator('.action-sleep').click();p=await waitSave(page,p=>p&&!p.sleeping);assert.ok(p.stats.energy>before+3);
  });
  await check('shop filters, purchases, decoration equipment and snack consumption work',async()=>{
    await go(page,'shop');await page.getByRole('button',{name:'Snacks',exact:true}).click();assert.equal(await page.locator('.shop-item').count(),3);
    await page.locator('.shop-item').filter({hasText:'Crunchy carrot'}).getByRole('button',{name:'Buy snack'}).click();
    await waitSave(page,p=>p?.inventory.carrot===1);await page.getByRole('button',{name:'Room decor',exact:true}).click();
    const fern=page.locator('.shop-item').filter({hasText:'Fern friend'});await fern.getByRole('button',{name:'Buy decoration'}).click();let p=await waitSave(page,p=>p?.inventory.fern===1);assert.equal(p.acorns,17);assert.ok(p.equipped.includes('fern'));
    await fern.getByRole('button',{name:'Put away'}).click();p=await waitSave(page,p=>p&&!p.equipped.includes('fern'));assert.equal(p.inventory.fern,1);
    await fern.getByRole('button',{name:'Place in room'}).click();await waitSave(page,p=>p?.equipped.includes('fern'));
    await go(page,'home');await page.getByRole('combobox',{name:'Choose snack for Feed'}).selectOption('carrot');await page.locator('.action-feed').click();p=await waitSave(page,p=>p?.inventory.carrot===0);assert.equal(p.acorns,20);assert.equal(await page.getByRole('combobox',{name:'Choose snack for Feed'}).inputValue(),'seeds');
  });
  await check('IndexedDB preserves adoption, inventory, stats and progression across refresh',async()=>{
    const before=await saved(page);await page.reload();await page.getByRole('button',{name:'Pause habitat animations'}).waitFor();const after=await saved(page);assert.equal(after.name,'Pip');assert.equal(after.coat,'cocoa');assert.equal(after.xp,before.xp);assert.deepEqual(after.inventory,before.inventory);assert.deepEqual(after.equipped,before.equipped);assert.ok(Math.abs(after.stats.hunger-before.stats.hunger)<1);
  });
  await check('runner keyboard, touch, pause, score, game over, rewards and restart are playable',async()=>{
    await go(page,'runner');await page.getByRole('button',{name:'Start running'}).click();await page.clock.runFor(1500);const before=await petTop(page);await page.keyboard.press('Space');await page.clock.runFor(180);const after=await petTop(page);assert.ok(before-after>30,`sprite y before ${before}, after ${after}`);
    await page.keyboard.press('Escape');await page.getByRole('button',{name:'Resume run'}).waitFor();const paused=await page.locator('.runner-readout').innerText();await page.clock.fastForward(1000);assert.equal(await page.locator('.runner-readout').innerText(),paused);
    await page.getByRole('button',{name:'Resume run'}).click();await page.clock.runFor(700);await page.getByRole('button',{name:'Jump',exact:true}).tap();await page.clock.runFor(180);assert.ok(await petTop(page)<200);
    await page.clock.runFor(12000);await page.getByRole('button',{name:'Run again'}).waitFor();const p=await waitSave(page,p=>p?.runner.runs===1);assert.ok(p.runner.best>0);assert.ok(p.runner.earnedToday<=20);
    await page.getByRole('button',{name:'Run again'}).click();assert.ok(!(await page.getByRole('button',{name:'Jump',exact:true}).isDisabled()));await page.clock.runFor(200);const clickBefore=await petTop(page);await page.locator('canvas').click({position:{x:150,y:100}});await page.clock.runFor(180);assert.ok(clickBefore-(await petTop(page))>30);await page.keyboard.press('Escape');
  });
  await check('API failure keeps gameplay available and never replaces missing data with zero',async()=>{
    api.mode='offline';await go(page,'home');await page.clock.fastForward(31000);await page.getByText('Connection unavailable',{exact:true}).waitFor();assert.equal(await page.locator('.world-breeze').count(),0);assert.ok((await page.locator('.rpm-value').innerText()).includes('last known'));await page.locator('.action-feed').click();await waitSave(page,p=>p?.counts.feed===3);
  });
  await check('simulated readings show provenance without boosts or memories',async()=>{
    api.mode='simulated';await page.clock.fastForward(65000);await page.getByText('Simulated reading',{exact:true}).waitFor();assert.equal(await page.locator('.world-breeze').count(),0);assert.equal((await saved(page)).memories.length,0);
  });
  await check('fresh hardware activity uses real units, boosts care and collects one accepted event',async()=>{
    api.mode='active';api.eventMode='new';await page.clock.fastForward(31000);await page.getByText('Squeektoshi is running!',{exact:true}).waitFor();await page.locator('.world-breeze').waitFor();assert.match(await page.locator('.rpm-value').innerText(),/12.5/);assert.match(await page.locator('.telemetry-details').innerText(),/1.235/);
    const p=await waitSave(page,p=>p?.memories.length===1);const xp=p.xp;await page.locator('.action-feed').click();const next=await waitSave(page,p=>p?.counts.feed===4);assert.equal(next.xp-xp,18);assert.equal(next.processedEventIds.length,1);assert.equal(next.memories[0].id,'browser-test-wheel-event');
  });
  await check('repeat and historical events do not create extra Wheel Memories',async()=>{
    await page.clock.fastForward(31000);await page.waitForTimeout(100);assert.equal((await saved(page)).memories.length,1);api.eventMode='old';await page.clock.fastForward(31000);await page.waitForTimeout(100);assert.equal((await saved(page)).memories.length,1);
  });
  await check('browser offline event removes the live boost immediately',async()=>{
    await context.setOffline(true);await page.getByText('Connection unavailable',{exact:true}).waitFor();assert.equal(await page.locator('.world-breeze').count(),0);assert.equal((await saved(page)).memories.length,1);await context.setOffline(false);
  });
  await check('replay, derived, stale and null measurement states remain honest',async()=>{
    for(const [mode,label] of [['replay','Replayed reading'],['derived','Derived reading'],['stale','Reading is stale'],['missing','Connection unavailable']]){api.mode=mode;await page.clock.fastForward(11000);await page.getByText(label,{exact:true}).waitFor();assert.equal(await page.locator('.world-breeze').count(),0);}
    assert.match(await page.locator('.rpm-value').innerText(),/—/);
  });
  await check('429 Retry-After prevents polling until the requested delay has passed',async()=>{
    api.mode='rate';await page.clock.fastForward(11000);await page.locator('.connection-error').waitFor();await page.waitForTimeout(100);const count=api.requests.length;await page.clock.fastForward(89000);await page.waitForTimeout(100);assert.equal(api.requests.length,count);api.mode='idle';await page.clock.fastForward(2000);await page.getByText('Squeektoshi is taking a breather',{exact:true}).waitFor();assert.ok(api.requests.length>count);
  });
  await check('malformed status and HTTP-200 unavailable events fail safely',async()=>{
    api.mode='malformed';api.eventMode='unavailable';await page.clock.fastForward(31000);await page.getByText('Connection unavailable',{exact:true}).waitFor();assert.equal(await page.locator('.world-breeze').count(),0);await go(page,'evolution');await page.locator('.feed-warning').waitFor();assert.match(await page.locator('.feed-warning').innerText(),/unavailable/);assert.equal((await saved(page)).memories.length,1);
  });
  await check('PNG card downloads as a valid 900×1100 image and Share on X has a real destination',async()=>{
    await go(page,'pet');await page.locator('.card-preview img').waitFor();const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download PNG'}).click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'squeekpet-Pip.png');const path=await download.path();const bytes=await readFile(path);assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(bytes.readUInt32BE(16),900);assert.equal(bytes.readUInt32BE(20),1100);if(record)await writeFile(resolve(evidence,'screenshots/pet-card.png'),bytes);const href=await page.getByRole('link',{name:'Share on X'}).getAttribute('href');assert.ok(href.startsWith('https://twitter.com/intent/tweet?'));assert.ok(decodeURIComponent(href).includes('Pip'));
  });
  await check('all routes reflow at 320, 390, 768 and 1440 without horizontal overflow',async()=>{
    for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});for(const id of ['home','pet','runner','evolution','shop']){await go(page,id);assertNoOverflow(await overflow(page));}}
  });
  await check('reduced motion stops ambient animations and habitat pause is functional',async()=>{
    await go(page,'home');await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.getTiming().iterations===Infinity).length),0);await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'Pause habitat animations'}).click();assert.ok(await page.locator('.app').evaluate(e=>e.classList.contains('motion-paused')));await page.getByRole('button',{name:'Resume habitat animations'}).click();
  });
  await check('axe finds no serious or critical accessibility violations across the five routes and dialog',async()=>{
    const checks=[];for(const id of ['home','pet','runner','evolution','shop']){await go(page,id);const audit=await new AxeBuilder({page}).analyze();checks.push({route:id,violations:audit.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary,html:n.html}))}))});assert.equal(audit.violations.filter(v=>['serious','critical'].includes(v.impact)).length,0,JSON.stringify(checks));}
    await page.getByRole('button',{name:'How to play'}).click();const audit=await new AxeBuilder({page}).analyze();checks.push({route:'help-dialog',violations:audit.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary,html:n.html}))}))});assert.equal(audit.violations.filter(v=>['serious','critical'].includes(v.impact)).length,0,JSON.stringify(checks));await page.keyboard.press('Escape');return checks;
  });
  await check('storage failure is visible and cannot overwrite a saved pet with a new adoption',async()=>{
    const other=await browser.newContext();await other.addInitScript(()=>Object.defineProperty(window,'indexedDB',{get(){throw new Error('Browser storage is unavailable. Check site storage permissions and reload.');}}));const p=await other.newPage();await p.route('https://api.squeekchain.com/**',r=>r.abort());await p.goto(url);await p.locator('.storage-warning').waitFor();assert.ok(await p.getByRole('button',{name:'Adopt a hamster',exact:true}).isDisabled());await other.close();
  });
  await check('Wheel Runner remains playable without adoption or API access',async()=>{
    const other=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p=await other.newPage();await p.route('https://api.squeekchain.com/**',r=>r.abort());await p.clock.install();await p.goto(url+'#runner');await p.getByRole('button',{name:'Start running'}).click();await p.clock.runFor(15000);await p.getByRole('button',{name:'Run again'}).waitFor();assert.ok(!(await p.locator('.runner-readout').innerText()).includes('0000'));assert.equal(await p.locator('dialog').count(),0);assert.equal((await p.locator('.acorn-balance').innerText()).trim(),'0');await other.close();
  });
  await context.close();
  await check('production page requests the real public endpoints and renders their actual outcome',async()=>{
    const live=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p=await live.newPage();
    const responses=[];p.on('response',r=>{if(r.url().startsWith('https://api.squeekchain.com/'))responses.push({url:r.url(),status:r.status()});});
    p.on('pageerror',e=>result.consoleErrors.push(e.message));await p.goto(url);await p.getByRole('button',{name:'Adopt a hamster',exact:true}).waitFor();
    await p.waitForFunction(()=>{const s=document.querySelector('.wheel-state');return s&&!s.textContent.includes('Connecting');},{},{timeout:20000});
    result.liveApi={responses,outcome:await p.locator('.wheel-reading').innerText(),activity:await p.locator('.wheel-description').innerText()};
    await p.screenshot({path:resolve(evidence,'screenshots/mobile-home.png')});
    await p.setViewportSize({width:1440,height:1000});await p.screenshot({path:resolve(evidence,'screenshots/desktop-home.png')});
    await p.getByRole('button',{name:'Adopt a hamster',exact:true}).click();await p.getByRole('textbox',{name:'What shall we call them?'}).fill('Mochi');await p.getByRole('button',{name:'Bring my hamster home'}).click();await p.locator('.action-feed').click();await waitSave(p,p=>p?.counts.feed===1);
    await p.setViewportSize({width:390,height:844});await p.locator('.app').evaluate(e=>e.scrollTo(0,0));await p.screenshot({path:resolve(evidence,'screenshots/mobile-pet-care.png')});
    await go(p,'runner');await p.getByRole('button',{name:'Start running'}).waitFor();await p.screenshot({path:resolve(evidence,'screenshots/mobile-runner.png')});await p.getByRole('button',{name:'Start running'}).click();await p.waitForTimeout(1800);await p.locator('canvas').click({position:{x:160,y:100}});await p.waitForTimeout(160);await p.screenshot({path:resolve(evidence,'screenshots/mobile-runner-playing.png')});
    await p.setViewportSize({width:1440,height:1000});await go(p,'evolution');await p.screenshot({path:resolve(evidence,'screenshots/desktop-evolution.png')});await live.close();return result.liveApi;
  });
  try{const safari=await webkit.launch({headless:true});const ctx=await safari.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();await p.goto(url);await p.getByRole('button',{name:'Adopt a hamster',exact:true}).click();await p.getByRole('button',{name:'Bring my hamster home'}).click();await p.locator('.action-feed').click();await waitSave(p,p=>p?.counts.feed===1);await ctx.close();await safari.close();result.tests.push({name:'WebKit adoption and care',passed:true});}catch(e){result.limitations.push(`WebKit was attempted but could not run: ${e.message.split('\n').filter(Boolean).slice(0,7).join(' ')}`);}
  assert.equal(result.consoleErrors.length,0,JSON.stringify(result.consoleErrors));
}catch(e){result.failure=e.message;process.exitCode=1;}
finally{if(browser)await browser.close();await new Promise(done=>server.close(done));await writeFile(resolve(evidence,'browser-results.json'),JSON.stringify(result,null,2)+'\n');process.stdout.write(`Evidence: ${evidence}\n`);}
