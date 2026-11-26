// ORÁCULO DESECHABLE (AP-004). No es el motor de producto.
// Calendario por recorrido día a día, deliberadamente ingenuo e independiente de los índices cacheados del contrato.
const MS_DAY = 86_400_000;

export const toEpochDay = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / MS_DAY;
};
export const fromEpochDay = (n) => new Date(n * MS_DAY).toISOString().slice(0, 10);
export const weekday = (n) => (new Date(n * MS_DAY).getUTCDay() + 6) % 7; // lunes=0 … domingo=6

export function addYearsClamped(iso, years) {
  const [y, m, d] = iso.split('-').map(Number);
  const last = new Date(Date.UTC(y + years, m, 0)).getUTCDate();
  return Date.UTC(y + years, m - 1, Math.min(d, last)) / MS_DAY;
}

/** Fecha civil de un instante UTC en una zona IANA (Intl, sin Temporal). */
export function todayIn(instantIso, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(instantIso));
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function makeCalendar(calendar, projectStartIso) {
  const exceptions = new Map((calendar.exceptions ?? []).map((e) => [toEpochDay(e.date), e.minutes]));
  const minutes = (n) => (exceptions.has(n) ? exceptions.get(n) : calendar.weekdayMinutes[weekday(n)]);
  const isWorking = (n) => minutes(n) > 0;
  const p = toEpochDay(projectStartIso);
  const GUARD = 40_000;

  const nextWorking = (n) => {
    for (let x = n, i = 0; i < GUARD; x++, i++) if (isWorking(x)) return x;
    throw new Error('CALENDAR_NO_WORKING_DAYS');
  };
  // Índice de un día laborable n respecto al inicio del proyecto (día laborable 0).
  const indexOf = (n) => {
    let k = 0;
    if (n >= p) { for (let x = p; x < n; x++) if (isWorking(x)) k++; }
    else { for (let x = n; x < p; x++) if (isWorking(x)) k--; }
    return k;
  };
  const B = (iso) => indexOf(nextWorking(toEpochDay(iso)));
  const Bend = (iso) => indexOf(nextWorking(toEpochDay(iso) + 1));
  const epochOf = (k) => {
    if (k >= 0) {
      for (let x = p, i = -1, g = 0; g < GUARD; x++, g++) if (isWorking(x) && ++i === k) return x;
    } else {
      for (let x = p - 1, i = 0, g = 0; g < GUARD; x--, g++) if (isWorking(x) && --i === k) return x;
    }
    throw new Error('HORIZON_GUARD');
  };
  const dateOf = (k) => fromEpochDay(epochOf(k));
  return { minutes, isWorking, B, Bend, dateOf, epochOf, projectStartEpoch: p };
}
