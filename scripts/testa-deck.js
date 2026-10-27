// Uso: node testa-deck.js <url>
const { chromium } = require('C:/Projetos/SITES/luizeduardodf/node_modules/playwright-core');
(async () => {
  const url = process.argv[2];
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const erros = [], falhas = [];
  p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  p.on('pageerror', e => erros.push('pageerror: ' + e.message));
  p.on('requestfailed', r => falhas.push(r.url() + ' ' + (r.failure() || {}).errorText));
  p.on('response', r => { if (r.status() >= 400) falhas.push(r.status() + ' ' + r.url()); });
  await p.goto(url, { waitUntil: 'networkidle' });
  const estado = () => p.evaluate(() => ({
    slide: window.vtNavegacao ? window.vtNavegacao.atual() : null,
    visiveis: document.querySelectorAll('.passo-visivel').length,
    gsap: typeof window.gsap,
    robots: (document.querySelector('meta[name=robots]') || {}).content,
    secoes: document.querySelectorAll('section').length,
  }));
  const s0 = await estado(); console.log('inicio', JSON.stringify(s0));
  for (let i = 0; i < 6; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(500); }
  const s1 = await estado(); console.log('apos 6 setas', JSON.stringify(s1));
  await p.keyboard.press('End'); await p.waitForTimeout(800);
  const s2 = await estado(); console.log('End', JSON.stringify(s2));
  await p.keyboard.press('Home'); await p.waitForTimeout(800);
  await p.mouse.move(800, 450);
  for (let i = 0; i < 3; i++) { await p.mouse.wheel(0, 200); await p.waitForTimeout(1000); }
  const s3 = await estado(); console.log('Home + 3 rodas', JSON.stringify(s3));
  await p.keyboard.press('f'); await p.waitForTimeout(500);
  console.log('fullscreen', await p.evaluate(() => !!document.fullscreenElement));
  console.log('ERROS', JSON.stringify(erros));
  console.log('FALHAS', JSON.stringify(falhas));
  await b.close();
})();
