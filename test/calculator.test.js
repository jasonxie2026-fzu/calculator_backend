import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { evaluateExpression } from '../src/calculator.js';
import { createDatabase } from '../src/database.js';

test('evaluates operators with normal precedence', () => {
  assert.equal(evaluateExpression('1 + 2 * 3'), 7);
  assert.equal(evaluateExpression('(1 + 2) * 3'), 9);
});

test('supports decimals and unary plus/minus', () => {
  assert.equal(evaluateExpression('-5 + 8'), 3);
  assert.equal(evaluateExpression('3 * -2'), -6);
  assert.equal(evaluateExpression('0.5 + 1.25'), 1.75);
});

test('rejects invalid expressions and division by zero', () => {
  assert.throws(() => evaluateExpression('1 +'), /Invalid expression/);
  assert.throws(() => evaluateExpression('2 / 0'), /Division by zero/);
  assert.throws(() => evaluateExpression('process.exit()'), /Invalid expression/);
});

test('persists, lists, and deletes calculation history in sqlite', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'calculator-test-'));
  const db = createDatabase(path.join(tempDir, 'history.sqlite'));
  const inserted = db.addHistory('2+3', 5);

  assert.equal(db.listHistory().length, 1);
  assert.equal(db.listHistory()[0].expression, '2+3');
  assert.equal(db.deleteHistory(inserted.id), true);
  assert.equal(db.listHistory().length, 0);
  db.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});
