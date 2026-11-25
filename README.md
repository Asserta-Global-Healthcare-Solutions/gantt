# Asserta Projects — kit de especificación v1.0

Fecha: 2026-11-25. Estado: alcance aprobado por el solicitante; diseño técnico propuesto, pendiente de ADR y PoC. No contiene código de aplicación ni credenciales.

## Orden de lectura
1. `docs/01-PRD.md`: objetivos, alcance, usuarios, flujos y UX.
2. `docs/02-REQUISITOS.md`: requisitos funcionales y no funcionales verificables.
3. `docs/03-ARQUITECTURA.md`: stack, componentes, contratos, despliegue e integraciones.
4. `docs/04-MOTOR-PLANIFICACION.md`: especificación normativa propuesta del motor.
5. `docs/05-MODELO-DATOS.md`: esquema lógico, invariantes y permisos.
6. `docs/06-BACKLOG.md` y `docs/backlog.csv`: tickets, dependencias, prioridades y criterios de aceptación.
7. `docs/07-TESTING-RELEASE.md`: pruebas, gates y operación.
8. `AGENTS.md`: reglas de trabajo de los agentes.
9. `docs/adr/0000-DECISIONES-PENDIENTES.md`: decisiones que requieren aprobación.
10. `docs/08-FUENTES.md`: referencias oficiales y límites de verificación.

## Arranque
Copiar estos archivos al repositorio corporativo propuesto `asserta-projects`. No iniciar código de producto hasta aprobar fase F0, contratos del motor, mockups y ADR obligatorios. Importar `backlog.csv` como borrador de backlog, no como tickets automáticamente creados. Cada requisito RF/RNF tiene al menos un ticket asociado. Las estimaciones y SLO son objetivos iniciales, no compromisos.

## Convenciones
- F0–F6: fases de ejecución; P0: imprescindible para piloto; P1: imprescindible para v1 completa; P2: fuera de esta versión.
- RF: requisito funcional; RNF: no funcional; AP-xxx: ticket; ADR: registro de decisión.
- Los criterios de aceptación son condiciones verificables, no evidencia de que ya se hayan ejecutado.
- Documentación interna de Asserta no verificada: el conector no estaba autorizado en la revisión previa. No se han creado repositorios, registros Entra, canales ni tickets reales.
