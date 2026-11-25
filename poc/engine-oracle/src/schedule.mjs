// ORÁCULO DESECHABLE (AP-004). No es el motor de producto.
import { makeCalendar, toEpochDay, addYearsClamped } from './calendar.mjs';

const START_TYPES = new Set(['FS', 'SS']);
const isLeaf = (t) => t.kind === 'task' || t.kind === 'milestone';
const dur = (t) => (t.kind === 'milestone' ? 0 : t.durationDays);

export function classOf(t) {
  if (t.kind === 'group') return 'GROUP';
  if (t.status === 'completada') return 'FACT_DONE';
  if (t.actualStart) return 'FACT_RUNNING';
  return t.scheduleMode === 'manual' ? 'MANUAL' : 'AUTO';
}

// ---------- Validación ----------
export function validate(input) {
  const errors = [];
  const err = (code, ref = {}) => errors.push({ code, ...ref });
  const { project, calendar, tasks, dependencies = [], today } = input;
  if (!calendar.weekdayMinutes.some((m) => m > 0)) { err('CALENDAR_NO_WORKING_DAYS'); return sortErrors(errors); }
  const cal = makeCalendar(calendar, project.startDate);
  if (!cal.isWorking(toEpochDay(project.startDate))) err('PROJECT_START_NON_WORKING');

  const byId = new Map(tasks.map((t) => [t.id, t]));
  for (const t of tasks) {
    const taskId = t.id;
    if (t.parentId != null) {
      const parent = byId.get(t.parentId);
      if (!parent) err('UNKNOWN_TASK', { taskId });
      else if (parent.kind !== 'group') err('PARENT_NOT_GROUP', { taskId });
    }
    if (t.kind === 'group') {
      if (['durationDays', 'fixedStart', 'notBefore', 'actualStart', 'actualFinish'].some((k) => t[k] != null)) err('GROUP_SCHEDULE_FIELDS', { taskId });
      continue;
    }
    if (t.kind === 'task' && !(Number.isInteger(t.durationDays) && t.durationDays >= 1)) err('INVALID_DURATION', { taskId });
    if (t.kind === 'milestone' && t.durationDays != null && t.durationDays !== 0) err('INVALID_DURATION', { taskId });
    if (t.kind === 'milestone' && t.estimatedEffortMinutes != null) err('MILESTONE_EFFORT', { taskId });
    if (t.kind === 'milestone' && t.actualStart && t.actualFinish && t.actualStart !== t.actualFinish) err('MILESTONE_FACTS', { taskId });
    const cls = classOf(t);
    if (t.scheduleMode === 'manual' && t.notBefore != null) err('MANUAL_WITH_NOT_BEFORE', { taskId });
    if (cls === 'MANUAL' && t.fixedStart == null) err('MANUAL_WITHOUT_FIXED_START', { taskId });
    if (t.status === 'en_curso' && !t.actualStart) err('MISSING_FACT', { taskId });
    if (t.status === 'completada' && (!t.actualFinish || (t.kind === 'task' && !t.actualStart))) err('MISSING_FACT', { taskId });
    if (t.actualStart && t.actualFinish && t.actualFinish < t.actualStart) err('ACTUAL_ORDER', { taskId });
    const hasR = t.remainingDurationDays != null, hasAsOf = t.remainingAsOf != null;
    if (hasR || hasAsOf) {
      if (cls !== 'FACT_RUNNING' || !hasR || !hasAsOf || !Number.isInteger(t.remainingDurationDays) || t.remainingDurationDays < 1) err('INVALID_REMAINING', { taskId });
      else if (t.remainingAsOf < t.actualStart) err('REMAINING_BEFORE_START', { taskId });
    }
    if (today && [t.actualStart, t.actualFinish, t.remainingAsOf].some((d) => d && d > today)) err('FACT_IN_FUTURE', { taskId });
  }
  // Árbol WBS sin ciclos
  for (const t of tasks) {
    const seen = new Set([t.id]);
    for (let p = byId.get(t.parentId); p; p = byId.get(p.parentId)) {
      if (seen.has(p.id)) { err('TREE_CYCLE', { taskId: t.id }); break; }
      seen.add(p.id);
    }
  }
  // Dependencias
  const keys = new Set();
  for (const d of dependencies) {
    const ref = { dependencyId: d.id };
    const a = byId.get(d.predecessorId), b = byId.get(d.successorId);
    if (!a || !b) { err('UNKNOWN_TASK', ref); continue; }
    if (d.predecessorId === d.successorId) { err('SELF_DEPENDENCY', ref); continue; }
    if (!isLeaf(a) || !isLeaf(b)) { err('GROUP_DEPENDENCY', ref); continue; }
    if (!Number.isInteger(d.lagDays)) err('INVALID_LAG', ref);
    const key = `${d.predecessorId}|${d.successorId}|${d.type}`;
    if (keys.has(key)) err('DUPLICATE_DEPENDENCY', ref);
    keys.add(key);
  }
  if (!errors.some((e) => ['UNKNOWN_TASK', 'SELF_DEPENDENCY', 'GROUP_DEPENDENCY'].includes(e.code)) && hasCycle(tasks, dependencies)) err('CYCLE');
  return sortErrors(errors);
}

const sortErrors = (errors) => errors.sort((x, y) => (x.code + (x.taskId ?? x.dependencyId ?? '')).localeCompare(y.code + (y.taskId ?? y.dependencyId ?? '')));

function hasCycle(tasks, deps) {
  const out = new Map(tasks.map((t) => [t.id, []]));
  for (const d of deps) out.get(d.predecessorId)?.push(d.successorId);
  const state = new Map();
  const visit = (n) => {
    state.set(n, 1);
    for (const m of out.get(n)) {
      if (state.get(m) === 1) return true;
      if (!state.get(m) && visit(m)) return true;
    }
    state.set(n, 2);
    return false;
  };
  return tasks.some((t) => !state.get(t.id) && visit(t.id));
}

// ---------- Pase hacia delante ----------
function initial(t, cal, cls, force) {
  const d = dur(t);
  if (force?.id === t.id && force.start != null) return { s: force.start, f: force.start + d };
  switch (cls) {
    case 'AUTO': { const s = Math.max(0, t.notBefore ? cal.B(t.notBefore) : 0); return { s, f: s + d }; }
    case 'MANUAL': { const s = cal.B(t.fixedStart); return { s, f: s + d }; }
    case 'FACT_DONE': {
      if (t.kind === 'milestone') { const s = cal.B(t.actualFinish); return { s, f: s }; }
      return { s: cal.B(t.actualStart), f: cal.Bend(t.actualFinish) };
    }
    case 'FACT_RUNNING': {
      const s = cal.B(t.actualStart);
      if (force?.id === t.id && force.finish != null) return { s, f: force.finish };
      const f = t.remainingDurationDays != null ? cal.B(t.remainingAsOf) + t.remainingDurationDays : s + d;
      return { s, f };
    }
  }
}

const startBound = (type, a, L, dB) => ({ FS: a.f + L, SS: a.s + L, FF: a.f + L - dB, SF: a.s + L - dB }[type]);
const finishBound = (type, a, L) => ({ FF: a.f + L, SF: a.s + L }[type]);

/** Relajación hasta punto fijo (algoritmo del oráculo). */
export function forwardRelax(leaves, deps, cal, force) {
  const pos = new Map(), cls = new Map();
  for (const t of leaves) {
    const c = force?.id === t.id && force.start != null ? 'MANUAL' : classOf(t);
    cls.set(t.id, c);
    pos.set(t.id, initial(t, cal, classOf(t), force));
  }
  const byId = new Map(leaves.map((t) => [t.id, t]));
  for (let iter = 0, changed = true; changed; iter++) {
    if (iter > leaves.length + 1) throw new Error('NO_CONVERGE');
    changed = false;
    for (const e of deps) {
      const a = pos.get(e.predecessorId), b = pos.get(e.successorId), B = byId.get(e.successorId);
      const c = cls.get(e.successorId);
      const forcedFinish = force?.id === e.successorId && force.finish != null;
      if (c === 'AUTO') {
        const lb = startBound(e.type, a, e.lagDays, dur(B));
        if (lb > b.s) { b.s = lb; b.f = lb + dur(B); changed = true; }
      } else if (c === 'FACT_RUNNING' && !START_TYPES.has(e.type) && !forcedFinish) {
        const fb = finishBound(e.type, a, e.lagDays);
        if (fb > b.f) { b.f = fb; changed = true; }
      }
    }
  }
  return { pos, cls };
}

/** Orden topológico de Kahn con desempate por id (algoritmo del contrato). */
export function forwardKahn(leaves, deps, cal) {
  const ids = leaves.map((t) => t.id).sort();
  const byId = new Map(leaves.map((t) => [t.id, t]));
  const indeg = new Map(ids.map((i) => [i, 0])), out = new Map(ids.map((i) => [i, []])), inc = new Map(ids.map((i) => [i, []]));
  for (const e of deps) { indeg.set(e.successorId, indeg.get(e.successorId) + 1); out.get(e.predecessorId).push(e); inc.get(e.successorId).push(e); }
  const ready = ids.filter((i) => indeg.get(i) === 0);
  const pos = new Map(), cls = new Map();
  while (ready.length) {
    ready.sort();
    const id = ready.shift(), t = byId.get(id), c = classOf(t);
    cls.set(id, c);
    const p = initial(t, cal, c);
    for (const e of inc.get(id)) {
      const a = pos.get(e.predecessorId);
      if (c === 'AUTO') { p.s = Math.max(p.s, startBound(e.type, a, e.lagDays, dur(t))); p.f = p.s + dur(t); }
      if (c === 'FACT_RUNNING' && !START_TYPES.has(e.type)) p.f = Math.max(p.f, finishBound(e.type, a, e.lagDays));
    }
    pos.set(id, p);
    for (const e of out.get(id)) { indeg.set(e.successorId, indeg.get(e.successorId) - 1); if (indeg.get(e.successorId) === 0) ready.push(e.successorId); }
  }
  return { pos, cls };
}

export function satisfied(e, a, b) {
  switch (e.type) {
    case 'FS': return { ok: b.s >= a.f + e.lagDays, required: a.f + e.lagDays, actual: b.s };
    case 'SS': return { ok: b.s >= a.s + e.lagDays, required: a.s + e.lagDays, actual: b.s };
    case 'FF': return { ok: b.f >= a.f + e.lagDays, required: a.f + e.lagDays, actual: b.f };
    case 'SF': return { ok: b.f >= a.s + e.lagDays, required: a.s + e.lagDays, actual: b.f };
  }
}

// ---------- CPM ----------
function projectEnd(leaves, pos, cls) {
  const open = leaves.filter((t) => cls.get(t.id) !== 'FACT_DONE');
  const set = open.length ? open : leaves;
  return set.length ? Math.max(...set.map((t) => pos.get(t.id).f)) : 0;
}

/** Recurrencia del contrato (pase hacia atrás). */
export function cpmRecurrence(leaves, deps, pos, cls) {
  const T = projectEnd(leaves, pos, cls);
  const byId = new Map(leaves.map((t) => [t.id, t]));
  const order = topo(leaves, deps).reverse();
  const out = new Map(leaves.map((t) => [t.id, []]));
  for (const e of deps) out.get(e.predecessorId).push(e);
  const LS = new Map(), LF = new Map(), fromEnd = new Map(), res = new Map();
  for (const id of order) {
    const X = byId.get(id), cx = cls.get(id), dX = dur(X);
    if (cx === 'FACT_DONE') { res.set(id, { totalFloat: null, critical: false, criticalReason: null }); continue; }
    const cands = [];
    if (cx === 'FACT_RUNNING') {
      cands.push({ v: T, end: true });
      for (const e of out.get(id)) {
        const cy = cls.get(e.successorId), Y = byId.get(e.successorId), L = e.lagDays;
        if (cy === 'FACT_DONE') continue;
        if (cy === 'FACT_RUNNING') { if (e.type === 'FF') cands.push({ v: LF.get(Y.id) - L, end: fromEnd.get(Y.id) }); continue; }
        const lsy = cy === 'MANUAL' ? pos.get(Y.id).s : LS.get(Y.id), endY = cy === 'MANUAL' ? false : fromEnd.get(Y.id);
        if (e.type === 'FS') cands.push({ v: lsy - L, end: endY });
        if (e.type === 'FF') cands.push({ v: lsy + dur(Y) - L, end: endY });
      }
      const v = Math.min(...cands.map((c) => c.v));
      LF.set(id, v); fromEnd.set(id, cands.some((c) => c.v === v && c.end));
      const fl = v - pos.get(id).f;
      res.set(id, { totalFloat: fl, critical: fl <= 0, criticalReason: fl <= 0 ? (fl === 0 && fromEnd.get(id) ? 'cadenaFin' : 'ancladaManual') : null });
      continue;
    }
    cands.push({ v: T - dX, end: true });
    for (const e of out.get(id)) {
      const cy = cls.get(e.successorId), Y = byId.get(e.successorId), L = e.lagDays;
      if (cy === 'FACT_DONE') continue;
      if (cy === 'FACT_RUNNING') {
        if (e.type === 'FF') cands.push({ v: LF.get(Y.id) - L - dX, end: fromEnd.get(Y.id) });
        if (e.type === 'SF') cands.push({ v: LF.get(Y.id) - L, end: fromEnd.get(Y.id) });
        continue;
      }
      const lsy = cy === 'MANUAL' ? pos.get(Y.id).s : LS.get(Y.id), lfy = lsy + dur(Y);
      const endY = cy === 'MANUAL' ? false : fromEnd.get(Y.id);
      const v = { FS: lsy - L - dX, SS: lsy - L, FF: lfy - L - dX, SF: lfy - L }[e.type];
      cands.push({ v, end: endY });
    }
    const v = Math.min(...cands.map((c) => c.v));
    LS.set(id, v); fromEnd.set(id, cands.some((c) => c.v === v && c.end));
    const fl = v - pos.get(id).s;
    res.set(id, { totalFloat: fl, critical: fl <= 0, criticalReason: fl <= 0 ? (fl === 0 && fromEnd.get(id) ? 'cadenaFin' : 'ancladaManual') : null });
  }
  return { T, res };
}

/**
 * Definición semántica de holgura total (CPM estándar): máximo desplazamiento δ de X tal que X y lo que X empuja
 * aguas abajo —ignorando cualquier otra cota (otras ramas, notBefore, inicio de proyecto) — terminan ≤ T y no
 * incumplen ninguna ancla MANUAL. Simulación hacia delante sobre el subgrafo, independiente de la recurrencia.
 * Las MANUAL son anclas (no se mueven ni propagan), FACT_DONE se corta y en FACT_RUNNING solo se mueve el fin.
 */
export function floatSemantic(leaves, deps, cal, id) {
  const base = forwardRelax(leaves, deps, cal);
  const cls = base.cls;
  if (cls.get(id) === 'FACT_DONE') return null;
  const T = projectEnd(leaves, base.pos, cls);
  const byId = new Map(leaves.map((t) => [t.id, t]));
  const order = topo(leaves, deps);
  const p0 = base.pos.get(id), running = cls.get(id) === 'FACT_RUNNING';
  const H = leaves.reduce((s, t) => s + dur(t), 0) + deps.reduce((s, e) => s + Math.abs(e.lagDays), 0) + Math.abs(T) + 10;

  const ok = (delta) => {
    // pos parcial: solo nodos alcanzados por el empuje de X. `moves` indica qué extremo depende de X.
    const pos = new Map([[id, running ? { s: p0.s, f: p0.f + delta, moves: 'f' } : { s: p0.s + delta, f: p0.s + delta + dur(byId.get(id)), moves: 'sf' }]]);
    for (const v of order) {
      if (v === id) continue;
      const cv = cls.get(v), V = byId.get(v);
      const inc = deps.filter((e) => e.successorId === v && pos.has(e.predecessorId));
      if (!inc.length || cv === 'FACT_DONE') continue;
      // Solo las cotas que dependen del extremo que X mueve.
      const live = inc.filter((e) => pos.get(e.predecessorId).moves.includes(['FS', 'FF'].includes(e.type) ? 'f' : 's'));
      if (!live.length) continue;
      if (cv === 'MANUAL') {
        const b = base.pos.get(v);
        if (live.some((e) => !satisfied(e, pos.get(e.predecessorId), b).ok)) return false;
        continue;
      }
      if (cv === 'FACT_RUNNING') {
        const fb = live.filter((e) => !START_TYPES.has(e.type)).map((e) => finishBound(e.type, pos.get(e.predecessorId), e.lagDays));
        if (fb.length) pos.set(v, { s: base.pos.get(v).s, f: Math.max(...fb), moves: 'f' });
        continue;
      }
      const s = Math.max(...live.map((e) => startBound(e.type, pos.get(e.predecessorId), e.lagDays, dur(V))));
      pos.set(v, { s, f: s + dur(V), moves: 'sf' });
    }
    return [...pos.values()].every((p) => p.f <= T);
  };
  for (let delta = H; delta >= -H; delta--) if (ok(delta)) return delta;
  return undefined;
}

function topo(leaves, deps) {
  const ids = leaves.map((t) => t.id).sort();
  const indeg = new Map(ids.map((i) => [i, 0])), out = new Map(ids.map((i) => [i, []]));
  for (const e of deps) { indeg.set(e.successorId, indeg.get(e.successorId) + 1); out.get(e.predecessorId).push(e.successorId); }
  const ready = ids.filter((i) => indeg.get(i) === 0), order = [];
  while (ready.length) { ready.sort(); const n = ready.shift(); order.push(n); for (const m of out.get(n)) { indeg.set(m, indeg.get(m) - 1); if (indeg.get(m) === 0) ready.push(m); } }
  return order;
}

// ---------- Cálculo completo ----------
export function schedule(input) {
  const errors = validate(input);
  if (errors.length) return { outcome: 'error', errors };
  const { project, calendar, tasks, dependencies = [], today } = input;
  const cal = makeCalendar(calendar, project.startDate);
  const leaves = tasks.filter(isLeaf);
  const { pos, cls } = forwardRelax(leaves, dependencies, cal);

  const limit = addYearsClamped(project.startDate, 10);
  for (const t of leaves) {
    const p = pos.get(t.id);
    if (cal.epochOf(p.f) > limit || cal.epochOf(p.s) > limit) return { outcome: 'error', errors: [{ code: 'HORIZON_EXCEEDED', taskId: t.id }] };
  }

  const conflicts = [];
  for (const e of dependencies) {
    const r = satisfied(e, pos.get(e.predecessorId), pos.get(e.successorId));
    if (r.ok) continue;
    const c = cls.get(e.successorId);
    if (c === 'AUTO') throw new Error(`invariante rota: AUTO ${e.successorId} incumple ${e.id}`);
    conflicts.push({ dependencyId: e.id, successorId: e.successorId, kind: c === 'MANUAL' ? 'MANUAL' : 'FACT',
      requiredIdx: r.required, actualIdx: r.actual, deficitDays: r.required - r.actual,
      requiredDate: cal.dateOf(r.required), actualDate: cal.dateOf(r.actual) });
  }
  conflicts.sort((x, y) => x.dependencyId.localeCompare(y.dependencyId));

  const { T, res: cpm } = cpmRecurrence(leaves, dependencies, pos, cls);
  const out = {};
  for (const t of leaves) {
    const p = pos.get(t.id), c = cls.get(t.id);
    const start = t.actualStart ?? (t.kind === 'milestone' && t.actualFinish ? t.actualFinish : cal.dateOf(p.s));
    const finish = t.actualFinish ?? (t.kind === 'milestone' ? cal.dateOf(p.s) : cal.dateOf(p.f - 1));
    out[t.id] = { class: c, startIdx: p.s, finishIdx: p.f, start, finish, ...cpm.get(t.id),
      progress: t.status === 'completada' ? 100 : (t.progress ?? 0) };
  }
  rollup(tasks, out);

  const warnings = [];
  const w = (code, taskId) => warnings.push({ code, taskId });
  for (const t of leaves) {
    const o = out[t.id], c = cls.get(t.id);
    if ((c === 'AUTO' || c === 'MANUAL') && today && o.start < today) w('START_OVERDUE', t.id);
    if (t.deadline && o.finish > t.deadline) w('DEADLINE_EXCEEDED', t.id);
    if (c === 'MANUAL' && o.startIdx < 0) w('MANUAL_BEFORE_PROJECT_START', t.id);
    const facts = [t.actualStart, t.actualFinish].filter(Boolean);
    if (facts.some((d) => d < project.startDate)) w('FACT_BEFORE_PROJECT_START', t.id);
    if (facts.some((d) => !cal.isWorking(toEpochDay(d)))) w('FACT_ON_NON_WORKING_DAY', t.id);
  }
  warnings.sort((x, y) => (x.code + x.taskId).localeCompare(y.code + y.taskId));

  let newConflicts;
  if (input.previousConflicts) {
    const prev = new Set(input.previousConflicts.map((k) => `${k.dependencyId}|${k.kind}`));
    newConflicts = conflicts.filter((k) => !prev.has(`${k.dependencyId}|${k.kind}`)).map((k) => k.dependencyId);
  }
  return { outcome: 'ok', projectFinishIdx: T, tasks: out, conflicts, warnings, ...(newConflicts && { newConflicts }) };
}

function rollup(tasks, out) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  for (const g of tasks.filter((t) => t.kind === 'group')) {
    const leaves = tasks.filter((t) => isLeaf(t) && isDescendant(byId, t, g.id));
    if (!leaves.length) { out[g.id] = { class: 'GROUP', startIdx: null, finishIdx: null, progress: null }; continue; }
    const o = leaves.map((t) => out[t.id]);
    const work = leaves.filter((t) => t.kind === 'task');
    let progress;
    if (!work.length) {
      const done = leaves.filter((t) => t.status === 'completada').length;
      progress = roundHalfUp(done * 100, leaves.length);
    } else {
      const byEffort = work.every((t) => t.estimatedEffortMinutes > 0);
      const wt = (t) => (byEffort ? t.estimatedEffortMinutes : t.durationDays);
      progress = roundHalfUp(work.reduce((s, t) => s + wt(t) * out[t.id].progress, 0), work.reduce((s, t) => s + wt(t), 0));
    }
    out[g.id] = { class: 'GROUP', startIdx: Math.min(...o.map((x) => x.startIdx)), finishIdx: Math.max(...o.map((x) => x.finishIdx)),
      start: o.map((x) => x.start).sort()[0], finish: o.map((x) => x.finish).sort().at(-1), progress };
  }
}
const isDescendant = (byId, t, gid) => { for (let p = byId.get(t.parentId); p; p = byId.get(p.parentId)) if (p.id === gid) return true; return false; };
export const roundHalfUp = (num, den) => Math.floor((2 * num + den) / (2 * den));
