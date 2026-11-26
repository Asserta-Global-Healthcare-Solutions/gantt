# AP-005 · 04 Copias de seguridad, restauración, RPO y RTO (propuesta)

Estado: **propuesta pendiente de aprobación.** IT y Seguridad aprueban los objetivos definitivos y la infraestructura (`P-07`, `P-08`, `P-36`). Nada se ha implementado ni ensayado todavía.

## 1. Objetivos provisionales propuestos (`P-07`, `P-36`)

| Indicador | Objetivo provisional | Notas |
|---|---|---|
| **RPO máximo** | **≤ 4 horas** | Con archivado continuo de WAL / PITR de PostgreSQL (cuando la infraestructura lo permita) el RPO efectivo puede reducirse a minutos |
| **RTO máximo** | **≤ 8 horas** | Medido desde la declaración formal del incidente hasta la verificación funcional y de seguridad del servicio restaurado |
| Disponibilidad | 99,5 % mensual en horario laboral acordado (`RNF-04`) | Sin compromiso formal en producción hasta completar el ensayo `AP-058` |

## 2. Qué se respalda y protección de copias

| Elemento | Método propuesto | Frecuencia | Retención propuesta (`P-06`) |
|---|---|---|---|
| PostgreSQL (`DA-01..16`, `DA-18`) | Backup automático cifrado (físico + archivado WAL para **PITR** cuando la infraestructura lo permita; complemento lógico `pg_dump` cifrado) | Automático continuo (WAL/PITR) o incremental ≤ 4 h + copia diaria completa | 35 días diarios, 12 mensuales |
| Configuración no secreta | Infraestructura como código en repositorio git | Por cambio | Historial de git |
| Secretos (`DA-11`) | Custodiados en el gestor de secretos corporativo (`SV-07`); **no** se incluyen en backups de aplicación | Según política IT | Según política IT |
| Almacén de objetos (`SV-06`) | **No se respalda**: exportaciones y staging son temporales (TTL 24 h) | — | — |

**Controles obligatorios sobre copias de seguridad:**
- **Ejecución automática** con monitorización y alerta inmediata ante fallo o retraso de copia (`op.mon.3`).
- **Cifrado en reposo** con claves gestionadas por IT (separadas del almacenamiento de copias).
- **Credenciales separadas:** la cuenta/identidad de backup y restauración es independiente de la cuenta ordinaria de PostgreSQL de la aplicación (que no puede leer ni borrar copias).
- **Copia fuera del servidor primario en la UE:** almacenamiento redundante en otra zona, cuenta o repositorio aislado dentro de la Unión Europea (`RNF-02`, `P-08`, `mp.info.6`).
- **Recuperación puntual (PITR):** habilitada mediante archivado WAL de PostgreSQL siempre que el servicio gestionado o la infraestructura elegida en `P-08` lo soporte, para recuperarse ante borrados lógicos o corrupción sin perder hasta 4 h de cambios.

## 3. Procedimiento de restauración (borrador de runbook)
1. Declarar el incidente y congelar escrituras (modo mantenimiento / solo lectura con aviso en UI).
2. Seleccionar el punto de restauración (timestamp PITR inmediatamente anterior al incidente o último backup íntegro dentro de la ventana RPO ≤ 4 h).
3. Restaurar en un **entorno aislado** y verificar la versión de esquema/migraciones frente a la aplicación desplegada.
4. **Verificación formal de integridad antes de abrir tráfico:**
   - recuento de filas por tabla crítica frente al último inventario de métricas;
   - integridad referencial y *constraints* (incluidos CHECK de `D-16` y exclusión de tarifas);
   - coherencia de `revision` en los proyectos activos;
   - integridad de la auditoría de seguridad `DA-10` (y verificación de cadena de hashes por lote si `P-34` está activo);
   - muestra de recálculo del motor (`SV-03`): el `inputHash` y el resultado recalculado coinciden con lo persistido.
5. **Seguridad post-restauración:** invalidar **todas** las sesiones activas en PostgreSQL (`DA-16`) y ejecutar la revisión de permisos revocados en la ventana RPO (§5, `R-10`).
6. Conmutar tráfico y reactivar jobs del worker **después** de reconciliar el outbox (deduplicación por `(eventId, channel, recipient)`).
7. Comunicar a los responsables la ventana real de posible pérdida de datos y registrar los **tiempos reales medidos de RPO y RTO** y las lecciones aprendidas.

## 4. Pruebas trimestrales de restauración y evidencias formales (`AP-058`, `RNF-05`)
- **Gate previo al piloto (`AP-058`):** primera restauración completa en entorno aislado, ejecutada y firmada antes de abrir el piloto.
- **Cadencia operativa:** **pruebas trimestrales obligatorias** (`mp.info.6 + R1`), además de comprobación de alertas por fallo de backup y verificación de purga de copias caducadas (> 35 días diarios).
- **Acta de evidencias formales requerida en cada prueba:**
  1. Fecha, responsable y punto de restauración elegido (backup completo o PITR).
  2. Tiempos reales medidos de **RPO** y **RTO** frente a los objetivos (≤ 4 h / ≤ 8 h).
  3. Evidencia de verificación de **conteos por tabla**, **constraints**, **revisiones** de proyecto y **muestra de `inputHash`** del motor.
  4. Evidencia de revocación total de sesiones y **revisión de grants/bajas modificados en la ventana RPO** (`R-10`).
  5. Incidencias detectadas y acciones correctivas con responsable y fecha.

## 5. Riesgos específicos de continuidad
- **Outbox y notificaciones duplicadas tras restaurar:** mitigado con deduplicación por `(eventId, channel, recipient)` y reactivación controlada del worker.
- **Resurrección de permisos revocados en la ventana RPO (`R-10`):** un grant o baja aplicado tras el último backup podría reaparecer al restaurar; es obligatoria la revisión por Seguridad de los cambios de permisos y bajas ocurridos durante la ventana RPO antes de reabrir acceso normal.
- **Refresh tokens de Jira rotados tras el backup (`R-07`):** el token restaurado puede haber sido invalidado por Atlassian; se dispara alerta operativa y reconexión guiada por el propietario del conector.
