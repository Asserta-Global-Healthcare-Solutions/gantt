# Backlog de implementación

55 tickets. P0 = condición de piloto o release operativo; P1 = requisito de v1. S/M/L indican tamaño relativo, no horas. L debe dividirse en subtareas antes de implementar. Dependencias expresan precedencias técnicas; además se respetan los gates. Estado inicial pendiente; no son tickets creados en Jira.

## F0 — Definición y PoC

| ID | Prioridad | Historia/tarea | Requisitos | Depende de | Aceptación | Tamaño |
|---|---|---|---|---|---|---|
| AP-001 | P0 | Descubrimiento y UAT | RF-03,RF-17,RNF-02 | — | Validar usuarios, escenarios, tamaño, calendario, costes y alcance; designar sponsor y propietarios; registrar pendientes y aprobar PRD. | M |
| AP-002 | P0 | Mockups y diseño UX | RF-06,RF-07,RF-11,RF-12,RF-17,RF-18,RNF-07,RNF-08 | AP-001 | Mockups de rutas del PRD con estados vacío/error/conflicto; recorrido de jefe y miembro aprobado. | L |
| AP-003 | P0 | PoC componentes Gantt | RF-06,RF-07,RF-15,RF-16,RNF-03,RNF-12 | AP-001, AP-002 | Comparativa SVAR/DHTMLX con 1000 tareas y 2000 vínculos, overlays y teclado; versión/licencia y métricas en ADR. | L |
| AP-004 | P0 | Contrato del motor y casos dorados | RF-08,RF-09,RF-10,RF-15,RF-19,RF-21 | AP-001 | Aprobar semántica fronteras, reglas, fixtures y restricciones; pruebas de referencia revisadas manualmente. | L |
| AP-005 | P0 | Threat model y decisiones ENS | RF-01,RF-13,RF-14,RNF-01,RNF-02,RNF-13 | AP-001 | Inventario de datos y amenazas; política de accesos, retención, RPO/RTO y responsables aprobados. | M |
| AP-006 | P0 | ADR stack, identidad e integraciones | RF-01,RF-28,RF-29,RNF-12,RNF-14 | AP-003, AP-004, AP-005 | Versiones/hosting aprobados; tenant, Jira Cloud, audiencia y Teams Workflows confirmados o bloqueos registrados. | M |

## F1 — Fundamentos

| ID | Prioridad | Historia/tarea | Requisitos | Depende de | Aceptación | Tamaño |
|---|---|---|---|---|---|---|
| AP-007 | P0 | Inicializar monorepo y CI | RNF-10,RNF-12 | AP-006 | Workspace, lint, typecheck, tests, lockfile, SCA, SBOM, secret scan y build funcionan en PR. | M |
| AP-008 | P0 | Base PostgreSQL y migraciones | RNF-11,RF-03,RF-04 | AP-007 | Migraciones reproducibles desde vacío y upgrade; fixtures sintéticas; constraints verificadas. | M |
| AP-009 | P0 | OIDC Entra y sesiones | RF-01,RF-02,RNF-01 | AP-007, AP-008, AP-005 | SSO single tenant, PKCE, nonce, sesión segura; tests denegación y expiración; smoke preprod. | L |
| AP-010 | P0 | Usuarios y administración | RF-02,RF-32 | AP-009 | Alta por tid+oid, desactivar, equipos, último admin protegido; cambios auditables. | M |
| AP-011 | P0 | Autorización centralizada | RF-13,RNF-01 | AP-009, AP-010 | RBAC y scopes de proyecto/finanzas/export; matriz tests deny-by-default e IDOR. | L |
| AP-012 | P0 | Auditoría y outbox transaccional | RF-14,RNF-09,RNF-11 | AP-008, AP-011 | Eventos mínimos actor/revisión/diff; rollback sin éxito; logs sanitizados y acceso restringido. | M |
| AP-013 | P0 | CRUD proyectos y membresías | RF-03,RF-13 | AP-011, AP-012 | Crear, editar, archivar, restaurar; owner/members válidos; acceso revocado inmediato local. | M |
| AP-014 | P0 | CRUD WBS y estados | RF-04,RF-05 | AP-013 | Grupos, hojas, hitos, orden, transiciones; árbol sin ciclos; cambios persistentes y auditados. | L |
| AP-015 | P0 | Shell web e inicio personal | RF-31,RNF-08 | AP-009, AP-011, AP-013 | Navegación y mis tareas sin fuga; estados de carga/error/denegación; layout responsivo. | M |

## F2 — Motor y vistas

| ID | Prioridad | Historia/tarea | Requisitos | Depende de | Aceptación | Tamaño |
|---|---|---|---|---|---|---|
| AP-016 | P0 | Motor calendario civil | RF-09,RNF-11 | AP-004, AP-007 | Conversiones fronteras/días, excepciones, DST/bisiesto, horizonte; fixtures dorados pasan. | L |
| AP-017 | P0 | Editor calendarios versionados | RF-09,RF-32 | AP-016, AP-012, AP-013 | Crear versiones; previsualizar cambio y confirmar; no mutar calendarios históricos. | M |
| AP-018 | P0 | Validación DAG/WBS | RF-04,RF-08 | AP-014, AP-016 | Kahn, self/ciclo/cruce/duplicado rechazados; grupos no enlazables; casos generados. | M |
| AP-019 | P0 | Forward scheduling y constraints | RF-08,RF-10 | AP-016, AP-018 | Cuatro ecuaciones, lags, múltiples predecesoras, manual/auto, deadlines; fixtures exactos. | L |
| AP-020 | P0 | Rollup de grupos y progreso | RF-04,RF-05,RF-10 | AP-019 | Fechas, esfuerzo y progreso derivados sin doble conteo; hitos y árboles profundos probados. | M |
| AP-021 | P0 | API preview/commit y conflictos | RF-07,RF-10,RNF-06 | AP-017, AP-019, AP-020, AP-012 | Cambios transitivos preview, rollback, confirmación idempotente, revisión 409, auditoría. | L |
| AP-022 | P0 | Adaptador Gantt y timeline | RF-06,RNF-03 | AP-003, AP-014, AP-021 | WBS, zoom, scroll, hitos y links render; adaptador no calcula autoridad; PoC rendimiento replicada. | L |
| AP-023 | P0 | Interacción Gantt y edición de vínculos | RF-07,RF-08,RNF-07 | AP-021, AP-022 | Drag/resize/link con preview; teclado/formulario; cancelar no persiste y error revierte. | L |
| AP-024 | P0 | Vista tabla y filtros | RF-11,RF-22 | AP-014, AP-021 | Inline edit y columnas; filtros no mutan datos; misma revisión que Gantt; permisos campos. | M |
| AP-025 | P0 | Vista Kanban | RF-12 | AP-014, AP-024 | Mover tarjeta aplica estado/progreso sin reprogramar; alternativa teclado; cambios persistidos. | M |
| AP-026 | P0 | CSV export básico | RF-22,RNF-02 | AP-024, AP-011 | CSV con filtros y campos permitidos; neutraliza fórmulas; prueba revocación. | S |
| AP-027 | P1 | CPM y holguras | RF-15 | AP-019, AP-020 | Backward pass con cuatro tipos; múltiples caminos y restricciones manuales; oráculo DAG pequeño. | L |
| AP-028 | P1 | Baselines y comparación | RF-16 | AP-021, AP-027 | Snapshot inmutable con versiones; tareas nuevas/retiradas y deltas; overlay autorizado en Gantt. | L |
| AP-029 | P0 | Invalidación vistas y concurrencia | RNF-06,RF-11,RF-12 | AP-021, AP-022, AP-024, AP-025 | SSE autorizado o polling; conflicto entre dos sesiones; reconectar y recargar; no fuga eventos. | M |

## F3 — Colaboración y cartera

| ID | Prioridad | Historia/tarea | Requisitos | Depende de | Aceptación | Tamaño |
|---|---|---|---|---|---|---|
| AP-030 | P1 | Comentarios y menciones | RF-25 | AP-014, AP-011, AP-012 | Crear/editar/sanitizar; menciones solo con acceso; enlaces HTTPS sin descarga server-side. | M |
| AP-031 | P1 | Worker persistente y jobs | RF-26,RF-30,RNF-09,RNF-14 | AP-012, AP-007 | Leases, dedupe, retry, DLQ, cancelación y observabilidad; worker caído recupera trabajo. | L |
| AP-032 | P1 | Notificaciones y preferencias | RF-26 | AP-030, AP-031 | Asignación/mención/vencimiento/cambio relevante; sin duplicados lógicos; leído y permisos vigentes. | M |
| AP-033 | P1 | Plantillas versionadas | RF-27 | AP-021, AP-028 | Crear e instanciar con remapeo de IDs/calendario/fechas; no copia miembros/horas/secretos. | M |
| AP-034 | P1 | Cartera y salud | RF-17 | AP-020, AP-028, AP-011 | Indicadores con motivos y visibilidad; filtros, próximos hitos; datos exactos del plan. | M |
| AP-035 | P0 | Validación core piloto | RF-01,RF-03,RF-06,RF-10,RF-13,RNF-07 | AP-023, AP-024, AP-025, AP-026, AP-029 | UAT sintético y smoke tenant; pruebas críticas pasan; no bloqueantes; aprobación antes de piloto controlado. | M |

## F4 — Recursos, horas y costes

| ID | Prioridad | Historia/tarea | Requisitos | Depende de | Aceptación | Tamaño |
|---|---|---|---|---|---|---|
| AP-036 | P1 | Recursos y ausencias | RF-18 | AP-017, AP-010, AP-011 | Humanos/virtuales, calendario/ausencia y vigencia; razón mínima; capacidad diaria correcta. | M |
| AP-037 | P1 | Asignaciones y distribución | RF-19 | AP-021, AP-036 | Asignar múltiples recursos, distribución exacta, cero capacidad advertida; no cambia plan automáticamente. | L |
| AP-038 | P1 | Carga multi-proyecto | RF-18,RF-19 | AP-037, AP-011 | Heatmap diario/semanal, sobrecarga, totales exactos, privacidad de proyectos no accesibles. | L |
| AP-039 | P1 | Registro y aprobación de horas | RF-20 | AP-036, AP-014, AP-011, AP-012 | Borrador/envío/aprobación/reapertura; minutos positivos, duplicados, permisos y auditoría. | L |
| AP-040 | P1 | Tarifas y costes | RF-21 | AP-039, AP-037 | Tarifa versionada y snapshot por fecha; decimal exacto; costes incompletos explícitos; tests privacidad. | L |
| AP-041 | P1 | Presupuesto e informes de coste | RF-21,RF-17 | AP-040, AP-034 | Coste real/estimado, presupuesto y desviación; lectura/escritura financiera separadas. | M |

## F5 — Importación, exportación e integraciones

| ID | Prioridad | Historia/tarea | Requisitos | Depende de | Aceptación | Tamaño |
|---|---|---|---|---|---|---|
| AP-042 | P1 | Parser y staging import CSV/XLSX | RF-23,RNF-11 | AP-021, AP-031 | Límites de archivo, mapeo, errores por fila, fórmulas no ejecutadas y ciclos; fixtures inválidos. | L |
| AP-043 | P1 | Preview y commit import | RF-23,RNF-06 | AP-042 | Preview trazable, revisión e idempotencia; lote inválido no escribe; import válido recalcula. | M |
| AP-044 | P1 | Exportación XLSX/JSON | RF-24 | AP-026, AP-031, AP-041 | Esquema versionado, columnas y permisos, neutraliza fórmulas, TTL, descarga reautorizada. | M |
| AP-045 | P1 | Exportación PDF/PNG local | RF-24,RNF-02 | AP-022, AP-031, AP-044 | Gantt legible con rango/escala, paginado PDF y límites PNG; sin proveedor externo; pruebas visuales. | L |
| AP-046 | P1 | Configuración segura de conectores | RF-30,RNF-14 | AP-031, AP-011, AP-005 | Secret refs cifrados, egress allowlist, desactivar, estado, auditoría y retry; sin SSRF. | M |
| AP-047 | P1 | Teams Workflows | RF-28,RNF-14 | AP-032, AP-046 | Canal autorizado, co-owner, Adaptive Card mínima, 429/5xx y fallo no bloquea proyecto. | M |
| AP-048 | P1 | Jira OAuth y vínculo/import selectivo | RF-29,RNF-14 | AP-046, AP-043 | Consentimiento acotado, site permitido, cloudId+issueId, preview y sin metadata si audiencia no verificada. | L |
| AP-049 | P1 | Jira sincronización y reconciliación | RF-29,RF-30,RNF-14 | AP-048 | Polling y refresh; rate limits; pérdida acceso limpia caché; estado externo separado, sin escritura. | L |
| AP-050 | P1 | Observabilidad y panel operaciones | RF-30,RNF-09 | AP-031, AP-046, AP-049 | Métricas cola/latencia y alertas; DLQ redrive auditado; sin secretos en logs. | M |

## F6 — Calidad y lanzamiento

| ID | Prioridad | Historia/tarea | Requisitos | Depende de | Aceptación | Tamaño |
|---|---|---|---|---|---|---|
| AP-051 | P0 | Suite seguridad y privacidad | RNF-01,RNF-02,RNF-12,RNF-13 | AP-035, AP-041, AP-045, AP-047, AP-049 | Threat model actualizado, pruebas IDOR/XSS/CSRF/SSRF/import; SBOM; findings resueltos/aceptados según política. | L |
| AP-052 | P0 | Rendimiento y accesibilidad | RNF-03,RNF-07,RNF-08 | AP-035, AP-038, AP-045 | Dataset reproducible y SLO medidos; teclado/foco/contraste/lectores; matriz browsers; evidencia. | L |
| AP-053 | P0 | Infraestructura y restore | RNF-04,RNF-05,RNF-09,RNF-13 | AP-007, AP-050, AP-051 | Staging/prod aislados, TLS, backup y restauración con RPO/RTO medidos; rollback probado. | L |
| AP-054 | P1 | E2E y UAT de v1 | RF-15,RF-16,RF-17,RF-19,RF-20,RF-21,RF-23,RF-24,RF-25,RF-26,RF-27,RF-28,RF-29 | AP-033, AP-034, AP-041, AP-045, AP-047, AP-049, AP-051, AP-052 | Flujos integrales por roles; integraciones sandbox y prueba autorizada real; aceptación sponsor. | L |
| AP-055 | P0 | Documentación, operación y release | RNF-04,RNF-05,RNF-10,RNF-13 | AP-053, AP-054 | Manual usuario/admin, runbooks, evidencias ENS aplicables, ADR y release notes; aprobación humana y smoke prod. | M |

## Definition of Ready
Requisito, criterios, dependencias resueltas, ADR relevantes aprobados, mocks/contrato, datos sintéticos, riesgos y plan de pruebas. Dividir L en cambios revisables.

## Definition of Done
Código mínimo, tests positivos/negativos, lint/typecheck, migración compatible, autorización y auditoría cuando aplique, docs/traceabilidad actualizadas, revisión independiente, CI verde y aceptación humana; no cerrar por mera ejecución de agente.
