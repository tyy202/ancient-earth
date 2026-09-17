// Run with a locally installed Playwright: node tests/responsive.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
  const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg'};
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROME_PATH || undefined, args: ['--enable-unsafe-swiftshader']});
    for (const [name, width, height, mobile] of [['desktop',1440,900,false], ['phone',393,852,true], ['small-phone',320,568,true], ['landscape',852,393,true], ['small-landscape',568,320,true]]) {
      const context = await browser.newContext({viewport: {width, height}, isMobile: mobile, hasTouch: mobile});
      const errors = [], external = [];
      await context.route('**/*', route => {
        if (!route.request().url().startsWith(origin)) { external.push(route.request().url()); return route.abort(); }
        // Serve repository bytes directly so host antivirus HTTP injection cannot alter the page.
        const pathname = new URL(route.request().url()).pathname;
        const file = path.join(root, pathname === '/' ? 'index.html' : decodeURIComponent(pathname));
        if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({status:404});
        return route.fulfill({path:file});
      });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin);
      await page.locator('#loading').waitFor({state: 'hidden'});
      const toggle = page.locator('#explanation-toggle');
      assert.equal(await toggle.isVisible(), mobile, name + ': separate mobile layout');
      await page.selectOption('#years-ago', '370');
      assert.match(await page.locator('#how-long-ago').textContent(), /3.7/);
      if (mobile) {
        assert.equal(await page.locator('#explanation').isVisible(), false);
        await toggle.click();
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        assert.equal(await page.locator('#explanation').isVisible(), true);
        await toggle.click();
        for (const id of ['years-ago','jump-to','remove-clouds','stop-rotation','explanation-toggle']) {
          const box = await page.locator('#' + id).boundingBox();
          assert(box.height >= 44, name + ': touch target ' + id);
        }
      }
      await page.selectOption('#jump-to', '170');
      assert.equal(await page.locator('#years-ago').inputValue(), '170');
      await page.locator('#stop-rotation').click();
      await page.locator('#remove-clouds').click();
      assert.equal(await page.locator('#stop-rotation').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('#remove-clouds').textContent(), '显示云层');
      await page.locator('#remove-clouds').click();
      assert.equal(await page.locator('#remove-clouds').getAttribute('aria-pressed'), 'false');
      await page.locator('#remove-clouds').click();
      const canvas = page.locator('canvas');
      const globe = await canvas.boundingBox();
      assert(globe.width > 100 && globe.height > 100, name + ': usable globe area');
      if (mobile) {
        const controls = await page.locator('#controls').boundingBox();
        const info = await page.locator('#info-panel').boundingBox();
        assert(controls.y + controls.height <= globe.y + 1 || controls.x >= globe.x + globe.width - 1, name + ': controls do not cover globe');
        assert(info.y >= globe.y + globe.height - 1 || info.x >= globe.x + globe.width - 1, name + ': info does not cover globe');
        const cdp = await context.newCDPSession(page);
        const x = globe.x + globe.width / 2, y = globe.y + globe.height / 2;
        const before = await canvas.screenshot();
        await cdp.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x, y}]});
        await cdp.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{x:x+40, y:y+15}]});
        await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
        assert(!before.equals(await canvas.screenshot()), name + ': one finger rotates');
        const rotated = await canvas.screenshot();
        await cdp.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{id:0,x:x-20,y},{id:1,x:x+20,y}]});
        await cdp.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{id:0,x:x-40,y},{id:1,x:x+40,y}]});
        assert(!rotated.equals(await canvas.screenshot()), name + ': pinch zooms');
        await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[{id:1,x:x+40,y}]});
        const pinched = await canvas.screenshot();
        await cdp.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{id:0,x,y:y+15}]});
        await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
        assert(!pinched.equals(await canvas.screenshot()), name + ': pinch transitions to drag');
        await page.setViewportSize({width:height,height:width});
        await page.waitForFunction(() => {
          const c = document.querySelector('canvas'), r = document.querySelector('#webgl').getBoundingClientRect();
          return Math.abs(c.width-r.width) < 2 && Math.abs(c.height-r.height) < 2;
        });
        await page.setViewportSize({width,height});
      } else {
        const x = globe.x + globe.width / 2, y = globe.y + globe.height / 2;
        const before = await canvas.screenshot();
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x+80, y+30, {steps:5});
        await page.mouse.up();
        assert(!before.equals(await canvas.screenshot()), 'desktop: mouse rotates');
        await page.keyboard.press('ArrowRight');
        assert.equal(await page.locator('#years-ago').inputValue(), '150');
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, name + ': no horizontal overflow');
      assert.deepEqual(errors, [], name + ': no JS errors');
      assert.deepEqual(external, [], name + ': stays offline');
      if (process.env.SCREENSHOT_DIR) await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR, name + '.png')});
      console.log('PASS ' + name);
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
