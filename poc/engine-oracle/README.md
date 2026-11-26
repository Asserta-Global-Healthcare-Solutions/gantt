# Oráculo del motor (AP-004) — DESECHABLE

**No es el motor de producto** ni debe importarse desde `apps/` o `packages/`. Existe solo para verificar el contrato [docs/f0/AP-004-contrato-motor.md](../../docs/f0/AP-004-contrato-motor.md) y los casos dorados de [docs/f0/fixtures/engine/](../../docs/f0/fixtures/engine/).

- Sin dependencias: Node ≥ 24 y `node:test`.
- Usa algoritmos deliberadamente distintos de los del contrato:
  - calendario recorrido día a día;
  - relajación hasta punto fijo frente a Kahn;
  - holgura semántica (simulación sobre el subgrafo) frente a la recurrencia hacia atrás.

```sh
npm test                                          # casos dorados + propiedades (400 grafos por propiedad)
CASES=5000 node --test test/properties.test.mjs   # propiedades con más grafos
```

Los valores esperados de los fixtures se calculan **a mano** y nunca se regeneran desde este código.
