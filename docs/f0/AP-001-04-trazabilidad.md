# AP-001 · Matriz de trazabilidad de hallazgos

La matriz conecta cada hallazgo de la auditoría inicial (H) con su decisión (D) o pendiente (P), la errata (E) y el cambio (CH), los requisitos afectados, el ADR, los tickets, el criterio de aceptación y la prueba.

«Nuevo» indica un RF, ticket o prueba que propone la v1.1. **Estado:** Decidido (D aprobada por el responsable técnico), Propuesto (CH sin aprobar), Pendiente (requiere P-xx).

## 1. Críticos y altos

| H | Resumen | D / P | E | CH | RF / RNF | ADR | Tickets | Aceptación (resumen) | Prueba | Estado |
|---|---|---|---|---|---|---|---|---|---|---|
| H-C1 | Falta el responsable; esfuerzos ambiguos | D-06, P-27, P-28 | E-01 | CH-05, CH-07 | RF-04, RF-05, RF-31 | ADR-005 | AP-014, AP-015 | Responsable principal y colaboradores persistidos; «Mis tareas» los filtra | AT-02, AT-05, AT-22 | Decidido |
| H-C2 | Scope de autorización indefinido | D-07, P-13 | E-02 | CH-08 | RF-13, RF-17, RNF-01 | ADR-004 | AP-011a/b, AP-034 | Grants org/team/project, deny-by-default, Dirección solo por concesión | AT-01, AT-15, AT-21 | Decidido (P-13 abierto) |
| H-C3 | Conflictos manuales y hechos | D-08, P-23, P-24 | E-03, E-08 | CH-02, CH-03 | RF-07, RF-10, RF-12, RF-15 | ADR-003 | AP-004, AP-019, AP-021, AP-025, AP-027 | Manual intacta y conflicto reconocido; hechos inmutables; sin ciclos | AT-04 (mod.), AT-19, PR-01..04 | Decidido |
| H-A1 | Preview interactivo frente a autoridad del backend | D-09 | — | CH-10 | RF-07, RNF-03, RNF-10 | ADR-001, ADR-003 | AP-016, AP-021, AP-023 | Preview local; el servidor recalcula; `preview_mismatch` = 0 | AT-23, PR-12 | Decidido |
| H-A2 | AP-003 bloqueado por AP-002 completo | D-10 | E-09 | CH-13 | RF-06, RNF-07 | ADR-009 | AP-002a, AP-002b, AP-003 | Dirección visual aprobada antes de la PoC | Revisión de mocks | Decidido |
| H-A3 | Overlays solo en PRO | D-11, D-21 | — | CH-12 | RF-15, RF-16, RNF-12 | ADR-002 | AP-003, AP-022, AP-028 | Overlays sin módulos PRO en la versión exacta | PoC: criterio eliminatorio | Decidido |
| H-A4 | Doble fuente de esfuerzo | D-12, P-12 | E-06 | CH-05 | RF-05, RF-19, RF-21 | ADR-005 | AP-014, AP-037, AP-040 | El estimado nunca se sobrescribe; planificado = Σ asignaciones; real = Σ aprobadas | AT-22, AT-09 | Decidido (P-12 abierto) |
| H-A5 | «Publicar» sin borrador | D-13 | E-04 | CH-01 | RF-07, RF-10 | ADR-003 | AP-021 | Sin tabla de borradores; preview obligatorio | AT-03 | Decidido |
| H-A6 | Semántica de versiones de calendario | D-14 | E-05 | CH-04 | RF-09, RF-16 | ADR-003 | AP-016, AP-017, AP-028 | Versión inmutable; cambio con preview de impacto | AT-03, fixtures | Decidido |
| H-A7 | Librería de autenticación | D-15 | — | CH-10 | RF-01, RF-02, RNF-01, RNF-12 | ADR-004 | AP-006, AP-009 | ADR con comparativa; sin autenticación propia compleja | AT-01 | Decidido (evaluación en AP-006) |
| H-A8 | Autoasignación del admin | D-16, P-15 | — | CH-08 | RF-13, RF-14, RF-32 | ADR-004 | AP-011b | CHECK + servicio + break-glass aprobado por un tercero | AT-21 | Decidido (P-15 abierto) |
| H-A9 | Identidad y audiencia de Jira | D-17, P-21 | E-12 | CH-11 | RF-29, RF-30 | ADR-007 | AP-048, AP-049 | `linkOnly` salvo compatibilidad declarada | AT-14 | Decidido (P-21 abierto) |
| H-A10 | Estimación poco realista | D-18 | E-26 | CH-13 | — | — | Gate F0 | Volver a estimar tras F0 | — | Decidido |
| H-A11 | Piloto sin gate de seguridad ni de restore | P-20 | E-10, E-16 | CH-14 | RNF-01, RNF-02, RNF-05, RNF-13 | ADR-008 | AP-057 (nuevo), AP-058 (nuevo), AP-035 | Seguridad y restore verificados antes del piloto | AT-15, AT-17 | Pendiente |

## 2. Medios y bajos

| H | Resumen | D / P | E | CH | RF / RNF | Tickets | Prueba | Estado |
|---|---|---|---|---|---|---|---|---|
| H-M1 | `requestedStart` / `notBefore` redundantes | D-19 | E-11 | CH-02, CH-07 | RF-10 | AP-019 | Fixtures | Propuesto |
| H-M2 | Dependencias sobre grupos en la importación | D-19 | — | CH-02 | RF-23 | AP-042 | AT-10 | Propuesto |
| H-M3 | Convención visual de hitos | P-14 (resuelta 2026-11-25: convención A) | — | CH-12 | RF-06 | AP-002a, AP-022 | Revisión UX | Decidido |
| H-M4 | Holgura libre | D-19 | — | CH-02 | RF-15 | AP-027 | Fixtures | Propuesto (P2) |
| H-M5 | 403 frente a 404 | D-19 | E-13 | CH-08 | RF-13 | AP-011a | AT-15 | Propuesto |
| H-M6 | Unicidad de `external_issue` | D-19 | E-12 | CH-11 | RF-29 | AP-048 | Integración DB | Propuesto |
| H-M7 | Recurso obligatorio para registrar horas | D-19 | E-19 | CH-06 | RF-18, RF-20 | AP-036, AP-039 | AT-09 | Propuesto |
| H-M8 | Tarifa de coste o de venta | P-10, P-11 | — | CH-06 | RF-21 | AP-040 | AT-09 | Pendiente (Finanzas) |
| H-M9 | Redondeo del coste | D-19 | E-20 | CH-06 | RF-21, RNF-11 | AP-040 | AT-09 | Propuesto |
| H-M10 | Zona para «hoy» y vencimientos | D-19 | E-21 | CH-02 | RF-09 | AP-016 | Fixtures DST | Propuesto |
| H-M11 | Proyecto que empieza en día no laborable | D-19 | E-18 | CH-02 | RF-03, RF-09 | AP-013, AP-016 | Fixtures | Propuesto |
| H-M12 | CPM y líneas base en el piloto | P-16 | E-14 | CH-13 | RF-15, RF-16 | AP-035 | — | Pendiente |
| H-M13 | AP-028 depende de AP-027 sin necesidad | D-19 | E-15 | CH-13 | RF-16 | AP-028 | — | Propuesto |
| H-M14 | Vías de mutación duplicadas | D-19 | — | CH-10 | RF-13, RNF-01 | AP-007, AP-011a | Test de arquitectura | Propuesto |
| H-M15 | Navegador headless en el worker | P-19 | — | CH-10 | RF-24, RNF-02 | AP-045 | Pruebas visuales | Pendiente |
| H-M16 | SSE sobre la infraestructura real | P-08 | — | CH-10 | RNF-06 | AP-029 | AT-06 | Pendiente (IT) |
| H-M17 | Historial visible para el usuario | D-20, P-17 | E-17 | CH-09 | RF-33 (nuevo), RF-14 | AP-056 (nuevo) | AT-20 (nuevo) | Decidido (P-17 prioridad) |
| H-M18 | Estrategia de `sortKey` | D-19 | E-22 | CH-07 | RF-04 | AP-014 | Integración DB | Propuesto |
| DD-C09 | Preferencias de interfaz por usuario en servidor | P-29 (aprobada 2026-11-26) | — | CH-16, CH-07 | RF-34 (nuevo) | AP-015b (subtarea) | AT-24 (nuevo) | Decidido (aprobado) |
| H-B1 | Sponsor y responsable funcional | P-01, P-02 | E-27 | — | — | AP-001 | — | Pendiente (Dirección) |
| H-B2 | BOM en el CSV | — | E-25 | — | — | — | — | Mantener |
| H-B3 | Trazabilidad de AP-001 | D-19 | E-23 | CH-13 | — | AP-001 | — | Propuesto |
| H-B4 | Nombre del repositorio corporativo | P-18 | E-24 | — | — | AP-007 | — | Pendiente |

## 3. Requisitos nuevos o modificados (resumen v1.1)

| Requisito | Cambio | CH |
|---|---|---|
| RF-04 | WBS con responsable y colaboradores (relación, no esfuerzo) | CH-05 |
| RF-05 | Responsable principal, colaboradores, esfuerzo estimado, fechas reales, trabajo restante | CH-05, CH-03 |
| RF-07 | Preview local con autoridad del servidor; reconocimiento de conflictos nuevos | CH-02, CH-10 |
| RF-09 | Versiones inmutables; zona del proyecto para «hoy» | CH-04, CH-02 |
| RF-10 | Política D-08 sustituye al rechazo de manuales incompatibles | CH-02 |
| RF-12 | Kanban: los hechos con impacto requieren confirmación | CH-03 |
| RF-13 | Alcance org/team/project, sin autoasignación, break-glass, 404 | CH-08 |
| RF-15 | CPM con anclas manuales y tareas completadas excluidas | CH-02 |
| RF-19 | Planificado = Σ asignaciones; el estimado no se toca | CH-05 |
| RF-20 | Recurso 1:1 automático para quien registra horas | CH-06 |
| RF-29 | Audiencia compatible declarada, o solo enlace | CH-11 |
| **RF-33** | **Nuevo:** historial por tarea y por proyecto con permisos | CH-09 |
| **RF-34** | **Nuevo (P1, aprobado 2026-11-26):** preferencias de interfaz por usuario en servidor y sincronización entre dispositivos | CH-16 |
| RNF-10 | Suite del motor ejecutada en Node y en navegador | CH-10, CH-15 |

## 4. Mapa de ADR

| ADR | Recibe | Bloquea |
|---|---|---|
| ADR-001 Stack y hosting | CH-10 (Drizzle, cola), P-08 | AP-007 |
| ADR-002 Renderer Gantt | D-11, D-21 | AP-022 |
| ADR-003 Motor temporal | D-08, D-09, D-13, D-14, CH-02, CH-03, CH-04, P-23, P-24 | AP-016..021 |
| ADR-004 Identidad y acceso | D-07, D-15, D-16, CH-08, P-13, P-15 | AP-009, AP-011 |
| ADR-005 Recursos y costes | D-06, D-12, CH-05, CH-06, P-10, P-11, P-12 | AP-014, AP-036..041 |
| ADR-006 Teams | P-22 | AP-047 |
| ADR-007 Jira | D-17, CH-11, P-21 | AP-048, AP-049 |
| ADR-008 Datos, privacidad y ENS | P-05, P-06, P-07, CH-14 | AP-005, AP-057, AP-058 |
| ADR-009 UX y exportación | D-10, D-22, P-14 (resuelta), P-19, P-29 (aprobada), CH-16, C · Asserta oficial | AP-002b, AP-015b, AP-045 |
| ADR-010 Rendimiento y operación | H-M16, P-08 | AP-029, AP-052 |
