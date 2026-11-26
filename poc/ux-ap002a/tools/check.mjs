// Capturas + accesibilidad (axe-core) + errores de consola, con el Chrome local. Uso:
//   node tools/check.mjs [--dirs a,b] [--out ../../docs/f0/assets/ap-002a] [--widths 1440,360]
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const dirs = arg('dirs', 'a,b').split(',');
const widths = arg('widths', '1440').split(',').map(Number);
const out = resolve(here, arg('out', '../shots'));
mkdirSync(out, { recursive: true });
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const PORT = 4173, base = `http://127.0.0.1:${PORT}/ux-ap002a`;

const server = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', resolve(here, '../..')], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const axeSrc = readFileSync(resolve(here, '../node_modules/axe-core/axe.min.js'), 'utf8');
let failures = 0;

async function visit(path, { theme, width, name, act }) {
  const page = await browser.newPage({ viewport: { width, height: width < 600 ? 780 : 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`${base}/${path}${path.includes('?') ? '&' : '?'}theme=${theme}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (act) await act(page);
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(out, `${name}.png`) });
  await page.addScriptTag({ content: axeSrc });
  const res = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }));
  const serious = res.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
  const line = `${name.padEnd(34)} errores JS ${errors.length}  axe serias/críticas ${serious.length}  (moderadas/menores ${res.violations.length - serious.length})`;
  console.log(line);
  for (const v of res.violations) console.log(`   · [${v.impact}] ${v.id}: ${v.help} — ${v.nodes.length} nodos · ej. ${v.nodes[0].target.join(' ')} · ${v.nodes[0].html.slice(0, 160)}`);
  for (const e of errors) console.log(`   ! ${e}`);
  failures += errors.length + serious.length;
  await page.close();
}

const dragFirstAuto = async (page) => {
  // Primera barra automática realmente visible (no tapada por la tabla fija ni por el panel).
  const box = await page.evaluate(() => {
    for (const b of document.querySelectorAll('.g-item.c-AUTO .g-bar.drag')) {
      const r = b.getBoundingClientRect(), x = r.left + Math.min(10, r.width / 2), y = r.top + r.height / 2;
      if (document.elementFromPoint(x, y)?.closest('.g-bar') === b) return { x: x - 10, y: r.top, width: r.width, height: r.height };
    }
    return null;
  });
  if (!box) throw new Error('ninguna barra automática visible para arrastrar');
  await page.mouse.move(box.x + 10, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 10 + 90, box.y + box.height / 2, { steps: 6 });
  await page.mouse.up();
  await page.waitForSelector('dialog.impact[open]', { timeout: 5000 });
};

for (const d of dirs) {
  for (const theme of ['light', 'dark']) for (const width of widths) {
    await visit(`${d}/inicio.html`, { theme, width, name: `${d}-inicio-${theme}-${width}` });
    await visit(`${d}/gantt.html`, { theme, width, name: `${d}-gantt-${theme}-${width}` });
  }
  const w = widths[0];
  await visit(`${d}/gantt.html?task=3.3`, { theme: d === 'a' ? 'dark' : 'light', width: w, name: `${d}-gantt-conflicto-${w}` });
  await visit(`${d}/gantt.html?task=2.1`, { theme: d === 'a' ? 'dark' : 'light', width: w, name: `${d}-gantt-historial-${w}`, act: (p) => p.click('[data-tab="historial"]') });
  await visit(`${d}/gantt.html`, { theme: d === 'a' ? 'dark' : 'light', width: w, name: `${d}-gantt-impacto-${w}`, act: dragFirstAuto });
  await visit(`${d}/gantt.html`, { theme: d === 'a' ? 'light' : 'dark', width: w, name: `${d}-gantt-semana-${w}`, act: (p) => p.click('[data-zoom="semana"]') });
  for (const e of ['vacio', 'error', 'sinpermiso']) await visit(`${d}/gantt.html?estado=${e}`, { theme: d === 'a' ? 'dark' : 'light', width: w, name: `${d}-estado-${e}` });
}
await browser.close();
server.kill();
console.log(failures ? `\nFALLOS: ${failures}` : '\nOK: sin errores JS ni violaciones serias/críticas');
process.exit(failures ? 1 : 0);
