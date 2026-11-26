// PROTOTIPO AP-002a. Gantt navegable compartido por las dos direcciones visuales.
// La vista previa usa el ORÁCULO de AP-004 (no es el motor de producto) para mostrar el flujo D-09:
// el cliente previsualiza; en producto el servidor recalcula y confirma.
import { schedule } from '../../engine-oracle/src/schedule.mjs';
import { el, icon, avatar, fmtShort, fmtMonth, fmtWeekday, fmtStamp, isoWeek, toEpochDay, fromEpochDay, makeCalendar, STATUS, CLASS, TYPE, signed, days } from './util.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}) => { const n = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) if (v != null) n.setAttribute(k, v); return n; };

const val = (v) => (typeof v === 'function' ? v() : v);

export function mountGantt(root, DEMO, cfg) {
  const { people, meta, order, baseline } = DEMO;
  const cal = makeCalendar(DEMO.calendar, DEMO.project.startDate);
  const S = {
    input: structuredClone(DEMO.input), plan: DEMO.plan, preview: null, revision: DEMO.project.revision,
    zoom: cfg.zoom ?? 'dia', critical: true, baseline: true, collapsed: new Set(), selected: null,
    filter: { resp: '', q: '', status: new Set(), onlyCritical: false }, history: structuredClone(DEMO.history),
  };
  const children = new Map(order.map((id) => [id, order.filter((c) => meta[c].parent === id)]));
  const depsOf = (id, dir) => S.input.dependencies.filter((d) => (dir === 'in' ? d.successorId : d.predecessorId) === id);

  // ---------- Rango y escala ----------
  const allDates = Object.values(DEMO.plan.tasks).flatMap((t) => [t.start, t.finish]).filter(Boolean).concat(Object.values(baseline.tasks).flatMap((t) => [t.start, t.finish]));
  const e0 = toEpochDay(allDates.sort()[0]) - 3, e1 = toEpochDay(allDates.sort().at(-1)) + 12;
  const px = () => cfg.px[S.zoom];
  const xOf = (iso) => (toEpochDay(iso) - e0) * px();
  const width = () => (e1 - e0 + 1) * px();

  // ---------- Filas visibles ----------
  function matches(id) {
    const m = meta[id], t = cur().tasks[id], f = S.filter;
    if (m.kind === 'group') return false;
    if (f.resp && m.responsible !== f.resp && !m.collaborators.includes(f.resp)) return false;
    if (f.q && !`${id} ${m.name}`.toLowerCase().includes(f.q.toLowerCase())) return false;
    if (f.status.size && !f.status.has(m.status)) return false;
    if (f.onlyCritical && !t.critical) return false;
    return true;
  }
  const filtering = () => S.filter.resp || S.filter.q || S.filter.status.size || S.filter.onlyCritical;
  function visibleRows() {
    const keep = new Set();
    if (filtering()) for (const id of order) if (matches(id)) for (let p = id; p; p = meta[p].parent) keep.add(p);
    const rows = [];
    const walk = (id, level) => {
      if (filtering() && !keep.has(id)) return;
      rows.push({ id, level });
      if (!S.collapsed.has(id)) for (const c of children.get(id)) walk(c, level + 1);
    };
    for (const id of order.filter((x) => !meta[x].parent)) walk(id, 1);
    return rows;
  }
  const cur = () => S.preview?.plan ?? S.plan;

  // ---------- Esqueleto ----------
  root.classList.add('gantt');
  root.dataset.scale = S.zoom;
  const scroller = el('div', { class: 'g-scroll', tabindex: '-1' });
  const head = el('div', { class: 'g-head' });
  // Cabecera visual fuera del treegrid (sticky); para lectores de pantalla se repite dentro como fila oculta.
  const gridHead = el('div', { class: 'g-gridhead' },
    ...cfg.columns.map((c) => el('div', { class: `g-hc g-c-${c.key}`, 'aria-hidden': 'true' }, c.label)));
  const srHead = () => el('div', { class: 'sr-only', role: 'row' }, ...cfg.columns.map((c) => el('span', { role: 'columnheader' }, c.longLabel ?? c.label)));
  const ruler = el('div', { class: 'g-ruler', 'aria-hidden': 'true' });
  head.append(gridHead, ruler);
  const body = el('div', { class: 'g-body' });
  const grid = el('div', { class: 'g-grid', role: 'treegrid', 'aria-label': `Estructura de ${DEMO.project.name}`, 'aria-readonly': 'true' });
  const lane = el('div', { class: 'g-lane', 'aria-hidden': 'true' });
  body.append(grid, lane);
  scroller.append(head, body);
  root.append(scroller);

  // ---------- Render ----------
  function render() {
    const rows = visibleRows(), rowH = val(cfg.rowH), W = width(), plan = cur();
    root.style.setProperty('--lane-w', `${W}px`);
    root.dataset.scale = S.zoom;
    root.classList.toggle('show-critical', S.critical);
    root.classList.toggle('show-baseline', S.baseline);
    root.classList.toggle('is-preview', !!S.preview);
    renderRuler(W);
    grid.replaceChildren(srHead(), ...rows.map((r, i) => gridRow(r, i)));
    // Fondo: no laborables y hoy
    const bg = el('div', { class: 'g-bg' });
    for (let e = e0; e <= e1; e++) if (!cal.isWorking(e)) bg.append(el('i', { class: 'g-off', style: `left:${(e - e0) * px()}px;width:${px()}px` }));
    bg.append(el('i', { class: 'g-today', style: `left:${xOf(DEMO.today)}px` }));
    const bars = el('div', { class: 'g-bars', style: `height:${rows.length * rowH}px` });
    const yOf = new Map(rows.map((r, i) => [r.id, i * rowH + rowH / 2]));
    for (const [i, r] of rows.entries()) bars.append(bar(r.id, i * rowH, plan));
    const links = svg('svg', { class: 'g-links', width: W, height: rows.length * rowH });
    const defs = svg('defs');
    for (const k of ['n', 'crit', 'conf']) { const m = svg('marker', { id: `ar-${k}-${cfg.id}`, viewBox: '0 0 6 6', refX: 5, refY: 3, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }); m.append(svg('path', { d: 'M0,0 L6,3 L0,6 z', class: `ar ar-${k}` })); defs.append(m); }
    links.append(defs);
    const conflictIds = new Set(plan.conflicts.map((c) => c.dependencyId));
    for (const d of S.input.dependencies) {
      if (!yOf.has(d.predecessorId) || !yOf.has(d.successorId)) continue;
      const a = plan.tasks[d.predecessorId], b = plan.tasks[d.successorId];
      const ax = /^F/.test(d.type) ? endX(d.predecessorId, a) : startX(a);
      const bx = /S$/.test(d.type) ? startX(b) : endX(d.successorId, b);
      const kind = conflictIds.has(d.id) ? 'conf' : (a.critical && b.critical ? 'crit' : 'n');
      links.append(svg('path', { d: route(ax, yOf.get(d.predecessorId), bx, yOf.get(d.successorId), d.type, rowH), class: `lk lk-${kind}`, 'marker-end': `url(#ar-${kind}-${cfg.id})` }));
    }
    lane.replaceChildren(bg, links, bars);
    lane.style.height = `${rows.length * rowH}px`;
    renderPanel();
    cfg.onRender?.({ plan, revision: S.revision, filtering: !!filtering(), rows: rows.length, preview: !!S.preview });
  }

  const startX = (t) => xOf(t.start);
  const endX = (id, t) => (meta[id].kind === 'milestone' ? xOf(t.start) : xOf(t.finish) + px());
  function route(x1, y1, x2, y2, type, rowH) {
    const sd = /^F/.test(type) ? 1 : -1;      // sale por el fin hacia la derecha o por el inicio hacia la izquierda
    const td = /S$/.test(type) ? 1 : -1;      // entra al inicio desde la izquierda o al fin desde la derecha
    const a = x1 + sd * 8, b = x2 - td * 8, ym = y1 + (y2 > y1 ? 1 : -1) * rowH / 2;
    if (td === 1 ? a <= x2 - 4 : a >= x2 + 4) return `M${x1},${y1} H${a} V${y2} H${x2}`;
    return `M${x1},${y1} H${a} V${ym} H${b} V${y2} H${x2}`;
  }

  function renderRuler(W) {
    const top = el('div', { class: 'g-rt' }), bot = el('div', { class: 'g-rb' });
    let last = null;
    for (let e = e0; e <= e1; e++) {
      const iso = fromEpochDay(e), d = Number(iso.slice(8)), x = (e - e0) * px();
      const key = S.zoom === 'mes' ? iso.slice(0, 4) : iso.slice(0, 7);
      if (key !== last) { top.append(el('span', { class: 'g-rt-l', style: `left:${x}px` }, S.zoom === 'mes' ? iso.slice(0, 4) : fmtMonth(iso))); last = key; }
      const dow = (new Date(e * 86400000).getUTCDay() + 6) % 7;
      if (S.zoom === 'dia') bot.append(el('span', { class: `g-tick${cal.isWorking(e) ? '' : ' off'}${iso === DEMO.today ? ' now' : ''}`, style: `left:${x}px;width:${px()}px` }, el('b', {}, String(d)), el('small', {}, fmtWeekday(iso))));
      else if (S.zoom === 'semana' && dow === 0) bot.append(el('span', { class: 'g-tick wk', style: `left:${x}px;width:${7 * px()}px` }, el('b', {}, `S${isoWeek(iso)}`), el('small', {}, String(d))));
      else if (S.zoom === 'mes' && d === 1) bot.append(el('span', { class: 'g-tick mo', style: `left:${x}px` }, el('b', {}, fmtMonth(iso).split(' ')[0].slice(0, 3))));
    }
    const now = el('span', { class: 'g-nowtag', style: `left:${xOf(DEMO.today)}px` }, cfg.todayLabel(fmtShort(DEMO.today)));
    ruler.replaceChildren(top, bot, now);
    ruler.style.width = `${W}px`;
  }

  function gridRow({ id, level }, i) {
    const m = meta[id], t = cur().tasks[id], kids = children.get(id).length;
    const changed = S.preview?.changed.has(id);
    const conf = cur().conflicts.some((c) => c.successorId === id);
    const cells = {
      code: el('span', { class: 'g-code' }, id),
      name: el('span', { class: 'g-name' },
        kids ? el('button', { class: 'g-caret', type: 'button', tabindex: '-1', 'aria-label': S.collapsed.has(id) ? `Expandir ${m.name}` : `Contraer ${m.name}`, onclick: (ev) => { ev.stopPropagation(); toggle(id); } }, icon(S.collapsed.has(id) ? 'chevron-right' : 'chevron-down')) : el('span', { class: 'g-caret-sp' }),
        m.kind === 'milestone' ? icon('diamond') : null,
        el('span', { class: 'g-label' }, m.name),
        t.class === 'MANUAL' ? el('span', { class: 'tag tag-manual', title: 'Programación manual' }, 'M') : null,
        conf ? el('span', { class: 'tag tag-conf', title: 'Conflicto de planificación' }, icon('triangle-alert', 'Conflicto')) : null),
      resp: m.kind === 'group' ? el('span') : avatar(people, m.responsible, 'av-sm'),
      start: el('span', { class: 'num' }, fmtShort(t.start)),
      finish: el('span', { class: 'num' }, fmtShort(t.finish)),
      dur: el('span', { class: 'num' }, m.kind === 'task' ? `${S.input.tasks.find((x) => x.id === id).durationDays}d` : m.kind === 'milestone' ? '—' : `${t.finishIdx - t.startIdx}d`),
      float: m.kind === 'group' || t.totalFloat == null ? el('span', { class: 'num dim' }, '—') : floatCell(t),
      prog: el('span', { class: 'num' }, `${t.progress ?? 0}%`),
    };
    const row = el('div', {
      class: `g-row k-${m.kind} c-${t.class}${t.critical ? ' is-crit' : ''}${S.selected === id ? ' is-sel' : ''}${changed ? ' is-changed' : ''}`, 'data-status': m.status,
      role: 'row', 'aria-level': level, 'aria-expanded': kids ? String(!S.collapsed.has(id)) : null, 'aria-selected': String(S.selected === id),
      tabindex: (S.selected ?? visibleRows()[0]?.id) === id ? '0' : '-1', 'data-id': id, style: `--lvl:${level}`,
      onclick: () => select(id, true), onkeydown: (e) => rowKey(e, id),
    }, ...cfg.columns.map((c) => el('div', { class: `g-cell g-c-${c.key}`, role: 'gridcell' }, cells[c.key])));
    return row;
  }
  function floatCell(t) {
    const f = t.totalFloat, cap = 10, w = Math.min(Math.abs(f), cap) / cap * 100;
    const why = f < 0 ? 'Negativa: llega tarde a una fecha fijada manualmente.' : f === 0 ? 'Ruta crítica: cualquier retraso mueve el fin del proyecto.' : 'Puede retrasarse esos días sin mover el fin del proyecto.';
    return el('span', { class: `fl ${f < 0 ? 'neg' : f === 0 ? 'zero' : 'pos'}`, 'data-tip': `Holgura total ${signed(f)} días laborables. ${why}` },
      el('i', { style: `--w:${w}%` }), el('span', { class: 'num' }, signed(f)));
  }

  function bar(id, top, plan) {
    const m = meta[id], t = plan.tasks[id];
    const wrap = el('div', { class: `g-item k-${m.kind} c-${t.class}${t.critical ? ' is-crit' : ''}${S.selected === id ? ' is-sel' : ''}${S.preview?.changed.has(id) ? ' is-changed' : ''}`, style: `top:${top}px`, 'data-id': id, 'data-status': m.status });
    const b = baseline.tasks[id];
    if (b && m.kind !== 'group') {
      const bx = xOf(b.start), bw = m.kind === 'milestone' ? 0 : xOf(b.finish) + px() - bx;
      wrap.append(el('i', { class: `g-base${m.kind === 'milestone' ? ' ms' : ''}`, style: `left:${bx}px;width:${bw}px`, title: `Línea base: ${fmtShort(b.start)} – ${fmtShort(b.finish)}` }));
    }
    if (t.startIdx == null) return wrap;
    const x = xOf(t.start);
    if (m.kind === 'milestone') {
      wrap.append(el('i', { class: 'g-ms', style: `left:${x}px` }));
      wrap.append(el('span', { class: 'g-blabel out', style: `left:${x + 12}px` }, cfg.msLabel(m.name, fmtShort(t.start))));
      return wrap;
    }
    const w = xOf(t.finish) + px() - x;
    const draggable = m.kind === 'task' && (t.class === 'AUTO' || t.class === 'MANUAL');
    const body = el('div', { class: `g-bar${draggable ? ' drag' : ''}`, style: `left:${x}px;width:${w}px`, title: `${id} ${m.name} · ${fmtShort(t.start)} – ${fmtShort(t.finish)}` });
    if (m.kind === 'task') {
      body.append(el('i', { class: 'g-prog', style: `width:${t.progress ?? 0}%` }));
      if (t.class === 'FACT_RUNNING') body.append(el('i', { class: 'g-actual', style: `width:${Math.max(0, Math.min(w, xOf(DEMO.today) - x))}px` }));
    }
    const inside = val(cfg.labelInside) && w > m.name.length * 6.4 + 16 && m.kind === 'task';
    body.append(el('span', { class: `g-blabel${inside ? ' in' : ' out'}`, style: inside ? null : `left:${w + 8}px` }, cfg.barLabel(m, t, people)));
    if (draggable) {
      body.addEventListener('pointerdown', (e) => startDrag(e, id, 'move'));
      const h = el('i', { class: 'g-handle', title: 'Arrastra para cambiar la duración' });
      h.addEventListener('pointerdown', (e) => { e.stopPropagation(); startDrag(e, id, 'resize'); });
      body.append(h);
    }
    body.addEventListener('click', () => select(id, true));
    wrap.append(body);
    return wrap;
  }

  // ---------- Selección y teclado ----------
  function select(id, focus) {
    S.selected = id;
    render();
    cfg.onSelect?.(id); // primero los efectos de la página (abrir panel), después el foco, para no perderlo
    if (focus) grid.querySelector(`[data-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: false });
  }
  function toggle(id) { S.collapsed.has(id) ? S.collapsed.delete(id) : S.collapsed.add(id); render(); grid.querySelector(`[data-id="${CSS.escape(id)}"]`)?.focus(); }
  function rowKey(e, id) {
    const rows = visibleRows().map((r) => r.id), i = rows.indexOf(id);
    const go = (j) => { const n = rows[Math.max(0, Math.min(rows.length - 1, j))]; S.selected = n; render(); grid.querySelector(`[data-id="${CSS.escape(n)}"]`)?.focus(); };
    if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); keyboardShift(id, e.key === 'ArrowRight' ? 1 : -1); return; }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); go(i + 1); break;
      case 'ArrowUp': e.preventDefault(); go(i - 1); break;
      case 'Home': e.preventDefault(); go(0); break;
      case 'End': e.preventDefault(); go(rows.length - 1); break;
      case 'ArrowRight': if (children.get(id).length && S.collapsed.has(id)) { e.preventDefault(); toggle(id); } break;
      case 'ArrowLeft': if (children.get(id).length && !S.collapsed.has(id)) { e.preventDefault(); toggle(id); } else if (meta[id].parent) { e.preventDefault(); go(rows.indexOf(meta[id].parent)); } break;
      case 'Enter': e.preventDefault(); select(id, true); cfg.openPanel?.(); break;
    }
  }

  // ---------- Vista previa (D-09) ----------
  function withChange(id, change) {
    const input = structuredClone(S.input);
    const t = input.tasks.find((x) => x.id === id);
    if (change.start) { if (t.scheduleMode === 'manual') t.fixedStart = change.start; else t.notBefore = change.start; }
    if (change.duration) t.durationDays = change.duration;
    return input;
  }
  function computePreview(id, change) {
    const input = withChange(id, change);
    const plan = schedule(input);
    if (plan.outcome !== 'ok') return { input, plan: S.plan, error: plan.errors, changed: new Set() };
    const changed = new Set(Object.keys(plan.tasks).filter((k) => meta[k].kind !== 'group' && (plan.tasks[k].startIdx !== S.plan.tasks[k].startIdx || plan.tasks[k].finishIdx !== S.plan.tasks[k].finishIdx)));
    const prev = new Set(S.plan.conflicts.map((c) => `${c.dependencyId}|${c.kind}`));
    const newConflicts = plan.conflicts.filter((c) => !prev.has(`${c.dependencyId}|${c.kind}`));
    return { input, plan, changed, newConflicts, id, change };
  }
  function startDrag(e, id, mode) {
    if (e.button !== 0) return;
    e.preventDefault();
    // Se escucha en window: cada render sustituye la barra y un nodo con captura dejaría de recibir pointerup.
    const node = window;
    const x0 = e.clientX, t0 = S.plan.tasks[id];
    let lastDelta = 0;
    const move = (ev) => {
      const delta = Math.round((ev.clientX - x0) / px());
      if (delta === lastDelta) return;
      lastDelta = delta;
      S.preview = mode === 'move'
        ? computePreview(id, { start: fromEpochDay(toEpochDay(t0.start) + delta) })
        : computePreview(id, { duration: Math.max(1, cal.Bend(fromEpochDay(toEpochDay(t0.finish) + delta)) - t0.startIdx) });
      render();
    };
    const up = () => {
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', cancel);
      if (!S.preview || lastDelta === 0) { S.preview = null; render(); return; }
      openImpact();
    };
    const cancel = () => { S.preview = null; render(); };
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', cancel);
  }
  function keyboardShift(id, dir) {
    const m = meta[id], t = S.plan.tasks[id];
    if (m.kind !== 'task' || !(t.class === 'AUTO' || t.class === 'MANUAL')) { cfg.toast?.('Esta tarea no se puede desplazar: sus fechas son hechos registrados o derivadas.'); return; }
    const target = cal.dateOf(t.startIdx + dir);
    S.preview = computePreview(id, { start: target });
    render();
    openImpact();
  }

  const dlg = el('dialog', { class: 'impact', 'aria-labelledby': `impact-t-${cfg.id}` });
  document.body.append(dlg);
  dlg.addEventListener('close', () => { if (S.preview) { S.preview = null; render(); } });
  function openImpact() {
    const P = S.preview, moved = [...P.changed].filter((k) => k !== P.id);
    const self = P.plan.tasks[P.id], before = S.plan.tasks[P.id];
    const noop = !P.changed.size;
    const ack = el('input', { type: 'checkbox', id: `ack-${cfg.id}` });
    const confirm = el('button', { class: 'btn btn-primary', type: 'button', disabled: P.newConflicts.length ? true : null }, 'Confirmar cambio');
    ack.addEventListener('change', () => { confirm.disabled = !ack.checked; });
    confirm.addEventListener('click', () => commit());
    const cancel = el('button', { class: 'btn', type: 'button', onclick: () => dlg.close() }, 'Cancelar');
    dlg.replaceChildren(...[
      el('header', {}, el('p', { class: 'eyebrow' }, `Vista previa · revisión ${S.revision} → ${S.revision + 1}`),
        el('h2', { id: `impact-t-${cfg.id}` }, `${P.id} ${meta[P.id].name}`),
        el('p', { class: 'impact-sum' }, noop ? 'Sin cambios: sus predecesoras no permiten moverla ahí.' : `${fmtShort(before.start)} – ${fmtShort(before.finish)}  →  ${fmtShort(self.start)} – ${fmtShort(self.finish)}`)),
      el('section', {}, el('h3', {}, `Tareas desplazadas (${moved.length})`),
        moved.length ? el('ul', { class: 'impact-list', tabindex: '0', 'aria-label': 'Tareas desplazadas' }, ...moved.map((k) => el('li', {}, el('span', { class: 'g-code' }, k), el('span', {}, meta[k].name),
          el('span', { class: 'num' }, `${signed(P.plan.tasks[k].startIdx - S.plan.tasks[k].startIdx)} d`)))) : el('p', { class: 'dim' }, 'Ninguna otra tarea cambia.')),
      P.newConflicts.length ? el('section', { class: 'impact-conf' }, el('h3', {}, icon('triangle-alert'), ` Conflictos nuevos (${P.newConflicts.length})`),
        el('ul', { class: 'impact-list', tabindex: '0', 'aria-label': 'Conflictos nuevos' }, ...P.newConflicts.map((c) => el('li', {}, el('span', { class: 'g-code' }, c.successorId), el('span', {}, `${meta[c.successorId].name} queda ${days(c.deficitDays)} antes de lo que exige ${c.dependencyId}`)))),
        el('label', { class: 'ack', for: `ack-${cfg.id}` }, ack, 'Entiendo el conflicto y lo dejo registrado y visible')) : null,
      el('p', { class: 'note' }, 'Calculado en el navegador con el oráculo de AP-004. En producto, el servidor recalcula y confirma; si hay discrepancia, gana el servidor.'),
      el('footer', {}, cancel, noop ? null : confirm)].filter(Boolean));
    dlg.showModal();
    // Foco inicial en la decisión: reconocer el conflicto si lo hay; si no, confirmar (o cancelar si no hay cambio).
    (P.newConflicts.length ? ack : noop ? cancel : confirm).focus();
  }
  function commit() {
    const P = S.preview;
    S.input = P.input; S.plan = P.plan; S.revision += 1;
    (S.history[P.id] ??= []).unshift({ at: new Date().toISOString(), actor: DEMO.me, what: P.change.start ? 'Inicio' : 'Duración', to: P.change.start ? fmtShort(P.plan.tasks[P.id].start) : `${P.change.duration} días`, rev: S.revision, impact: P.changed.size > 1 ? `${P.changed.size - 1} tareas desplazadas` : null });
    S.preview = null;
    dlg.close();
    S.selected = P.id;
    render();
    cfg.toast?.(`Revisión ${S.revision} confirmada · ${P.changed.size} ${P.changed.size === 1 ? 'tarea cambia' : 'tareas cambian'}`);
  }

  // ---------- Panel de detalle ----------
  const panel = cfg.panel;
  function renderPanel() {
    if (!panel) return;
    const id = S.selected;
    if (!id) { panel.dataset.empty = 'true'; panel.querySelector('[data-p-body]').replaceChildren(el('p', { class: 'dim p-empty' }, 'Selecciona una tarea para ver su detalle e historial.')); return; }
    delete panel.dataset.empty;
    const m = meta[id], t = cur().tasks[id], inp = S.input.tasks.find((x) => x.id === id), b = baseline.tasks[id];
    const tab = panel.dataset.tab ?? 'detalle';
    const dl = (pairs) => el('dl', { class: 'p-dl' }, ...pairs.filter(Boolean).flatMap(([k, v]) => [el('dt', {}, k), el('dd', {}, v)]));
    const deps = (dir) => depsOf(id, dir).map((d) => el('li', {}, el('span', { class: 'g-code' }, dir === 'in' ? d.predecessorId : d.successorId), el('span', {}, meta[dir === 'in' ? d.predecessorId : d.successorId].name), el('span', { class: 'dep-type', title: TYPE[d.type] }, `${d.type}${d.lagDays ? signed(d.lagDays) : ''}`)));
    const conflicts = cur().conflicts.filter((c) => c.successorId === id);
    const content = tab === 'historial'
      ? el('ol', { class: 'p-hist' }, ...(S.history[id] ?? [{ at: '2026-10-28T10:00:00Z', actor: 'LF', what: 'Creó la tarea', rev: 3 }]).map((h) => el('li', {},
          el('div', { class: 'h-meta' }, avatar(people, h.actor, 'av-xs'), el('span', {}, people[h.actor]?.name), el('span', { class: 'num dim' }, `${fmtStamp(h.at)} · r${h.rev}`)),
          el('p', {}, el('strong', {}, h.what), h.from ? ` ${h.from} → ${h.to}` : h.to ? ` ${h.to}` : ''),
          h.impact ? el('p', { class: 'dim' }, h.impact) : null)))
      : el('div', { class: 'p-stack' },
          conflicts.length ? el('div', { class: 'p-alert', role: 'note' }, icon('triangle-alert'), el('div', {}, el('strong', {}, 'Conflicto de planificación reconocido'),
            ...conflicts.map((c) => el('p', {}, `Empieza ${days(c.deficitDays)} antes de lo que exige ${c.dependencyId} (${TYPE[S.input.dependencies.find((d) => d.id === c.dependencyId).type].toLowerCase()} desde ${S.input.dependencies.find((d) => d.id === c.dependencyId).predecessorId}). La fecha manual se mantiene.`)))) : null,
          dl([
            ['Estado', m.status ? STATUS[m.status] : 'Derivado'],
            ['Programación', CLASS[t.class]],
            m.kind !== 'group' ? ['Responsable', el('span', { class: 'p-person' }, avatar(people, m.responsible, 'av-xs'), people[m.responsible]?.name ?? 'Sin responsable')] : null,
            m.collaborators.length ? ['Colaboran', el('span', { class: 'p-people' }, ...m.collaborators.map((c) => el('span', { class: 'p-person' }, avatar(people, c, 'av-xs'), people[c].name)))] : null,
            ['Plan', `${fmtShort(t.start)} – ${fmtShort(t.finish)}`],
            inp?.actualStart ? ['Real', `${fmtShort(inp.actualStart)} – ${inp.actualFinish ? fmtShort(inp.actualFinish) : 'en curso'}`] : null,
            inp?.remainingDurationDays ? ['Restante', `${days(inp.remainingDurationDays)} desde ${fmtShort(inp.remainingAsOf)}`] : null,
            b && m.kind !== 'group' ? ['Línea base', `${fmtShort(b.start)} – ${fmtShort(b.finish)} · fin ${signed(t.finishIdx - b.finishIdx)} d`] : null,
            t.totalFloat != null ? ['Holgura', `${signed(t.totalFloat)} días laborables${t.criticalReason === 'ancladaManual' ? ' · anclada a manual' : t.critical ? ' · ruta crítica' : ''}`] : null,
            m.effort ? ['Esfuerzo est.', `${m.effort / 60} h`] : null,
            m.kind !== 'group' ? ['Progreso', `${t.progress ?? 0}%`] : null,
          ]),
          depsOf(id, 'in').length ? el('section', {}, el('h4', {}, 'Predecesoras'), el('ul', { class: 'p-deps' }, deps('in'))) : null,
          depsOf(id, 'out').length ? el('section', {}, el('h4', {}, 'Sucesoras'), el('ul', { class: 'p-deps' }, deps('out'))) : null);
    panel.querySelector('[data-p-title]').replaceChildren(el('span', { class: 'g-code' }, id), ' ', m.name);
    panel.querySelector('[data-p-body]').replaceChildren(content);
    for (const b2 of panel.querySelectorAll('[data-tab]')) b2.setAttribute('aria-selected', String(b2.dataset.tab === tab));
  }
  panel?.addEventListener('click', (e) => { const t = e.target.closest('[data-tab]'); if (t) { panel.dataset.tab = t.dataset.tab; renderPanel(); } });

  // ---------- Controles ----------
  const api = {
    zoom(z) { S.zoom = z; render(); api.today(); },
    toggle(k, v) { S[k] = v ?? !S[k]; render(); return S[k]; },
    filter(patch) { Object.assign(S.filter, patch); render(); },
    toggleStatus(s) { S.filter.status.has(s) ? S.filter.status.delete(s) : S.filter.status.add(s); render(); return S.filter.status.has(s); },
    // «Hoy» al 25 % del cronograma visible (descontando la tabla fija de la izquierda).
    today() { scroller.scrollLeft = Math.max(0, xOf(DEMO.today) - (scroller.clientWidth - grid.offsetWidth) * 0.25); },
    select, render, state: S,
  };
  render();
  requestAnimationFrame(() => api.today());
  return api;
}
