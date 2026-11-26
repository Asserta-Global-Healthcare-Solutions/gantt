// Audita licencias directas y transitivas de node_modules en poc/gantt-poc/
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const rootPkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const nmRoot = join(root, 'node_modules');

const pkgs = [];
function scan(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const name of entries) {
    if (name === '.bin' || name === '.cache') continue;
    const full = join(dir, name);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (!st.isDirectory()) continue;
    if (name.startsWith('@')) {
      scan(full);
      continue;
    }
    const pkgPath = join(full, 'package.json');
    try {
      const p = JSON.parse(readFileSync(pkgPath, 'utf8'));
      const files = readdirSync(full);
      const licenseFiles = files.filter((f) => /^licen[sc]e|^copying|^notice/i.test(f));
      const rawLicense = typeof p.license === 'string'
        ? p.license
        : p.license?.type ?? (Array.isArray(p.licenses) ? p.licenses.map((l) => l.type ?? l).join(' OR ') : 'UNKNOWN');
      pkgs.push({
        name: p.name ?? name,
        version: p.version ?? 'UNKNOWN',
        license: rawLicense,
        licenseFiles,
        direct: Boolean(rootPkg.dependencies?.[p.name] || rootPkg.devDependencies?.[p.name]),
        section: rootPkg.dependencies?.[p.name] ? 'dependencies' : rootPkg.devDependencies?.[p.name] ? 'devDependencies' : 'transitive',
        path: relative(root, full).replaceAll('\\', '/'),
      });
    } catch { /* ignore */ }
    // Recurse into nested node_modules
    scan(join(full, 'node_modules'));
  }
}

scan(nmRoot);
pkgs.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));

const byLicense = {};
const risky = [];
const ALLOWED_RE = /^(MIT|ISC|BSD-2-Clause|BSD-3-Clause|Apache-2\.0|0BSD|CC0-1\.0|Unlicense|BlueOak-1\.0\.0|Python-2\.0|MPL-2\.0|CC-BY-4\.0|\(MIT OR Apache-2\.0\)|\(MIT OR CC0-1\.0\)|\(BSD-2-Clause OR MIT OR Apache-2\.0\)|\(MIT AND Zlib\)|\(BSD-3-Clause OR MIT\)|\(Apache-2\.0 OR MIT\)|\(ISC OR MIT\)|MIT\*)$/i;

for (const p of pkgs) {
  byLicense[p.license] = (byLicense[p.license] ?? 0) + 1;
  if (!ALLOWED_RE.test(p.license.trim())) risky.push(p);
}

const direct = pkgs.filter((p) => p.direct);
const report = {
  auditedAt: new Date().toISOString(),
  totalPackages: pkgs.length,
  directCount: direct.length,
  transitiveCount: pkgs.length - direct.length,
  direct,
  licenseBreakdown: byLicense,
  flaggedOrNonStandard: risky,
};

writeFileSync(join(root, 'bench', 'licenses-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  totalPackages: report.totalPackages,
  direct: direct.map((d) => `${d.name}@${d.version} (${d.license})`),
  licenseBreakdown: byLicense,
  flaggedCount: risky.length,
  flagged: risky.map((r) => `${r.name}@${r.version} (${r.license})`),
}, null, 2));
