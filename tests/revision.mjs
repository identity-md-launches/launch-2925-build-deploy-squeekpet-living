// Focused regressions against the production export. --before verifies the reported failures.
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

const before = process.argv.includes('--before');
const output = resolve('test/scratch', before ? 'revision-before' : 'revision-after');
await mkdir(output, { recursive: true });
const root = resolve('dist');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    assert.ok(pathname.startsWith('/preview/'));
    const file = resolve(root, pathname.slice('/preview/'.length) || 'index.html');
    assert.ok(file.startsWith(root + '/'));
    const bytes = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(bytes);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const url = `http://127.0.0.1:${server.address().port}/preview/`;
const result = { phase: before ? 'before fixes' : 'after fixes', tests: [], limitations: [], pageErrors: [], resourceErrors: [] };
let browser;

async function check(name, work) {
  try {
    const detail = await work();
    result.tests.push({ name, passed: true, detail });
    console.log(`${before ? 'REPRODUCED' : 'PASS'} ${name}`);
  } catch (error) {
    result.tests.push({ name, passed: false, error: error.message });
    console.log(`FAIL ${name}: ${error.message}`);
    throw error;
  }
}
async function contextFor(type, width = 390) {
  const context = await type.newContext({ viewport: { width, height: 844 }, hasTouch: true });
  await context.route('https://api.squeekchain.com/**', route => route.abort('failed'));
  const page = await context.newPage();
  page.on('pageerror', error => result.pageErrors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(url) && response.status() >= 400) result.resourceErrors.push({ url: response.url(), status: response.status() });
  });
  await page.clock.install();
  return { context, page };
}
async function saved(page, replacement) {
  return page.evaluate(replacement => new Promise((resolve, reject) => {
    const request = indexedDB.open('squeekpet-living-evolution', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('progress', replacement ? 'readwrite' : 'readonly');
      const entry = replacement ? tx.objectStore('progress').put(replacement, 'pet') : tx.objectStore('progress').get('pet');
      tx.oncomplete = () => { db.close(); resolve(replacement ?? entry.result); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    };
  }), replacement);
}
async function waitSave(page, predicate) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const value = await saved(page);
    if (predicate(value)) return value;
    await page.waitForTimeout(40);
  }
  throw new Error('Expected progress was not saved.');
}
async function adoptOriginal(page) {
  await page.goto(url);
  await page.getByRole('button', { name: 'Adopt a hamster', exact: true }).click();
  await page.getByRole('textbox', { name: 'What shall we call them?' }).fill('Original');
  await page.getByRole('button', { name: 'Bring my hamster home' }).click();
  await waitSave(page, pet => pet?.name === 'Original');
}
async function spriteTop(page) {
  return page.locator('canvas').evaluate(canvas => {
    const pixels = canvas.getContext('2d').getImageData(100, 70, 65, 205).data;
    let top = 300;
    for (let y = 0; y < 205; y++) for (let x = 0; x < 65; x++) {
      const i = (y * 65 + x) * 4;
      if (pixels[i] === 108 && pixels[i + 1] === 83 && pixels[i + 2] === 62) top = Math.min(top, y + 70);
    }
    return top;
  });
}
async function runnerLayout(type, label) {
  const { context, page } = await contextFor(type, 320);
  try {
    await page.goto(url + '#runner');
    await page.getByRole('button', { name: 'Start running', exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    const measure = () => page.evaluate(() => {
      const box = selector => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height };
      };
      return { field: box('.runner-field'), panel: box('.runner-overlay>div'), readout: box('.runner-readout'), instructions: box('#runner-instructions'), overflow: document.querySelector('.app').scrollWidth > innerWidth };
    });
    const states = [{ mode: 'ready', width: 320, ...await measure() }];
    await page.screenshot({ path: resolve(output, `${label}-runner-320.png`) });
    if (before) {
      assert.ok(states[0].panel.top < states[0].readout.bottom);
      assert.ok(states[0].panel.bottom > states[0].instructions.top);
    } else {
      const fits = state => {
        assert.ok(state.panel.top >= state.field.top, JSON.stringify(state));
        assert.ok(state.panel.bottom <= state.field.bottom, JSON.stringify(state));
        assert.ok(state.panel.top >= state.readout.bottom, JSON.stringify(state));
        assert.ok(state.panel.bottom < state.instructions.top, JSON.stringify(state));
        assert.equal(state.overflow, false);
      };
      fits(states[0]);
      for (const width of [390, 480, 768, 1440]) {
        await page.setViewportSize({ width, height: 844 });
        await page.clock.runFor(50);
        const state = { mode: 'ready', width, ...await measure() };
        fits(state); states.push(state);
      }
      await page.setViewportSize({ width: 320, height: 844 });
      await page.getByRole('button', { name: 'Start running', exact: true }).click();
      await page.clock.runFor(200);
      await page.getByRole('button', { name: 'Pause', exact: true }).click();
      const paused = { mode: 'paused', width: 320, ...await measure() }; fits(paused); states.push(paused);
      await page.getByRole('button', { name: 'Resume run', exact: true }).click();
      await page.clock.runFor(15000);
      await page.getByRole('button', { name: 'Run again', exact: true }).waitFor();
      const over = { mode: 'over', width: 320, ...await measure() }; fits(over); states.push(over);
    }
    return states;
  } finally { await context.close(); }
}

try {
  browser = await chromium.launch({ headless: true });
  await check('Runner overlay stays inside its field and clear of scores/instructions', () => runnerLayout(browser, 'chromium'));
  for (const reason of ['transient read failure', 'unsupported record version']) {
    await check(`Shop cannot replace a saved pet after ${reason}`, async () => {
      const { context, page } = await contextFor(browser);
      try {
        await adoptOriginal(page);
        await page.locator('.action-feed').click();
        await page.locator('.action-play').click();
        const original = await waitSave(page, pet => pet?.xp === 27 && pet?.acorns === 38);
        let expected = original;
        if (reason === 'transient read failure') {
          await page.addInitScript(() => {
            if (sessionStorage.getItem('read-restored')) return;
            const get = IDBObjectStore.prototype.get;
            let once = true;
            IDBObjectStore.prototype.get = function (...args) {
              if (this.name === 'progress' && once) { once = false; throw new DOMException('Temporary read failure', 'UnknownError'); }
              return get.apply(this, args);
            };
          });
        } else { expected = { ...original, version: 99 }; await saved(page, expected); }
        await page.reload();
        await page.locator('.storage-warning').waitFor();
        assert.ok(await page.getByRole('button', { name: 'Adopt a hamster', exact: true }).isDisabled());
        assert.deepEqual(await saved(page), expected);
        await page.locator('nav a[href="#shop"]').click();
        const buttons = page.getByRole('button', { name: 'Adopt to shop', exact: true });
        const disabled = await buttons.evaluateAll(nodes => nodes.map(node => node.disabled));
        if (before) {
          assert.ok(disabled.every(value => !value));
          await buttons.first().click();
          await page.getByRole('textbox', { name: 'What shall we call them?' }).fill('Replacement');
          await page.getByRole('button', { name: 'Bring my hamster home' }).click();
          const replacement = await waitSave(page, pet => pet?.name === 'Replacement');
          assert.equal(replacement.xp, 0); assert.equal(replacement.acorns, 30);
          return { original: { name: original.name, xp: original.xp, acorns: original.acorns }, overwritten: replacement.name, shopButtonsDisabled: disabled };
        }
        assert.ok(disabled.length > 0 && disabled.every(Boolean));
        // Also check the handler: removing native disabled must not bypass the failed-load guard.
        await buttons.first().evaluate(button => { button.disabled = false; button.click(); });
        assert.equal(await page.locator('dialog').count(), 0);
        await buttons.first().evaluate(button => { button.disabled = true; });
        await page.clock.fastForward(31000);
        assert.deepEqual(await saved(page), expected);
        await page.screenshot({ path: resolve(output, reason === 'transient read failure' ? 'shop-read-failure.png' : 'shop-version-failure.png') });
        if (reason === 'transient read failure') {
          await page.evaluate(() => sessionStorage.setItem('read-restored', 'yes'));
          await page.getByRole('button', { name: 'Try loading saved pet' }).click();
          await page.getByRole('button', { name: 'Buy snack', exact: true }).first().waitFor();
          assert.equal(await page.locator('.storage-warning').count(), 0);
          const restored = await saved(page); assert.equal(restored.name, 'Original'); assert.equal(restored.xp, 27); assert.equal(restored.acorns, 38);
        }
        return { originalPreserved: true, shopButtonsDisabled: disabled, recoveryChecked: reason === 'transient read failure' };
      } finally { await context.close(); }
    });
  }
  await check('Lower Resume returns keyboard focus and Space jumps instead of pausing', async () => {
    const { context, page } = await contextFor(browser);
    try {
      await page.goto(url + '#runner');
      await page.getByRole('button', { name: 'Start running', exact: true }).click();
      await page.clock.runFor(200);
      const outcomes = [];
      for (const keyboard of before ? [false] : [false, true]) {
        const pause = page.getByRole('button', { name: 'Pause', exact: true });
        if (keyboard) { await pause.focus(); await page.keyboard.press('Space'); } else await pause.click();
        const resume = page.getByRole('button', { name: 'Resume', exact: true });
        if (keyboard) await page.keyboard.press('Space'); else await resume.click();
        const focus = await page.evaluate(() => document.activeElement.tagName);
        const grounded = await spriteTop(page);
        await page.keyboard.press('Space');
        await page.clock.runFor(180);
        const jumped = await spriteTop(page);
        if (before) {
          assert.equal(focus, 'BUTTON');
          assert.ok(await page.getByRole('button', { name: 'Resume run', exact: true }).isVisible());
        } else {
          assert.equal(focus, 'CANVAS');
          assert.equal(await page.locator('.runner-overlay').count(), 0);
          assert.ok(grounded - jumped > 30, `sprite before ${grounded}, after ${jumped}`);
          await page.clock.runFor(550);
        }
        outcomes.push({ input: keyboard ? 'keyboard' : 'pointer', focus, grounded, jumped, pausedAfterSpace: await page.locator('.runner-overlay').count() > 0 });
      }
      await page.screenshot({ path: resolve(output, 'runner-resumed.png') });
      return outcomes;
    } finally { await context.close(); }
  });
  await check('Failed writes show unsaved status until retry commits and progress survives reload', async () => {
    const { context, page } = await contextFor(browser, 1440);
    try {
      await adoptOriginal(page);
      await page.waitForFunction(() => document.querySelector('.save-indicator')?.textContent.includes('Saved on this device'));
      const original = await saved(page);
      await page.evaluate(() => {
        const put = IDBObjectStore.prototype.put;
        window.restorePut = () => { IDBObjectStore.prototype.put = put; };
        IDBObjectStore.prototype.put = function (...args) {
          if (this.name === 'progress') throw new DOMException('Quota exceeded', 'QuotaExceededError');
          return put.apply(this, args);
        };
      });
      await page.locator('.action-feed').click();
      await page.locator('.storage-warning').waitFor();
      const status = await page.locator('.save-indicator').innerText();
      const successIcon = await page.locator('.save-indicator .lucide-circle-check').count();
      assert.deepEqual(await saved(page), original);
      if (before) { assert.match(status, /Saved on this device/); assert.equal(successIcon, 1); }
      else { assert.equal(status.trim(), 'Changes not saved'); assert.equal(successIcon, 0); }
      await page.locator('.save-indicator').scrollIntoViewIfNeeded();
      await page.screenshot({ path: resolve(output, 'save-failure.png') });
      await page.evaluate(() => window.restorePut());
      await page.getByRole('button', { name: 'Try saving again' }).click();
      const retried = await waitSave(page, pet => pet?.counts.feed === 1 && pet?.acorns === 33);
      await page.waitForFunction(() => !document.querySelector('.storage-warning') && document.querySelector('.save-indicator')?.textContent.includes('Saved on this device'));
      await page.reload();
      await page.getByRole('button', { name: 'Pause habitat animations' }).waitFor();
      const restored = await saved(page); assert.equal(restored.name, retried.name); assert.equal(restored.xp, retried.xp); assert.equal(restored.acorns, retried.acorns); assert.equal(restored.counts.feed, 1);
      return { failedStatus: status.trim(), successIcon: !!successIcon, persistedBeforeRetry: original.acorns, afterRetryAndReload: restored.acorns };
    } finally { await context.close(); }
  });
  let safari;
  try { safari = await webkit.launch({ headless: true }); }
  catch (error) { result.limitations.push(`WebKit could not launch: ${error.message.split('\n').filter(Boolean).slice(0, 7).join(' ')}`); }
  if (safari) {
    try { await check('WebKit runner overlay layout', () => runnerLayout(safari, 'webkit')); }
    finally { await safari.close(); }
  }
  assert.deepEqual(result.pageErrors, []);
  assert.deepEqual(result.resourceErrors, []);
} catch (error) { result.failure = error.message; process.exitCode = 1; }
finally {
  if (browser) await browser.close();
  await new Promise(done => server.close(done));
  await writeFile(resolve(output, 'results.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(`Results: ${output}/results.json`);
}
