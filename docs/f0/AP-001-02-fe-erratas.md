# AP-001 · Fe de erratas del kit documental v1.0

Una errata es un error, una contradicción interna o una omisión del texto v1.0, **independiente** de las decisiones nuevas. Los cambios de diseño están en la [propuesta v1.1](AP-001-03-propuesta-v1.1.md). Cada errata enlaza con el cambio que la corrige.

## 1. Verificaciones mecánicas realizadas (2026-11-25)
El script de validación lo ejecutó el agente en local y no forma parte del repositorio. Resultados:

| Comprobación | Resultado |
|---|---|
| Tickets en `backlog.csv` | 55 (F0 6, F1 9, F2 14, F3 6, F4 6, F5 9, F6 5); tamaños S 1, M 28, L 26 |
| RF-01..32 y RNF-01..14 con al menos un ticket | **Sí**, ninguno sin cubrir; ningún ID desconocido |
| Dependencias inexistentes o hacia fases posteriores | Ninguna |
| Ciclos en las dependencias de tickets | Ninguno |
| `06-BACKLOG.md` frente a `backlog.csv` (prioridad, requisitos, dependencias) | Coinciden |
| Dependencias P0 → P1 | **8**: AP-051←AP-041/045/047/049; AP-052←AP-038/045; AP-053←AP-050; AP-055←AP-054 (ver E-16) |
| Fechas de los casos dorados (§7 del motor) | 2026-11-30 es lunes; recalculados a mano FS/SS/FF/SF/lag−1 y la red A-B-C-H (T=5, holgura C=2): **correctos** |
| Fechas auxiliares | 2028-02-29 es martes; los cambios de hora de 2026 (29-03 y 25-10) caen en domingo |

## 2. Erratas

| ID | Sev. | Documento / sección | Texto o situación v1.0 | Problema | Corrección propuesta |
|---|---|---|---|---|---|
| E-01 | Crítica | 05 tabla `task`; PRD §4 y §3; RF-05, RF-31; matriz 05 | «responsable», «tareas asignadas», «gestión básica de responsables» (P0) | La tabla `task` no tiene campo de responsable y las asignaciones son P1 (F4): el piloto no puede cumplir RF-05 ni RF-31 | [CH-05](AP-001-03-propuesta-v1.1.md#ch-05) |
| E-02 | Crítica | 05 matriz y `global_role/user_role` | «membresía/scope», «capability + scope» | «Scope» no tiene semántica ni tabla; `user_role` guarda capabilities sin alcance | [CH-08](AP-001-03-propuesta-v1.1.md#ch-08) |
| E-03 | Crítica | 04 §2–3 «Manual valida fixedStart >= earliestStart … return conflict» | Rechazo con 422 | Bloquea el commit de cualquier **predecesora** de una tarea manual. Las tareas completadas se reprogramarían porque el estado no influye | [CH-02](AP-001-03-propuesta-v1.1.md#ch-02) |
| E-04 | Alta | PRD §6 flujo 2 «publica planificación»; PRD §5 «deshacer de cambios simples no publicados» | Estado «no publicado» | No existe borrador en el motor, la API ni el modelo: el commit es inmediato | [CH-01](AP-001-03-propuesta-v1.1.md#ch-01) |
| E-05 | Alta | 05 `calendar_version.validFrom` frente a `project.calendarVersionId` | Dos semánticas | Una sugiere vigencia por fechas; la otra, una sola instantánea | [CH-04](AP-001-03-propuesta-v1.1.md#ch-04) |
| E-06 | Alta | 05 `task.effortMinutes` frente a `assignment.totalMinutes`; PRD §7 «esfuerzo estimado» | Dos fuentes de esfuerzo | No se indica cuál manda ni si una sobrescribe a la otra | [CH-05](AP-001-03-propuesta-v1.1.md#ch-05) |
| E-07 | Alta | PRD §5 Kanban «movimiento cambia estado, no reprograma fechas»; RF-12 | — | Con D-08, pasar a «en curso» o «completada» registra fechas reales que pueden desplazar a las sucesoras. La frase deja de ser cierta tal cual | [CH-03](AP-001-03-propuesta-v1.1.md#ch-03) |
| E-08 | Alta | RF-15 «plan no factible no muestra falsa criticidad»; 04 §4 «Si plan no factible, no publicar» | — | Con D-08 un plan con conflictos autorizados es persistible. Falta definir el CPM en ese caso | [CH-02](AP-001-03-propuesta-v1.1.md#ch-02) |
| E-09 | Alta | 06 AP-003 depende de AP-002 (L, todas las rutas) | — | Alarga sin necesidad la ruta crítica de F0 | [CH-13](AP-001-03-propuesta-v1.1.md#ch-13) |
| E-10 | Alta | 06/07: el piloto (AP-035, F3) no depende de ningún ticket de seguridad ni de restore; AP-051/053 dependen de F4/F5 | — | RNF-01 exige revisión de amenazas y pruebas negativas **antes del piloto**, y PRD §8 usa proyectos reales en el piloto | [CH-14](AP-001-03-propuesta-v1.1.md#ch-14) |
| E-11 | Media | 04 §2 `requestedStart` y `notBefore` | Los dos son límite inferior en modo auto | Redundantes | [CH-02](AP-001-03-propuesta-v1.1.md#ch-02) |
| E-12 | Media | 05 `external_issue unique(taskId,cloudId,issueId)` | «evitar duplicar import por proyecto» | La unique permite el mismo issue en dos tareas del mismo proyecto | [CH-11](AP-001-03-propuesta-v1.1.md#ch-11) |
| E-13 | Media | 03 §5 «404 recurso inaccesible/inexistente según política» | Sin decidir | Respuesta ambigua para pruebas IDOR | [CH-08](AP-001-03-propuesta-v1.1.md#ch-08) |
| E-14 | Media | 07 §1 gate F2 «CPM/baseline v1» frente a PRD §4 (CPM y baseline son P1) y AP-035 | — | No queda claro si el piloto incluye CPM y línea base | [CH-13](AP-001-03-propuesta-v1.1.md#ch-13) |
| E-15 | Media | 06 AP-028 depende de AP-027 | — | La línea base no necesita CPM; solo el overlay de criticidad lo usa | [CH-13](AP-001-03-propuesta-v1.1.md#ch-13) |
| E-16 | Media | 06: 8 dependencias P0 → P1 | P0 = «condición de piloto o release operativo» | Un P0 no puede cerrarse sin funciones P1. Para la release v1 es coherente, para el piloto no | [CH-14](AP-001-03-propuesta-v1.1.md#ch-14) |
| E-17 | Media | Alcance aprobado «historial de modificaciones» | Solo `/admin/audit` | No hay vista de historial para usuarios | [CH-09](AP-001-03-propuesta-v1.1.md#ch-09) |
| E-18 | Media | 04 §1 sin regla para un proyecto que empieza en día no laborable | — | Comportamiento indefinido | [CH-02](AP-001-03-propuesta-v1.1.md#ch-02) |
| E-19 | Media | 05 `time_entry.resourceId` obligatorio | — | Un usuario sin recurso no puede registrar horas (contradice RF-20) | [CH-06](AP-001-03-propuesta-v1.1.md#ch-06) |
| E-20 | Media | 04 §6 `minutes/60 * rate` con redondeo por entrada | — | Si se divide antes de multiplicar aparece redondeo intermedio | [CH-06](AP-001-03-propuesta-v1.1.md#ch-06) |
| E-21 | Media | RF-09 «cambios DST sin alterar fechas civiles» | — | El horario de verano solo afecta a «hoy», al vencimiento y a los timestamps; falta fijar la zona de referencia | [CH-02](AP-001-03-propuesta-v1.1.md#ch-02) |
| E-22 | Media | 05 `sortKey` | Sin estrategia | Riesgo de colisiones y reordenaciones costosas | [CH-07](AP-001-03-propuesta-v1.1.md#ch-07) |
| E-23 | Baja | 06 AP-001 requisitos «RF-03,RF-17,RNF-02» | — | Trazabilidad poco significativa: AP-001 es transversal | [CH-13](AP-001-03-propuesta-v1.1.md#ch-13) |
| E-24 | Baja | README «Copiar al repositorio corporativo `asserta-projects`» | — | El repositorio local actual se llama `gantt` y no tiene remoto. Nombre por confirmar | P-18 |
| E-25 | Baja | `backlog.csv` con BOM UTF-8 | — | Útil para Excel, pero algunas herramientas lo leen como parte de la cabecera `id` | Mantener y documentar |
| E-26 | Baja | README «55 tickets» | — | Con la v1.1 pasan a 57 (AP-002a/b, AP-056) más las divisiones de CH-14 | [CH-13](AP-001-03-propuesta-v1.1.md#ch-13) |
| E-27 | Baja | PRD cabecera: responsable funcional y sponsor «pendiente» | — | Bloqueante de gate F0 | P-01, P-02 |

## 3. Verificaciones externas sin errata
- **08-FUENTES, retirada de los conectores O365 «mayo 2026»:** coherente con el Message Center MC1181996 (despliegue del 18 al 22 de mayo de 2026).
- **03 §3 / 08, DHTMLX Community MIT desde v10:** coherente con el anuncio de v10.0 (11 de junio de 2026). Las versiones ≤9 siguen en GPL v2.
- **03 §3, SVAR MIT y PRO comercial:** coherente. La auto-programación, la ruta crítica, las líneas base y los calendarios son PRO; se volverá a comprobar sobre el paquete exacto en AP-003.
