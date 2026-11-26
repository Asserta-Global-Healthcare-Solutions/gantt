// Generador determinista del dataset común AP-003:
// 1.000 tareas (WBS 3 niveles, hitos convención A, AUTO/MANUAL/FACT_RUNNING/FACT_DONE)
// y 2.000 dependencias acíclicas (FS/SS/FF/SF con lags 0, positivos y negativos),
// validado por el oráculo de AP-004 (poc/engine-oracle/src/schedule.mjs).
import { mkdirSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { schedule } from '../../engine-oracle/src/schedule.mjs';

const SEED = 20261126;
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randInt = (min, max) => min + Math.floor(rand() * (max - min + 1));

const TODAY = '2026-11-26';
const PROJECT = { startDate: '2026-10-05', timezone: 'Europe/Madrid' };
const CALENDAR = {
  weekdayMinutes: [480, 480, 480, 480, 480, 0, 0],
  exceptions: [
    '2026-10-12', '2026-11-02', '2026-12-08', '2026-12-25',
    '2027-01-01', '2027-01-06', '2027-03-26', '2027-05-01',
    '2027-08-15', '2027-10-12', '2027-11-01', '2027-12-06',
    '2027-12-08', '2027-12-25',
  ].map((date) => ({ date, minutes: 0 })),
};

const OWNERS = ['LF', 'MP', 'NE', 'JO', 'AR', 'OV'];
const PHASE_NAMES = [
  'Descubrimiento y alcance',
  'Arquitectura y seguridad',
  'Diseño de interfaz y tokens',
  'Núcleo de dominio y motor',
  'Integraciones corporativas',
  'Recursos, horas y costes',
  'Importación y exportación',
  'Calidad y rendimiento',
  'Piloto controlado',
  'Despliegue y transición',
];

// Estructura exacta = 1.000 tareas:
// - 10 grupos nivel 1 (fases)
// - 50 grupos nivel 2 (5 subfases por fase)
// - 940 hojas nivel 3 (18 o 19 hojas por subfase: 40 subfases × 19 + 10 subfases × 18 = 760 + 180 = 940)
//   Total = 10 + 50 + 940 = 1.000 tareas exactas.
const tasksInput = [];
const meta = {};
const leaves = [];

let leafIndex = 0;
for (let p = 1; p <= 10; p++) {
  const phaseId = `T-${String(p).padStart(2, '0')}`;
  tasksInput.push({ id: phaseId, kind: 'group', parentId: null });
  meta[phaseId] = { id: phaseId, code: `${p}`, name: `${p}. ${PHASE_NAMES[p - 1]}`, level: 1, responsible: OWNERS[(p - 1) % OWNERS.length] };

  for (let s = 1; s <= 5; s++) {
    const subId = `${phaseId}.${s}`;
    tasksInput.push({ id: subId, kind: 'group', parentId: phaseId });
    meta[subId] = { id: subId, code: `${p}.${s}`, name: `Paquete ${p}.${s} · ${PHASE_NAMES[p - 1].split(' ')[0]}`, level: 2, responsible: OWNERS[(p + s) % OWNERS.length] };

    const countInSub = s <= 4 ? 19 : 18;
    for (let k = 1; k <= countInSub; k++) {
      leafIndex++;
      const id = `${subId}.${String(k).padStart(2, '0')}`;
      const isMilestone = k === countInSub; // 50 hitos de cierre de subfase + 10 hitos intermedios
      const isExtraMilestone = !isMilestone && s === 3 && k === 9;
      const kind = isMilestone || isExtraMilestone ? 'milestone' : 'task';
      const durationDays = kind === 'milestone' ? 0 : randInt(2, 5);

      const t = { id, kind, parentId: subId };
      if (kind === 'task') {
        t.durationDays = durationDays;
        t.estimatedEffortMinutes = durationDays * 480;
      }

      // Fase 1 mayormente completada (hechos reales), fase 2 en curso, resto planificado con manuales
      if (p === 1 && k <= 14) {
        t.status = 'completada';
        t.progress = 100;
        if (kind === 'milestone') {
          t.actualStart = '2026-10-23';
          t.actualFinish = '2026-10-23';
        } else {
          const dayOffset = 5 + ((k - 1) % 15);
          const aStart = `2026-10-${String(dayOffset).padStart(2, '0')}`;
          const aFinish = `2026-10-${String(Math.min(28, dayOffset + Math.min(durationDays, 4))).padStart(2, '0')}`;
          t.actualStart = aStart;
          t.actualFinish = aFinish;
        }
      } else if (p === 2 && k <= 6 && kind === 'task') {
        t.status = 'en_curso';
        t.progress = randInt(25, 75);
        t.actualStart = '2026-11-16';
        t.remainingDurationDays = randInt(2, 5);
        t.remainingAsOf = TODAY;
      } else if (p >= 3 && k === 5 && kind === 'task') {
        // Anclas manuales tempranas para provocar conflictos MANUAL verificables y holgura negativa
        t.scheduleMode = 'manual';
        t.fixedStart = `2026-11-${String(10 + (p % 15)).padStart(2, '0')}`;
        t.status = p % 2 === 0 ? 'bloqueada' : 'pendiente';
        t.progress = 0;
      } else {
        t.scheduleMode = 'auto';
        t.status = 'pendiente';
        t.progress = 0;
      }

      tasksInput.push(t);
      meta[id] = {
        id,
        code: `${p}.${s}.${k}`,
        name: kind === 'milestone' ? `Hito ${p}.${s}.${k} · Entrega parcial` : `Actividad ${p}.${s}.${k} · Módulo ${leafIndex}`,
        level: 3,
        responsible: OWNERS[leafIndex % OWNERS.length],
        status: t.status ?? 'pendiente',
      };
      leaves.push({ idx: leaves.length, id, p, s, k, kind, scheduleMode: t.scheduleMode ?? 'auto', status: t.status ?? 'pendiente' });
    }
  }
}

if (tasksInput.length !== 1000) throw new Error(`Se esperaban 1000 tareas, generadas ${tasksInput.length}`);

// Generar exactamente 2.000 dependencias acíclicas (predecesor.idx < sucesor.idx garantiza DAG 100% acíclico).
// Distribución realista de FS, SS, FF, SF con lags 0, positivos y negativos.
const dependencies = [];
const seen = new Set();
const addDep = (aId, bId, type, lagDays) => {
  const key = `${aId}|${bId}|${type}`;
  if (aId === bId || seen.has(key)) return false;
  seen.add(key);
  dependencies.push({
    id: `D-${String(dependencies.length + 1).padStart(4, '0')}`,
    predecessorId: aId,
    successorId: bId,
    type,
    lagDays,
  });
  return true;
};

// 1) Cadena secuencial realista dentro de cada subfase (5 paquetes en paralelo por fase, ~18-24 meses total)
const subStartByKey = new Map();
const subEndByKey = new Map();
for (let i = 0; i < leaves.length; i++) {
  const curr = leaves[i];
  const key = `${curr.p}.${curr.s}`;
  if (!subStartByKey.has(key)) subStartByKey.set(key, curr);
  subEndByKey.set(key, curr);
  if (i > 0) {
    const prev = leaves[i - 1];
    if (prev.p === curr.p && prev.s === curr.s) {
      const type = curr.k % 9 === 0 ? 'FF' : curr.k % 5 === 0 ? 'SS' : 'FS';
      const lag = type === 'FS' ? (curr.k % 6 === 0 ? 1 : 0) : type === 'SS' ? 2 : 0;
      addDep(prev.id, curr.id, type, lag);
    }
  }
}

// 2) Enlaces entre fases (solape realista SS+15 / FS para horizonte ~18-24 meses tanto en plan como en línea base)
for (let p = 2; p <= 10; p++) {
  for (let s = 1; s <= 5; s++) {
    const prevEnd = subEndByKey.get(`${p - 1}.${s}`);
    const prevStart = subStartByKey.get(`${p - 1}.${s}`);
    const currStart = subStartByKey.get(`${p}.${s}`);
    if (prevEnd && currStart) {
      if (s <= 4) {
        addDep(prevStart.id, currStart.id, 'SS', 12 + s * 2);
      } else {
        addDep(prevEnd.id, currStart.id, 'FS', 0);
      }
    }
  }
}

// Conflictos controlados hacia tareas manuales (predecesor FS tardío en la misma subfase)
for (let i = 2; i < leaves.length; i++) {
  const curr = leaves[i];
  if (curr.scheduleMode === 'manual') {
    addDep(leaves[i - 2].id, curr.id, 'FS', 2);
  }
}

// 3) Completar exactamente hasta 2.000 vínculos acíclicos (FS, SS, FF, SF) dentro de misma fase o fase adyacente
const TYPES = ['FS', 'FS', 'FS', 'FS', 'FS', 'SS', 'SS', 'FF', 'FF', 'SF'];
let guard = 0;
while (dependencies.length < 2000 && guard < 300000) {
  guard++;
  const aIdx = randInt(0, leaves.length - 3);
  const a = leaves[aIdx];
  // Mantener enlaces entre misma subfase o subfases paralelas de la misma fase (evita estirar cadena a >10 años)
  const bMin = aIdx + 1;
  const bMax = Math.min(leaves.length - 1, aIdx + 24);
  const bIdx = randInt(bMin, bMax);
  const b = leaves[bIdx];
  if (b.p - a.p > 1) continue;
  // Evitar encadenar subfases paralelas en serie (solo cruzar a misma fase si SS/FF o a fase siguiente)
  const type = b.p === a.p && b.s !== a.s ? pick(['SS', 'FF', 'SF']) : pick(TYPES);
  const lag = type === 'FS' ? pick([0, 0, 1, -1]) : type === 'SS' ? pick([0, 1, 2]) : type === 'FF' ? pick([0, 1, -1]) : pick([0, 1]);
  addDep(a.id, b.id, type, lag);
}

if (dependencies.length !== 2000) throw new Error(`Se esperaban 2000 vínculos, generados ${dependencies.length}`);

// Calcular plan actual con el oráculo AP-004
const t0 = performance.now();
const input = { project: PROJECT, calendar: CALENDAR, today: TODAY, tasks: tasksInput, dependencies };
const plan = schedule(input);
const oracleMs = +(performance.now() - t0).toFixed(2);
if (plan.outcome !== 'ok') {
  throw new Error(`El oráculo rechazó el dataset: ${JSON.stringify(plan.errors.slice(0, 10))}`);
}

// Calcular línea base congelada (duraciones originales -1 en ~25% de hojas, sin hechos ni manuales)
const baseTasksInput = tasksInput.map((t, idx) => {
  const { status, actualStart, actualFinish, remainingDurationDays, remainingAsOf, progress, scheduleMode, fixedStart, ...rest } = t;
  if (rest.kind === 'task' && idx % 4 === 0 && rest.durationDays > 2) {
    rest.durationDays = rest.durationDays - 1;
  }
  return rest;
});
const baselinePlan = schedule({ project: PROJECT, calendar: CALENDAR, today: TODAY, tasks: baseTasksInput, dependencies });
if (baselinePlan.outcome !== 'ok') {
  throw new Error(`El oráculo rechazó la línea base: ${JSON.stringify(baselinePlan.errors.slice(0, 10))}`);
}

// Construir snapshot serializable para las 4 alternativas (mismo horizonte y mismo snapshot exacto)
const order = tasksInput.map((t) => t.id);
const rows = order.map((id) => {
  const inp = tasksInput.find((x) => x.id === id);
  const calc = plan.tasks[id];
  const base = baselinePlan.tasks[id];
  return {
    id,
    code: meta[id].code,
    name: meta[id].name,
    kind: inp.kind,
    parentId: inp.parentId,
    level: meta[id].level,
    responsible: meta[id].responsible,
    status: meta[id].status ?? null,
    scheduleMode: inp.scheduleMode ?? 'auto',
    class: calc.class ?? 'GROUP',
    durationDays: inp.durationDays ?? 0,
    start: calc.start,
    finish: calc.finish,
    startIdx: calc.startIdx,
    finishIdx: calc.finishIdx,
    progress: calc.progress ?? 0,
    totalFloat: calc.totalFloat ?? null,
    critical: Boolean(calc.critical),
    criticalReason: calc.criticalReason ?? null,
    actualStart: inp.actualStart ?? null,
    actualFinish: inp.actualFinish ?? null,
    baselineStart: base?.start ?? null,
    baselineFinish: base?.finish ?? null,
  };
});

const typeCounts = dependencies.reduce((acc, d) => ((acc[d.type] = (acc[d.type] ?? 0) + 1), acc), {});
const criticalCount = rows.filter((r) => r.critical).length;
const dates = rows.flatMap((r) => [r.start, r.finish, r.baselineStart, r.baselineFinish]).filter(Boolean).sort();

const dataset = {
  meta: {
    seed: SEED,
    generatedWith: 'poc/engine-oracle/src/schedule.mjs (AP-004)',
    today: TODAY,
    project: PROJECT,
    horizonStart: dates[0],
    horizonEnd: dates[dates.length - 1],
    taskCount: rows.length,
    groupCount: rows.filter((r) => r.kind === 'group').length,
    leafTaskCount: rows.filter((r) => r.kind === 'task').length,
    milestoneCount: rows.filter((r) => r.kind === 'milestone').length,
    dependencyCount: dependencies.length,
    dependencyTypes: typeCounts,
    conflictCount: plan.conflicts.length,
    criticalCount,
    warningCount: plan.warnings.length,
    oracleComputeMs: oracleMs,
  },
  calendar: CALENDAR,
  tasks: rows,
  dependencies,
  conflicts: plan.conflicts,
  warnings: plan.warnings,
};

mkdirSync(new URL('../public/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/dataset-1000.json', import.meta.url), JSON.stringify(dataset));
console.log(JSON.stringify(dataset.meta, null, 2));
