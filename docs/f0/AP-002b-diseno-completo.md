# AP-002b · Diseño completo del prototipo navegable (17 pantallas y 7 recorridos)

| Campo | Valor |
|---|---|
| Ticket / Fase | `AP-002b` · Fase F0 (Diseño UX/UI completo) |
| Sistema visual aplicado | **C · Asserta** (referencia oficial aprobada en `docs/f0/AP-002a-sistema-diseno-c.md`, sin rediseños ni CDN) |
| Prototipo navegable | `poc/ux-ap002b/index.html` (mapa de las 17 pantallas + 7 recorridos guiados) |
| Galería de capturas | `docs/f0/AP-002b-galeria.html` (abrible con doble clic; 57 capturas JPEG en `docs/f0/assets/ap-002b/`) |
| Evidencia automatizada | `poc/ux-ap002b/check-results.log` (`node poc/ux-ap002b/tools/check.mjs`, **exit code 0**) |

---

## 1. Reutilización estricta de C · Asserta

Todo el prototipo de `poc/ux-ap002b/` consume directamente los archivos oficiales aprobados de AP-002a **sin modificarlos ni duplicar librerías**:

- **Hojas de estilo base:** `../ux-ap002a/shared/base.css`, `../ux-ap002a/c/c.css` (que importa `../b/b.css`) y únicamente extensiones de componentes nuevos en `poc/ux-ap002b/shared/ap002b.css` usando exclusivamente los tokens semánticos oficiales (`--bg`, `--surface`, `--surface-2`, `--line`, `--line-strong`, `--text`, `--brand`, `--crit-*`, `--signal*`, `--warn*`, `--ok`, `--st-*`).
- **Tipografía e iconografía local (sin CDN ni instalaciones nuevas):** `@fontsource-variable/inter-tight`, `@fontsource-variable/jetbrains-mono` y `lucide-static` servidos desde `poc/ux-ap002a/node_modules/`.
- **Motor oráculo y datos consistentes:** reutilización de `../ux-ap002a/shared/gantt.js`, `demo.js` (plan `PPV2` rev. 41 con 25 nodos WBS, 19 dependencias y conflicto `d13` en `3.3`), `inicio-data.js`, `tooltip.js` y `util.js`, ampliados en `poc/ux-ap002b/shared/data-ext.js` para mantener coherencia de personas (`LF, MP, NE, JO, AR, OV` + `CN` + recurso virtual `QA-V`), proyectos (`PPV2`, `MERP`, `ILAB`, `AUDA`, `MIG1`), tarifas congeladas y auditoría en todas las vistas.
- **Transversales comunes (`poc/ux-ap002b/shared/shell.js`):**
  - Navegación lateral editorial `01..12` + subproyectos `PPV2..AUDA` (candado `Restringido`) + pestañas de proyecto `a..f`, plegable con `[` y cajón móvil `<760 px`.
  - **Selector de rol simulado en el pie del shell:** *Jefa de proyecto (con `financial.read`)*, *Miembro (sin `financial.read`)* y *Admin IT (sin contenido de proyectos)* (también seleccionable por URL `?rol=pm|miembro|admin`).
  - **Modo claro (defecto) y oscuro** persistente en las 17 pantallas.
  - **Los 7 estados obligatorios de interfaz** probables en cualquier pantalla vía `?estado=cargando|vacio|error|sinpermiso|sesion|conflicto|pendiente`.

---

## 2. Catálogo de las 17 pantallas diseñadas

| # | Pantalla | Archivo | Navegación | Decisiones e invariantes clave reflejadas |
|---:|---|---|---|---|
| 01 | **Inicio** | `inicio.html` | `01` | Mi trabajo, 4 cifras editoriales, agenda por fecha de fin, hitos, avisos de conflicto `d13`, tabla de proyectos y accesos directos a los 7 recorridos. En rol Admin IT redirige a consola de plataforma sin contenido de proyectos. |
| 02 | **Listado de proyectos** | `proyectos.html` | `02` | Búsqueda, filtros por estado/área/equipo/responsable/archivados, candado en `AUDA` y flujo interactivo **«Crear proyecto»** (vacío o desde plantilla, calendario, visibilidad, propietario). |
| 03 | **Gantt** | `gantt.html` | `02 / PPV2 / a` | Referencia oficial C integrada en las 17 pantallas: preview + diálogo de impacto con reconocimiento de conflictos, densidad estándar/compacta, panel `dock`/`float`/`closed` por espacio real (`≥ 480 px`), pantalla completa (`F`), zoom por proyecto y botón **Restablecer preferencias (RF-34)**. |
| 04 | **Tabla de tareas** | `tabla.html` | `02 / PPV2 / b` | Mismo plan `PPV2` rev. 41, edición inline simulada, selector de **columnas visibles y orden (RF-34)** + «Restablecer vista», filtros no destructivos, aviso de conflicto `d13` y **omisión server-side de columnas económicas sin `financial.read`**. |
| 05 | **Kanban** | `kanban.html` | `02 / PPV2 / c` | Columnas Pendiente / En curso / Bloqueada / Completada, movimiento accesible por botones/teclado y arrastre; diálogo de impacto al registrar hechos que afectan a sucesoras (CH-03 / P-23) y fechas intactas sin impacto. |
| 06 | **Detalle de tarea** | `tarea.html` | `02 / PPV2 / d` | Vista completa + resumen acoplado con 4 pestañas: **Detalle** (modo auto/manual, esfuerzo est./plan./real, Jira), **Comentarios** (menciones `@NE`, aviso privacidad R-08), **Horas** e **Historial RF-33** con ocultación económica sin `financial.read`. |
| 07 | **Cartera de proyectos** | `cartera.html` | `03` | Resumen ejecutivo, tabla de cartera con salud por símbolo+color y **motivo determinista explícito (sin IA)**, próximos hitos y aviso explícito de visibilidad restringida (`AUDA`, P-13). |
| 08 | **Recursos y capacidad** | `recursos.html` | `04` | Heatmap diario/semanal por equipo y persona (`LF..OV` + virtual `QA-V`), alerta de sobrecarga (`> 8 h/día`) sin reprogramar fechas, ausencias con código mínimo (`VAC`/`AUS`, sin motivo médico) y redacción «Proyecto restringido» para gestor de recursos. |
| 09 | **Registro de horas** | `horas.html` | `05` | Hoja semanal (`LF`), flujo **Borrador → Enviada → Aprobada → Reabierta (con motivo)**, validación de minutos positivos, bloque de aprobación para gestor y aviso explícito de que **no es fichaje laboral**. |
| 10 | **Costes y presupuestos** | `costes.html` | `06` y `02 / PPV2 / e` | Tarifas congeladas (`v2`), costes fijos, presupuesto vs estimado vs real y desviación en EUR (2 decimales), indicador **«Coste incompleto (sin tarifa)»** (nunca 0,00 € ficticio, P-11) y bloqueo `sinpermiso` limpio sin exponer cifras para Miembro y Admin IT. |
| 11 | **Plantillas** | `plantillas.html` | `07` | Catálogo versionado (`TPL-WEB-3`, `TPL-INT-2`, `TPL-AUD-1`, `TPL-MIG-2`), previsualización WBS y flujo **«Instanciar plantilla»** con fecha de inicio, remapeo de IDs y garantía de no copiar miembros, horas, costes ni secretos. |
| 12 | **Notificaciones** | `notificaciones.html` | `08` | Bandeja leída/no leída con filtros (menciones, plan, asignaciones, vencimientos), enlaces directos y panel completo de **Preferencias de usuario (RF-34)** con botón «Restablecer». |
| 13 | **Importación y exportación** | `import-export.html` | `09` | Asistente CSV/XLSX en 5 pasos (carga, mapeo, validación bloqueante de ciclo y vínculo a grupo, preview atómico, confirmación) y panel de exportación (CSV, XLSX, PDF, PNG, JSON v1.0) con neutralización de fórmulas (`=,+,-,@`) y control `financial.read`. |
| 14 | **Configuración de proyectos** | `ajustes-proyecto.html` | `02 / PPV2 / f` | Calendario versionado inmutable con preview de impacto al cambiar versión, miembros y roles, líneas base (congelar/comparar), visibilidad `standard`/`restricted`, **break-glass** (aprobador distinto + caducidad) y presupuesto condicionado a `financial.read`. |
| 15 | **Administración** | `admin.html` | `10` | Usuarios Entra ID (`tid+oid`), activar/deshabilitar, **«Invalidar todas las sesiones»**, equipos, calendarios corporativos versionados y grants con alcance (`org`/`team`/`project`) con **bloqueo interactivo de autoasignación** y aviso `platform.admin ≠ project.read`. |
| 16 | **Auditoría** | `auditoria.html` | `11` | Registro **append-only** de seguridad separado de RF-33, filtros por actor, acción, proyecto, resultado (`ALLOW`/`DENY`) y `correlationId`, timestamp UTC y diffs sanitizados (sin tokens ni cuerpos de comentarios). |
| 17 | **Integraciones Teams y Jira** | `integraciones.html` | `12` | **Teams Workflows** (autenticado por tenant recomendado vs aviso de riesgo en `Anyone`, prueba de canal, cola/reintentos/DLQ, payload mínimo) y **Jira Cloud solo lectura** (OAuth 3LO, `linkOnly` por defecto vs `metadata` con declaración obligatoria de audiencia compatible y última sincronización). |

---

## 3. Los 7 recorridos interactivos guiados

Accesibles desde `poc/ux-ap002b/index.html` y desde `inicio.html`, con barra contextual de paso anterior/siguiente (`?tour=1..7&step=1..n`):

1. **Creación de proyecto:** `plantillas.html` → `proyectos.html` → `ajustes-proyecto.html`
2. **Planificación y reprogramación:** `gantt.html` → `tabla.html` → `import-export.html`
3. **Ejecución de tareas:** `inicio.html` → `kanban.html` → `tarea.html?task=2.1` → `notificaciones.html`
4. **Gestión de recursos:** `cartera.html` → `recursos.html`
5. **Registro de horas:** `horas.html` → `tarea.html?task=2.1#horas`
6. **Seguimiento económico:** `costes.html` → `tabla.html` → `tarea.html?task=2.1#historial`
7. **Administración y permisos:** `admin.html` → `auditoria.html` → `integraciones.html` → `ajustes-proyecto.html?p=AUDA`

---

## 4. Resultados reales de verificación automatizada (`check.mjs`)

- **Comando ejecutado:** `node poc/ux-ap002b/tools/check.mjs`
- **Exit code:** `0`
- **Navegador:** Chrome local (`C:/Program Files/Google/Chrome/Application/chrome.exe`) mediante `playwright-core` + `axe-core` (reglas `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`).
- **Cobertura ejecutada:**
  - **51 cargas auditadas** con `axe-core` + consola JS + códigos HTTP:
    - 18 vistas (`index.html` + 17 pantallas) en **claro y oscuro** a `1440 px` (36 cargas).
    - 8 cargas multiresolución (`1280`, `1920` y móvil `390 px` en `gantt`, `inicio`, `tabla`, `kanban`, `recursos`, `costes`).
    - 7 estados obligatorios (`?estado=cargando|vacio|error|sinpermiso|sesion|conflicto|pendiente`).
  - **11 comprobaciones funcionales y RBAC:** `costes` sin permiso en Miembro/Admin IT (0 cifras EUR expuestas), omisión de columnas económicas en `tabla` y diffs económicos en `tarea` RF-33, bloqueo de `admin` para Miembro y bloqueo de autoasignación en Admin IT, diálogo de impacto en `kanban` (CH-03), detección bloqueante de ciclo/grupo en `import-export`, diálogo de impacto y conflicto bloqueado en `gantt` (`Alt+→`), creación de proyecto y envío de hoja de horas.
  - **7 recorridos guiados completos (21/21 pasos):** todos navegables con barra de recorrido visible, **0 errores JS** y **0 HTTP 4xx**.
  - **Resultado final:** **0 errores JS**, **0 HTTP 4xx**, **0 violaciones `axe-core` serias/críticas** (y **0 moderadas/menores**).
  - **Hallazgos corregidos durante la auditoría:** (1) contraste del botón `.btn-primary` dentro de `.home .kicker` en `inicio.html`, (2) eliminación de `aria-pressed` no permitido en `role="tab"` en `tarea.html`, (3) extracción del enlace «Ficha completa →» fuera de `role="tablist"` en `gantt.html` (`aria-required-children`), y (4) mapeo de `/node_modules/` en el servidor estático de `check.mjs` para las peticiones de `axe-core` al inspeccionar `@import` anidados de fuentes.
  - **Capturas generadas:** **57 JPEG** en `docs/f0/assets/ap-002b/` y galería navegable en `docs/f0/AP-002b-galeria.html`.

---

## 5. Limitaciones conocidas y decisiones pendientes

- **Prototipo estático desechable:** la persistencia (preferencias RF-34, cambios en tabla/kanban/proyectos/horas) es local/en memoria de sesión y no sustituye a las APIs ni al motor de servidor de F1–F6.
- **P-30 (navegadores adicionales):** la verificación automatizada se ha ejecutado en Chromium/Chrome local; queda pendiente validar visual e interactivamente en **Safari y Firefox** antes del cierre definitivo de F0/F1.
- **P-31 (lectores de pantalla reales):** aunque `axe-core` reporta 0 violaciones WCAG 2.2 AA, queda pendiente prueba manual con lector de pantalla real (**NVDA / VoiceOver**).
- **P-25 (identidad definitiva):** la marca provisional (`--brand: #1f5c63` / `#6fb6bc`) se sustituirá por tokens cuando Marketing/Comunicación entregue el manual definitivo.
