# AP-005 · Threat model y decisiones ENS — resumen

| Campo | Valor |
|---|---|
| Estado | **En revisión.** Revisión técnica pendiente; las aprobaciones de Seguridad, DPD, IT, Finanzas y Dirección se registran como **PENDIENTES** (ninguna se da por obtenida) |
| Rama | `feat/AP-005-threat-model` |
| Autorización | Ejecución en paralelo a la aprobación visual de AP-002a (instrucción del responsable técnico, 2026-11-26) |
| Cumplimiento ENS | **No se declara cumplimiento ni certificación ENS.** Matriz preliminar de diseño (categoría objetivo MEDIA) que debe cotejar y aprobar Seguridad |
| Estado | **En revisión.** Revisión técnica pendiente; las aprobaciones de Seguridad, DPD, IT, Finanzas y Dirección se registran como pendientes (no se dan por obtenidas) |
| Rama | `feat/AP-005-threat-model` |
| Autorización | Ejecución en paralelo a la aprobación visual de AP-002a (instrucción del responsable técnico, 2026-11-26) |
| Cumplimiento ENS | **No se declara.** Matriz preliminar que debe cotejar y aprobar Seguridad |

## Documentos
| Nº | Documento | Cubre |
|---|---|---|
| 01 | [Activos, clasificación y conservación](AP-005-01-activos-datos.md) | Inventario y clasificación de activos (`DA-01..19`, `SV-01..12`, incluyendo `DA-18` `user_preference`/`user_view_preference` de RF-34), conservación diferenciada propuesta, exclusión clínica e incidentes por entrada accidental, protección de datos económicos |
| 02 | [Flujos, límites y amenazas](AP-005-02-modelo-amenazas.md) | DFD, límites de confianza, matriz de escaladas (`EP-01..11`), Entra ID sin dependencia de CAE, sesiones opacas revocables y Graph, Teams (tenant-restricted vs `Anyone`), Jira, separación auditoría seguridad vs historial funcional (`RF-33`), STRIDE |
| 03 | [Controles ENS y ASVS](AP-005-03-controles-ens.md) | Matriz preliminar ENS (RD 311/2022 Anexo II, categoría MEDIA, dimensiones C/I/D/A/T, refuerzos aplicables y aportación D/P/E) y correspondencia exacta con los 17 capítulos de OWASP ASVS 5.0.0 (`V1..V17`) |
| 04 | [Continuidad](AP-005-04-continuidad.md) | Backups automáticos cifrados, PITR, objetivos provisionales **RPO ≤ 4 h** y **RTO ≤ 8 h**, procedimiento de restauración y pruebas trimestrales con evidencias formales |
| 05 | [Riesgos y pruebas](AP-005-05-riesgos-pruebas.md) | Riesgos residuales `R-01..14`, matriz de bloqueo (Gate F0 / `AP-006` / F1 vs fases posteriores), responsables de aprobación, casos de prueba de seguridad `ST-01..23` |

## Hechos verificados en fuentes oficiales (26-11-2026)
| Hecho | Fuente oficial | Estado |
|---|---|---|
| Catálogo del Anexo II del ENS (73 medidas, denominaciones oficiales en RD 311/2022, reordenación de `op.exp.10` a *Protección de claves criptográficas*, dimensiones afectadas y aplicabilidad general en categoría MEDIA) | BOE-A-2022-7191 (Real Decreto 311/2022, de 3 de mayo, texto consolidado) | Denominaciones y aplicabilidad general verificadas; **el detalle exhaustivo de cada refuerzo (`R1..R5`) por medida debe cotejarse sobre el PDF oficial del BOE y CCN-STIC 804 antes de la Declaración de Aplicabilidad** (`R-13`) |
| OWASP ASVS 5.0.0: versión estable publicada el 30-05-2025, estructurada en 17 capítulos exactos (`V1` a `V17`, incluyendo `V17 WebRTC`) | OWASP (`asvs.owasp.org`) | Confirmado |
| *Assignment required* (`appRoleAssignmentRequired`) limita el inicio de sesión a usuarios/grupos asignados (incluido OIDC) | Microsoft Learn («Manage user assignment for an app») | Confirmado |
| ID token: 1 h por defecto; access token: 60–90 min | Microsoft Learn («Microsoft identity platform ID tokens / access tokens») | Confirmado |
| Continuous Access Evaluation (CAE): opera mediante tokens Bearer con capacidad `cp1` y desafíos `401 WWW-Authenticate` entre clientes y APIs habilitadas para CAE; **no revoca automáticamente cookies de sesión propias** gestionadas por una aplicación web de terceros | Microsoft Learn («Continuous access evaluation», «How to use Continuous Access Evaluation enabled APIs») | Confirmado → **no se confía en CAE** para sesiones propias de la webapp (`R-03`) |
| Microsoft Graph `GET /users/{id}`: requiere `$select` explícito para devolver `accountEnabled` y `signInSessionsValidFromDateTime`. `User.ReadBasic.All` soporta aplicación para perfil básico, pero `signInSessionsValidFromDateTime` requiere **`User.Read.All` (Aplicación)** con consentimiento de administrador. Sujeto a *throttling* (`429` + `Retry-After`); sin *push* instantáneo salvo *change notifications* (`/subscriptions`, cuotas: 100/app/tenant, 1.000/tenant) | Microsoft Learn («Get user», «Microsoft Graph permissions reference», «Change notifications», «Throttling limits») | Confirmado |
| Teams Workflows / Power Automate: el disparador de webhook ofrece 3 modos: `Anyone` (URL con firma SAS `&sig=`, sin cabecera `Authorization`), `Any user in my tenant` y `Specific users in my tenant` (**sin firma SAS**; requieren `Authorization: Bearer` de Entra ID con `aud` = `https://service.flow.microsoft.com/`). En el disparador HTTP general de Power Automate se admite Service Principal (*Client Credentials*, scope `https://service.flow.microsoft.com//.default` y Object ID del SP en *Allowed users*) | Microsoft Learn («Add OAuth authentication for HTTP request triggers», «Microsoft Teams connectors») | **Parcialmente confirmado con matiz crítico:** el disparador específico «When a Teams webhook request is received» presenta limitaciones reportadas en campo con tokens *app-only* (Client Credentials) bajo *Specific users* (espera contexto de usuario/UPN). Requiere PoC en el tenant corporativo antes de `AP-046` (`P-22`) |
| Jira Cloud OAuth 2.0 (3LO): scope `read:jira-work` (clásico) o `read:issue:jira` (granular) + `offline_access`; *refresh tokens* rotatorios (90 días de inactividad, 10 min de ventana de reutilización) | Atlassian Developer (`developer.atlassian.com`) | Confirmado |

## Condiciones de bloqueo — resumen ejecutivo
El desglose completo por decisión y ticket está en [AP-005-05 §2](AP-005-05-riesgos-pruebas.md#2-condiciones-de-bloqueo-gate-f0--ap-006--f1-vs-fases-posteriores).

- **Bloquean Gate F0 / `AP-006` / entrada a F1:**
  1. Revisión técnica de `AP-005` (Responsable técnico).
  2. Confirmación de categoría ENS objetivo de diseño (`P-05`, Seguridad — solo bloquea arquitectura en `AP-006` si cambia de MEDIA a ALTA).
  3. Ratificación de principios de privacidad y exclusión de datos clínicos/motivo médico (`P-06` base, DPD — antes de congelar el modelo de datos en `AP-006`).
  4. Definición de infraestructura/hosting en UE y gestión de secretos (`P-08` base, IT — condiciona `AP-006` y `AP-007`).
- **NO bloquean F0 ni F1 (bloquean solo los tickets/fases indicados):**
  - `AP-009` (Entra ID y sesiones): `P-09`, `P-32`, `P-33`, `P-37`.
  - `AP-011b` (break-glass): `P-15`.
  - `AP-012` (auditoría encadenada): `P-34`.
  - `AP-040` (retención contable y datos económicos): aprobación de Finanzas y Dirección (`DA-06`, `R-05`).
  - `AP-046` / `AP-047` (Teams saliente): `P-22` (modo tenant, PoC Service Principal, prohibición de `Anyone` salvo aceptación IT+Seguridad).
  - `AP-048` / `AP-049` (Jira Cloud lectura): `P-21`.
  - `AP-053` (endurecimiento/despliegue): `P-08` detalle final y cotejo formal de refuerzos ENS (`P-05`, `R-13`).
  - `AP-057` / `AP-058` (piloto y ensayo de continuidad): `P-07` / `P-36` (RPO ≤ 4 h, RTO ≤ 8 h, PITR), `P-06` / `P-35` (plazos definitivos de conservación, anonimización y procedimiento de sanitización).

## Impacto en el resto de la especificación (propuestas para el coordinador, sin aplicar fuera de AP-005)
- **Sin contradicciones materiales con AP-004.** Se mantienen `ST-22` (CH-10) y se incorpora `ST-23` para `RF-34` (`user_preference` / `user_view_preference`, trazada a `AT-24` / `AP-015b`).
- **Decisiones pendientes a registrar/actualizar en `AP-001-05`:**
  - `P-32` (actualizada): sesión opaca revocable en servidor — máximo absoluto **8 h**, inactividad **30 min** (IT + Seguridad).
  - `P-33` (actualizada): detección de bajas/deshabilitación en Entra ID (**objetivo ≤ 15 min**) y consentimiento de permiso de aplicación Graph `User.Read.All` (IT + Seguridad).
  - `P-34` (mantenida): encadenado de hashes diarios de auditoría y exportación protegida (Seguridad + IT).
  - `P-35` (actualizada): política diferenciada de conservación, anonimización tras baja de usuarios y procedimiento auditado de sanitización por entrada accidental de datos sensibles (DPD + Seguridad).
  - `P-36` (actualizada): objetivos provisionales de continuidad **RPO ≤ 4 h** y **RTO ≤ 8 h**, PITR si infraestructura lo permite y pruebas trimestrales (IT + Seguridad, complementa `P-07`).
  - `P-37` (nueva): comportamiento ante indisponibilidad de Microsoft Graph durante la revalidación periódica — fail-open acotado con ventana máxima y alerta vs fail-closed estricto (Seguridad + IT).
  - Actualización de alcance en `P-22` (Teams: priorizar autenticación de tenant, PoC Service Principal, prohibir `Anyone` sin aceptación expresa de IT + Seguridad) y en `P-05` (cotejo de refuerzos exactos ENS en BOE/CCN-STIC 804).
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
