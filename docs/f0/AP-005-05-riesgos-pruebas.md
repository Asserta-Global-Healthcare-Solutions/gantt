# AP-005 · 05 Riesgos residuales, bloqueos, aprobaciones y pruebas de seguridad

## 1. Registro de riesgos residuales (tras controles propuestos)
Probabilidad (P) e impacto (I): B / M / A. **Ningún riesgo está aceptado todavía:** cada uno requiere decisión explícita de aceptación, mitigación adicional o rechazo por su responsable.

| ID | Riesgo residual | P | I | Mitigación propuesta | Aprueba / acepta |
|---|---|---|---|---|---|
| R-01 | Un administrador con acceso a PostgreSQL o al gestor de secretos lee contenido restringido o económico eludiendo la app | B | A | Mínimo privilegio, acceso a producción mediante break-glass de infraestructura, auditoría de BD, cifrado | Seguridad + IT |
| R-02 | Abuso del break-glass aplicativo (aprobador cómplice) | B | M | Caducidad corta (8 h defecto / 72 h máx.), aprobador distinto, notificación al owner y Seguridad, revisión mensual | Seguridad (`P-15`) |
| R-03 | Baja o deshabilitación en Entra ID no reflejada hasta la siguiente revalidación (objetivo ≤ 15 min) o caída temporal de Microsoft Graph; **CAE no revoca cookies de sesión propias** | M | M | Sesiones opacas revocables en servidor (8 h / 30 min), revocación total por usuario, desactivación local inmediata, revalidación Graph ≤ 15 min y política ante caída de Graph (`P-33`, `P-37`) | Seguridad + IT (`P-09`, `P-33`, `P-37`) |
| R-04 | XSS almacenado vía comentarios, nombres o metadatos de Jira | B | A | Texto plano o Markdown saneado sin HTML crudo, CSP estricta sin `unsafe-inline`, `ST-17` | Responsable técnico |
| R-05 | Fuga por exportación (fichero descargado fuera del control de la app) | M | M | Permiso `project.export`, filtrado de columnas económicas sin `financial.read`, auditoría en `DA-10` con número de filas, TTL 24 h | Dirección + Seguridad + Finanzas |
| R-06 | El flujo de Teams depende de su propietario/licencia o falla la autenticación Service Principal en el disparador nativo de Teams; si se autorizara excepcionalmente `Anyone`, filtrar la URL SAS permitiría inyectar mensajes al canal | M | B | Priorizar OAuth restringido al tenant + PoC en tenant corporativo; cuenta de servicio con co-owners; **prohibir `Anyone`** salvo aceptación expresa IT+Seguridad; allowlist SSRF y rotación | IT + Seguridad (`P-22`) |
| R-07 | Pérdida del refresh token rotatorio de Jira (rotación no persistida o restauración de backup) | M | B | Persistencia atómica en transacción, alerta y reconexión guiada | IT / propietario Jira (`P-21`) |
| R-08 | Introducción accidental de datos clínicos, de pacientes o de terceros en campos de texto libre | M | A | Exclusión de diseño (sin motivo médico libre, `reasonCode` cerrado), avisos en UI, formación y procedimiento auditado de sanitización (`01 §6`); **sin DLP automático en v1** | DPD (`P-06`, `P-35`) |
| R-09 | Cadena de suministro (dependencia o GitHub Action comprometida) | B | A | Lockfile, antigüedad mínima de paquetes, SCA, SBOM, pin por SHA, revisión humana | Responsable técnico |
| R-10 | Restauración de backup reactiva permisos o accesos revocados dentro de la ventana RPO (≤ 4 h) | B | M | Revocación total de sesiones y revisión obligatoria de grants/bajas tras restaurar (`04 §5`, `ST-21`) | Seguridad (`P-07`, `P-36`) |
| R-11 | Denegación de servicio por recálculos o importaciones masivas | M | M | Límites de grafo e importación (10 MB / 10.000 filas), rate limit, jobs en cola y DDoS perimetral IT | IT |
| R-12 | La vista previa local diverge del servidor y el usuario confía en ella | B | M | Servidor siempre recalcula con autoridad (`CH-10`), `preview_mismatch` monitorizado y alerta | Responsable técnico |
| R-13 | Detalle de refuerzos ENS (`R1..R5`) por medida pendiente de cotejo formal sobre el PDF BOE-A-2022-7191 y CCN-STIC 804 | M | M | Denominaciones y aplicabilidad general ya cotejadas (`03`); Seguridad valida refuerzos exactos y DdA antes de piloto/producción | Seguridad (`P-05`) |
| R-14 | Historial y auditoría conservan identificadores de usuarios dados de baja más allá de lo necesario | B | M | Borrado rápido de preferencias (`DA-18`), anonimización programada del perfil visible y conservación mínima de auditoría sujeta a dictamen DPD (`01 §4`) | DPD (`P-06`, `P-35`) |

## 2. Condiciones de bloqueo: Gate F0 / `AP-006` / F1 vs fases posteriores

Para no bloquear innecesariamente el arranque técnico de funcionalidades independientes, se separan explícitamente los bloqueos por hito:

### A. Decisiones que SÍ bloquean Gate F0 / `AP-006` / entrada a F1
| Bloqueo | Decisión / Elemento | Responsable | Por qué bloquea F0 / `AP-006` / F1 |
|---|---|---|---|
| **B-F0-1** | Revisión técnica del paquete `AP-005` | Responsable técnico | Cierre técnico del entregable `AP-005` para Gate F0 |
| **B-F0-2** | Categoría ENS objetivo de diseño (`P-05` base) | Seguridad | Si cambia de MEDIA a ALTA altera requisitos estructurales de `AP-006` (p. ej. `op.cont.2..4` obligatorias, refuerzos criptográficos) |
| **B-F0-3** | Exclusión clínica y ausencia de campos médicos (`P-06` base) | DPD | Condiciona el modelo de datos inmutable (`DA-08`, `DA-09`, `DA-18`) que se congela en `AP-006` |
| **B-F0-4** | Modelo de hosting/infraestructura UE y gestor de secretos (`P-08` base) | IT | Condiciona arquitectura de despliegue, red, backups PITR y configuración base en `AP-006` / `AP-007` |

### B. Decisiones que NO bloquean F0/F1 y solo bloquean fases o tickets posteriores
| Ticket / Fase bloqueada | Decisiones pendientes | Responsable | Qué puede avanzar sin esperar |
|---|---|---|---|
| **`AP-009`** (Auth Entra ID y sesiones) | `P-09` (registro Entra, assignment required, invitados, MFA), `P-32` (8 h / 30 min), `P-33` (revalidación ≤ 15 min y permiso Graph `User.Read.All`), `P-37` (política ante caída de Graph) | IT + Seguridad | Scaffolding (`AP-007`), esquema de BD base, motor de scheduling puro (`AP-004` / F2) |
| **`AP-011b`** (Break-glass) | `P-15` (caducidad, aprobación dual, `R-02`) | Seguridad | Autorización base `AP-011a` y CRUD core |
| **`AP-012`** (Auditoría reforzada) | `P-34` (encadenado diario de hashes y exportación externa) | Seguridad + IT | Registro append-only base `DA-10` e historial funcional `RF-33` |
| **`AP-040`** (Módulo económico y costes) | Política contable de retención económica y aceptación de `DA-06` / `R-05` | Finanzas + Dirección | Planificación, Gantt, horas base y vistas sin costes |
| **`AP-046` / `AP-047`** (Teams saliente) | `P-22` (modo tenant-restricted, PoC Service Principal, prohibición de `Anyone` salvo aceptación expresa `R-06`, co-owners) | IT + Seguridad | Toda la webapp core y bandeja in-app |
| **`AP-048` / `AP-049`** (Jira Cloud solo lectura) | `P-21` (scopes `read:jira-work`/`read:issue:jira`, rotación de refresh token, `R-07`) | IT + Propietario Jira | Toda la webapp core sin integraciones |
| **`AP-053`** (Despliegue y endurecimiento) | `P-08` detalle final (WAF/IDS, TLS, segmentación) y cotejo final de refuerzos ENS/DdA (`P-05`, `R-13`) | IT + Seguridad | Desarrollo completo en dev/preprod |
| **`AP-057` / `AP-058`** (Piloto y continuidad) | `P-07` / `P-36` (RPO ≤ 4 h, RTO ≤ 8 h, PITR, pruebas trimestrales, `R-10`), `P-06` / `P-35` (plazos finales de conservación, anonimización `R-14`, sanitización `R-08`) | IT + Seguridad + DPD | Desarrollo e integración previa al paso a piloto |

## 3. Estado de aprobaciones de AP-005 (todas PENDIENTES)
| Elemento | Aprueba | Estado |
|---|---|---|
| Revisión técnica del threat model y pruebas `ST-01..23` | Responsable técnico | **Pendiente** |
| Clasificación de activos, categoría ENS, matriz/refuerzos (`R-13`) | Responsable de Seguridad (`P-05`) | **Pendiente** |
| Conservación diferenciada, privacidad, `DA-18`, `R-08`, `R-14` | DPD (`P-06`, `P-35`) | **Pendiente** |
| RPO ≤ 4 h, RTO ≤ 8 h, PITR, backups, infraestructura | IT + Seguridad (`P-07`, `P-08`, `P-36`) | **Pendiente** |
| Entra ID, sesiones (8 h/30 min), Graph `User.Read.All` (≤ 15 min) y caída Graph (`R-03`) | IT + Seguridad (`P-09`, `P-32`, `P-33`, `P-37`) | **Pendiente** |
| Break-glass (`P-15`), `R-01`, `R-02`, `R-10`, hash auditoría (`P-34`) | Responsable de Seguridad | **Pendiente** |
| Teams (`R-06`, prohibición `Anyone`) y Jira (`R-07`) | IT, Seguridad y propietario Jira (`P-21`, `P-22`) | **Pendiente** |
| Datos económicos (`01 §5`), retención contable, `R-05` | Dirección + Finanzas | **Pendiente** |

## 4. Casos de prueba de seguridad (`ST-01..23`)
Cada caso se implementa en el ticket indicado y se reejecuta en `AP-057` (piloto) y `AP-051` (v1). «Negativa» indica que el resultado esperado es denegación.

| ID | Caso (dado / cuando / entonces) | Tipo | Ticket | Trazabilidad |
|---|---|---|---|---|
| ST-01 | Usuario sin acceso pide por UUID un proyecto, tarea, historial, exportación, job o SSE → `404`, sin datos ni temporización distinguible | Negativa, integración | `AP-011a` | `EP-04`, `EP-09`, `RF-13`, `AT-15` |
| ST-02 | Token de otro tenant, `aud` incorrecto, `nonce` repetido, firma alterada o usuario sin asignación → login denegado y auditado en `DA-10` | Negativa | `AP-009` | `op.acc.1/6`, `RF-01`, ASVS V6/V9/V10 |
| ST-03 | Sesión opaca: cookie sin `Secure`/`HttpOnly`/`__Host-` → fallo de build; fijación → ID rotado al iniciar sesión; inactividad 30 min y máximo absoluto 8 h; revocación masiva de todas las sesiones del usuario; detección `accountEnabled=false` / `signInSessionsValidFromDateTime` y política ante fallo Graph (`P-37`) | Integración, E2E | `AP-009` | `02 §4-5`, `P-32`, `P-33`, `P-37`, ASVS V7 |
| ST-04 | Admin se concede a sí mismo `project.read` en un proyecto restringido → `403` y evento; inserción directa → CHECK BD la rechaza | Negativa, BD | `AP-011b` | `EP-01`, `D-16`, `AT-21` |
| ST-05 | Admin se añade a un equipo con grants → queda pendiente de un segundo aprobador | Negativa | `AP-011b` | `EP-02` |
| ST-06 | Manager concede `financial.read` sin tenerlo → `403` | Negativa | `AP-011b` | `EP-03` |
| ST-07 | Revocar acceso o desactivar usuario con exportación encolada, descarga pendiente y SSE abierto → el job falla por autorización, la descarga devuelve `404` y SSE se corta | Negativa, integración | `AP-029`, `AP-044` | `EP-06` |
| ST-08 | Break-glass: aprobado por el solicitante → rechazado; aprobado por tercero → caduca a su hora; notificación al owner y Seguridad | Negativa | `AP-011b` | `EP-07`, `P-15` |
| ST-09 | Usuario sin `financial.read` → tareas, historial funcional (`RF-33`), exportación, plantillas y notificaciones omiten campos económicos en servidor | Negativa | `AP-011a`, `AP-056`, `AP-044` | `EP-05`, `01 §5`, `RF-33` |
| ST-10 | Coste: modificación de entrada aprobada → `409`/`422`; cambio de tarifa no altera registros históricos aprobados | Integración | `AP-040` | `DA-06`, `AT-09` |
| ST-11 | Eliminar al último owner o último administrador → rechazado | Negativa | `AP-010`, `AP-013` | `EP-08` |
| ST-12 | Instanciar plantilla → sin miembros, grants, horas, costes ni secretos | Integración | `AP-033` | `EP-10`, `RF-27` |
| ST-13 | Auditoría `DA-10` vs historial `RF-33`: rollback no deja evento de éxito; la cuenta BD de app no puede hacer `UPDATE` ni `DELETE` en `DA-10`; `project.read` no accede a `DA-10` (requiere `audit.read`); campos obligatorios presentes y sin secretos/tokens/cookies | Negativa, integración, BD | `AP-012` | `op.exp.8`, `RF-14`, `RF-33`, ASVS V16 |
| ST-14 | Importar XLSX con macros, fórmulas, ZIP bomb, 10 MB + 1 byte o MIME falso → rechazo sin escritura | Negativa | `AP-042` | `op.exp.6`, `AT-10`, ASVS V5 |
| ST-15 | Teams: webhook hacia host fuera de allowlist, IP privada/loopback/metadatos o con redirección → bloqueado (SSRF); URL anónima (`Anyone`) rechazada salvo bandera de excepción autorizada; envío de proyecto restringido a canal no validado → bloqueado; reintentos + DLQ verificados | Negativa, integración | `AP-046`, `AP-047` | `op.ext.4`, `P-22`, `R-06` |
| ST-16 | Jira: token con scopes de escritura → configuración rechazada; pérdida de acceso → purga de metadatos; `429` → `Retry-After`; rotación atómica de refresh token | Integración (simulador) | `AP-048`, `AP-049` | `D-17`, `AT-14`, `R-07` |
| ST-17 | Payloads XSS en nombre, comentario y resumen de Jira; CSV injection (`=`, `+`, `-`, `@`) en exportación → escapados o neutralizados | Negativa | `AP-030`, `AP-026` | `R-04`, `mp.info.5`, ASVS V1 |
| ST-18 | Rate limit: ráfaga de previews/commits e importación masiva → `429` sin degradar a otros usuarios | Carga | `AP-052` | `R-11`, `mp.s.4` |
| ST-19 | Cabeceras: CSP sin `unsafe-inline` en scripts, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors 'none'` | Automatizada | `AP-057` | `mp.s.2`, ASVS V3/V12/V13 |
| ST-20 | Secretos: secret scanning en CI, logs y auditoría sin tokens, cookies, URLs SAS ni contraseñas | CI | `AP-007` | `op.exp.10`, ASVS V13/V16 |
| ST-21 | Restauración: prueba en entorno aislado verifica conteos, constraints, revisiones, `inputHash`, tiempos reales ≤ RPO 4 h / RTO 8 h, revocación de sesiones y revisión de grants revocados en ventana RPO | Ensayo | `AP-058` | `04`, `R-10`, `mp.info.6` |
| ST-22 | Vista previa local con `engineVersion` distinta se desactiva; discrepancia cliente/servidor → prevalece el servidor y se registra métrica `preview_mismatch` | Integración | `AP-021`, `AP-023` | `R-12`, `D-09`, `CH-10` |
| ST-23 | Preferencias de usuario y vista (`RF-34`, `DA-18`): leer, modificar o resetear `user_preference` o `user_view_preference` de otro usuario (incluyendo como `platform.admin`) → denegado (`403`/`404`); pedir o guardar `user_view_preference` sobre un `projectId` sin acceso → `404` sin oráculo; enviar claves/columnas arbitrarias, orden no permitido o `schemaVersion` inválido → `400` rechazado (sin persistencia KV arbitraria) | Negativa, integración | `AP-015b` | `RF-34`, `AT-24`, `EP-11`, `DA-18`, ASVS V2/V8 |
