# AP-002a · Sistema de diseño oficial — Dirección C · Asserta

| Campo | Valor |
|---|---|
| Estado | **Referencia visual oficial del producto** (aprobada definitivamente el 2026-11-26) |
| Alcance | Obligatoria para AP-002b (resto de pantallas), AP-003 (PoC Gantt) y F1–F6 (`packages/ui`) |
| Prototipo de referencia | `poc/ux-ap002a/c/` + `poc/ux-ap002a/shared/` (`a/` y `b/` conservados solo como evidencia histórica) |
| Regla de cambio | No se permiten rediseños ni nuevas direcciones sin aprobación humana explícita. La identidad provisional (`--brand`) se sustituye por tokens al recibir los recursos de Marketing/Comunicación (P-25) |

---

## 1. Principios y arquitectura de tokens

La Dirección C combina la base estética editorial de papel y tinta (claridad tipográfica, filetes, jerarquía sin ornamento) con controles de precisión (modo compacto, franja de lecturas, holgura visible, navegación plegable y panel adaptable por espacio real). Claro es el tema por defecto; oscuro mantiene exactamente los mismos niveles de contraste y semántica.

### 1.1 Separación cromática estricta (DD-C10)
Ningún color repite significado. Nunca se depende únicamente del color: siempre acompaña icono, trazo discontinuo, patrón, posición o texto.

| Significado | Claro (`data-theme="light"`) | Oscuro (`data-theme="dark"`) | Uso exclusivo |
|---|---|---|---|
| **Identidad / foco** (`--brand`, `--focus`) | `#1f5c63` (ink `#ffffff`, soft `#e1eced`) | `#6fb6bc` (ink `#0b1f21`, soft `rgb(111 182 188 / .14)`) | Marca provisional, foco de teclado (`2px`), elemento activo en índice (P-25 sustituible) |
| **Ruta crítica** (`--crit-bar`, `--crit-progress`, `--crit-text`, `--crit-ink`, `--crit-link`) | barra `#f2c4b3`, progreso/vínculo `#e2401c`, texto en barra `#141413`, texto lectura `#b3300e` | barra `#5b2a1c`, progreso/vínculo `#ff5a33`, texto en barra `#ffe2d8`, texto lectura `#ff7d5c` | Solo tareas/hitos/vínculos con holgura ≤ 0 (CPM) |
| **Error y conflicto** (`--signal`, `--signal-text`, `--signal-soft`) | `#a3122b`, texto `#9e1129`, fondo `#f7dde2` | `#ff6b86`, texto `#ff8fa3`, fondo `rgb(255 107 134 / .13)` | Conflictos de planificación (trazo `3 3`), errores recuperables/409, salud roja, holgura negativa |
| **Advertencia** (`--warn`, `--warn-text`, `--warn-soft`) | `#c58a1c`, texto `#7a4f00`, fondo `#f6ead0` | `#e0a93b`, texto `#e8b85a`, fondo `rgb(224 169 59 / .13)` | Vencidos, Δ línea base positiva, tarea bloqueada, salud ámbar, sobrecarga |
| **Correcto / completado** (`--ok`, `--st-completada`) | `#4a6b3a` | `#8fae7e` | Salud verde, estado completada |
| **Estados de tarea** (`--st-*`) | `pendiente #a49d8b`, `en_curso #141413`, `bloqueada #c58a1c`, `completada #4a6b3a` | `pendiente #6f6a5f`, `en_curso #ece8de`, `bloqueada #e0a93b`, `completada #8fae7e` | Marca lateral de 3 px (`inset 3px 0 0 var(--st)`) en columna código y badges de estado |

### 1.2 Primitivos y superficies

| Token | Claro (`light`) | Oscuro (`dark`) | Uso |
|---|---|---|---|
| `--bg` | `#f4f1ea` (`--papel`) | `#121211` (`--noche`) | Lienzo base y cabecera fija |
| `--surface` | `#faf8f3` (`--papel-2`) | `#181816` (`--noche-2`) | Panel de detalle, diálogos, controles, campos |
| `--surface-2` | `#ece8de` (`--papel-3`) | `#22211e` (`--noche-3`) | Hover de botones, avatares, estados pulsados |
| `--line` / `--row-line` / `--line-strong` | `#d9d4c7` / `#e5e0d4` / `#c2bba9` | `#2e2c27` / `#23221f` / `#3f3c35` | Bordes estructurales, separadores de fila, filetes dobles (`3px double`) |
| `--text` / `--text-2` / `--text-3` | `#141413` / `#4d4a43` / `#5f5b52` | `#ece8de` / `#b9b4a7` / `#908b7f` | Jerarquía tipográfica principal, secundaria y metadatos |
| `--accent` / `--accent-ink` | `#141413` / `#f4f1ea` | `#ece8de` / `#121211` | Botón primario y segmento activo |
| `--hover` / `--sel` / `--scrim` | `rgb(20 20 19 / .035)` / `.06` / `.3` | `rgb(236 232 222 / .04)` / `.07` / `rgb(0 0 0 / .6)` | Interacción de filas y fondo de modales |
| `--shadow-float` | `0 18px 40px rgb(20 20 19 / .14), 0 0 0 1px var(--line-strong)` | `0 18px 40px rgb(0 0 0 / .5), 0 0 0 1px var(--line-strong)` | Panel flotante, diálogos, tooltips, cajón móvil |

### 1.3 Tokens de Gantt

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--bar` / `--bar-progress` / `--bar-done` / `--bar-text` | `#d6cfbd` / `#141413` / `transparent` / `#141413` | `#3b3832` / `#ece8de` / `transparent` / `#ece8de` | Barra normal, franja de progreso inferior (3 px), completada (contorno `--st-completada` + texto tachado) |
| `--group-bar` | `#141413` | `#ece8de` | Barra resumen WBS con terminales en triángulo |
| `--link` / `--baseline` / `--weekend` | `#a49d8b` / `#8f8878` / `rgb(20 20 19 / .04)` | `#5e5a51` / `#7c776b` / `rgb(236 232 222 / .03)` | Vínculos ortogonales (1 px), barra línea base (3 px), días no laborables |
| `--today` / `--actual` | `#141413` / `#141413` | `#ece8de` / `#ece8de` | Línea vertical `HOY` (1,5 px) y trazo real inferior (2 px) |
| `--ms-fill` / `--ms-line` | `#f4f1ea` / `#141413` | `#121211` / `#ece8de` | Rombo de hito (convención A, P-14) |
| `--manual-line` / `--manual-hatch` | `#5f5b52` / `rgb(20 20 19 / .1)` | `#908b7f` / `rgb(236 232 222 / .1)` | Borde y rayado diagonal `135deg` de tareas manuales |

### 1.4 Tipografía, escala, densidad y geometría
- **Tipografía (local, OFL-1.1, sin CDN):** `--font-ui: 'Inter Tight Variable', system-ui, sans-serif` (rasgos `"cv11", "ss01"`) y `--font-mono: 'JetBrains Mono Variable', ui-monospace, monospace` (`font-variant-numeric: tabular-nums` en todas las cifras, fechas y códigos).
- **Escala:** `--fs-body: 14px` (`13px` en compacta), `--fs-small: 12.5px`, `--fs-label: 11px` (uppercase mono `letter-spacing: .06–.1em`), `--fs-num: 12px`, `--fs-bar: 12px`, `--fs-h3: 17px`, `--fs-h2: 22px`, `h1: clamp(24px, 2.1vw, 32px)`.
- **Controles y radios:** `--radius: 3px`, `--radius-lg: 4px`, `--bar-r: 2px`, `--today-w: 1.5px`, `--base-y: 2px`, `--ctl-h: 32px` (`44px` en `@media (pointer: coarse)`), `--ease: cubic-bezier(.22, 1, .36, 1)`.
- **Densidad (DD-C02):**
  - Estándar (`data-density="estandar"`): `--row-h: 36px`, `--bar-h: 20px`, `--ms: 12px`, `--group-h: 5px`, `--head-h: 58px`, `--indent: 16px`, etiqueta dentro de barra si cabe.
  - Compacta (`data-density="compacta"`): `--row-h: 28px`, `--bar-h: 12px`, `--ms: 10px`, `--group-h: 4px`, `--head-h: 54px`, `--indent: 14px`, etiqueta fuera en mono `11px`.
- **Geometría de marcos:** `--nav-w: 248px` (`0px` plegada), `--name-w: 220px` (rango 140–420 px), `--grid-tpl: 52px var(--name-w) 40px 60px 82px 46px` (`--grid-cols-w: calc(280px + var(--name-w))`), `--panel-w: 340px` (rango 300–560 px), `MIN_LANE: 480px`.
- **Iconografía:** `lucide-static` (ISC), renderizados mediante máscara CSS sobre `currentColor`, `16px` por defecto (`--i-size`).

---

## 2. Catálogo de componentes oficiales

| Componente | Clases / estructura en C | Reglas de reutilización (AP-002b y `packages/ui`) |
|---|---|---|
| **Shell e índice lateral** | `nav.index`, `.wordmark`, `.toc`, `.sub`, `.foot` | Numeración editorial `01..N` con puntos conductores (`.lead`) y contadores; proyectos restringidos marcados con candado (`i-lock`, `aria-label="Restringido"`); pie fijo con avatar de iniciales (sin fotos), rol y selector de tema; totalmente plegable (`[`) y cajón superpuesto en `<760 px` |
| **Cabecera compacta** | `.masthead`, `.kicker`, `.tabs`, `.titlebar`, `.dateline`, `.reads` | `container-type: inline-size`; pestañas de vistas del proyecto integradas en `.kicker` para ahorrar altura (~215 px cabecera + toolbar); filete doble inferior (`3px double`); lecturas KPI en `.reads` con colapso automático (`≤1100 px` oculta secundarias; `≤760 px` oculta bloque) |
| **Barra de herramientas** | `.toolbar`, `.seg`, `.btn`, `.btn-primary`, `.btn-ghost`, `.icon-btn`, `.chip`, `.field` | Controles agrupados en segmentos (`.seg`), filtros no destructivos con aviso `Filtro activo · el plan no cambia` (`.fnote`), botones con `aria-pressed` y tooltips en controles de solo icono |
| **Tabla WBS + Gantt** | `.gantt`, `.g-gridhead`, `.g-resize`, `.g-row`, `.g-bar`, `.g-ms`, `.g-base`, `.g-links`, `.fl` | Columna código con barra de estado de 3 px; fases nivel 1 con `3px double` y mayúsculas; columna Tarea redimensionable (ratón y `← →`); medidor de holgura `.fl` con barras proporcionales y tooltip explicativo; barra real inferior + barra planificada + línea base opcional + capa de vínculos SVG |
| **Panel de detalle adaptable** | `.stage[data-mode]`, `.gutter`, `aside.panel`, `.p-tabs`, `.p-body`, `.p-dl`, `.p-hist` | Modos `dock` / `float` / `closed`; cambio automático a `float` si `stageWidth - gridW - panelW - 6 < 480 px` (medido con `ResizeObserver`), con aviso visible `.p-mode`; en `float` solo visible con selección; `.p-body` con `tabindex="0"` y `role="region"` |
| **Diálogo de impacto** | `dialog.impact`, `.impact-list`, `.impact-conf`, `.ack` | Modal nativo `<dialog>` con resumen de operación, lista de tareas desplazadas transitivamente y bloque de conflictos nuevos con casilla obligatoria de reconocimiento (`acknowledgedConflicts`); confirmar deshabilitado hasta marcar reconocimiento |
| **Indicadores y ayuda** | `.av`, `.tag`, `.health`, `.tip`, `.toast`, `.keys` | Avatares por iniciales; etiquetas mono (`.tag-manual`, `.tag-conf`); salud con símbolo distinto + color (`●` rojo, `◐` ámbar, `○` verde); tooltips accesibles ratón+teclado (`role="tooltip"`, `aria-describedby`); panel de atajos y leyenda (`?`) |
| **Bloques de estado** | `.state` (`cargando`, `vacio`, `error`, `sinpermiso`, `sesion`, `conflicto`, `pendiente`) | Obligatorios en todas las vistas; copy accionable en castellano, icono semántico y acción de recuperación (reintentar, volver, recargar revisión 409, iniciar sesión) |
| **Inicio editorial** | `.figs`, `.cols12`, `.sec-h`, `.day`, `.mstone`, `.notes`, `.ptable` | 4 cifras grandes con filete doble superior; rejilla 12 columnas (7/5); agenda agrupada por día con vencidos en `--warn-text`; lista de hitos, bandeja de actividad y tabla de proyectos con salud y candado |

---

## 3. Patrones de interacción y reglas de diseño

1. **El Gantt manda (DD-C03, DD-C08):** la cabecera y barra de herramientas deben mantenerse compactas; las lecturas se adaptan al contenedor (container queries) y existe modo pantalla completa (`F`, con Fullscreen API opcional y degradación limpia).
2. **Espacio real sobre breakpoints fijos (DD-C06):** el panel de detalle decide `dock` frente a `float` con `ResizeObserver` garantizando al menos `480 px` de cronograma útil.
3. **Preview antes de confirmar (CH-01, CH-10):** cualquier cambio con impacto en fechas o conflictos pasa por vista previa (atenuación `.is-preview` y contorno discontinuo `.is-changed`) y diálogo de impacto; cancelar nunca persiste; error revierte.
4. **Filtros no destructivos (RF-11):** filtrar nunca modifica el plan ni oculta avisos de estado; muestra `.fnote` con `aria-live="polite"`.
5. **Preferencias de usuario persistentes (RF-34 / P-29 aprobada):** `theme`, `density`, `defaultZoom`, `navCollapsed`, `panelMode`, `panelWidthPx` y `taskColWidthPx` se persisten por usuario en el servidor (`user_preference` / `GET|PUT /api/v1/me/preferences`) y se sincronizan entre dispositivos. Los parámetros de URL solo aplican a la visita actual.
6. **Móvil y pantallas pequeñas (`<760 px`, DD-C13):** nunca se comprime el cronograma; se presenta lista de lectura por fases y ficha/formularios a pantalla completa; la navegación abre como cajón lateral.
7. **Teclado y accesibilidad (WCAG 2.2 AA, DD-C11, DD-C12):**
   - Atajos globales (desactivados dentro de inputs/selects/diálogos/separadores): `1/2/3` escala, `C` ruta crítica, `B` línea base, `T` hoy, `D` densidad, `P` modo panel, `F` pantalla completa, `[` navegación, `?` ayuda y leyenda, `Esc` cerrar capa activa.
   - En tabla/Gantt: `↑ ↓ ← →` mover/plegar/expandir, `Alt+←/→` desplazar 1 día laborable con preview, `Enter` abrir detalle.
   - Separadores (`.gutter`, `.g-resize`) operables por ratón y teclado (`role="separator"`, `aria-valuemin/max/now`).
   - Respetar `@media (prefers-reduced-motion: reduce)`.
   - Pendientes de verificación antes de cerrar AP-002b/F0: Safari y Firefox (P-30) y lector de pantalla real NVDA/VoiceOver (P-31).
8. **Límites de arquitectura visual (AGENTS.md):**
   - Prohibido duplicar lógica de cálculo o fechas del motor en componentes visuales.
   - Prohibido copiar assets de terceros (GanttPRO u otros) o cargar fuentes/iconos desde CDN externos.
   - Los campos económicos y controles administrativos solo se renderizan cuando el servidor autoriza la capability correspondiente (sin ocultar datos ya enviados al cliente).
   - En F1 (`packages/ui`), estos tokens CSS se mapean 1:1 a variables de Tailwind v4 / shadcn sin introducir una paleta paralela.
