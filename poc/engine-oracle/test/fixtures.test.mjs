import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { checkCase } from '../src/run.mjs';

const dir = join(dirname(fileURLToPath(import.meta.url)), '../../../docs/f0/fixtures/engine');
const REQUIRED = ['id', 'title', 'rationale', 'input', 'expected', 'computedBy'];

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'schema.json').sort()) {
  const doc = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  for (const kase of doc.cases) {
    test(`${file} › ${kase.id} — ${kase.title}`, () => {
      for (const k of REQUIRED) assert.ok(k in kase, `falta el campo ${k}`);
      const { problems } = checkCase({ kind: doc.kind, ...kase, input: { ...doc.defaults, ...kase.input } });
      assert.deepEqual(problems, []);
    });
  }
}
