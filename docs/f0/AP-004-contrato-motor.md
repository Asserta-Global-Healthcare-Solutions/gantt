# AP-004 · Contrato del motor de planificación v1.1

| Campo | Valor |
|---|---|
| Estado | **En revisión.** Firma humana pendiente (§12) |
| Versión del contrato | `engine-contract 1.1.0-rc1` |
| Sustituye | 04-MOTOR-PLANIFICACION §1–§4 y §7 de v1.0, en lo indicado (las partes no mencionadas siguen vigentes) |
| Origen | D-08, D-09, D-13, D-14 ([acta](AP-001-01-acta-decisiones.md)); CH-02..CH-06 ([v1.1](AP-001-03-propuesta-v1.1.md)) |
| Casos dorados | [fixtures/engine/](fixtures/engine/) (90 casos) · esquema [schema.json](fixtures/engine/schema.json) |
| Verificador | `poc/engine-oracle/` (desechable; **no** es el motor de producto) |

Las palabras **DEBE**, **NO DEBE** y **PUEDE** son normativas.

---

## 1. Alcance y principios
1. El motor es una función pura: `schedule(ProjectInput) → Snapshot | ValidationError[]`.
   - **NO DEBE** leer el reloj, el entorno, la red ni la base de datos.
   - «Hoy» entra como dato (`today`), y la API lo calcula con `todayIn(instante, zona)` (§3.4).
2. **Isomorfía (D-09).** El mismo paquete se ejecuta en el navegador (vista previa) y en el servidor (autoridad).
   - **NO DEBE** depender de APIs de Node, del DOM ni de `Temporal`.
   - Fechas como cadenas ISO `YYYY-MM-DD` y enteros (día-época, índice laborable). `Intl` está permitido solo para `todayIn`.
3. **Determinismo (PR-05).** Mismas entradas y misma `engineVersion` dan un snapshot idéntico, sea cual sea el orden de las listas de entrada.
4. **Validación completa antes de calcular.** Si hay errores, no se devuelve ningún resultado parcial (§8).
5. Granularidad: día laborable entero para fechas y duraciones; minutos enteros para esfuerzo y capacidad; dinero en decimal (§10).

## 2. Entradas

```ts
ProjectInput {
  project: { startDate: ISODate; timezone: IANA };       // startDate DEBE ser laborable (E-18)
  calendar: CalendarVersion;                              // instantánea inmutable (CH-04)
  today?: ISODate;                                        // obligatorio en la API; opcional en tests
  tasks: TaskInput[];
  dependencies: Dependency[];
  previousConflicts?: { dependencyId; kind }[];           // conflictos de la revisión vigente
  engineVersion: string;                                  // fuera del oráculo
}
CalendarVersion { weekdayMinutes: [L,M,X,J,V,S,D] (enteros ≥0); exceptions: { date; minutes }[] }
TaskInput {
  id; parentId?; kind: 'task'|'milestone'|'group';
  durationDays?;                     // task: entero ≥1; milestone: 0 o ausente; group: ausente
  scheduleMode?: 'auto'|'manual';    // por defecto auto
  fixedStart?; notBefore?; deadline?;
  status?: 'pendiente'|'en_curso'|'bloqueada'|'completada';
  progress?: 0..100;                 // no influye en fechas
  actualStart?; actualFinish?;       // hechos (D-08)
  remainingDurationDays?; remainingAsOf?;   // trabajo restante [P-24]
  estimatedEffortMinutes?;           // solo task (CH-05)
}
Dependency { id; predecessorId; successorId; type: 'FS'|'SS'|'FF'|'SF'; lagDays: entero }
```
`requestedStart` desaparece (E-11): el inicio deseado se expresa como `notBefore`.

## 3. Calendario y fronteras

### 3.1 Índices
- Un día es laborable si sus minutos son > 0. Los minutos salen de la excepción de esa fecha si existe; si no, de `weekdayMinutes` según el día de la semana.
- El día laborable `k` se cuenta desde `project.startDate` (`k = 0`). Los días laborables anteriores al inicio tienen índice negativo.
- La **frontera `k`** es el inicio del día laborable `k`.
- Una tarea ocupa `[s, f)`, con `f = s + d`. Un hito tiene `s = f`.

### 3.2 Conversión de fechas
| Función | Definición |
|---|---|
| `B(x)` | Índice del primer día laborable ≥ `x` |
| `Bend(x)` | Índice del primer día laborable > `x` |
| `dateOf(k)` | Fecha civil del día laborable `k` |

Un hecho registrado en un día no laborable no rompe el índice: `Bend(sábado)` = lunes (casos CAL-01 y C3-11).

### 3.3 Restricciones del calendario
- Un calendario sin ningún día de la semana laborable se rechaza (`CALENDAR_NO_WORKING_DAYS`).
- Horizonte: `dateOf(f)` y `dateOf(s)` **DEBEN** ser ≤ `startDate + 10 años` (si la fecha no existe, por ejemplo un 29-02, se usa el último día del mes); si no, `HORIZON_EXCEEDED`.

### 3.4 «Hoy»
`todayIn(instante UTC, zona IANA)` devuelve la fecha civil en la zona del proyecto. Los cambios de hora no alteran las fechas civiles (caso CAL-06, Europe/Madrid y Atlantic/Canary).

## 4. Clases de programación

| Clase | Condición | `s` | `f` |
|---|---|---|---|
| `FACT_DONE` | `status = completada` | `B(actualStart)` | `Bend(actualFinish)`. **Hito:** `s = f = B(actualFinish)` |
| `FACT_RUNNING` | `actualStart` presente y no completada | `B(actualStart)` | sin restante: `max(s + d, cotasFin)`; con restante: `max(B(remainingAsOf) + remaining, cotasFin)` |
| `MANUAL` | sin hechos y `scheduleMode = manual` | `B(fixedStart)` | `s + d` |
| `AUTO` | resto | `max(0, B(notBefore), cotasInicio)` | `s + d` |

**Cotas** de la arista A→B, con lag `L` y duración `d_B`:

| Tipo | Cota de inicio (AUTO) | Cota de fin (FACT_RUNNING) |
|---|---|---|
| FS | `f_A + L` | — |
| SS | `s_A + L` | — |
| FF | `f_A + L − d_B` | `f_A + L` |
| SF | `s_A + L − d_B` | `s_A + L` |

Otras reglas:
- El estado `bloqueada` no cambia la clase.
- El progreso no influye en las fechas.
- `MANUAL` y los hechos **PUEDEN** quedar antes del inicio del proyecto; en ese caso hay aviso (§9).

## 5. Pase hacia delante
- **Algoritmo normativo:** orden topológico de Kahn sobre hojas e hitos, con desempate por `id`. Para cada nodo se aplica la tabla del §4 con sus predecesoras ya calculadas.
- **Complejidad:** O(V+E) más las conversiones de calendario.
- **Comprobación independiente:** el oráculo usa relajación hasta punto fijo y coincide con Kahn en 5.000 grafos aleatorios (§11).

## 6. Conflictos
- Una arista está **en conflicto** si su restricción no se cumple con las posiciones calculadas:

  | Tipo | Se cumple si |
  |---|---|
  | FS | `s_B ≥ f_A + L` |
  | SS | `s_B ≥ s_A + L` |
  | FF | `f_B ≥ f_A + L` |
  | SF | `f_B ≥ s_A + L` |

- **Solo puede ocurrir si B es `MANUAL` o `FACT_*`.** En `FACT_RUNNING` solo afecta a FS/SS. Una AUTO en conflicto es un fallo interno del motor (PR-01).
- **Registro:** `{dependencyId, successorId, kind: MANUAL|FACT, requiredIdx, actualIdx, deficitDays, requiredDate, actualDate}`.
  - Las fechas son **fechas de frontera**: `dateOf` del índice requerido o real.
  - La lista se ordena por `dependencyId`.
- **`newConflicts`** = conflictos actuales cuya clave `(dependencyId, kind)` no estaba en `previousConflicts`. La API **DEBE** rechazar el commit con `422 CONFLICTS_NOT_ACKNOWLEDGED` si `acknowledgedConflicts ⊉ newConflicts` (casos C3-02a/b; prueba de integración en AP-021).

## 7. CPM y holgura total
1. **Fin del proyecto:** `T = max f` de las hojas no `FACT_DONE`. Si todas lo son, `max f` de todas.
2. **Pase hacia atrás** en orden topológico inverso, para cada nodo X que no sea `FACT_DONE`.

   **X `AUTO` o `MANUAL`:** `LS_X = min(T − d_X, cotas de cada sucesora Y)`. Para Y `AUTO` o `MANUAL` se toma `LSY = (Y MANUAL ? s_Y : LS_Y)` y `LFY = LSY + d_Y`:

   | Tipo | Cota |
   |---|---|
   | FS | `LSY − L − d_X` |
   | SS | `LSY − L` |
   | FF | `LFY − L − d_X` |
   | SF | `LFY − L` |

   Para Y `FACT_RUNNING`: FF da `LF_Y − L − d_X` y SF da `LF_Y − L`; FS y SS se omiten. Para Y `FACT_DONE` la arista se omite.

   **Holgura:** `totalFloat = LS_X − s_X`.

   **X `FACT_RUNNING`:** `LF_X = min(T, cotas)`. Para Y `AUTO` o `MANUAL`: FS da `LSY − L` y FF da `LFY − L`. Para Y `FACT_RUNNING`: FF da `LF_Y − L`. Las demás se omiten.

   **Holgura:** `totalFloat = LF_X − f_X`.

3. **`FACT_DONE`:** `totalFloat = null`, `critical = false`.
4. **Ruta crítica:** `critical ⇔ totalFloat ≤ 0`.
   - `criticalReason = cadenaFin` si la holgura es 0 y alguna cota mínima procede de `T` sin pasar por un ancla manual.
   - En otro caso `ancladaManual`.
   - *Cambio respecto a CH-02:* se elimina el valor `conflicto`, porque los conflictos ya se informan aparte (§6).
5. **Holgura negativa.** Solo aparece por anclas `MANUAL` (casos C3-01, C3-10, CPM-07). Sin tareas manuales, la holgura es ≥ 0 (PR-09). Los plazos (`deadline`) generan avisos, no holgura.
6. **Definición de referencia (aclaración surgida en AP-004).** La holgura es la del CPM estándar: el máximo desplazamiento de X tal que X y lo que X empuja aguas abajo terminan ≤ T y no rompen anclas manuales, **suponiendo el resto de tareas en sus fechas tardías**.
   - **No** es un «qué pasa si» sobre el plan completo: si otra rama ya llega tarde a un ancla, esa culpa no se transfiere a X (CPM-07).
   - El oráculo implementa esta definición como simulación hacia delante sobre el subgrafo y coincide con la recurrencia en 5.000 grafos.

## 8. Validación (códigos `ValidationError`)
Se devuelven **todos** los errores aplicables, ordenados por `(code, taskId|dependencyId)`.
- **Si hay errores de referencia** (`UNKNOWN_TASK`, `SELF_DEPENDENCY`, `GROUP_DEPENDENCY`), no se busca `CYCLE`.
- **`HORIZON_EXCEEDED`** se evalúa después del cálculo.

| Código | Regla | Caso |
|---|---|---|
| `CALENDAR_NO_WORKING_DAYS` | Ningún día de la semana con minutos > 0 | CAL-09 |
| `PROJECT_START_NON_WORKING` | `startDate` no laborable | CAL-08 |
| `UNKNOWN_TASK` | Padre o extremo de vínculo inexistente | VAL-12 |
| `PARENT_NOT_GROUP` | El padre no es un grupo | VAL-19 |
| `TREE_CYCLE` | Ciclo en la WBS | VAL-13 |
| `GROUP_SCHEDULE_FIELDS` | Un grupo con `durationDays`, `fixedStart`, `notBefore` o hechos | VAL-15 |
| `INVALID_DURATION` | Tarea con d < 1 o no entera; hito con d ≠ 0 | VAL-10 |
| `MILESTONE_EFFORT` | Hito con esfuerzo | VAL-11 |
| `MILESTONE_FACTS` | Hito con `actualStart ≠ actualFinish` | VAL-17 |
| `MANUAL_WITH_NOT_BEFORE` | Manual con límite inferior | VAL-05 |
| `MANUAL_WITHOUT_FIXED_START` | Manual sin hechos y sin `fixedStart` | VAL-16 |
| `MISSING_FACT` | `en_curso` sin `actualStart`; `completada` sin `actualFinish` (o sin `actualStart` en tareas) | VAL-14 |
| `ACTUAL_ORDER` | `actualFinish < actualStart` | VAL-09 |
| `FACT_IN_FUTURE` | Algún hecho o `remainingAsOf` posterior a `today` | VAL-06 |
| `INVALID_REMAINING` | Restante fuera de `FACT_RUNNING`, sin pareja, no entero o < 1 | VAL-07 |
| `REMAINING_BEFORE_START` | `remainingAsOf < actualStart` | VAL-08 |
| `SELF_DEPENDENCY` | A→A | VAL-01 |
| `GROUP_DEPENDENCY` | Vínculo con un grupo (cubre también ancestro-descendiente) | VAL-03 |
| `INVALID_LAG` | Lag no entero | VAL-18 |
| `DUPLICATE_DEPENDENCY` | Mismo par y mismo tipo (con tipo distinto se admite: DEP-10) | VAL-02 |
| `CYCLE` | Ciclo en el grafo de dependencias, sea cual sea el modo | VAL-04, C3-07 |
| `HORIZON_EXCEEDED` | §3.3 | CAL-07a |

## 9. Salida
Para cada hoja: `class, startIdx, finishIdx, start, finish, totalFloat, critical, criticalReason, progress`.

**Fechas que se muestran.** Cuando hay hechos se muestran las fechas reales. Si no:
- `start = dateOf(s)`;
- `finish = dateOf(f − 1)` en tareas y `dateOf(s)` en hitos (convención A, **[P-14]**).

**Grupos (rollup).**
- **Fechas:** `startIdx = min` y `finishIdx = max` sobre las hojas descendientes, hitos incluidos. `start` y `finish` mostrados son el mínimo y el máximo de los mostrados de las hojas (WBS-05).
- **Progreso:** se calcula sobre las hojas descendientes **directamente**, sin promediar subgrupos (WBS-04).
  - Las tareas `FACT_DONE` cuentan como 100.
  - Peso = `estimatedEffortMinutes` si todas las tareas lo tienen > 0; si no, `durationDays`. Los dos pesos nunca se mezclan (WBS-02).
  - Hitos: excluidos del peso. Si el grupo solo tiene hitos, progreso = completados / total.
  - Redondeo half-up a entero. Un grupo vacío da `null`.

**Avisos** (ordenados por `code, taskId`; no bloquean):

| Código | Condición |
|---|---|
| `START_OVERDUE` | `AUTO`/`MANUAL` con `start < today`. El motor **no** la mueve |
| `DEADLINE_EXCEEDED` | `finish` mostrado > `deadline` |
| `MANUAL_BEFORE_PROJECT_START` | `MANUAL` con `s < 0` |
| `FACT_BEFORE_PROJECT_START` | Algún hecho anterior a `startDate` |
| `FACT_ON_NON_WORKING_DAY` | Algún hecho en un día no laborable |

**Snapshot:** `projectFinishIdx (T)`, `tasks`, `conflicts`, `warnings`, `newConflicts?`, `engineVersion` y `inputHash`.
- `inputHash` = SHA-256 del JSON canónico de la entrada, con claves ordenadas, tareas y vínculos ordenados por `id`, e incluyendo `engineVersion`.
- *No está implementado en el oráculo;* se verificará en AP-016.

## 10. Distribución, coste y línea base
- **Distribución (DIST-01..06).**
  - Días elegibles: días laborables del proyecto dentro de `[inicio, fin]` de la tarea con capacidad > 0.
  - Capacidad = minutos del calendario del recurso − ausencia, con mínimo 0. No se restan otras asignaciones.
  - Reparto: mayor resto con aritmética entera; en caso de empate, la fecha más temprana. La suma es exacta.
  - Con capacidad total 0 no se reparte, se avisa `UNDISTRIBUTED` y se conserva el esfuerzo.
  - Solo hay modo «esfuerzo total» **[P-12]**.
- **Coste (COST-01..08).**
  - Por entrada: `round_half_up(minutos × tarifa / 60, 2)` en aritmética entera exacta (tarifa con 4 decimales), sin redondeos intermedios.
  - Total = suma de los costes por entrada.
  - Una entrada sin tarifa queda `INCOMPLETE` y el total se marca incompleto; nunca se pone 0 ficticio.
  - COST-05 muestra que redondear por entrada difiere del redondeo del total. Es la regla de la v1.0 y la valida Finanzas **[P-10, P-11]**.
- **Línea base (BASE-01..03).**
  - Se compara por `id`: añadidas, retiradas, cambiadas e intactas.
  - Los deltas de inicio y fin se miden en días laborables del calendario **actual**. `CALENDAR_CHANGED` si la versión difiere.

## 11. Propiedades (sustituyen a CH-02 §2.6)

| ID | Propiedad | Estado |
|---|---|---|
| PR-01 | Satisfacción condicionada: toda arista se cumple salvo que B ∈ {MANUAL, FACT_*} y figure en `conflicts`; FACT_RUNNING nunca incumple cotas de fin | Verificada |
| PR-02 | `conflicts` = conjunto exacto de aristas incumplidas | Verificada |
| PR-03 | Los hechos de salida son iguales a los de entrada; FACT_DONE depende solo de sus hechos | Verificada |
| PR-04 | MANUAL: `s = B(fixedStart)` | Verificada |
| PR-05 | Determinismo ante permutación de las entradas | Verificada |
| PR-06 | ASAP: toda AUTO tiene una cota ajustada | Verificada |
| **PR-07a** | Aumentar un lag nunca adelanta una AUTO y no altera MANUAL ni FACT_* | Verificada |
| **PR-07b** | Alargar una tarea **sin vínculos FF/SF entrantes** nunca adelanta una AUTO | Verificada |
| PR-08 | AUTO: `s ≥ 0` | Verificada |
| PR-09 | Holgura de la recurrencia (§7) = definición de referencia (§7.6); ≥ 0 sin manuales | Verificada |
| PR-10 | Todo ciclo se rechaza, sea cual sea el modo | Verificada |
| PR-11 | Localidad: lo no alcanzable desde la tarea cambiada no se mueve | Verificada |
| PR-12 | Isomorfía: Node y navegador dan el mismo resultado | **No ejecutada** (requiere el paquete real; AP-016) |

**Corrección de la v1.1 descubierta por las pruebas.** CH-02 enunciaba PR-07 como «aumentar una duración nunca adelanta una AUTO», y es **falso**: con FF o SF entrantes, alargar B rebaja su cota de inicio (`s_B ≥ f_A + L − d_B`), y las sucesoras SS de B también se adelantan. Es la semántica correcta de esas restricciones. Se sustituye por PR-07a/b.

## 12. Hallazgos durante AP-004

| # | Hallazgo | Tratamiento |
|---|---|---|
| F-01 | PR-07 de CH-02 era incorrecta (contraejemplo automático) | Sustituida por PR-07a/b (§11) |
| F-02 | Mi primera definición «semántica» de holgura (un «qué pasa si» sobre el plan completo) no coincidía con la recurrencia cuando otra rama llega tarde a un ancla | La recurrencia es el CPM estándar. Se aclara la definición de referencia (§7.6) y se añade CPM-07 |
| F-03 | Error en mi cálculo a mano de CPM-07 (holgura de X 0 en lugar de 1), detectado al repasarlo antes de ejecutar | Corregido; el valor final coincide con el oráculo |
| F-04 | Se elimina `criticalReason = conflicto` | §7.4 |
| F-05 | Hito completado: ancla en `B(actualFinish)`; un hito no puede tener `actualStart ≠ actualFinish` | §4, VAL-17 |
| F-06 | Las fechas mostradas de las tareas con hechos son las reales, aunque caigan en día no laborable | §9, C3-11 |
| F-07 | El rollup de grupos incluye hitos en las fechas y los excluye del progreso; así el «fin mostrado» de un grupo puede ser posterior al de su última tarea (WBS-05) | Depende de P-14 |

## 13. Evidencia
Ejecutado el 2026-11-25 con Node v24.19.0, sin dependencias externas:

| Comando (en `poc/engine-oracle/`) | Resultado |
|---|---|
| `npm test` | 102 tests: 90 casos dorados + 12 propiedades (400 grafos cada una); **102 pass, 0 fail**, exit 0 |
| `CASES=5000 node --test test/properties.test.mjs` | 12 propiedades × 5.000 grafos; **12 pass, 0 fail**, exit 0 |
| Prueba de mutación manual (alterar valores esperados de C3-01 y C3-07) | El ejecutor informa de las 3 diferencias introducidas |

**Limitaciones.**
- El oráculo y los cálculos a mano los ha hecho el mismo agente, así que la revisión humana caso por caso sigue siendo necesaria: `reviewedBy` está a `null` en los 90 casos.
- PR-12 e `inputHash` no están verificados.
- El rendimiento (1.000 tareas) no se mide aquí; se mide en AP-003 y AP-016.

## 14. Decisiones abiertas que afectan al contrato

| P | Efecto | Casos afectados |
|---|---|---|
| P-24 | Semántica del trabajo restante (`remainingDurationDays` + `remainingAsOf`) | C3-05a/b, C3-08, VAL-07/08 |
| P-14 | Convención de fechas mostradas de los hitos | DEP-08, DEP-14/15, WBS-03/05 |
| P-12 | Modo único de asignación | DIST-* |
| P-10 / P-11 | Tarifa y coste incompleto; redondeo por entrada | COST-05, COST-07 |

## 15. Firma
| Rol | Nombre | Fecha | Resultado |
|---|---|---|---|
| Responsable técnico (contrato y fixtures) | — | — | Pendiente |
| Producto (P-14, P-24) | — | — | Pendiente |
