// Propiedades PR-01..PR-11 sobre grafos aleatorios pequeños (semilla fija → reproducible).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { schedule, forwardRelax, forwardKahn, cpmRecurrence, floatSemantic, satisfied, classOf } from '../src/schedule.mjs';
import { makeCalendar } from '../src/calendar.mjs';

const N = Number(process.env.CASES ?? 400);
const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const DATES = ['2026-11-25', '2026-11-27', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05', '2026-12-07', '2026-12-08', '2026-12-09', '2026-12-10'];
const TYPES = ['FS', 'SS', 'FF', 'SF'];

function gen(rnd, opts = {}) {
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (xs) => xs[int(0, xs.length - 1)];
  const n = int(2, 8);
  const tasks = [];
  for (let i = 0; i < n; i++) {
    const id = `T${i}`;
    const milestone = rnd() < 0.15;
    const t = { id, kind: milestone ? 'milestone' : 'task', durationDays: milestone ? 0 : int(1, 4), status: 'pendiente' };
    const r = rnd(), allowManual = opts.manual !== false;
    if (allowManual && r < 0.2) { t.scheduleMode = 'manual'; t.fixedStart = pick(DATES.slice(2)); }
    else if (r < 0.3) { const a = int(0, 6); t.status = 'completada'; t.actualFinish = DATES[Math.min(DATES.length - 1, a + (milestone ? 0 : int(0, 3)))]; t.actualStart = milestone ? t.actualFinish : DATES[a]; }
    else if (r < 0.4 && !milestone) {
      t.status = 'en_curso'; const a = int(0, 7); t.actualStart = DATES[a];
      if (rnd() < 0.5) { t.remainingDurationDays = int(1, 3); t.remainingAsOf = DATES[Math.min(DATES.length - 1, a + int(0, 3))]; }
    } else if (rnd() < 0.2) t.notBefore = pick(DATES);
    tasks.push(t);
  }
  const deps = [];
  for (let j = 1; j < n; j++) for (let i = 0; i < j; i++) if (rnd() < 0.35) deps.push({ id: `d${i}_${j}`, predecessorId: `T${i}`, successorId: `T${j}`, type: pick(TYPES), lagDays: int(-2, 3) });
  const exceptions = rnd() < 0.5 ? [{ date: pick(DATES.slice(2)), minutes: 0 }] : [];
  return { project: { startDate: '2026-11-30', timezone: 'Europe/Madrid' }, calendar: { weekdayMinutes: [480, 480, 480, 480, 480, 0, 0], exceptions }, tasks, dependencies: deps, today: '2027-01-29' };
}
const shuffle = (rnd, xs) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const leavesOf = (inp) => inp.tasks.filter((t) => t.kind !== 'group');
const reachable = (deps, from) => { const r = new Set(); const st = [from]; while (st.length) { const x = st.pop(); for (const e of deps) if (e.predecessorId === x && !r.has(e.successorId)) { r.add(e.successorId); st.push(e.successorId); } } return r; };

function forEachCase(name, fn, opts) {
  test(name, () => {
    const rnd = mulberry32(20261125);
    let ran = 0;
    for (let k = 0; k < N; k++) {
      const inp = gen(rnd, opts);
      const res = schedule(inp);
      if (res.outcome !== 'ok') continue; // p. ej. horizonte; los casos generados son válidos por construcción
      fn(inp, res, rnd); ran++;
    }
    assert.ok(ran > N * 0.9, `solo ${ran} casos válidos`);
  });
}

forEachCase('Kahn (contrato) ≡ relajación (oráculo)', (inp) => {
  const cal = makeCalendar(inp.calendar, inp.project.startDate);
  const a = forwardRelax(leavesOf(inp), inp.dependencies, cal).pos, b = forwardKahn(leavesOf(inp), inp.dependencies, cal).pos;
  for (const [id, p] of a) assert.deepEqual(b.get(id), p, id);
});

forEachCase('PR-01/PR-02 satisfacción condicionada y conflictos exactos', (inp, res) => {
  const conflictIds = new Set(res.conflicts.map((c) => c.dependencyId));
  const byId = Object.fromEntries(inp.tasks.map((t) => [t.id, t]));
  for (const e of inp.dependencies) {
    const ok = satisfied(e, { s: res.tasks[e.predecessorId].startIdx, f: res.tasks[e.predecessorId].finishIdx }, { s: res.tasks[e.successorId].startIdx, f: res.tasks[e.successorId].finishIdx }).ok;
    assert.equal(!ok, conflictIds.has(e.id), e.id);
    const c = classOf(byId[e.successorId]);
    if (!ok) assert.ok(c === 'MANUAL' || c.startsWith('FACT'), `${e.id} incumplida con sucesora ${c}`);
    if (!ok && c === 'FACT_RUNNING') assert.ok(['FS', 'SS'].includes(e.type), `cota de fin incumplida en ${e.id}`);
  }
});

forEachCase('PR-03/PR-04 hechos y manuales inmutables', (inp, res) => {
  const cal = makeCalendar(inp.calendar, inp.project.startDate);
  for (const t of leavesOf(inp)) {
    const o = res.tasks[t.id], c = classOf(t);
    if (t.actualStart) assert.equal(o.start, t.actualStart);
    if (t.actualFinish) assert.equal(o.finish, t.actualFinish);
    if (c === 'MANUAL') assert.equal(o.startIdx, cal.B(t.fixedStart));
    if (c === 'FACT_DONE' && t.kind === 'task') assert.deepEqual([o.startIdx, o.finishIdx], [cal.B(t.actualStart), cal.Bend(t.actualFinish)]);
  }
});

forEachCase('PR-05 determinismo ante permutación de entradas', (inp, res, rnd) => {
  const perm = { ...inp, tasks: shuffle(rnd, inp.tasks), dependencies: shuffle(rnd, inp.dependencies) };
  assert.deepEqual(JSON.parse(JSON.stringify(schedule(perm))), JSON.parse(JSON.stringify(res)));
});

forEachCase('PR-06 ASAP: toda AUTO tiene una cota ajustada', (inp, res) => {
  const cal = makeCalendar(inp.calendar, inp.project.startDate);
  for (const t of leavesOf(inp).filter((x) => classOf(x) === 'AUTO')) {
    const d = t.kind === 'milestone' ? 0 : t.durationDays;
    const bounds = [0, t.notBefore ? cal.B(t.notBefore) : 0];
    for (const e of inp.dependencies.filter((x) => x.successorId === t.id)) {
      const a = res.tasks[e.predecessorId];
      bounds.push({ FS: a.finishIdx + e.lagDays, SS: a.startIdx + e.lagDays, FF: a.finishIdx + e.lagDays - d, SF: a.startIdx + e.lagDays - d }[e.type]);
    }
    assert.equal(res.tasks[t.id].startIdx, Math.max(...bounds), t.id);
  }
});

forEachCase('PR-07a monotonía al aumentar un lag', (inp, res, rnd) => {
  if (!inp.dependencies.length) return;
  const k = Math.floor(rnd() * inp.dependencies.length);
  const r2 = schedule({ ...inp, dependencies: inp.dependencies.map((e, i) => (i === k ? { ...e, lagDays: e.lagDays + 1 } : e)) });
  if (r2.outcome !== 'ok') return;
  for (const t of leavesOf(inp)) {
    if (classOf(t) === 'AUTO') assert.ok(r2.tasks[t.id].startIdx >= res.tasks[t.id].startIdx, t.id);
    else assert.equal(r2.tasks[t.id].startIdx, res.tasks[t.id].startIdx, t.id);
  }
});

// PR-07b: con FF/SF entrantes, alargar la sucesora rebaja su cota de inicio (sB ≥ fA + L − dB); se excluye por definición.
forEachCase('PR-07b monotonía al alargar una tarea sin FF/SF entrantes', (inp, res, rnd) => {
  const cands = inp.tasks.filter((t) => t.kind === 'task' && !inp.dependencies.some((e) => e.successorId === t.id && ['FF', 'SF'].includes(e.type)));
  if (!cands.length) return;
  const victim = cands[Math.floor(rnd() * cands.length)].id;
  const longer = { ...inp, tasks: inp.tasks.map((t) => (t.id === victim ? { ...t, durationDays: t.durationDays + 1 } : t)) };
  const r2 = schedule(longer);
  if (r2.outcome !== 'ok') return;
  for (const t of leavesOf(inp)) {
    const c = classOf(t);
    if (c === 'AUTO') assert.ok(r2.tasks[t.id].startIdx >= res.tasks[t.id].startIdx, t.id);
    else assert.equal(r2.tasks[t.id].startIdx, res.tasks[t.id].startIdx, t.id);
  }
});

forEachCase('PR-08 AUTO nunca antes del inicio del proyecto', (inp, res) => {
  for (const t of leavesOf(inp)) if (classOf(t) === 'AUTO') assert.ok(res.tasks[t.id].startIdx >= 0, t.id);
});

forEachCase('PR-09 holgura: recurrencia del contrato ≡ definición semántica', (inp, res) => {
  const cal = makeCalendar(inp.calendar, inp.project.startDate);
  for (const t of leavesOf(inp)) assert.equal(res.tasks[t.id].totalFloat, floatSemantic(leavesOf(inp), inp.dependencies, cal, t.id), t.id);
});

forEachCase('PR-09 holgura ≥ 0 sin tareas manuales', (inp, res) => {
  for (const t of leavesOf(inp)) { const f = res.tasks[t.id].totalFloat; if (f !== null) assert.ok(f >= 0, `${t.id}: ${f}`); }
}, { manual: false });

forEachCase('PR-10 añadir una arista que cierra un ciclo se rechaza', (inp) => {
  const e = inp.dependencies[0];
  if (!e) return;
  const cyc = { ...inp, dependencies: [...inp.dependencies, { id: 'zcycle', predecessorId: e.successorId, successorId: e.predecessorId, type: 'FS', lagDays: 0 }] };
  const r = schedule(cyc);
  assert.equal(r.outcome, 'error');
  assert.ok(r.errors.some((x) => x.code === 'CYCLE'));
});

forEachCase('PR-11 localidad: lo no alcanzable no se mueve', (inp, res, rnd) => {
  const cands = inp.tasks.filter((t) => t.kind === 'task');
  if (!cands.length) return;
  const victim = cands[Math.floor(rnd() * cands.length)].id;
  const r2 = schedule({ ...inp, tasks: inp.tasks.map((t) => (t.id === victim ? { ...t, durationDays: t.durationDays + 2 } : t)) });
  if (r2.outcome !== 'ok') return;
  const reach = reachable(inp.dependencies, victim);
  for (const t of leavesOf(inp)) if (t.id !== victim && !reach.has(t.id)) {
    assert.equal(r2.tasks[t.id].startIdx, res.tasks[t.id].startIdx, t.id);
    assert.equal(r2.tasks[t.id].finishIdx, res.tasks[t.id].finishIdx, t.id);
  }
});
