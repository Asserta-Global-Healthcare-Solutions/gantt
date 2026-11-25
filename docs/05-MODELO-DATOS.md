# Modelo lógico y control de acceso

PostgreSQL: UUID PK, timestamps UTC, FK, checks y unique; columnas tenant/org/project en tablas que lo necesiten, FKs compuestas para evitar cruces de proyecto. Single tenant corporativo; `organization` evita configuración dispersa, no implica SaaS. Sin borrados en cascada de registros históricos. Soft-delete/archivado según políticas; purga solo autorizada y trazada. Migraciones versionadas. El esquema definitivo se aprueba en ADR.

| Tabla | Campos principales e invariantes |
|---|---|
| organization | id, entraTenantId unique, timezone, currency, settings |
| user | id, orgId, tid, oid, displayName, upn, active; unique(tid,oid) |
| global_role / user_role | role, userId, orgId; capabilities; solo admin autorizado |
| team / team_member | id, nombre; userId, teamId |
| project | id, orgId, code unique/org, name, ownerId, clientLabel, teamId, status, startDate, deadline, calendarVersionId, revision bigint, activeBaselineId, createdAt, archivedAt |
| project_member | projectId,userId, role, capabilityOverrides controlados; unique(projectId,userId) |
| task | id,projectId,parentId,kind,sortKey,name,description,status,priority,progress,durationDays,effortMinutes,requestedStart,notBefore,fixedStart,mode,deadline,computedStart,computedEndExclusive,actualStart/Finish opcional,revision,archivedAt; FK parent mismo proyecto; no ciclos |
| task_dependency | id,projectId,predecessorId,successorId,type,lagDays; FK compuesto; unique(par,tipo), check != |
| calendar / calendar_version | id,orgId,name; version,timezone,weekdayMinutes,validFrom, createdBy; versiones inmutables |
| calendar_exception | calendarVersionId, date, availableMinutes, reasonCode; unique por fecha |
| resource | id,orgId,userId nullable unique, name,teamId,kind human/virtual,active,calendarVersionId |
| resource_absence | resourceId,date,minutes,reasonCode mínimo sin detalle médico,version; capacidad >=0 |
| assignment | id,projectId,taskId,resourceId,mode,totalMinutes,dailyMinutes,revision; unique(taskId,resourceId) |
| assignment_day | assignmentId,date,minutes,calcVersion; derivado reconstruible; unique(assignmentId,date) |
| baseline / baseline_task / baseline_dependency / baseline_assignment | projectId,sourceRevision,engineVersion,calendarVersionId,label,actor,createdAt; snapshots inmutables por taskId histórico (sin FK a tarea viva destructiva) |
| time_entry | id,projectId,taskId,resourceId,workDate,minutes,status,billable,note,approvedBy,approvedAt,rateSnapshot,costSnapshot,revision; no editar aprobado |
| rate | resourceId,validFrom,validTo,amount decimal(14,4),currency; rangos sin solapamiento |
| budget / expense | projectId,amount decimal(14,2),currency,category,kind planned/actual,revision; no exposición sin capability |
| comment | id,projectId,taskId,authorId,body,createdAt,editedAt,deletedAt; sanitización |
| mention | commentId,userId; unique |
| document_link | projectId,taskId,url,label,actor; HTTPS allowlist corporativa; no descarga server-side |
| notification / preference | userId,projectId,eventId,kind,readAt,payload mínimo; dedupe |
| template / template_version | orgId,name,version,creator,snapshot schema version; sin miembros, horas, secretos |
| integration_config | projectId,provider,enabled,encryptedCredentialRef,publicConfig,revision; acceso admin restringido |
| external_issue | projectId,taskId,cloudId,issueId,issueKey,status,summary permitido,lastSync,visibilityState; unique(taskId,cloudId,issueId), evitar duplicar import por proyecto |
| import_stage / export_job | ownerId,projectId,status,hash,revision,expiresAt,privateObjectRef,errorSummary |
| audit_event | id,orgId,projectId nullable,actorType,actorId,action,targetType,targetId,occurredAt,correlationId,revision,diff sanitizado; append-only |
| outbox_event / job | id,eventId,kind,state,attempt,nextRun,leaseUntil,uniqueKey, sanitizedError; leases y dedupe |
| session / idempotency_record | hashed session ID,userId,expiry,revokedAt; actor,operation,key,requestHash,resultRef,expiry |

Índices: task(projectId,parentId,sortKey), task(projectId,status,computedStart), dependency por ambos extremos, assignment(resourceId,taskId), assignment_day(date,assignmentId), time_entry(resourceId,workDate,status), project_member(userId,projectId), audit_event(projectId,occurredAt), notification(userId,readAt), job(state,nextRun), external_issue(cloudId,issueId). Revisar EXPLAIN con dataset. Usar exclusion constraint o transacción para no solapar rate. Cantidades: minutos enteros no negativos; fechas fin exclusiva; moneda fija EUR v1; DECIMAL nunca float. Grupos y hitos sin esfuerzo/asignación; constraints de árbol/grafo en dominio transaccional y tests. Backups cifrados, auditoría append-only con cuenta DB separada para purga aprobada; no afirmar inmutabilidad criptográfica; evaluar exportación a repositorio protegido según ENS.

## Matriz de autorización (propuesta)
Roles globales no dan acceso automático al contenido: Admin plataforma, Dirección, Resource manager, Usuario. Rol de proyecto: owner/manager/member/viewer. Capabilities explícitas: project.create, portfolio.read, resource.capacity.read, financial.read/write, project.export, audit.read, integration.manage, time.approve. Deny by default; prevalece archivo/usuario deshabilitado. Dirección recibe cartera solo con scope acordado; no lectura global implícita. Admin puede otorgar membresía con motivo/auditoría y aprobación de política, pero no ve datos privados por ser admin. Owner/manager administran miembros del proyecto sin elevar roles globales ni capabilities que no poseen. Evitar último owner/admin eliminado.

| Acción | Admin | Dirección | Manager de proyecto | Miembro | Lector |
|---|---|---|---|---|---|
| Gestión plataforma | sí | no | no | no | no |
| Crear proyecto | con capability | con capability | con capability | no | no |
| Leer proyecto | membresía/scope | membresía/scope | propio | propio | propio |
| Editar plan/baseline/plantilla | si manager | si manager | sí | no | no |
| Editar estado/progreso | si autorizado | si autorizado | sí | tareas asignadas | no |
| Comentarios | si autorizado | si autorizado | sí | sí | no |
| Registrar horas | si miembro asignado | si miembro asignado | propias | propias | no |
| Aprobar horas | capability + scope | capability + scope | capability | no | no |
| Ver/editar costes | capability + scope | capability + scope | capability + scope | no | no |
| Exportar | capability + scope | capability + scope | capability + scope | capability + scope | capability + scope |
| Gestionar conectores | capability + scope | no por defecto | capability + scope | no | no |
| Auditoría | audit.read y scope | audit.read y scope | cambios de su proyecto | no | no |

Resource manager con capacidad transversal solo recibe carga total y huecos por recurso; nombres/proyecto/cliente solo con acceso. Auditoría nunca incluye tokens, cookies, contenido de comentarios, notas, ni costes en vistas sin autorización. Borrado/retención sujeto a política corporativa; no almacenar motivos de ausencia sensibles. Exportes, jobs y dashboards aplican las mismas políticas de campo y fila, incluida revocación posterior al encolado.
