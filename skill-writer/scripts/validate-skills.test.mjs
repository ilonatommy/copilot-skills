import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { inspect, validate, localLinks } from './validate-skills.mjs';

const root = fs.mkdtempSync(path.join(process.cwd(), '.validation-tests-'));
process.on('exit', () => fs.rmSync(root, { recursive: true, force: true }));
let serial = 0;
function fixture(frontmatter, body = '') {
  const dir = path.join(root, String(serial++));
  fs.mkdirSync(dir);
  const file = path.join(dir, 'SKILL.md');
  fs.writeFileSync(file, `---\n${frontmatter}\n---\n${body}`);
  return file;
}
const good = 'name: valid-skill\ndescription: >-\n  Describe what this does and when it runs.';
test('real YAML handles folded scalars and rejects malformed YAML and duplicate keys', () => {
  assert.deepEqual(inspect(fixture(good)).errors, []);
  assert.ok(inspect(fixture('name: valid\ndescription: [broken')).errors.length);
  assert.ok(inspect(fixture('name: a\nname: b\ndescription: text')).errors.length);
});
test('metadata required types and length limits', () => {
  for (const metadata of ['name: valid', 'name: Wrong_Name\ndescription: yes',
    `name: ${'a'.repeat(65)}\ndescription: text`, `name: valid\ndescription: ${'x'.repeat(1025)}`,
    'name: valid\ndescription: [not, text]']) assert.ok(inspect(fixture(metadata)).errors.length);
});
test('links check local inline, image and reference resources but ignore URLs, anchors and examples', () => {
  const file = fixture(good, '[a](./exists.md#part)\n![b](./missing.png)\n[c][ref]\n[ref]: ./absent.md\n[x](https://example.com/a)\n[x](#title)\n```md\n[x](./example.md)\n```');
  fs.writeFileSync(path.join(path.dirname(file), 'exists.md'), '');
  const errors = inspect(file).errors;
  assert.equal(errors.length, 2);
  assert.ok(errors.some(x => x.includes('missing.png')));
  assert.deepEqual(localLinks('[a](mailto:a@b)\n[b](#part)'), []);
  assert.deepEqual(localLinks('Use `[script](./example.sh)` as the syntax.'), []);
});
test('duplicates scoped to explicitly selected skill roots', () => {
  const a = fixture(good), b = fixture(good);
  assert.equal(validate([a]).valid, true);
  assert.equal(validate([a, b]).valid, false);
  assert.ok(validate([a, b]).skills.every(x => x.errors.some(e => e.includes('Duplicate'))));
});
test('discovery requires exact enabled path, not a matching name in a shadowing copy', () => {
  const file = fixture(good);
  assert.equal(validate([file], [{ name: 'valid-skill', path: path.dirname(file), enabled: true }]).valid, true);
  assert.equal(validate([file], [{ name: 'valid-skill', path: root, enabled: true }]).valid, false);
  assert.equal(validate([file], [{ name: 'valid-skill', path: path.dirname(file), enabled: false }]).valid, false);
});
