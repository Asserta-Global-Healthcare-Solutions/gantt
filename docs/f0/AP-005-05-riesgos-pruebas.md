# AP-005 · 05 Riesgos residuales, responsables de aprobación y casos de prueba de seguridad

## 1. Registro de riesgos (tras aplicar los controles propuestos)
Probabilidad (P) e impacto (I): B / M / A. **Ningún riesgo está aceptado:** cada uno tiene un responsable que debe aceptarlo, mitigarlo más o rechazar el diseño.

| ID | Riesgo residual | P | I | Mitigación propuesta | Aprueba / acepta |
|---|---|---|---|---|---|
| R-01 | Un administrador con acceso a la BD o al gestor de secretos lee contenido restringido o económico eludiendo la app | B | A | Mínimo privilegio, acceso a producción con break-glass de infraestructura, auditoría de BD, cifrado | Seguridad + IT |
| R-02 | Abuso del break-glass (aprobador cómplice) | B | M | Notificación al owner y a Seguridad, revisión mensual, caducidad corta | Seguridad (P-15) |
| R-03 | Revocación en Entra no reflejada hasta la revalidación (≤ 15 min propuestos); CAE no confirmada para la sesión propia | M | M | Revalidación periódica, desactivación local inmediata, ventana documentada | Seguridad + IT (P-09) |
| R-04 | XSS almacenado vía comentarios, nombres o metadatos de Jira | B | A | Texto plano o Markdown saneado, CSP estricta, ST-17 | Responsable técnico |
| R-05 | Fuga por exportación (fichero descargado fuera del control de la app) | M | M | Permiso `project.export`, columnas filtradas, auditoría con número de filas, sin costes por defecto | Dirección + Seguridad |
| R-06 | El flujo de Teams depende de su propietario o licencia; si la URL es de tipo «Anyone», su filtración permite enviar mensajes al canal | M | B | Cuenta de servicio con co-owners, modos de tenant si son viables, rotación de URL | IT (P-22) |
| R-07 | Pérdida del refresh token de Jira (rotación no persistida, restauración de backup) | M | B | Persistencia atómica del token rotado, alerta y reconexión guiada | IT / propietario de Jira (P-21) |
| R-08 | Usuarios introducen datos de salud o de terceros en texto libre (comentarios, motivos, nombres) | M | A | Aviso en la UI, formación, campos de motivo cerrados (`reasonCode`), revisión del DPD; detección automática **no** en v1 | DPD (P-06) |
| R-09 | Cadena de suministro (dependencia o acción comprometida) | B | A | Lockfile, versiones ≥ 2 semanas, SCA, SBOM, pin por SHA, revisión | Responsable técnico |
| R-10 | Restauración que reactiva permisos revocados en la ventana de RPO | B | M | Revisión de grants tras restaurar (04 §5) | Seguridad |
| R-11 | Denegación de servicio por recálculos o importaciones masivas | M | M | Límites de tamaño (1.000 tareas por proyecto como referencia), rate limit, jobs en cola | IT |
| R-12 | La vista previa local diverge del servidor y el usuario confía en ella | B | M | Siempre preview del servidor antes del commit, métrica `preview_mismatch` y alerta | Responsable técnico |
| R-13 | Mapa ENS preliminar con títulos o aplicabilidad no cotejados | M | M | Cotejo con el BOE y la guía del CCN antes de aprobar | Seguridad (P-05) |
| R-14 | Historial y auditoría conservan datos de usuarios dados de baja más allá de lo necesario | B | M | Anonimización programada del perfil visible (01 §4) | DPD (P-06) |

## 2. Responsables de aprobación de AP-005
| Elemento | Aprueba | Estado |
|---|---|---|
| Revisión técnica del threat model | Responsable técnico | Pendiente de revisión |
| Clasificación de activos, categoría ENS, matriz de controles (R-13) | Responsable de Seguridad (P-05) | Pendiente |
| Conservación, datos personales, R-08, R-14 | DPD (P-06) | Pendiente |
| RPO, RTO, backups, infraestructura | IT + Seguridad (P-07, P-08) | Pendiente |
| Break-glass (P-15), R-01, R-02, R-10 | Responsable de Seguridad | Pendiente |
| Teams y Jira (R-06, R-07) | IT y propietario de Jira (P-21, P-22) | Pendiente |
| Datos económicos (01 §5), R-05 | Dirección + Finanzas | Pendiente |

## 3. Casos de prueba de seguridad
Cada caso se implementa en el ticket indicado y se vuelve a ejecutar en AP-057 (piloto) y AP-051 (v1). «Negativa» indica que se espera denegación.

| ID | Caso (dado / cuando / entonces) | Tipo | Ticket | Trazabilidad |
|---|---|---|---|---|
| ST-01 | Usuario sin acceso pide por UUID un proyecto, tarea, historial, exportación, job o SSE → 404, sin datos ni temporización distinguible | Negativa, integración | AP-011a | EP-04, EP-09, RF-13, AT-15 |
| ST-02 | Token de otro tenant, `aud` incorrecto, `nonce` repetido, firma alterada, usuario sin asignación → login denegado y auditado | Negativa | AP-009 | op.acc.1/6, RF-01 |
| ST-03 | Sesión: cookie sin Secure/HttpOnly → fallo de build; fijación de sesión → ID rotado al iniciar sesión; inactividad y máximo de 8 h | Integración, E2E | AP-009 | 02 §5 |
| ST-04 | Admin se concede a sí mismo `project.read` en un proyecto restringido → 403 y evento; inserción directa → la CHECK lo rechaza | Negativa, BD | AP-011b | EP-01, D-16, AT-21 |
| ST-05 | Admin se añade a un equipo con grants → queda pendiente de un segundo aprobador | Negativa | AP-011b | EP-02 |
| ST-06 | Manager concede `financial.read` sin tenerlo → 403 | Negativa | AP-011b | EP-03 |
| ST-07 | Revocar el acceso con una exportación encolada, una descarga pendiente y SSE abierto → el job falla por autorización, la descarga devuelve 404 y SSE se corta | Negativa, integración | AP-029, AP-044 | EP-06 |
| ST-08 | Break-glass: aprobado por el mismo solicitante → rechazado; aprobado por un tercero → caduca a su hora; notificación al owner | Negativa | AP-011b | EP-07, P-15 |
| ST-09 | Usuario sin `financial.read` → tareas, historial, exportación, plantillas y notificaciones sin campos económicos | Negativa | AP-011a, AP-056, AP-044 | EP-05, 01 §5 |
| ST-10 | Coste: modificación de una entrada aprobada → 409/422; cambio de tarifa no altera el pasado | Integración | AP-040 | DA-06, AT-09 |
| ST-11 | Eliminar al último owner o administrador → rechazado | Negativa | AP-010, AP-013 | EP-08 |
| ST-12 | Instanciar una plantilla → sin miembros, grants, horas, costes ni secretos | Integración | AP-033 | EP-10 |
| ST-13 | Rollback de una transacción → sin evento de éxito; la cuenta de app no puede hacer UPDATE ni DELETE en auditoría | Integración, BD | AP-012 | op.exp.8, RF-14 |
| ST-14 | Importar XLSX con macros, fórmulas, ZIP bomb, 10 MB + 1 byte, MIME falso → rechazo sin escritura | Negativa | AP-042 | op.exp.6, AT-10 |
| ST-15 | Configurar el webhook de Teams hacia un host fuera de la allowlist, IP privada o con redirección → bloqueado (SSRF) | Negativa | AP-046 | op.ext.4 |
| ST-16 | Jira: token con scopes de escritura → configuración rechazada; pérdida de acceso → purga de metadatos; 429 → Retry-After | Integración (simulador) | AP-048, AP-049 | D-17, AT-14 |
| ST-17 | Payloads XSS en nombre, comentario y resumen de Jira; CSV injection (`=`, `+`, `-`, `@`) en la exportación → escapados o neutralizados | Negativa | AP-030, AP-026 | R-04, mp.info.5 |
| ST-18 | Rate limit: ráfaga de previews y commits, importación masiva → 429 sin degradar a otros usuarios | Carga | AP-052 | R-11, mp.s.4 |
| ST-19 | Cabeceras: CSP sin `unsafe-inline` en scripts, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors 'none'` | Automatizada | AP-057 | mp.s.2 |
| ST-20 | Secretos: secret scanning en CI, logs sin tokens ni cookies (búsqueda de patrones en los logs de prueba) | CI | AP-007 | op.exp.10 |
| ST-21 | Restauración: los conteos, las revisiones y el `inputHash` coinciden; los grants revocados en la ventana se revisan | Ensayo | AP-058 | 04, R-10 |
| ST-22 | La vista previa del cliente con `engineVersion` distinta se desactiva; diferencia entre cliente y servidor → gana el servidor y se registra la métrica | Integración | AP-021, AP-023 | R-12, D-09 |
