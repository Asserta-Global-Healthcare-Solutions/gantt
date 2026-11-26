# AP-005 · Threat model y decisiones ENS — resumen

| Campo | Valor |
|---|---|
| Estado | **En revisión.** Revisión técnica pendiente; las aprobaciones de Seguridad, DPD, IT, Finanzas y Dirección se registran como pendientes (no se dan por obtenidas) |
| Rama | `feat/AP-005-threat-model` |
| Autorización | Ejecución en paralelo a la aprobación visual de AP-002a (instrucción del responsable técnico, 2026-11-26) |
| Cumplimiento ENS | **No se declara.** Matriz preliminar que debe cotejar y aprobar Seguridad |

## Documentos
| Nº | Documento | Cubre |
|---|---|---|
| 01 | [Activos, clasificación y conservación](AP-005-01-activos-datos.md) | Inventario y clasificación de activos (DA/SV), política de conservación propuesta, protección de datos económicos |
| 02 | [Flujos, límites y amenazas](AP-005-02-modelo-amenazas.md) | DFD, límites de confianza, matriz de permisos y escaladas (EP-01..10), Entra ID, sesiones, Teams, Jira, auditoría, STRIDE |
| 03 | [Controles ENS y ASVS](AP-005-03-controles-ens.md) | Matriz preliminar de categoría media (aportación D/P/E), correspondencia con ASVS 5.0 L2 |
| 04 | [Continuidad](AP-005-04-continuidad.md) | Backups, restauración, RPO y RTO propuestos, ensayos |
| 05 | [Riesgos y pruebas](AP-005-05-riesgos-pruebas.md) | Riesgos residuales R-01..14, responsables de aprobación, casos de prueba ST-01..22 |

## Hechos verificados en fuentes oficiales (26-11-2026)
| Hecho | Fuente | Estado |
|---|---|---|
| Medidas del Anexo II (códigos org, op.pl, op.acc.1–6, op.exp.1–10, op.ext.1–4, op.nub.1, op.cont.1–4, op.mon.1–3, mp.com.1–4, mp.sw.1–2, mp.info.1–6, mp.s.1–4) | BOE-A-2022-7191, texto consolidado | Códigos confirmados en el índice; **títulos completos y aplicabilidad a MEDIA solo verificados en parte** → cotejar con el PDF (R-13) |
| ASVS 5.0.0, estable, 30-05-2025 | asvs.owasp.org | Confirmado |
| *Assignment required* limita el inicio de sesión a usuarios y grupos asignados (también OIDC) | Microsoft Learn, «what-is-access-management» | Confirmado |
| ID token de 1 h; access token de 60–90 min | Microsoft Learn, «id-tokens», «access-tokens» | Confirmado |
| CAE aplicable a la sesión propia de una aplicación web de terceros | — | **No confirmado** (página no accesible) → R-03 |
| Modos de autenticación del disparador de webhook de Teams Workflows: Anyone / Any user in my tenant / Specific users | Microsoft Learn, conector de Teams | Confirmado; que la URL lleve una firma SAS **no** está confirmado |
| Jira 3LO: scope `read:jira-work`; refresh tokens rotatorios (90 días de inactividad, 10 min de reutilización); `offline_access` | developer.atlassian.com | Confirmado |

## Impacto en el resto de la especificación (propuestas, sin aplicar)
- **Sin contradicciones materiales con el contrato AP-004.** Solo se añade la prueba ST-22, ya cubierta por CH-10.
- **Nuevos requisitos de prueba:** ST-01..22 enlazan con tickets existentes de F1–F6 y con AP-057 y AP-058 (CH-14).
- **Decisiones que se suman a las pendientes:**
  - inactividad de sesión de 30 min;
  - revalidación de identidad cada 15 min;
  - encadenado de hashes de auditoría;
  - anonimización de usuarios dados de baja;
  - RPO de 4 h en la v1.

  Se proponen a Seguridad, IT y DPD; se registran en [AP-001-05](AP-001-05-decisiones-pendientes.md) como P-32..P-36.
