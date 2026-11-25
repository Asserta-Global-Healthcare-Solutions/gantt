# AP-001 · Propuesta de actualización de la especificación a v1.1

Estado: **propuesta para revisión**. No modifica el kit v1.0. Cada cambio (CH) indica los documentos afectados, el texto nuevo propuesto, su origen (hallazgo H o errata E, decisión D) y su impacto. Lo marcado como **[P-xx]** depende de una decisión pendiente.

## Resumen de cambios

| CH | Tema | Docs afectados | Origen |
|---|---|---|---|
| CH-01 | Sin borrador de plan; preview obligatorio | 01, 03 | H-A5, E-04, D-13 |
| CH-02 | Motor v1.1: modos, hechos, conflictos, CPM y propiedades | 02, 04, 07 | H-C3, E-03, E-08, E-11, E-18, E-21, D-08 |
| CH-03 | Estados, hechos reales y vistas | 01, 02 | E-07, D-08 |
| CH-04 | Calendarios inmutables | 04, 05 | H-A6, E-05, D-14 |
| CH-05 | Responsable, colaboradores y tres esfuerzos | 01, 02, 04, 05 | H-C1, H-A4, E-01, E-06, D-06, D-12 |
| CH-06 | Horas y costes | 04, 05 | E-19, E-20 |
| CH-07 | Delta del modelo de datos | 05 | varios |
| CH-08 | Autorización con alcance, sin autoasignación, acceso excepcional | 02, 03, 05 | H-C2, H-A8, E-02, E-13, D-07, D-16 |
| CH-09 | Historial de modificaciones (RF-33) | 01, 02, 05, 06 | E-17, D-20 |
| CH-10 | Arquitectura: motor isomórfico y una sola vía de mutación | 03 | H-A1, H-A7, D-09, D-15 |
| CH-11 | Integraciones: unicidad Jira y audiencia compatible | 03, 05 | H-A9, E-12, D-17 |
| CH-12 | UX: AP-002a/b, conflictos, hechos e historial | 01 | D-10, D-22 |
| CH-13 | Backlog | 06, backlog.csv | E-09, E-14, E-15, E-23, E-26 |
| CH-14 | Gates propios del piloto | 06, 07 | H-A11, E-10, E-16 |
| CH-15 | Testing y aceptación | 07 | todos |

---

## CH-01
**Sin borrador persistente (D-13).**

- **PRD §6, flujo 2.** Sustituir «establece dependencias y publica planificación» por «establece dependencias; cada cambio de plan se confirma tras su preview».
- **PRD §5, Gantt.** Sustituir «deshacer de cambios simples no publicados (si se aprueba en PoC)» por «deshacer de la última operación propia como **nueva operación inversa** con preview y commit (si se aprueba en PoC); nunca reescribe historial».
- **Impacto:** no hay tabla de borradores. El estado «borrador» del **proyecto** sigue existiendo como ciclo de vida, no como plan sin publicar.

## CH-02
**Motor de planificación v1.1 (D-08, D-09).** Sustituye 04 §2–§4 en lo indicado. Sigue en vigor: granularidad por día laboral, índices de frontera, las cuatro ecuaciones y el rechazo de ciclos.

### 2.1 Entradas
- `TaskInput`: `id, parentId, kind, durationDays, scheduleMode (auto|manual), fixedStart?, notBefore?, deadline?, status, progress, actualStart?, actualFinish?, remainingDurationDays?, remainingAsOf?`.
- **Se elimina `requestedStart`** (E-11). Lo que introduce el usuario como «inicio deseado» en modo auto se guarda como `notBefore`.
- `ProjectInput`: `startDate, calendarVersion, timezone, revision, engineVersion`. **El motor no lee el reloj**: cualquier fecha «hoy» entra como dato.

### 2.2 Clase de programación
Se deriva en cada cálculo y no se almacena.

| Clase | Condición | Inicio `s` | Fin `f` (exclusivo) |
|---|---|---|---|
| FACT_DONE | `status=completada` | `B(actualStart)` | `Bend(actualFinish)` |
| FACT_RUNNING | `actualStart` presente y no completada | `B(actualStart)` | sin `remaining`: `max(s+d, cotasFin)`; con `remaining`: `max(B(remainingAsOf)+remaining, cotasFin)` |
| MANUAL | sin `actualStart` y `scheduleMode=manual` | `B(fixedStart)` | `s+d` |
| AUTO | resto | `max(B(projectStart), B(notBefore), cotasInicio)` | `s+d` |

- **Cotas.** Las cotas de inicio vienen de las aristas entrantes según 04 §3. Las cotas de fin vienen de las aristas FF (`fA+L`) y SF (`sA+L`).
- **Conversión de fechas a frontera.** `B(x)` es la frontera de inicio del primer día laborable ≥ x. `Bend(x)` es la frontera de inicio del primer día laborable > x. Así, un hecho registrado en un día no laborable no rompe el índice.
- **Validaciones** (422 si fallan):
  - `actualStart ≤ actualFinish`;
  - `actualStart ≤ remainingAsOf`;
  - `remainingDurationDays ≥ 1` mientras la tarea está en curso;
  - una tarea manual no admite `notBefore`;
  - los hechos no pueden ser posteriores a «hoy» en la zona del proyecto.
- **Hitos** (`d=0`): uno completado se ancla en `B(actualFinish)`.

### 2.3 Conflictos
- Una arista (A,B) está **en conflicto** cuando su restricción no se cumple. Por construcción, solo puede ocurrir si B es MANUAL o FACT_*. En FACT_RUNNING solo pueden quedar en conflicto las cotas de inicio, porque el fin se ajusta.
- Cada conflicto se registra como `{dependencyId, successorId, kind: MANUAL|FACT, requiredDate, actualDate, deficitWorkingDays}`.
- Los conflictos se derivan del snapshot y se persisten en `schedule_conflict` con la revisión. Son reconstruibles.
- **Conflictos nuevos.** El preview informa de los conflictos nuevos respecto a la revisión vigente. El commit exige `acknowledgedConflicts` ⊇ conflictos nuevos; si no, devuelve `422 CONFLICTS_NOT_ACKNOWLEDGED`. El reconocimiento se audita con el actor.
- **Ciclos.** Se rechazan siempre, sea cual sea el modo (estructural, antes del cálculo).
- **Visibilidad.** Los conflictos se ven en el Gantt (vínculo marcado), en la tabla (columna o icono), en el panel del proyecto y en el preview.

### 2.4 Reglas que corrigen erratas
- **E-18.** El `startDate` de un proyecto en día no laborable se rechaza al editarlo y se sugiere el siguiente día laborable. En la importación se normaliza explícitamente, con aviso por fila.
- **E-21.** «Hoy», el vencimiento de un plazo y el «inicio planificado vencido» se evalúan en la zona IANA del proyecto. El horario de verano no altera las fechas civiles. Los tests de DST cubren el cálculo de «hoy» en los cambios de hora.
- **Tareas automáticas no iniciadas con inicio pasado.** No se mueven solas, para que el plan no cambie a diario sin que nadie lo edite. Generan el aviso «inicio vencido».
- **Dependencias sobre grupos.** Siguen prohibidas. La importación las rechaza con error por fila (H-M2).
- **Holgura.** En la v1 solo se calcula la total; la libre queda en P2 (H-M4).

### 2.5 CPM v1.1
Sustituye «si plan no factible, no publicar».

- `T = max f` de las tareas no completadas, o de todas si todas están completadas.
- **Pase hacia atrás.** Recorre las tareas en orden topológico inverso.
  - Inicialización: `LF = T` para AUTO y FACT_RUNNING; `LS = s` (fijo) para MANUAL; FACT_DONE queda **excluida** (`float = null`, motivo «completada»).
  - Las aristas cuya sucesora es FACT_DONE no se propagan hacia atrás.
  - Las aristas hacia MANUAL se propagan usando su `s` fijo; pueden producir holgura negativa en la predecesora, y eso es información real («llega tarde a una fecha fijada»).
  - En FACT_RUNNING, la holgura se mide sobre el fin: `LF − f`.
- **Crítica** = holgura ≤ 0 en tareas no completadas. `criticalReason ∈ {cadenaFin, ancladaManual, conflicto}`.
- **Holgura negativa.** Solo puede existir si hay conflictos MANUAL o anclas manuales activas. Los plazos (`deadline`) siguen generando alertas aparte y no holgura.
- AP-004 formaliza el detalle y lo valida contra un oráculo enumerativo.

### 2.6 Propiedades del motor
Sustituyen 07 §2, «property-based».

| ID | Propiedad |
|---|---|
| PR-01 | **Satisfacción condicionada:** toda arista se cumple, salvo que B ∈ {MANUAL, FACT_*} y la arista figure en `conflicts`. Una tarea AUTO nunca tiene aristas entrantes incumplidas; FACT_RUNNING nunca incumple cotas de fin |
| PR-02 | **Exactitud de conflictos:** `conflicts` = conjunto exacto de aristas incumplidas (sin falsos positivos ni negativos) |
| PR-03 | **Hechos inmutables:** `actualStart`, `actualFinish` y `remaining*` de salida son iguales a los de entrada; FACT_DONE depende solo de sus hechos |
| PR-04 | **Manual inmutable:** MANUAL siempre tiene `s = B(fixedStart)` |
| PR-05 | **Determinismo:** mismas entradas y misma `engineVersion` producen el mismo snapshot y el mismo `inputHash`, con independencia del orden de las listas de entrada |
| PR-06 | **ASAP mínima:** toda tarea AUTO tiene al menos una cota ajustada (no podría empezar antes) |
| PR-07 | **Monotonía:** aumentar una duración o un lag nunca adelanta una tarea AUTO y no altera MANUAL ni FACT_* |
| PR-08 | **Calendario:** todas las fronteras son fronteras laborables válidas; AUTO cumple `s ≥ B(projectStart)` |
| PR-09 | **Holgura:** sin conflictos MANUAL ni anclas manuales, la holgura es ≥ 0. El CPM coincide con el oráculo enumerativo en grafos de ≤ 8 nodos |
| PR-10 | **Aciclicidad:** todo grafo con ciclo se rechaza antes del cálculo, sea cual sea el modo |
| PR-11 | **Localidad:** las tareas no alcanzables desde las modificadas conservan sus fechas |
| PR-12 | **Isomorfía:** el mismo caso da un resultado idéntico byte a byte en Node y en el navegador (D-09) |

### 2.7 Casos dorados añadidos
Se suman a 04 §7. AP-004 los calcula, los verifica a mano y los firma.

| Caso | Escenario |
|---|---|
| G-C3-01 | A(2) FS→B manual fijado en el día 1 → B se queda en 1; conflicto MANUAL con déficit 1 |
| G-C3-02 | Ampliar A cuando B es manual → el commit sin reconocimiento devuelve 422; con reconocimiento se persiste y se audita |
| G-C3-03 | A completada con fechas reales lun–mié (3 días frente a 2 planificados) → B AUTO FS empieza el jueves |
| G-C3-04 | A AUTO ampliada y B completada → B no cambia; conflicto FACT |
| G-C3-05 | B en curso, `remaining=2` a partir del viernes → fin exclusivo en el martes siguiente; los hechos no cambian |
| G-C3-06 | FF desde A hacia B en curso → empuja el fin de B, no su inicio |
| G-C3-07 | Ciclo que pasa por una tarea manual → rechazado |
| G-C3-08 | Reabrir una tarea completada → se conserva el `actualFinish` anterior en el historial y la tarea pasa a FACT_RUNNING |
| G-C3-09 | Sucesora AUTO de una MANUAL → se calcula desde las fechas manuales |
| G-C3-10 | Predecesora AUTO de una MANUAL temprana → holgura negativa con motivo `ancladaManual` |
| G-C3-11 | Hecho registrado en sábado → `B`/`Bend` mapean al lunes y la sucesora no queda en día no laborable |

**Impacto:** cambia la redacción de RF-10, RF-15 y AT-04; añade `schedule_conflict`, `actualStart/Finish` (ya opcionales), `remainingDurationDays` y `remainingAsOf` **[P-24]**.

## CH-03
**Estados, hechos reales y vistas (E-07).**

- **Pasar a «en curso»** registra `actualStart` (por defecto «hoy» en la zona del proyecto, editable ≤ hoy).
- **Pasar a «completada»** registra `actualFinish`, fija `progress=100` y conserva `actualStart`.
- **Reabrir** exige un motivo. El `actualFinish` anterior queda en el historial y la tarea vuelve a «en curso» con un progreso < 100.
- **PRD §5 Kanban y RF-12.** Sustituir «no reprograma fechas» por: «mover una tarjeta cambia el estado; si registra un hecho que desplaza a otras tareas o crea conflictos, se muestra el impacto y se pide confirmación (mismo preview/commit que el Gantt); si no hay impacto, se confirma directamente». **[P-23]**
- El progreso **no** mueve fechas (se mantiene la regla v1.0).

## CH-04
**Calendarios inmutables (D-14).**

- **Se elimina `calendar_version.validFrom`.** Cada versión es una instantánea completa e inmutable: semana, excepciones y zona. `project.calendarVersionId` apunta a una sola versión.
- **Cambiar la versión de un proyecto** es una operación de plan: preview de impacto (fechas, conflictos, deltas respecto a la línea base) y commit con revisión.
- **Las líneas base** guardan la versión con la que se congelaron. La comparación indica qué versión se usa para los deltas.
- **Capacidad de recursos.** Calendario del recurso ∩ días laborables del proyecto. Las ausencias restan capacidad, no duración (sin cambio).

## CH-05
**Responsable, colaboradores y esfuerzos (D-06, D-12).**

| Concepto | Representación | Fuente de verdad | Regla |
|---|---|---|---|
| Responsable principal | `task.responsibleUserId` (nullable) | La tarea | Usuario activo y miembro del proyecto. Válido en hojas, hitos y grupos. No implica asignación de esfuerzo |
| Colaboradores | `task_collaborator(taskId, userId)` | La tabla | Miembros del proyecto. Reciben notificaciones y aparecen en «Mis tareas» con el filtro «colaboro». No implican esfuerzo |
| Recursos asignados | `assignment(taskId, resourceId, …)` | La tabla | Solo hojas. Un recurso puede ser humano (vinculado a un usuario) o virtual |
| Esfuerzo estimado | `task.estimatedEffortMinutes` | Entrada del usuario | **El sistema nunca lo sobrescribe.** Solo hojas |
| Esfuerzo planificado | `Σ assignment.totalMinutes` | Las asignaciones | Derivado; no se guarda en la tarea (como mucho en una caché reconstruible) |
| Esfuerzo real | `Σ time_entry.minutes` aprobadas | Las horas | Las enviadas y pendientes se muestran aparte |

- Si planificado ≠ estimado se muestra un aviso, no un error.
- El peso del progreso de un grupo usa el **esfuerzo estimado** (PRD §7, ahora sin ambigüedad).
- **«Tareas asignadas» de la matriz** = responsable ∪ colaborador ∪ recurso asignado vinculado al usuario. Qué puede editar un colaborador: **[P-28]**.
- **Revocar la membresía** de un usuario que es responsable obliga a reasignar sus tareas o a dejarlas sin responsable de forma explícita y auditada **[P-27]**.
- **Modo de asignación v1** (propuesta): solo «esfuerzo total» distribuido por capacidad. La «carga diaria fija» pasa a P2 **[P-12]**.
- **Impacto:** RF-04, RF-05, RF-19, RF-31; tabla `task`; AP-014 incluye responsable y colaboradores (P0); AP-037 deja de tocar el esfuerzo estimado.

## CH-06
**Horas y costes.**

- **E-19.** Cada usuario que tenga que registrar horas recibe un `resource` humano 1:1, creado de forma idempotente la primera vez que se le asigna o registra horas. `unique(resource.userId)` se mantiene.
- **E-20.** El coste por entrada se calcula como `round_half_up(minutes × rate / 60, 2)` en aritmética decimal, sin redondeos intermedios. El coste total es la suma de los costes por entrada.
- Tarifa de coste o de venta, por recurso o por rol: **[P-10]**. Aprobar horas sin tarifa (excepción o bloqueo): **[P-11]**. Sin cambios en EUR ni en DECIMAL.

## CH-07
**Delta del modelo de datos (05).**

| Tabla | Cambio |
|---|---|
| task | **+** `responsibleUserId`, `estimatedEffortMinutes` (sustituye a `effortMinutes`), `remainingDurationDays`, `remainingAsOf`. **−** `requestedStart`. `sortKey` con indexación fraccionaria lexicográfica, generada en servidor y rebalanceada en transacción cuando supera la longitud máxima (E-22) |
| task_collaborator | **Nueva:** `taskId, userId, projectId`; unique(`taskId, userId`); FK compuesta de proyecto |
| schedule_conflict | **Nueva:** `projectId, revision, dependencyId, successorId, kind, requiredDate, actualDate, deficitDays, acknowledgedBy, acknowledgedAt`; derivada y reconstruible |
| calendar_version | **−** `validFrom` |
| project | **+** `visibility (standard\|restricted)`; `teamId` como equipo propietario (ya existía, ahora con semántica de alcance) |
| access_grant | **Nueva:** sustituye a `user_role` (ver CH-08) |
| access_request | **Nueva:** acceso excepcional (ver CH-08) |
| external_issue | unique(`projectId, cloudId, issueId`) (E-12); **+** `audienceMode (metadata\|linkOnly)` |
| audit_event | **+** índice (`projectId, targetType, targetId, occurredAt`) para el historial |

## CH-08
**Autorización con alcance (D-07, D-16).**

**Modelo.**

```
access_grant(id, principalType user|team, principalId, capability, scopeType org|team|project, scopeId,
             includesRestricted bool default false, grantedBy, approvedBy?, reason, validFrom, expiresAt?, revokedAt?, revokedBy?)
CHECK (principalType <> 'user' OR principalId <> grantedBy)   -- sin autoasignación
```

**Capabilities:** `platform.admin, project.create, project.read, portfolio.read, resource.capacity.read, financial.read, financial.write, project.export, audit.read, integration.manage, time.approve, membership.manage`.

**Decisión de acceso.** Por defecto se deniega. Se permite solo si:
- el usuario está activo, **y**
- la acción es compatible con el estado del proyecto (un proyecto archivado es de solo lectura), **y**
- se cumple una de estas condiciones:
  - una membresía `project_member` cuyo rol cubre la acción, **o**
  - un grant activo con la capability, cuyo alcance cubre el proyecto (org ⊇ team ⊇ project), y además el proyecto es `standard`, o el grant tiene `includesRestricted`, o el grant es de alcance proyecto.

**Reglas.**
- **`platform.admin`** gestiona usuarios, equipos, calendarios y conectores. **No** otorga `project.read`.
- **Dirección** recibe `portfolio.read` en alcance org mediante concesión explícita. Ese permiso da datos agregados (nombre, estado, salud, hitos, fechas); el contenido requiere `project.read`. Si incluye proyectos restringidos: **[P-13]**.
- **Sin autoasignación:**
  - nadie se concede a sí mismo un grant ni una membresía (servicio + CHECK + test);
  - nadie concede capabilities que no tiene;
  - modificar la pertenencia **propia** a un equipo que tiene grants requiere un segundo aprobador.
- **Acceso excepcional (break-glass):**
  - solicitud con motivo, proyecto, capability y duración (8 h por defecto, 72 h como máximo);
  - aprobación por el owner del proyecto o por el responsable de seguridad, siempre distinto del solicitante;
  - se crea un grant con `expiresAt`;
  - se notifica al owner y a seguridad;
  - queda auditado y entra en una revisión periódica;
  - sin vía de emergencia sin aprobador. Aprobadores y plazos: **[P-15]**.
- **E-13.** Un recurso con alcance de proyecto inaccesible devuelve **404**, para no revelar si existe. **403** cuando el recurso es legible pero la acción no está permitida.
- **Impacto:** RF-13 (criterios ampliados), 05 matriz, AP-011 (L, se divide en 011a modelo y evaluador / 011b concesiones, break-glass y tests).

## CH-09
**Historial de modificaciones (RF-33, D-20).**

**RF-33 (propuesto P1 [P-17]):** historial de cambios por tarea (pestaña «Historial» del panel de detalle) y por proyecto (`/projects/:id/history`) con:
- actor, fecha, operación, campo, valor anterior y valor nuevo;
- agrupación por commit o revisión;
- filtros por actor, fecha y tipo.

**Criterio de aceptación:**
- Solo es visible con `project.read`.
- Los campos financieros solo aparecen con `financial.read`.
- No muestra el cuerpo de comentarios, tokens ni datos excluidos de la auditoría.
- Un usuario con el acceso revocado no ve nada.
- Los cambios de plan muestran las tareas afectadas transitivamente y los conflictos reconocidos.
- Retención según **[P-06]**. Sin exportación en la v1.

**Fuente:** `audit_event` (RF-14), sin copia aparte. **API:** `GET /projects/:id/history`, `GET /projects/:id/tasks/:taskId/history`, con paginación por cursor. **Ticket:** AP-056.

## CH-10
**Arquitectura (03).**

- **Motor isomórfico (D-09).**
  - `packages/scheduling-engine` no usa APIs de Node ni del DOM ni depende de Temporal: trabaja con días-época enteros y cadenas ISO, porque Safari no trae Temporal según las fuentes consultadas.
  - El cliente previsualiza localmente durante el drag. Al soltar, llama a `/plan/preview` del servidor, que es el que manda, y luego hace el commit con `previewId`.
  - Si el preview local y el del servidor difieren, gana el servidor y se registra la métrica `preview_mismatch`, que debe ser 0 y genera alerta.
  - Si la `engineVersion` del cliente no coincide con la del servidor, se desactiva el preview local y se pide recargar.
- **Una sola vía de mutación (H-M14):** todas las mutaciones pasan por `/api/v1`; no se usan Server Actions para mutar.
- **ADR-004, librería OIDC (D-15).** Criterios: mantenimiento activo, certificación OpenID o madurez equivalente, soporte de PKCE, nonce, validación de `iss`/`tid` en single tenant, licencia y superficie mínima. Candidatas: `openid-client`, `@azure/msal-node` y la librería de sesiones de Better Auth/Auth.js. La sesión es siempre opaca y del lado del servidor.
- **ADR-001:** versión de Drizzle (estable 0.45.x frente a RC 1.0) y cola pg-boss frente a graphile-worker.
- **ADR-009:** render PDF/PNG local con navegador headless aislado en el worker **[P-19]**.
- **ADR-010:** SSE condicionado a la infraestructura real; polling de 15–30 s como respaldo.

## CH-11
**Integraciones (D-17).**

- **Jira:**
  - `external_issue` con unique(`projectId, cloudId, issueId`).
  - Se copian metadatos (estado, resumen) **solo** si el proyecto Jira de origen figura en una lista de compatibilidad de audiencia, declarada por el propietario de Jira y el owner del proyecto y auditada (`audienceMode=metadata`).
  - En otro caso (`linkOnly`) se guarda solo la clave, la URL y `issueId`, y cada usuario consulta Jira con sus propios permisos.
  - Si se pierde la compatibilidad o el acceso, se purga la caché de metadatos.
  - Solo lectura en la v1. Quién declara la compatibilidad: **[P-21]**.
- **Teams:** sin cambios respecto a v1.0 **[P-22]**.

## CH-12
**UX (01 §5).**

- AP-002a: dos direcciones visuales para Inicio y Gantt, en claro y oscuro, navegables. AP-002b: resto de pantallas, después de aprobar una dirección.
- **Nuevos elementos obligatorios en los mocks:**
  - conflicto de planificación (vínculo marcado y panel de conflictos);
  - barra real frente a barra planificada en tareas con hechos;
  - diálogo de impacto (lista de tareas desplazadas y conflictos a reconocer);
  - pestaña «Historial»;
  - indicador de proyecto restringido;
  - solicitud de acceso excepcional.
- Convención visual de los hitos (frontera en lunes o fin del viernes): se valida con el prototipo **[P-14]**.

## CH-13
**Backlog (06 y backlog.csv).** Detalle completo en [AP-001-06](AP-001-06-backlog-f0.md).

- AP-002 → AP-002a (M) + AP-002b (M); AP-003 depende de AP-002a y AP-004 (fixtures) (E-09).
- AP-001: requisitos «transversal» (E-23).
- AP-028 depende de AP-021 y AP-020, no de AP-027; el overlay de criticidad depende de AP-027 (E-15).
- Gate F2: CPM y líneas base «implementados y probados»; el piloto no los exige salvo **[P-16]** (E-14).
- Nuevos tickets: AP-056 (historial), AP-057 y AP-058 (CH-14).
- AP-011 se divide en 011a/011b. AP-019 incluye conflictos y hechos. AP-014 incluye responsable y colaboradores.
- Total: 55 → **59** tickets (+002b, +056, +057, +058; los 011a/b son subtareas).

## CH-14
**Gates propios del piloto (H-A11).**

- **AP-057, Revisión de seguridad del piloto** (P0, F3). Depende de AP-005, AP-011, AP-012, AP-021, AP-026 y AP-029.
  - Threat model actualizado.
  - Pruebas negativas de identidad, IDOR, CSRF, XSS, cabeceras y export CSV.
  - SCA, SBOM y escaneo de secretos.
  - Sin hallazgos altos o críticos abiertos.
- **AP-058, Entorno piloto, backup y restore** (P0, F3). Depende de AP-007, AP-008 y AP-005.
  - Entorno aislado y TLS.
  - Backup cifrado.
  - Restauración ensayada con conteos verificados.
- **AP-035** pasa a depender también de AP-057 y AP-058.
- **AP-051, 052, 053 y 055 pasan a P1** (gate de release v1). P1 no es opcional para la v1, así que no se pierde nada. Desaparecen las dependencias P0 → P1.

## CH-15
**Testing y aceptación (07).**

- 07 §2: las propiedades se sustituyen por PR-01..PR-12 (CH-02).
- **AT-04 (modificado).**
  - Añadir un ciclo devuelve 422, sin cambios ni evento.
  - Retrasar la predecesora de una tarea manual sin reconocer el conflicto devuelve 422.
  - Con reconocimiento, se persiste el conflicto visible, con evento auditado y la manual intacta.
- **AT-19.** Una tarea completada y otra en curso con `remaining` conservan sus hechos tras replanificar la predecesora; el conflicto FACT es visible.
- **AT-20.** El historial de una tarea muestra el diff; un usuario sin `financial.read` no ve costes; un usuario revocado recibe 404.
- **AT-21.** Un admin no puede concederse acceso a un proyecto restringido. El break-glass aprobado por un tercero caduca a su hora y queda auditado.
- **AT-22.** Crear asignaciones no modifica el esfuerzo estimado. Planificado y real se calculan aparte y cuadran con los fixtures.
- **AT-23.** La suite dorada del motor da resultados idénticos en Node y en Chromium headless.
