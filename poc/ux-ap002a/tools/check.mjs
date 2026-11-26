// Capturas + accesibilidad (axe-core) + errores de consola + regresiones funcionales, con el Chrome local.
//   node tools/check.mjs [--dirs a,b,c] [--widths 1280,1440,1920] [--out ../shots] [--format png|jpeg] [--no-shots]
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, extname, normalize, sep } from 'node:path';
import { chromium } from 'playwright-core';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const dirs = arg('dirs', 'a,b,c').split(',');
const widths = arg('widths', '1280,1440,1920').split(',').map(Number);
const out = resolve(here, arg('out', '../shots'));
const format = arg('format', 'png');
const shots = !process.argv.includes('--no-shots');
mkdirSync(out, { recursive: true });
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const PORT = 4173, base = `http://127.0.0.1:${PORT}/ux-ap002a`;
const DEFAULT_THEME = { a: 'dark', b: 'light', c: 'light' };

// Servidor estático mínimo (sustituye a python -m http.server, cuya cola de 5 conexiones provocaba rechazos intermitentes).
const ROOT = resolve(here, '../..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = createServer((req, res) => {
  const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!path.startsWith(ROOT + sep) || !existsSync(path) || !statSync(path).isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(readFileSync(path));
});
await new Promise((r) => server.listen({ port: PORT, host: '127.0.0.1', backlog: 512 }, r));
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const axeSrc = readFileSync(resolve(here, '../node_modules/axe-core/axe.min.js'), 'utf8');
let failures = 0, visits = 0;
const fail = (msg) => { failures++; console.log(`   ✗ ${msg}`); };

async function open(path, { theme, width }) {
  const page = await browser.newPage({ viewport: { width, height: width < 600 ? 800 : 900 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(6000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`${base}/${path}${path.includes('?') ? '&' : '?'}theme=${theme}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  return { page, errors };
}
async function audit(page, errors, name) {
  visits++;
  if (shots) await page.screenshot({ path: join(out, `${name}.${format === 'jpeg' ? 'jpg' : 'png'}`), type: format, ...(format === 'jpeg' ? { quality: 82 } : {}) });
  await page.addScriptTag({ content: axeSrc });
  const res = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }));
  const serious = res.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
  console.log(`${name.padEnd(40)} errores JS ${errors.length}  axe serias/críticas ${serious.length}  (moderadas/menores ${res.violations.length - serious.length})`);
  for (const v of res.violations) console.log(`   · [${v.impact}] ${v.id}: ${v.help} — ${v.nodes.length} nodos · ${v.nodes[0].html.slice(0, 140)}`);
  for (const e of errors) console.log(`   ! ${e}`);
  failures += errors.length + serious.length;
}
async function visit(path, opts, act) {
  const { page, errors } = await open(path, opts);
  if (act) await act(page);
  await page.waitForTimeout(200);
  await audit(page, errors, opts.name);
  await page.close();
}

// Barra AUTO visible (no tapada por la tabla fija ni por el panel)
const visibleBar = (page) => page.evaluate(() => {
  for (const b of document.querySelectorAll('.g-item.c-AUTO .g-bar.drag')) {
    const r = b.getBoundingClientRect(), x = r.left + Math.min(10, r.width / 2), y = r.top + r.height / 2;
    if (r.width > 20 && document.elementFromPoint(x, y)?.closest('.g-bar') === b) return { id: b.closest('.g-item').dataset.id, x: r.left, y: r.top, w: r.width, h: r.height };
  }
  return null;
});
const dialogOpen = (page) => page.waitForSelector('dialog.impact[open]', { timeout: 4000 }).then(() => true, () => false);
const dragBar = async (page, dx = 90) => {
  const b = await visibleBar(page);
  if (!b) throw new Error('ninguna barra automática visible');
  await page.mouse.move(b.x + 10, b.y + b.h / 2); await page.mouse.down();
  await page.mouse.move(b.x + 10 + dx, b.y + b.h / 2, { steps: 6 }); await page.mouse.up();
  return b;
};

/** Regresiones funcionales comunes (A, B y C). */
async function regressions(d) {
  const theme = DEFAULT_THEME[d], width = 1920;
  const check = async (label, fn) => {
    const { page, errors } = await open(`${d}/gantt.html`, { theme, width });
    try { const ok = await fn(page); console.log(`   ${ok ? '✓' : '✗'} ${d} · ${label}`); if (!ok) failures++; }
    catch (e) { fail(`${d} · ${label}: ${e.message.split('\n')[0]}`); }
    for (const e of errors) fail(`${d} · ${label}: error JS ${e}`);
    await page.close();
  };
  console.log(`\nRegresiones funcionales · ${d}`);
  await check('arrastre → vista previa → diálogo de impacto → confirmar sube revisión', async (p) => {
    await dragBar(p); if (!(await dialogOpen(p))) return false;
    const movedText = await p.textContent('dialog.impact');
    const confirm = p.locator('dialog.impact .btn-primary');
    if (await confirm.isDisabled()) await p.check('dialog.impact input[type=checkbox]');
    await confirm.click();
    await p.waitForTimeout(200);
    return /Tareas desplazadas/.test(movedText) && (await p.textContent('body')).includes('42');
  });
  await check('cancelar la vista previa no persiste', async (p) => {
    const b = await dragBar(p); if (!(await dialogOpen(p))) return false;
    await p.click('dialog.impact footer .btn:not(.btn-primary)');
    const after = await p.evaluate((id) => document.querySelector(`.g-item[data-id="${id}"] .g-bar`).getBoundingClientRect().left, b.id);
    return Math.abs(after - b.x) < 1 && !(await p.$('.gantt.is-preview'));
  });
  await check('redimensionar duración → diálogo de impacto', async (p) => {
    const b = await visibleBar(p); const hx = b.x + b.w - 1, hy = b.y + b.h / 2;
    await p.mouse.move(hx, hy); await p.mouse.down(); await p.mouse.move(hx + 80, hy, { steps: 5 }); await p.mouse.up();
    return dialogOpen(p);
  });
  await check('teclado Alt+→ → diálogo de impacto', async (p) => {
    await p.click('.g-row[data-id="2.3"]'); await p.keyboard.press('Alt+ArrowRight');
    return dialogOpen(p);
  });
  await check('conflicto nuevo exige reconocimiento (confirmar deshabilitado)', async (p) => {
    // 5.2 es manual y está fijada justo tras el Go-live: retrasar 4.2 crea el conflicto nuevo d19 (5.1 → 5.2)
    await p.click('.g-row[data-id="4.2"]'); await p.keyboard.press('Alt+ArrowRight');
    if (!(await dialogOpen(p)) || !(await p.$('dialog.impact .impact-conf'))) return false;
    const confirm = p.locator('dialog.impact .btn-primary');
    const blocked = await confirm.isDisabled();
    await p.check('dialog.impact input[type=checkbox]');
    const enabled = !(await confirm.isDisabled());
    await confirm.click(); await p.waitForTimeout(150);
    return blocked && enabled && (await p.locator('.lk-conf').count()) === 2;
  });
  await check('filtro por persona reduce filas y avisa de que el plan no cambia', async (p) => {
    const before = await p.locator('.g-row').count();
    await p.selectOption('#f-resp', 'OV');
    const after = await p.locator('.g-row').count();
    return after < before && /plan no cambia/i.test(await p.textContent('#fnote'));
  });
  await check('ruta crítica y línea base se activan y desactivan', async (p) => {
    const on = await p.$eval('.gantt', (g) => g.classList.contains('show-critical') && g.classList.contains('show-baseline'));
    await p.click('button[data-toggle="critical"]'); await p.click('button[data-toggle="baseline"]');
    const off = await p.$eval('.gantt', (g) => !g.classList.contains('show-critical') && !g.classList.contains('show-baseline'));
    return on && off && (await p.locator('.g-base').count()) > 10;
  });
  await check('dependencias dibujadas (19) con un conflicto discontinuo', async (p) => (await p.locator('.lk').count()) === 19 && (await p.locator('.lk-conf').count()) === 1);
  await check('historial de 2.1 muestra 4 cambios', async (p) => {
    await p.click('.g-row[data-id="2.1"]'); await p.click('[data-tab="historial"]');
    return (await p.locator('.p-hist li').count()) === 4;
  });
}

/** Comportamiento propio de C. */
async function cSpecific() {
  console.log('\nComportamiento propio · c');
  const t = async (label, width, path, fn) => {
    const { page, errors } = await open(path, { theme: 'light', width });
    try { const ok = await fn(page); console.log(`   ${ok ? '✓' : '✗'} c · ${label}`); if (!ok) failures++; } catch (e) { fail(`c · ${label}: ${e.message.split('\n')[0]}`); }
    for (const e of errors) fail(`c · ${label}: error JS ${e}`);
    await page.close();
  };
  await t('1280 px: panel acoplado pasa a flotante por falta de espacio', 1280, 'c/gantt.html?task=2.1&panel=dock', async (p) => (await p.getAttribute('#stage', 'data-mode')) === 'float' && /automático/.test(await p.textContent('#p-mode')));
  await t('1920 px: panel acoplado se mantiene acoplado', 1920, 'c/gantt.html?task=2.1&panel=dock', async (p) => (await p.getAttribute('#stage', 'data-mode')) === 'dock');
  await t('1440 px: al plegar navegación y estrechar la tabla vuelve a acoplarse', 1440, 'c/gantt.html?task=2.1&panel=dock&nav=plegada', async (p) => {
    await p.focus('.g-resize'); for (let i = 0; i < 6; i++) await p.keyboard.press('ArrowLeft');
    return (await p.getAttribute('#stage', 'data-mode')) === 'dock';
  });
  await t('densidad compacta: filas de 28 px; estándar: 36 px', 1440, 'c/gantt.html', async (p) => {
    const std = await p.$eval('.g-row[data-id="2.1"]', (r) => r.getBoundingClientRect().height);
    await p.click('button[data-density="compacta"]');
    const cmp = await p.$eval('.g-row[data-id="2.1"]', (r) => r.getBoundingClientRect().height);
    return std === 36 && cmp === 28;
  });
  await t('preferencias persistentes (densidad, zoom, panel) tras recargar', 1440, 'c/gantt.html', async (p) => {
    await p.click('button[data-density="compacta"]'); await p.click('button[data-zoom="semana"]'); await p.click('button[data-panel="float"]');
    await p.reload({ waitUntil: 'networkidle' });
    return (await p.getAttribute('html', 'data-density')) === 'compacta' && (await p.getAttribute('button[data-zoom="semana"]', 'aria-pressed')) === 'true' && (await p.getAttribute('button[data-panel="float"]', 'aria-pressed')) === 'true';
  });
  await t('tabla redimensionable por teclado (+64 px)', 1440, 'c/gantt.html', async (p) => {
    const w0 = await p.$eval('.g-grid', (g) => g.offsetWidth);
    await p.focus('.g-resize'); for (let i = 0; i < 4; i++) await p.keyboard.press('ArrowRight');
    return (await p.$eval('.g-grid', (g) => g.offsetWidth)) - w0 === 64;
  });
  await t('pantalla completa oculta navegación y titular; F la alterna', 1440, 'c/gantt.html', async (p) => {
    await p.keyboard.press('f');
    const on = await p.evaluate(() => document.body.classList.contains('vista-completa') && getComputedStyle(document.querySelector('.index')).display === 'none');
    await p.keyboard.press('f');
    return on && !(await p.evaluate(() => document.body.classList.contains('vista-completa')));
  });
  await t('tooltip de indicador por teclado (role=tooltip + aria-describedby)', 1440, 'c/gantt.html', async (p) => {
    await p.focus('.read'); await p.waitForTimeout(50);
    return (await p.isVisible('#tip')) && (await p.getAttribute('.read', 'aria-describedby')) === 'tip';
  });
  await t('390 px: lista de lectura y ficha a pantalla completa', 390, 'c/gantt.html', async (p) => {
    const list = (await p.isVisible('#mlist')) && !(await p.isVisible('#gantt'));
    await p.click('#mlist button >> nth=4');
    return list && (await p.getAttribute('#stage', 'data-sheet')) === 'open' && (await p.isVisible('#panel'));
  });
}

for (const d of dirs) {
  for (const theme of ['light', 'dark']) for (const width of widths) {
    await visit(`${d}/inicio.html`, { theme, width, name: `${d}-inicio-${theme}-${width}` });
    await visit(`${d}/gantt.html`, { theme, width, name: `${d}-gantt-${theme}-${width}` });
  }
  const th = DEFAULT_THEME[d];
  await visit(`${d}/gantt.html?task=3.3`, { theme: th, width: 1440, name: `${d}-gantt-conflicto-1440` });
  await visit(`${d}/gantt.html?task=2.1`, { theme: th, width: 1440, name: `${d}-gantt-historial-1440` }, (p) => p.click('[data-tab="historial"]'));
  await visit(`${d}/gantt.html`, { theme: th, width: 1440, name: `${d}-gantt-impacto-1440` }, async (p) => { await dragBar(p); await dialogOpen(p); });
  for (const e of ['vacio', 'error', 'sinpermiso']) await visit(`${d}/gantt.html?estado=${e}`, { theme: th, width: 1440, name: `${d}-estado-${e}` });
  await visit(`${d}/inicio.html`, { theme: th, width: 390, name: `${d}-inicio-${th}-390` });
  if (d === 'c') {
    await visit('c/gantt.html?densidad=compacta', { theme: 'light', width: 1440, name: 'c-gantt-compacta-1440' });
    await visit('c/gantt.html?densidad=compacta', { theme: 'dark', width: 1920, name: 'c-gantt-compacta-dark-1920' });
    await visit('c/gantt.html?task=2.1&panel=dock', { theme: 'light', width: 1920, name: 'c-gantt-panel-acoplado-1920' });
    await visit('c/gantt.html?task=2.1&panel=dock', { theme: 'light', width: 1280, name: 'c-gantt-panel-auto-flotante-1280' });
    await visit('c/gantt.html?vista=completa&densidad=compacta', { theme: 'light', width: 1440, name: 'c-gantt-pantalla-completa-1440' });
    await visit('c/gantt.html?vista=completa', { theme: 'dark', width: 1920, name: 'c-gantt-pantalla-completa-dark-1920' });
    await visit('c/gantt.html?zoom=semana&panel=closed', { theme: 'light', width: 1440, name: 'c-gantt-critica-linea-base-1440' });
    await visit('c/gantt.html?task=3.3&panel=float', { theme: 'dark', width: 1440, name: 'c-gantt-conflicto-dark-1440' });
    await visit('c/gantt.html', { theme: 'light', width: 1440, name: 'c-gantt-leyenda-1440' }, (p) => p.click('#keys-btn'));
    await visit('c/gantt.html', { theme: 'light', width: 390, name: 'c-gantt-movil-lista-390' });
    await visit('c/gantt.html', { theme: 'light', width: 390, name: 'c-gantt-movil-ficha-390' }, (p) => p.click('#mlist button >> nth=4'));
  }
  await regressions(d);
  if (d === 'c') await cSpecific();
}
await browser.close();
server.close();
console.log(`\nCargas auditadas: ${visits}`);
console.log(failures ? `FALLOS: ${failures}` : 'OK: sin errores JS, sin violaciones axe serias/críticas y sin regresiones');
process.exit(failures ? 1 : 0);
