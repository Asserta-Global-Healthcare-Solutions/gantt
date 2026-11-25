// ORÁCULO DESECHABLE (AP-004). Evalúa un caso dorado y devuelve las diferencias con lo esperado.
import { schedule } from './schedule.mjs';
import { makeCalendar, todayIn } from './calendar.mjs';
import { distribute, costEntries, compareBaseline } from './misc.mjs';

export function evaluate(kase) {
  const { kind = 'schedule', input } = kase;
  if (kind === 'schedule') return schedule(input);
  if (kind === 'calendar') {
    if (!input.calendar.weekdayMinutes.some((m) => m > 0)) return { outcome: 'error', errors: [{ code: 'CALENDAR_NO_WORKING_DAYS' }] };
    const cal = makeCalendar(input.calendar, input.project.startDate);
    return { outcome: 'ok', queries: input.queries.map((q) => ({
      B: () => cal.B(q.date), Bend: () => cal.Bend(q.date), dateOf: () => cal.dateOf(q.idx), todayIn: () => todayIn(q.instant, q.timeZone),
    }[q.op]())) };
  }
  if (kind === 'distribution') return distribute(input);
  if (kind === 'cost') return costEntries(input);
  if (kind === 'baseline') return compareBaseline(input);
  throw new Error(`kind desconocido: ${kind}`);
}

/** Compara solo los campos presentes en `expected` (coincidencia parcial en objetos, exacta en listas). */
export function diff(expected, actual, path = '') {
  const out = [];
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) return [`${path}: esperado ${JSON.stringify(expected)}, obtenido ${JSON.stringify(actual)}`];
    expected.forEach((e, i) => out.push(...diff(e, actual[i], `${path}[${i}]`)));
    return out;
  }
  if (expected !== null && typeof expected === 'object') {
    if (actual === null || typeof actual !== 'object') return [`${path}: esperado objeto, obtenido ${JSON.stringify(actual)}`];
    for (const k of Object.keys(expected)) out.push(...diff(expected[k], actual[k], path ? `${path}.${k}` : k));
    return out;
  }
  return Object.is(expected, actual) ? [] : [`${path}: esperado ${JSON.stringify(expected)}, obtenido ${JSON.stringify(actual)}`];
}

export function checkCase(kase) {
  const actual = evaluate(kase);
  const exp = { ...kase.expected };
  // Para errores se comparan solo los códigos (conjunto ordenado).
  if (exp.errors) { exp.errors = [...new Set(exp.errors)].sort(); }
  const act = actual.errors ? { ...actual, errors: [...new Set(actual.errors.map((e) => e.code))].sort() } : actual;
  return { actual, problems: diff(exp, act) };
}
