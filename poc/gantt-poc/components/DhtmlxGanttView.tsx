'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { PocChrome } from './PocChrome';
import {
  addDaysIso, checkSnapshotIntegrity, dateToIso, isoToLocalDate,
  type Density, type PocDataset, type SnapshotIntegrityResult, type Theme, type ZoomLevel,
} from './PocTypes';

const DHTMLX_LINK_TYPE = {
  FS: '0',
  SS: '1',
  FF: '2',
  SF: '3',
} as const;

function getScales(zoom: ZoomLevel) {
  if (zoom === 'dia') {
    return [
      { unit: 'month', step: 1, format: '%F %Y' },
      { unit: 'day', step: 1, format: '%d' },
    ];
  }
  if (zoom === 'semana') {
    return [
      { unit: 'month', step: 1, format: '%F %Y' },
      { unit: 'week', step: 1, format: 'S%W' },
    ];
  }
  if (zoom === 'mes') {
    return [
      { unit: 'year', step: 1, format: '%Y' },
      { unit: 'month', step: 1, format: '%M' },
    ];
  }
  return [
    { unit: 'year', step: 1, format: '%Y' },
    { unit: 'quarter', step: 1, format: (d: Date) => `T${Math.floor(d.getMonth() / 3) + 1}` },
  ];
}

export function DhtmlxGanttView() {
  const [dataset, setDataset] = useState<PocDataset | null>(null);
  const [zoom, setZoom] = useState<ZoomLevel>('mes');
  const [theme, setTheme] = useState<Theme>('light');
  const [density, setDensity] = useState<Density>('estandar');
  const [showCritical, setShowCritical] = useState(true);
  const [showBaseline, setShowBaseline] = useState(true);
  const [showConflicts, setShowConflicts] = useState(true);
  const [integrity, setIntegrity] = useState<SnapshotIntegrityResult | null>(null);
  const [previewNote, setPreviewNote] = useState<string | null>(null);
  const [addLayerWorked, setAddLayerWorked] = useState<boolean>(false);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const ganttRef = useRef<any>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    fetch('/dataset-1000.json')
      .then((r) => r.json())
      .then((d: PocDataset) => setDataset(d));
  }, []);

  const conflictLinkSet = useMemo(() => new Set(dataset?.conflicts.map((c) => c.dependencyId) ?? []), [dataset]);
  const conflictTargetSet = useMemo(() => new Set(dataset?.conflicts.map((c) => c.successorId) ?? []), [dataset]);
  const criticalTaskSet = useMemo(() => new Set(dataset?.tasks.filter((t) => t.critical).map((t) => t.id) ?? []), [dataset]);

  useEffect(() => {
    if (!dataset || !hostRef.current) return;
    let disposed = false;

    (async () => {
      const mod: any = await import('dhtmlx-gantt');
      const gantt = mod.gantt ?? mod.default;
      if (disposed || !hostRef.current) return;
      ganttRef.current = gantt;

      gantt.clearAll();
      gantt.config.xml_date = '%Y-%m-%d';
      gantt.config.smart_rendering = true;
      gantt.config.smart_scales = true;
      gantt.config.static_background = true;
      gantt.config.auto_scheduling = false;
      gantt.config.fit_tasks = false;
      gantt.config.open_tree_initially = true;
      gantt.config.show_links = true;
      gantt.config.row_height = density === 'compacta' ? 28 : 36;
      gantt.config.bar_height = density === 'compacta' ? 12 : 18;
      gantt.config.scale_height = 52;
      gantt.config.scales = getScales(zoom);
      gantt.config.min_column_width = zoom === 'dia' ? 30 : zoom === 'semana' ? 68 : zoom === 'mes' ? 84 : 110;
      gantt.config.columns = [
        { name: 'text', label: 'Tarea (WBS)', tree: true, width: 250, resize: true },
        { name: 'responsible', label: 'Resp.', width: 46, align: 'center' },
        { name: 'floatLabel', label: 'Holg.', width: 48, align: 'right' },
      ];

      // Templates Community MIT (sin módulos PRO) para ruta crítica, manuales, hechos y conflictos
      gantt.templates.task_class = (_s: Date, _e: Date, task: any) => {
        const cls: string[] = [`dhx-cls-${task._class}`];
        if (task._kind === 'group') cls.push('dhx-group');
        if (task._kind === 'milestone') cls.push('dhx-milestone');
        if (task._critical) cls.push('dhx-crit');
        if (task._conflict) cls.push('dhx-conf');
        return cls.join(' ');
      };

      gantt.templates.link_class = (link: any) => {
        const cls: string[] = [];
        if (conflictLinkSet.has(String(link.id))) cls.push('dhx-lk-conf');
        else if (criticalTaskSet.has(String(link.source)) && criticalTaskSet.has(String(link.target))) cls.push('dhx-lk-crit');
        return cls.join(' ');
      };

      gantt.templates.task_text = (_s: Date, _e: Date, task: any) => {
        if (task._kind === 'milestone') return '';
        const badge = task._conflict ? '<span class="dhx-badge-conf">!</span> ' : '';
        return `${badge}${task._code}`;
      };

      // Comprobar si addTaskLayer funciona en DHTMLX Community 10.1.0 MIT para overlay de línea base sin PRO
      let layerOk = false;
      try {
        if (typeof gantt.addTaskLayer === 'function') {
          gantt.addTaskLayer((task: any) => {
            if (!task._baseStart || !task._baseEnd) return false;
            const sizes = gantt.getTaskPosition(task, task._baseStart, task._baseEnd);
            const el = document.createElement('div');
            el.className = 'dhx-baseline-bar';
            el.style.left = `${sizes.left}px`;
            el.style.width = `${Math.max(4, sizes.width)}px`;
            el.style.top = `${sizes.top + (gantt.config.bar_height ?? 18) + 2}px`;
            return el;
          });
          layerOk = true;
        }
      } catch {
        layerOk = false;
      }
      setAddLayerWorked(layerOk);

      // Bloquear mutaciones silenciosas durante drag: emitir preview y mantener snapshot intacto
      const evId = gantt.attachEvent('onBeforeTaskChanged', (id: string, mode: string, _orig: any) => {
        setPreviewNote(`Preview DHTMLX (${mode}, bloqueado sin commit): ${id} — motor backend es autoridad`);
        return false;
      });

      gantt.init(hostRef.current);

      const data = {
        data: dataset.tasks.map((t) => ({
          id: t.id,
          parent: t.parentId ?? 0,
          text: `${t.code} ${t.name}`,
          start_date: isoToLocalDate(t.start),
          end_date: t.kind === 'milestone' ? isoToLocalDate(t.start) : isoToLocalDate(addDaysIso(t.finish, 1)),
          progress: t.progress / 100,
          open: true,
          // NO usar type:'project' para que DHTMLX no recalcule/sobrescriba fechas de grupos WBS
          type: t.kind === 'milestone' ? 'milestone' : 'task',
          responsible: t.responsible,
          floatLabel: t.totalFloat === null ? '—' : `${t.totalFloat}d`,
          _code: t.code,
          _kind: t.kind,
          _class: t.class,
          _critical: t.critical,
          _conflict: conflictTargetSet.has(t.id),
          _baseStart: t.baselineStart ? isoToLocalDate(t.baselineStart) : null,
          _baseEnd: t.baselineFinish ? isoToLocalDate(addDaysIso(t.baselineFinish, 1)) : null,
        })),
        links: dataset.dependencies.map((d) => ({
          id: d.id,
          source: d.predecessorId,
          target: d.successorId,
          type: DHTMLX_LINK_TYPE[d.type],
        })),
      };

      gantt.parse(data);

      // Verificar integridad del snapshot tras gantt.parse()
      const readBack = new Map<string, { start: string; finish: string }>();
      gantt.eachTask((rt: any) => {
        const sIso = dateToIso(rt.start_date);
        const fIso = rt._kind === 'milestone' ? sIso : addDaysIso(dateToIso(rt.end_date), -1);
        readBack.set(String(rt.id), { start: sIso, finish: fIso });
      });
      setIntegrity(checkSnapshotIntegrity(dataset.tasks, readBack));
      readyRef.current = true;

      return () => {
        gantt.detachEvent(evId);
      };
    })();

    return () => {
      disposed = true;
    };
  }, [dataset, conflictLinkSet, conflictTargetSet, criticalTaskSet]);

  useEffect(() => {
    const gantt = ganttRef.current;
    if (!gantt || !readyRef.current) return;
    gantt.config.scales = getScales(zoom);
    gantt.config.min_column_width = zoom === 'dia' ? 30 : zoom === 'semana' ? 68 : zoom === 'mes' ? 84 : 110;
    gantt.config.row_height = density === 'compacta' ? 28 : 36;
    gantt.config.bar_height = density === 'compacta' ? 12 : 18;
    gantt.render();
  }, [zoom, density]);

  const handleKeyboardNudge = useCallback(() => {
    if (!dataset) return;
    const sample = dataset.tasks.find((t) => t.kind === 'task' && t.class === 'AUTO');
    if (!sample) return;
    setPreviewNote(
      `Preview teclado (+1d sin mutar snapshot): ${sample.code} ${sample.start} → ${addDaysIso(sample.start, 1)}`
    );
  }, [dataset]);

  useEffect(() => {
    (window as any).__POC_HOOKS__ = {
      name: 'dhtmlx',
      isReady: () => readyRef.current && Boolean(hostRef.current?.querySelector('.gantt_task_line')),
      setZoom: (z: ZoomLevel) => setZoom(z),
      setTheme: (t: Theme) => setTheme(t),
      setDensity: (d: Density) => setDensity(d),
      getScrollContainer: () =>
        hostRef.current?.querySelector('.gantt_ver_scroll') ??
        hostRef.current?.querySelector('.gantt_task') ??
        hostRef.current,
      simulateDragPreview: (idx = 0) => {
        if (!dataset) return;
        const target = dataset.tasks.filter((t) => t.kind === 'task')[idx % 50];
        if (!target) return;
        setPreviewNote(`Preview drag #${idx}: ${target.id} +1d (${target.start} → ${addDaysIso(target.start, 1)})`);
      },
      getDiagnostics: () => {
        const root = hostRef.current;
        const bars = root?.querySelectorAll('.gantt_task_line').length ?? 0;
        const links = root?.querySelectorAll('.gantt_task_link').length ?? 0;
        const conflictLinks = root?.querySelectorAll('.gantt_task_link.dhx-lk-conf').length ?? 0;
        const baselines = root?.querySelectorAll('.dhx-baseline-bar').length ?? 0;
        return {
          renderedBars: bars,
          renderedLinks: links,
          renderedConflictLinks: conflictLinks,
          renderedBaselineNodes: baselines,
          addTaskLayerWorkedInCommunity: addLayerWorked,
          supportsWbsCollapse: true,
          supportsFourDepTypes: true,
          supportsPerLinkConflictStylingInMit: true,
          integrity,
        };
      },
    };
  }, [dataset, integrity, addLayerWorked]);

  return (
    <PocChrome
      current="dhtmlx"
      title="AP-003 · DHTMLX Gantt Community (MIT sin PRO)"
      pkgLabel="dhtmlx-gantt@10.1.0 · MIT · JS directo"
      dataset={dataset}
      zoom={zoom}
      onZoom={setZoom}
      theme={theme}
      onTheme={setTheme}
      density={density}
      onDensity={setDensity}
      showCritical={showCritical}
      onToggleCritical={() => setShowCritical((v) => !v)}
      showBaseline={showBaseline}
      onToggleBaseline={() => setShowBaseline((v) => !v)}
      showConflicts={showConflicts}
      onToggleConflicts={() => setShowConflicts((v) => !v)}
      onKeyboardNudge={handleKeyboardNudge}
      integrity={integrity}
      previewNote={previewNote}
    >
      <style>{`
        .dhx-host { height: 100%; width: 100%; }
        .dhx-host .gantt_container, .dhx-host .gantt_grid, .dhx-host .gantt_task,
        .dhx-host .gantt_grid_scale, .dhx-host .gantt_task_scale, .dhx-host .gantt_row,
        .dhx-host .gantt_task_row { background: var(--bg); color: var(--text); border-color: var(--row-line); }
        .dhx-host .gantt_grid_head_cell, .dhx-host .gantt_scale_cell { color: var(--text-3); border-color: var(--line); }
        .dhx-host .gantt_cell { color: var(--text); border-color: var(--row-line); }
        .dhx-host .gantt_task_line { background: var(--bar); border-color: var(--line-strong); border-radius: 2px; }
        .dhx-host .gantt_task_progress { background: var(--bar-progress); }
        .dhx-host .gantt_task_content { color: var(--bar-text); font: 500 11px/1 var(--font-mono); }
        .dhx-host .gantt_task_line.dhx-group { background: var(--group-bar); border-color: var(--group-bar); height: 6px !important; margin-top: 8px; }
        .dhx-host .gantt_task_line.dhx-cls-MANUAL { background-image: repeating-linear-gradient(135deg, transparent 0 4px, var(--manual-hatch) 4px 5px); border-color: var(--manual-line); }
        .dhx-host.show-crit .gantt_task_line.dhx-crit:not(.dhx-cls-FACT_DONE) { background: var(--crit-bar); border-color: var(--crit-progress); }
        .dhx-host.show-crit .gantt_task_line.dhx-crit:not(.dhx-cls-FACT_DONE) .gantt_task_progress { background: var(--crit-progress); }
        .dhx-host.show-crit .gantt_task_line.dhx-crit .gantt_task_content { color: var(--crit-text); }
        .dhx-host.show-conf .gantt_task_line.dhx-conf { outline: 1.5px dashed var(--signal); outline-offset: 1px; }
        .dhx-host .gantt_line_wrapper div { background-color: var(--link); }
        .dhx-host .gantt_link_arrow { border-color: var(--link); }
        .dhx-host.show-crit .gantt_task_link.dhx-lk-crit .gantt_line_wrapper div { background-color: var(--crit-link); }
        .dhx-host.show-conf .gantt_task_link.dhx-lk-conf .gantt_line_wrapper div {
          background: repeating-linear-gradient(90deg, var(--signal) 0 4px, transparent 4px 7px);
        }
        .dhx-host.show-conf .gantt_task_link.dhx-lk-conf .gantt_link_arrow { border-color: var(--signal); }
        .dhx-baseline-bar { position: absolute; height: 3px; background: var(--baseline); border-radius: 2px; pointer-events: none; z-index: 1; }
        .dhx-host:not(.show-base) .dhx-baseline-bar { display: none; }
        .dhx-badge-conf { color: var(--signal-text); font-weight: 700; }
      `}</style>
      <div
        ref={hostRef}
        className={`dhx-host${showCritical ? ' show-crit' : ''}${showBaseline ? ' show-base' : ''}${showConflicts ? ' show-conf' : ''}`}
        aria-label="Cronograma DHTMLX Gantt Community"
      />
    </PocChrome>
  );
}
