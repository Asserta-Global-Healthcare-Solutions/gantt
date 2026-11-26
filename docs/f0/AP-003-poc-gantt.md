# AP-003 · PoC comparativa del componente Gantt

| Campo | Valor |
|---|---|
| Estado | **Completada — pendiente de selección humana (insumo para `ADR-002`)** |
| Fecha de ejecución | 2026-11-26 |
| Rama / carpeta | `feat/AP-003-poc-gantt` · `poc/gantt-poc/` (desechable; cero código en `apps/` o `packages/`) |
| Stack fijado | **Next.js `16.4.6`** (Turbopack, Active LTS) + **React `19.3.1`** + **TypeScript `5.8.3`** |
| Modo de benchmark | **Build de producción (`next build` + `next start`)** — sin métricas de servidor dev |
| Entorno medido | Windows 11 (`win32 10.0.26300 x64`), Intel Core i7-8550U (8 hilos), 15,8 GB RAM, Node `v24.19.0`, Chrome `158.0.8127.88` headless |
| Capturas | `docs/f0/assets/ap-003/{frappe,svar,dhtmlx,custom}-{light,dark}-1440.jpg` |

> **Sin selección definitiva:** este informe aporta métricas reales, verificación forense de licencias y análisis de coste total de mantenimiento (TCO) para decidir en `ADR-002` tras aprobación humana.

---

## 1. Dataset común y verificación con el oráculo AP-004

Las 4 alternativas consumen exactamente el mismo archivo generado por `poc/gantt-poc/dataset/generate.mjs` (semilla fija `20261126`) y validado por `poc/engine-oracle/src/schedule.mjs` (`exit 0`, cálculo del oráculo en `482,88 ms`):

- **1.000 tareas exactas:** 60 grupos WBS (10 fases L1 + 50 subfases L2), 880 tareas hoja y 60 hitos (convención A, P-14).
- **2.000 vínculos acíclicos exactos:** `FS: 936`, `SS: 461`, `FF: 377`, `SF: 226` (con lags 0, positivos y negativos).
- **Semántica completa v1.1:** tareas `AUTO`, `MANUAL`, `FACT_RUNNING`, `FACT_DONE`, **259 conflictos** reales (`MANUAL`/`FACT`), **809 tareas críticas**, **124 avisos** y **línea base congelada**.
- **Horizonte temporal común:** `2026-10-05` → `2033-09-14` (~7 años, dentro del límite de 10 años de AP-004 §3.3).

---

## 2. Versiones fijadas y auditoría de licencias (directas y transitivas)

Instalación limpia con `npm install --ignore-scripts` (**sin `--force` ni `--legacy-peer-deps`**, 0 vulnerabilidades en `npm audit`, 60 paquetes totales inspeccionados en `poc/gantt-poc/bench/licenses-report.json`):

| Paquete | Versión exacta | Licencia verificada (`package.json` + archivo) | Compatibilidad React 19 / Next 16 | Hallazgos forenses reales |
|---|---|---|---|---|
| `next` | `16.4.6` | MIT (`license.md`) | Base Active LTS | Arrastra transitivamente `@img/sharp-win32-x64@0.35.5` (`Apache-2.0 AND LGPL-3.0-or-later`, libvips); evaluar en `ADR-001` (`images.unoptimized` / contenedor Linux) |
| `react` / `react-dom` | `19.3.1` | MIT (`LICENSE`) | Base | 0 alertas |
| `typescript` | `5.8.3` | Apache-2.0 (`LICENSE.txt`) | Base | 0 alertas |
| `frappe-gantt` | `1.2.2` | MIT (`license.txt`) | ⚠️ Fricción | Sin `.d.ts` (fallo TS7016); CSS fuera de `exports` (Turbopack bloquea `frappe-gantt/dist/...`); `custom_class` falla si contiene espacios (`DOMTokenList.add`) |
| `@svar-ui/react-gantt` | `2.8.3` | MIT (`license.txt`) | ✅ `peerDeps >=18` | `package.json` marca `"productTrial": true` y arrastra 16 subpaquetes `@svar-ui/*` + `date-fns@3.6.0` (todos MIT). `baselines` no renderiza en edición MIT sin PRO |
| `dhtmlx-gantt` | `10.1.0` | MIT (`LICENSE.md`) | ⚠️ JS imperativo | 0 dependencias transitivas. Wrapper React oficial es comercial (no usado). `addTaskLayer` **no está disponible en Community MIT** (solo PRO) |
| Render propio (Spike) | — | Propiedad interna Asserta | ✅ Nativo React 19 | 0 dependencias externas adicionales |

**Desglose transitivo total (60 paquetes):** 49 MIT, 5 Apache-2.0, 2 ISC, 1 BSD-3-Clause, 1 0BSD, 1 CC-BY-4.0 (`caniuse-lite`), 1 `Apache-2.0 AND LGPL-3.0-or-later` (`@img/sharp-win32-x64@0.35.5`, transitiva de Next.js, no de las librerías Gantt).

---

## 3. Métricas medidas sobre build de producción (`next build` + `next start`)

Resultados reproducibles de `node bench/run-bench.mjs` (`poc/gantt-poc/bench/bench-results.json`, 3 pasadas por candidata, viewport `1440×900`, Chrome `158`, `axe-core` WCAG 2.0/2.1/2.2 A+AA):

| Métrica | Objetivo RNF-03/07 | **Frappe** (`1.2.2`) | **SVAR** (`2.8.3`) | **DHTMLX Comm.** (`10.1.0`) | **Render propio** |
|---|---:|---:|---:|---:|---:|
| **Primer render p50** | ≤ 3.000 ms | 2.721,95 ms | 1.312,04 ms | 770,41 ms | **485,71 ms** |
| **Primer render p95** | ≤ 3.000 ms | **3.548,36 ms** ❌ | 1.515,28 ms ✅ | 887,68 ms ✅ | **540,06 ms** ✅ |
| **Zoom (Día/Sem/Mes/Año) p50** | — | 44,9 ms | 49,2 ms | 70,5 ms | **30,2 ms** |
| **Zoom p95** | — | **2.224,8 ms** ❌ | 60,7 ms | 92,4 ms | **31,9 ms** |
| **Preview drag p50 / p95** | Fluido | 31,4 / 38,5 ms | **30,0 / 31,0 ms** | 31,3 / 32,3 ms | 31,5 / 31,7 ms |
| **Scroll FPS medio / p5** | ≥ 45 fps | 56,0 / 30,0 fps | **60,0 / 59,9 fps** ✅ | 49,8 / 29,9 fps ⚠️ | **60,0 / 59,5 fps** ✅ |
| **Nodos DOM (1.000 tareas)** | Virtualizado | **17.287** ❌ | 693 ✅ | 1.306 ✅ | **510** ✅ |
| **Memoria JS Heap** | — | 14,13 MB | 8,88 MB | 11,94 MB | **7,23 MB** |
| **WBS 3 niveles plegable** | Obligatorio | ❌ No | ✅ Sí | ✅ Sí | ✅ Sí |
| **4 tipos de vínculo (FS/SS/FF/SF)** | Obligatorio | ❌ Solo FS sin lag | ✅ Sí (50 en viewport) | ✅ Sí (38 en viewport) | ✅ Sí (67 en viewport) |
| **Vínculos de conflicto marcados** | Obligatorio (259) | ❌ 0 marcados | ❌ 0 marcados en MIT | ✅ 21 en viewport (`link_class`) | ✅ 37 en viewport (trazo `3 3`) |
| **Overlay línea base sin PRO** | Obligatorio (D-11) | ❌ 0 nodos | ❌ 0 nodos en MIT | ❌ `addTaskLayer` ausente en MIT | ✅ Nativo (3 px bajo barra) |
| **Integridad del snapshot (1.000 tareas)** | 0 mutaciones | ❌ 1.000/1.000 mutadas (`+1d`) | ⚠️ Intacto **solo** omitiendo `duration` (con `duration` mutó >500 tareas y colapsó `summary`) | ✅ 1.000/1.000 intactas (evitando `type:'project'` y con `auto_scheduling=false`) | ✅ 1.000/1.000 intactas por construcción |
| **Accesibilidad `axe-core` (L / D)** | 0 serias/críticas | ❌ 1 / 1 (`color-contrast`) | ❌ **3 / 3** (`aria-valid-attr-value` crítica + `aria-conditional-attr` 25 nodos + contraste) | ✅ 0 / 0 *(sin teclado WBS completo)* | ✅ **0 / 0** + `treegrid` teclado |
| **Errores de consola** | 0 | 1 (404 recurso) | 0 | 0 | 0 |

---

## 4. Criterios eliminatorios y matriz ponderada (03-ARQUITECTURA §3)

### 4.1 Criterios eliminatorios
| Criterio | Frappe `1.2.2` | SVAR `2.8.3` MIT | DHTMLX `10.1.0` MIT | Render propio |
|---|---|---|---|---|
| **E1** Licencia libre válida uso interno sin PRO | ✅ MIT | ✅ MIT *(alerta `productTrial: true`)* | ✅ MIT | ✅ Interno |
| **E2** Overlays de criticidad, conflictos y línea base sin PRO | ❌ Falla | ❌ Falla (`baselines` y clases por vínculo ausentes en MIT) | ⚠️ Parcial (criticidad y conflictos sí; línea base exige hack sin `addTaskLayer`) | ✅ Cumple |
| **E3** Independencia del motor (sin mutación silenciosa) | ❌ Muta `_end` y solo FS | ⚠️ Requiere omitir `duration` y bloquear `update-task` | ✅ Cumple (con `auto_scheduling=false` y grupos como `task`) | ✅ Cumple por diseño |
| **E4** Integración estable Next.js 16 + React 19 | ❌ Falla CSS exports / sin `.d.ts` | ✅ Cumple | ⚠️ Imperativo (singleton global) | ✅ Cumple |

### 4.2 Puntuación ponderada (escala 0–10)
| Eje (peso oficial) | Frappe | SVAR MIT | DHTMLX Community | Render propio |
|---|---:|---:|---:|---:|
| Capacidad funcional sin PRO (**35%**) | 2,0 | 6,0 | 7,5 | **9,5** |
| Rendimiento 1.000/2.000 (**25%**) | 3,5 | 8,5 | 7,0 | **9,5** |
| Accesibilidad WCAG 2.2 AA y teclado (**15%**) | 3,0 | 3,5 | 6,5 | **9,0** |
| Integración Next 16/React 19 y fidelidad C (**15%**) | 3,0 | 7,0 | 6,0 | **9,5** |
| Licencia y coste total de mantenimiento (**10%**) | 6,0 | 6,0 | 7,5 | **6,5** |
| **Total ponderado (sobre 10)** | **3,08** | **6,40** | **7,03** | **9,10** |

---

## 5. Esfuerzo real de implementación y coste total de mantenimiento (TCO)

No se favorece ninguna alternativa por rapidez inicial:

1. **Frappe Gantt (`1.2.2`):** **descartada**. Reconstruir WBS 3 niveles, FS/SS/FF/SF, virtualización y línea base sobre Frappe equivale a reescribir la librería entera cargando con su arquitectura SVG sin virtualizar (17.287 nodos DOM).
2. **SVAR React Gantt (`2.8.3` MIT):** rápida de montar inicialmente (~3–5 días para vista básica), **pero coste oculto alto y riesgo estructural**: la edición MIT no entrega overlays de línea base ni estilizado individual de los 259 vínculos de conflicto, inyecta 3 violaciones `axe-core` (una crítica) en su DOM interno fuera de nuestro control, exige sortear su recálculo interno de `duration`/`summary` y arrastra 16 paquetes `@svar-ui/*` cuya frontera MIT vs PRO depende del proveedor (`productTrial: true`).
3. **DHTMLX Gantt Community (`10.1.0` MIT):** alternativa viable de librería madura (~1–2 semanas de adaptador inicial). Destaca por licencia MIT pura (0 transitivas), `link_class` para conflictos y buena integridad del snapshot. **Costes reales a medio plazo:** (a) sin `addTaskLayer` en Community, implementar línea base y barra real vs planificada obliga a inyectar overlays DOM acoplados al layout interno de DHTMLX (frágiles ante upgrades); (b) el singleton imperativo `gantt` complica pruebas React/Next, StrictMode y navegación por teclado WCAG 2.2 AA; (c) estilizar el CSS interno de DHTMLX para mantener la fidelidad exacta de **C · Asserta** (estándar 36 px / compacta 28 px, holgura, filetes editoriales, modo oscuro) requiere sobrescribir decenas de selectores internos; (d) p5 de scroll cayó a 29,9 fps.
4. **Render propio virtualizado (React 19 + SVG sobre tokens C · Asserta):** **mayor inversión inicial en F2** (~3–4 semanas de desarrollo cuidado en `AP-022` y `AP-023` para añadir drag/resize con puntero/teclado, creación/edición interactiva de vínculos, tooltips, scroll sincronizado horizontal/vertical, virtualización horizontal en escala Día y batería E2E/visual). **Menor TCO y menor riesgo a 2–3 años:** cero dependencias comerciales/PRO, cero hacks CSS sobre DOM ajeno, **0/0 violaciones `axe-core`** con teclado nativo, **100% fidelidad con C · Asserta** (reutilizando directamente la arquitectura visual ya probada en `AP-002a`), mejor rendimiento medido en todas las métricas (render p95 `540 ms`, zoom p95 `31,9 ms`, scroll `60 fps`, `510` nodos DOM) e inmunidad total ante cambios de versión de React 19 / Next.js 16 o cambios de licencia de terceros.

---

## 6. Recomendación preliminar (para decisión humana en `ADR-002`)

1. **Opción recomendada (primaria):** **Render propio virtualizado** en `packages/gantt-adapter` + `packages/ui`, acotado estrictamente a la especificación de `AP-002a` (C · Asserta) y al contrato puro de `AP-004`, dividiendo `AP-022`/`AP-023` en entregables verificables con pruebas visuales y de rendimiento.
2. **Opción de respaldo (secundaria, solo si se priorizase reducir esfuerzo inicial en F2 asumiendo compromisos en línea base/teclado/tematizado C):** **DHTMLX Gantt Community `10.1.0` (MIT)** mediante adaptador imperativo aislado, aceptando de antemano el coste de workarounds sin `addTaskLayer` y la optimización del scroll p5.
3. **Descartadas:** **Frappe Gantt** (incumple requisitos básicos y RNF-03) y **SVAR React Gantt MIT** (brechas de overlays/conflictos sin PRO y 3 errores `axe-core` internos).

**Pendiente de decisión humana:** aprobar la opción para redactar `ADR-002` dentro de `AP-006`.
