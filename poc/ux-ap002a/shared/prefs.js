// PROTOTIPO AP-002a. Preferencias de interfaz por visitante (densidad, zoom, distribución).
// En producto serían preferencias de usuario en servidor (ver AP-002a §C.4: posible ampliación de alcance).
// Los parámetros de la URL las sobrescriben solo para esa visita (no se guardan).
const DEFAULTS = { density: 'estandar', zoom: 'dia', nav: 'abierta', panel: 'dock', nameW: 220 };

export function loadPrefs(key) {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) ?? '{}') ?? {}; } catch { /* sin almacenamiento */ }
  const prefs = { ...DEFAULTS, ...saved };
  const q = new URLSearchParams(location.search);
  const over = { density: q.get('densidad'), zoom: q.get('zoom'), nav: q.get('nav'), panel: q.get('panel') };
  const session = { ...prefs, ...Object.fromEntries(Object.entries(over).filter(([, v]) => v)) };
  const save = (patch) => {
    Object.assign(prefs, patch); Object.assign(session, patch);
    try { localStorage.setItem(key, JSON.stringify(prefs)); } catch { /* sin almacenamiento */ }
  };
  return { get: (k) => session[k], save };
}
