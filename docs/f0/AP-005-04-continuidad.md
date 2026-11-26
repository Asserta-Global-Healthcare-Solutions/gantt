# AP-005 · 04 Copias de seguridad, restauración, RPO y RTO (propuesta)

Estado: **propuesta.** IT y Seguridad deciden los objetivos y la infraestructura (P-07, P-08). Nada se ha implementado ni ensayado todavía.

## 1. Objetivos propuestos
| Indicador | Piloto | v1 | Notas |
|---|---|---|---|
| RPO | ≤ 24 h | ≤ 4 h (propuesta) | Con WAL/PITR, si la infraestructura lo permite, se puede bajar a minutos |
| RTO | ≤ 8 h | ≤ 4 h | Desde la declaración del incidente hasta el servicio verificado |
| Disponibilidad | Horario laboral, sin compromiso formal | 99,5 % mensual en horario acordado (RNF-04) | Sin el ensayo AP-058 no hay compromiso |

## 2. Qué se respalda
| Elemento | Método propuesto | Frecuencia | Retención |
|---|---|---|---|
| PostgreSQL (DA-01..16) | `pg_dump` lógico cifrado y, si se puede, backup físico + WAL (PITR) | Diario (lógico); continuo (WAL) | 35 días diarios, 12 mensuales |
| Configuración no secreta | Infraestructura como código en el repositorio | Por cambio | Historial de git |
| Secretos | Los gestiona el gestor de secretos corporativo (no se copian en el backup de la app) | Según IT | Según IT |
| Almacén de objetos | **No se respalda**: exportaciones e importaciones son temporales (TTL de 24 h) | — | — |

**Cifrado y ubicación:** cifrado en reposo con claves gestionadas por IT; copia en una ubicación separada del servidor de BD (otra zona o cuenta), en la UE (RNF-02, P-06). Credenciales de backup distintas de las de la aplicación.

## 3. Procedimiento de restauración (borrador de runbook)
1. Declarar el incidente y congelar las escrituras: modo de solo lectura con aviso en la UI.
2. Elegir el punto de restauración (último backup válido o un PITR anterior al incidente).
3. Restaurar en un **entorno aislado**; ejecutar migraciones hasta la versión de la aplicación desplegada.
4. **Verificar:**
   - recuento por tabla frente al último inventario;
   - integridad referencial (constraints);
   - `revision` de los proyectos;
   - cadena de auditoría (hash por lote si se implementa);
   - muestra de recálculo del motor: el `inputHash` y el resultado coinciden con lo guardado.
5. Conmutar; revalidar sesiones (cerrarlas todas); reactivar los jobs **después** de reconciliar el outbox (dedupe por `eventId`).
6. Comunicar la pérdida de datos posible (ventana de RPO) e invitar a revisar los cambios recientes.
7. Registrar tiempos reales (RTO y RPO medidos) y lecciones aprendidas.

## 4. Ensayos
- **Antes del piloto (AP-058):** restauración completa en un entorno aislado, con tiempos medidos y conteos verificados.
- **Después:** restauración trimestral (RNF-05), alerta si falla un backup y prueba de que una copia de más de 35 días se purga.

## 5. Riesgos específicos
- Outbox y jobs duplicados tras restaurar → dedupe por `(eventId, channel, recipient)`.
- Revocaciones perdidas en la ventana de RPO (un acceso revocado vuelve a estar activo) → tras restaurar, Seguridad revisa los grants modificados en esa ventana (R-10).
- Tokens de Jira rotados después del backup → el token restaurado puede no ser válido; hay que reconectar (R-07).
