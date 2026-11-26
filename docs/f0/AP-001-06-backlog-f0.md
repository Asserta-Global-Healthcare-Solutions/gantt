# AP-001 · Backlog F0 actualizado y deltas propuestos

Estados: Pendiente / En curso / **En revisión** / Cerrado. No se ha creado ningún ticket en herramientas externas.

## 1. Backlog F0

| ID | P | Título | Requisitos | Depende de | Entregables | Criterios de aceptación | Tam. | Estado |
|---|---|---|---|---|---|---|---|---|
| AP-001 | P0 | Descubrimiento, auditoría y decisiones | Transversal | — | `docs/f0/AP-001-01..07` | (a) **Técnico:** los 7 entregables los revisa y acepta el responsable técnico. (b) **Funcional:** sponsor y responsable funcional designados (P-01, P-02) y PRD v1.1 validado por Asserta | M | **(a) Aprobado 2026-11-25; (b) pendiente** |
| AP-002a | P0 | Dirección visual: dos propuestas | RF-06, RF-31, RNF-07, RNF-08 | AP-001 | `poc/ux-ap002a/` (C referencia oficial; A y B evidencia histórica), `docs/f0/AP-002a-direccion-visual.md`, `docs/f0/AP-002a-sistema-diseno-c.md` | Dos direcciones diferenciadas para Inicio y Gantt, en claro y oscuro, navegables, con datos ficticios, estados, dependencias, responsables, hitos, filtros y paneles; contraste AA medido; capturas a 1280/1440/1920; **dirección C · Asserta aprobada definitivamente** y sistema de diseño documentado | M | **Cerrado 2026-11-26** (C oficial; A y B históricos) |
| AP-002b | P0 | Mockups del resto de pantallas | RF-06, RF-07, RF-11, RF-12, RF-17, RF-18, RF-33, RF-34, RNF-07, RNF-08 | AP-002a (aprobada) | `poc/ux-ap002b/` (17 pantallas y 7 recorridos sobre C), `docs/f0/AP-002b-diseno-completo.md`, `docs/f0/AP-002b-galeria.html`, 57 capturas | Recorridos del jefe de proyecto y del miembro aprobados; coherencia visual C claro/oscuro; 7 estados obligatorios; 51 cargas `axe-core` 0 errores; sin código de producción | M | **En revisión (2026-11-26)** |
| AP-003 | P0 | PoC del componente Gantt | RF-06, RF-07, RF-15, RF-16, RNF-03, RNF-07, RNF-12 | AP-002a, AP-004 (formato de fixtures) | `poc/gantt-poc/` (Next 16.4.6 + React 19.3.1), `docs/f0/AP-003-poc-gantt.md`, `bench/{bench-results,licenses-report}.json`, capturas | Mismo dataset (1.000 tareas / 2.000 vínculos acíclicos, WBS, hitos, FS/SS/FF/SF) en build de producción para Frappe, SVAR, DHTMLX Community y render propio; p50/p95, licencias directas/transitivas y TCO documentados. **Pendiente selección humana (`P-38`)** | L | **En revisión (2026-11-26; pendiente `P-38`)** |
| AP-004 | P0 | Contrato del motor v1.1 y casos dorados | RF-08, RF-09, RF-10, RF-15, RF-19, RF-21 | AP-001 | `docs/f0/AP-004-contrato-motor.md`, `docs/f0/fixtures/engine/*.json`, `poc/engine-oracle/` (verificador desechable) | Semántica CH-02 formalizada; fixtures v1.0 + G-C3 calculados a mano y verificados por el oráculo; propiedades PR-01..12 especificadas; revisión humana firmada | L | **Cerrado 2026-11-25** |
| AP-005 | P0 | Threat model y decisiones ENS | RF-01, RF-13, RF-14, RNF-01, RNF-02, RNF-13 | AP-001 | `docs/f0/AP-005-00..05-*.md` | Inventario `DA-01..19` (incl. `DA-18` RF-34), STRIDE, sesiones sin CAE + Graph, Teams tenant, ENS Anexo II RD 311/2022 sin declarar cumplimiento, ASVS 5.0.0 V1..V17, RPO ≤4 h / RTO ≤8 h, `ST-01..23`. Revisión técnica aplicada; **aprobaciones IT/Seguridad/DPD/Finanzas/Dirección pendientes** | M | **Corregido técnicamente (2026-11-26; aprobaciones externas pendientes)** |
| AP-006 | P0 | ADR de stack, identidad e integraciones | RF-01, RF-28, RF-29, RNF-12, RNF-14 | AP-003, AP-004, AP-005 | `docs/adr/0001..0010-*.md` (nuevos) | ADR-001..010 redactados con opciones, licencias y versiones exactas (Next 16 / React 19, elección Gantt `P-38`). Aprobados o con bloqueos externos registrados | M | **Listo tras decidir `P-38`** |
| Gate F0 | — | Acta de salida de F0 | — | Todos los anteriores | Acta | Sponsor (P-01) aprueba el PRD v1.1, la UX, el contrato del motor, la PoC, los ADR y el threat model; estimaciones revisadas (D-18) | — | Pendiente |

### Secuencia
```text
AP-001 ──┬── AP-002a ──┬── AP-002b ─────────────┐
         │             └── AP-003 ──┐            │
         ├── AP-004 ────────┘ (fixtures)         │
         │                  └───────┴── AP-006 ──┴── Gate F0
         └── AP-005 ────────────────────┘
```
Tras aprobar AP-001 pueden ir en paralelo AP-002a, AP-004 y AP-005. El responsable técnico pidió revisión al terminar cada ticket, así que la propuesta es entregarlos uno a uno, en este orden: **AP-004 → AP-002a → AP-005** (el motor es el riesgo principal y da el formato de fixtures que necesita AP-003).

## 2. Deltas propuestos para F1–F6
Se aplicarán al `backlog.csv` solo cuando se apruebe la v1.1.

| Ticket | Cambio | CH |
|---|---|---|
| AP-011 | Se divide en AP-011a (modelo de grants y evaluador deny-by-default) y AP-011b (concesiones, sin autoasignación, break-glass, tests negativos) | CH-08 |
| AP-013 | Revocación de membresía con tareas a cargo (P-27); `visibility` del proyecto | CH-05, CH-08 |
| AP-014 | + responsable principal, colaboradores, esfuerzo estimado, `sortKey` fraccional, fechas reales y trabajo restante | CH-05, CH-07, CH-03 |
| AP-015 | Se divide en `AP-015a` (P0: shell web e inicio personal) y el ticket independiente **`AP-015b`** (P1, S/M: preferencias de usuario en servidor RF-34 con modelo versionado `user_preference` + `user_view_preference`, preferencias globales y por proyecto/vista, columnas visibles/orden, zoom de proyecto, restablecimiento, adaptación no destructiva entre viewports, endpoints `GET/PUT/reset` y pruebas AT-24/ST-23) | CH-16 |
| AP-016 | Motor isomórfico sin Temporal; fronteras `B`/`Bend`; zona del proyecto para «hoy» | CH-02, CH-10 |
| AP-017 | Versiones inmutables sin `validFrom`; cambio de versión con preview | CH-04 |
| AP-019 | + clases AUTO/MANUAL/FACT_*, conflictos y PR-01..08, PR-10, PR-11 | CH-02 |
| AP-021 | + reconocimiento de conflictos, `schedule_conflict`, `preview_mismatch` | CH-02, CH-10 |
| AP-023 | Preview local durante el drag y validación del servidor al soltar | CH-10 |
| AP-025 | Diálogo de impacto si el cambio de estado registra hechos (P-23) | CH-03 |
| AP-027 | CPM v1.1 (anclas manuales, completadas excluidas) y PR-09 | CH-02 |
| AP-028 | Depende de AP-020 y AP-021, ya no de AP-027 (el overlay de criticidad sí depende de AP-027) | CH-13 |
| AP-035 | + depende de AP-057 y AP-058 | CH-14 |
| AP-037 | No modifica el esfuerzo estimado; modo único «total» (P-12) | CH-05 |
| AP-039 | Recurso 1:1 automático | CH-06 |
| AP-040 | Redondeo por entrada sin intermedios; P-10, P-11 | CH-06 |
| AP-048 | unique(`projectId, cloudId, issueId`); `audienceMode` | CH-11 |
| AP-051, 052, 053, 055 | P0 → **P1** (gate de release v1) | CH-14 |
| **AP-056** (nuevo) | Historial por tarea y proyecto (RF-33), P1 propuesta (P-17), F3; depende de AP-011a, AP-012, AP-014, AP-022 y AP-024 | CH-09 |
| **AP-057** (nuevo) | Revisión de seguridad del piloto, P0, F3 | CH-14 |
| **AP-058** (nuevo) | Entorno piloto, backup y restore, P0, F3 | CH-14 |

Total propuesto: **59 tickets** (más las subtareas 011a/011b y 015a/015b).
