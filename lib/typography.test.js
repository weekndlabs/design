import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkTypography } from './typography.js';

const fixture = (files) => {
  const dir = mkdtempSync(join(tmpdir(), 'wl-typo-'));
  for (const [name, body] of Object.entries(files)) {
    const path = join(dir, name);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, body);
  }
  return dir;
};

test('an arbitrary pixel size is refused', async () => {
  const dir = fixture({ 'a.tsx': '<p className="text-[13px]">x</p>\n' });
  const found = await checkTypography(dir);
  assert.equal(found.length, 1);
  assert.equal(found[0].found, 'text-[13px]');
  assert.equal(found[0].line, 1);
});

test('Tailwind named sizes are refused, including in components/ui', async () => {
  // forgepod's version exempted src/components/ui. The exemption is dropped: a
  // vendored component is still a component on the page.
  const dir = fixture({
    'components/ui/button.tsx': 'const c = "text-sm font-medium";\n',
    'page.tsx': 'const c = "text-xl";\n',
  });
  const found = await checkTypography(dir);
  assert.equal(found.length, 2, `expected both files flagged, got ${JSON.stringify(found)}`);
});

test('role names pass, and the roles come from the tokens', async () => {
  const dir = fixture({ 'a.tsx': '<p className="text-body text-label text-hero">x</p>\n' });
  assert.deepEqual(await checkTypography(dir), []);
});

test('text-2xl and up are not banned yet', async () => {
  // The responsive display ramps still use them. Banning them here would fail on
  // work this change deliberately leaves whole.
  const dir = fixture({ 'a.tsx': 'const c = "text-2xl";\n' });
  assert.deepEqual(await checkTypography(dir), []);
});

test('files the gate has no business reading are skipped', async () => {
  const dir = fixture({
    'node_modules/pkg/index.tsx': 'const c = "text-sm";\n',
    'notes.md': 'use text-sm here\n',
  });
  assert.deepEqual(await checkTypography(dir), []);
});

test('the gate reaches no devDependency, so a consumer can run it', () => {
  // It is exported as @weekndlabs/design/typography-check and runs in someone
  // else's test suite. lib/tokens.js imports style-dictionary, which is a
  // devDependency here and absent there, so importing it would throw on install
  // rather than on any change to this file.
  const source = readFileSync(new URL('./typography.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /from '\.\/tokens\.js'/, 'typography.js pulled in style-dictionary');
  assert.match(source, /from '\.\.\/dist\/tokens\.js'/, 'it should read the built output');
});

test('the line number points at the offending line, not the file', async () => {
  const dir = fixture({ 'a.tsx': 'const a = 1;\nconst b = 2;\nconst c = "text-base";\n' });
  const found = await checkTypography(dir);
  assert.equal(found.length, 1);
  assert.equal(found[0].line, 3);
});
