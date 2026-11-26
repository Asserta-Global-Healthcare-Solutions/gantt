// Benchmark reproducible AP-003 sobre build de PRODUCCIÓN (next start) en Next.js 16 + React 19.
// Mide las 4 alternativas (/frappe, /svar, /dhtmlx, /custom) con el mismo dataset (1000 tareas / 2000 vínculos),
// mismo horizonte, mismo navegador Chrome local y mismo hardware.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const repoRoot = resolve(root, '../../../..');
const nmShared = existsSync(join(repoRoot, 'poc', 'ux-ap002a', 'node_modules', 'playwright-core'))
  ? join(repoRoot, 'poc', 'ux-ap002a', 'node_modules')
  : resolve(root, '../ux-ap002a/node_modules');

const require = createRequire(join(nmShared, 'playwright-core', 'package.json'));
const { chromium } = require('playwright-core');
const axeSource = readFileSync(join(nmShared, 'axe-core', 'axe.min.js'), 'utf8');

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);
  for (const p of candidates) if (existsSync(p)) return p;
  throw new Error('No se encontró Chrome ni Edge instalado localmente');
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1));
  return +s[idx].toFixed(2);
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Servidor no respondió en ${timeoutMs} ms: ${url}\n---SERVER LOGS---\n${serverLogs}`);
}

const PORT = 4180;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ROUTES = [
  { id: 'frappe', path: '/frappe' },
  { id: 'svar', path: '/svar' },
  { id: 'dhtmlx', path: '/dhtmlx' },
  { id: 'custom', path: '/custom' },
];

const shotsDir = resolve(root, '../../docs/f0/assets/ap-003');
mkdirSync(shotsDir, { recursive: true });

// Arrancar next start (build de producción)
const nextBin = join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const server = spawn(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', String(PORT)], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverLogs = '';
server.stdout.on('data', (d) => (serverLogs += d.toString()));
server.stderr.on('data', (d) => (serverLogs += d.toString()));

let browser;
try {
  await waitForServer(BASE_URL);
  const chromePath = findChrome();
  browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--enable-precise-memory-info'],
  });

  const results = {};

  for (const route of ROUTES) {
    const firstRenderSamples = [];
    let diagnostics = null;
    let scrollFps = null;
    let zoomLatencies = [];
    let dragLatencies = [];
    let domNodes = 0;
    let heapMb = null;
    let axeLight = null;
    let axeDark = null;
    const errors = [];

    let failedReason = null;

    // 3 pasadas de carga completa sobre producción para p50 / p95 de primer render
    for (let pass = 0; pass < 3; pass++) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
      });

      try {
        const t0 = performance.now();
        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForFunction(() => Boolean(window.__POC_HOOKS__?.isReady?.()), { timeout: 15000 });
        // Esperar 2 frames para asegurar pintura real
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
        const renderMs = performance.now() - t0;
        firstRenderSamples.push(+renderMs.toFixed(2));
      } catch (err) {
        failedReason = String(err?.message ?? err);
        try {
          const domDiag = await page.evaluate(() => ({
            text: document.body?.innerText?.slice(0, 400) ?? '',
            hasHooks: Boolean(window.__POC_HOOKS__),
            diag: window.__POC_HOOKS__?.getDiagnostics?.() ?? null,
            domNodes: document.querySelectorAll('*').length,
          }));
          diagnostics = domDiag;
          domNodes = domDiag.domNodes;
          await page.screenshot({ path: join(shotsDir, `${route.id}-light-1440.jpg`), type: 'jpeg', quality: 82 });
        } catch { /* ignore */ }
        await ctx.close();
        break;
      }

      if (pass === 2) {
        // Esperar check de integridad (SVAR tiene setTimeout 150ms)
        await page.waitForTimeout(300);

        // Captura en modo claro (1440x900)
        await page.screenshot({ path: join(shotsDir, `${route.id}-light-1440.jpg`), type: 'jpeg', quality: 82 });

        diagnostics = await page.evaluate(() => window.__POC_HOOKS__.getDiagnostics());
        domNodes = await page.evaluate(() => document.querySelectorAll('*').length);
        heapMb = await page.evaluate(() => {
          const m = performance.memory;
          return m ? +(m.usedJSHeapSize / (1024 * 1024)).toFixed(2) : null;
        });

        // Medir latencia de preview de drag (20 muestras)
        for (let i = 0; i < 20; i++) {
          const dt = await page.evaluate(
            (idx) =>
              new Promise((resolve) => {
                const s = performance.now();
                window.__POC_HOOKS__.simulateDragPreview(idx);
                requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - s)));
              }),
            i
          );
          dragLatencies.push(+dt.toFixed(2));
        }

        // Medir FPS durante scroll vertical y horizontal real (45 frames)
        scrollFps = await page.evaluate(
          () =>
            new Promise((resolve) => {
              const sc = window.__POC_HOOKS__.getScrollContainer();
              if (!sc) return resolve({ avgFps: 0, p5Fps: 0, scrolledPx: 0 });
              const deltas = [];
              let last = performance.now();
              let step = 0;
              const maxY = Math.max(0, sc.scrollHeight - sc.clientHeight);
              const maxX = Math.max(0, sc.scrollWidth - sc.clientWidth);
              function tick(now) {
                if (step > 0) deltas.push(now - last);
                last = now;
                step++;
                if (step <= 30) {
                  sc.scrollTop = Math.min(maxY, (step / 30) * Math.min(maxY, 4500));
                } else {
                  sc.scrollLeft = Math.min(maxX, ((step - 30) / 15) * Math.min(maxX, 2400));
                }
                if (step < 45) requestAnimationFrame(tick);
                else {
                  sc.scrollTop = 0;
                  sc.scrollLeft = 0;
                  const fpsList = deltas.map((d) => (d > 0 ? 1000 / d : 60));
                  const avg = fpsList.reduce((a, b) => a + b, 0) / Math.max(1, fpsList.length);
                  const sorted = [...fpsList].sort((a, b) => a - b);
                  const p5 = sorted[Math.floor(sorted.length * 0.05)] ?? 0;
                  resolve({ avgFps: +avg.toFixed(1), p5Fps: +p5.toFixed(1), maxScrollY: maxY, maxScrollX: maxX });
                }
              }
              requestAnimationFrame(tick);
            })
        );

        // Medir latencia de cambio de zoom (mes -> semana -> dia -> mes -> anio, 2 ciclos = 8 cambios)
        const zoomSeq = ['semana', 'dia', 'mes', 'anio', 'semana', 'mes'];
        for (const z of zoomSeq) {
          const zt = await page.evaluate(
            (targetZoom) =>
              new Promise((resolve) => {
                const s = performance.now();
                window.__POC_HOOKS__.setZoom(targetZoom);
                requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - s)));
              }),
            z
          );
          zoomLatencies.push(+zt.toFixed(2));
        }

        // Auditoría axe-core en modo claro
        await page.addScriptTag({ content: axeSource });
        axeLight = await page.evaluate(async () => {
          const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
          return {
            total: r.violations.length,
            seriousOrCritical: r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').length,
            rules: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
          };
        });

        // Cambiar a modo oscuro, capturar y auditar axe-core en oscuro
        await page.evaluate(() => window.__POC_HOOKS__.setTheme('dark'));
        await page.waitForTimeout(200);
        await page.screenshot({ path: join(shotsDir, `${route.id}-dark-1440.jpg`), type: 'jpeg', quality: 82 });
        axeDark = await page.evaluate(async () => {
          const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
          return {
            total: r.violations.length,
            seriousOrCritical: r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').length,
            rules: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
          };
        });
      }

      await ctx.close();
    }

    results[route.id] = {
      failedReason,
      firstRenderMs: {
        samples: firstRenderSamples,
        p50: percentile(firstRenderSamples, 50),
        p95: percentile(firstRenderSamples, 95),
      },
      zoomLatencyMs: {
        p50: percentile(zoomLatencies, 50),
        p95: percentile(zoomLatencies, 95),
        samples: zoomLatencies,
      },
      dragPreviewLatencyMs: {
        p50: percentile(dragLatencies, 50),
        p95: percentile(dragLatencies, 95),
      },
      scrollFps,
      domNodes,
      jsHeapMb: heapMb,
      diagnostics,
      axeLight,
      axeDark,
      consoleErrors: [...new Set(errors)],
    };
    console.log(`[${route.id}] failed=${Boolean(failedReason)} render p50=${results[route.id].firstRenderMs.p50}ms p95=${results[route.id].firstRenderMs.p95}ms · fps=${scrollFps?.avgFps} · dom=${domNodes} · heap=${heapMb}MB · intact=${diagnostics?.integrity?.intact} · axe(L/D)=${axeLight?.seriousOrCritical}/${axeDark?.seriousOrCritical}`);
  }

  const out = {
    executedAt: new Date().toISOString(),
    environment: {
      node: process.version,
      os: `${os.platform()} ${os.release()} (${os.arch()})`,
      cpu: os.cpus()[0]?.model ?? 'unknown',
      cores: os.cpus().length,
      ramGb: +(os.totalmem() / (1024 ** 3)).toFixed(1),
      browserPath: chromePath,
      browserVersion: browser.version(),
      mode: 'next build + next start (producción)',
    },
    results,
  };

  writeFileSync(join(root, 'bench', 'bench-results.json'), JSON.stringify(out, null, 2));
  console.log('OK: bench-results.json guardado');
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
  setTimeout(() => { try { server.kill('SIGKILL'); } catch {} }, 1500);
}
