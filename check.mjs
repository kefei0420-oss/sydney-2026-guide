import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const data = JSON.parse(await readFile('trip.json', 'utf8'));
assert.equal(data.days.length, 6);
assert.equal(data.reservations.length, 3);
assert.equal(data.places.length, 31);
assert.equal(data.trip.title, '三个人的悉尼夏天');
assert.ok(!data.cartoApiKey);
assert.equal(data.places.filter(p => p.image_url).length, 31);
assert.equal(data.permissions.share_budget, false);
assert.equal(data.baseCurrency, 'AUD');
assert.ok(!JSON.stringify(data).includes('39 Thomas'));
assert.match(data.places.find(p => p.name.includes('放下行李')).notes, /房东已确认可以提前寄存行李/);
assert.equal((Date.parse('2026-12-06T11:05:00+11:00')-Date.parse('2026-12-06T08:30:00+10:00'))/60000, 95);
assert.equal((Date.parse('2026-12-11T13:40:00+10:00')-Date.parse('2026-12-11T13:20:00+11:00'))/60000, 80);
const remote = process.env.GUIDE_URL;
const server = remote ? null : spawn('python3', ['-m', 'http.server', '8768', '--bind', '127.0.0.1'], { stdio: 'ignore' });
const url = remote || 'http://127.0.0.1:8768/docs/';
let browser, page;
const errors = [], badLocal = [], backend = [], mapResponses = [];
try {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(url)).ok) break; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  browser = await chromium.launch({ headless: true,
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (/\/api\/|localhost:3000|127\.0\.0\.1:3000/.test(r.url())) backend.push(r.url()); });
  page.on('response', r => {
    if (r.url().startsWith(new URL(url).origin) && r.status() >= 400) badLocal.push(`${r.status()} ${r.url()}`);
    if (r.url().includes('tiles.openfreemap.org') && r.ok()) mapResponses.push(r.url());
  });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.getByRole('heading', { name: data.trip.title }).waitFor();
  assert.equal(await page.locator('button[aria-pressed]').count(), 7);
  const seenPhotos = new Set();
  for (let i = 0; i < 6; i++) {
    await page.locator('button[aria-pressed]').nth(i + 1).click();
    assert.equal(await page.locator('button[aria-expanded="true"]').count(), 1);
    await page.locator('.leaflet-marker-icon').first().waitFor({ state: 'visible', timeout: 10000 });
    for (const img of await page.locator('.shared-place-photo').all()) {
      await img.scrollIntoViewIfNeeded(); await img.evaluate(el => el.decode());
      seenPhotos.add(await img.getAttribute('src'));
    }
    assert.equal(await page.locator('.shared-place-details details[open]').count(), 0);
    if (i === 0 || i === 5) {
      const hk = i === 0 ? '布里斯班机场 国内航站楼' : '黄金海岸机场 T1';
      await page.locator(`.leaflet-marker-icon[title="${hk}"]`).waitFor();
      const airport = page.locator(`.leaflet-marker-icon[title="${i === 0 ? '悉尼机场 T3' : '悉尼机场 T2'}"]`);
      if (!await airport.count()) await page.locator('.marker-cluster-wrapper').last().click();
      await airport.waitFor(); await airport.focus(); await airport.press('Enter');
      assert.ok(await page.locator('.leaflet-popup a[target="_blank"]').count());
      await page.locator('.leaflet-popup-close-button').click();
    }
  }
  assert.equal(seenPhotos.size, 31);
  assert.equal(await page.title(), data.trip.title);
  await page.locator('button[aria-pressed]').nth(3).click();
  await page.getByRole('link', { name: '官方行程查询', exact: true }).waitFor();
  await page.waitForLoadState('networkidle');
  assert.match(await page.locator('body').innerText(), /Manly/);
  assert.ok(await page.locator('.leaflet-overlay-pane path').count(), 'day route line');
  assert.ok(await page.locator('.maplibregl-canvas').count(), 'interactive vector basemap');
  assert.ok(mapResponses.some(u => /\/(?:planet|[0-9]+\/)/.test(u)), 'map tile response');
  await page.screenshot({ path: '/tmp/sydney-guide-desktop.png', fullPage: true });
  await page.getByRole('button', { name: '预订', exact: true }).click();
  const bookings = await page.locator('body').innerText();
  assert.match(bookings, /QF513/); assert.match(bookings, /VA523/);
  assert.match(bookings, /Darlington Airbnb/);
  await page.getByRole('button', { name: '计划', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button[aria-pressed]').nth(3).click();
  await page.waitForLoadState('networkidle');
  assert.match(await page.locator('body').innerText(), /Manly/);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'mobile width');
  for (const img of await page.locator('.shared-place-photo').all()) {
    await img.scrollIntoViewIfNeeded(); await img.evaluate(el => el.decode());
    assert.ok(await img.evaluate(el => el.getBoundingClientRect().right <= innerWidth + 1), 'mobile photo width');
  }
  await page.screenshot({ path: '/tmp/sydney-guide-mobile.png', fullPage: true });
  assert.deepEqual(errors, []); assert.deepEqual(badLocal, []); assert.deepEqual(backend, []);
  console.log('PASS: 6 days, 3 bookings, 31 inline photos, official source links, airport markers, map tiles/routes, mobile width, no backend requests or browser errors.');
} catch (e) {
  console.error({ errors, badLocal, backend, mapResponses: mapResponses.slice(0, 5) });
  if (page) { await page.screenshot({ path: '/tmp/sydney-guide-failure.png', fullPage: true }); console.error((await page.locator('body').innerText()).slice(0, 800)); }
  throw e;
} finally { await browser?.close(); server?.kill(); }
