import test from 'node:test';
import assert from 'node:assert/strict';
import { Trie } from '../src/index.js';

test('insert and has round-trip', () => {
  const t = new Trie();
  assert.equal(t.insert('apple'), true);
  assert.equal(t.has('apple'), true);
  assert.equal(t.has('appl'), false);
  assert.equal(t.has('apples'), false);
});

test('duplicate insert is a no-op', () => {
  const t = new Trie();
  t.insert('cat');
  assert.equal(t.insert('cat'), false);
  assert.equal(t.length, 1);
});

test('insert rejects empty string', () => {
  const t = new Trie();
  assert.throws(() => t.insert(''), RangeError);
  assert.equal(t.length, 0);
});

test('non-string input throws TypeError', () => {
  const t = new Trie();
  assert.throws(() => t.insert(42), TypeError);
  assert.throws(() => t.has(null), TypeError);
  assert.throws(() => t.complete(undefined), TypeError);
});

test('complete returns sorted matches', () => {
  const t = new Trie();
  for (const w of ['banana', 'band', 'bandana', 'apple', 'apricot']) {
    t.insert(w);
  }
  assert.deepEqual(t.complete('ban'), ['banana', 'band', 'bandana']);
  assert.deepEqual(t.complete('band'), ['band', 'bandana']);
  assert.deepEqual(t.complete('ap'), ['apple', 'apricot']);
});

test('complete with no matches returns empty array', () => {
  const t = new Trie();
  t.insert('apple');
  assert.deepEqual(t.complete('z'), []);
  assert.deepEqual(t.complete('apples'), []);
});

test('complete with empty prefix returns everything sorted', () => {
  const t = new Trie();
  for (const w of ['dog', 'cat', 'bird']) {
    t.insert(w);
  }
  assert.deepEqual(t.complete(''), ['bird', 'cat', 'dog']);
});

test('prefix itself is a completion', () => {
  const t = new Trie();
  t.insert('car');
  t.insert('carpet');
  assert.deepEqual(t.complete('car'), ['car', 'carpet']);
});

test('case-insensitive by default', () => {
  const t = new Trie();
  t.insert('Apple');
  assert.equal(t.has('apple'), true);
  assert.equal(t.has('APPLE'), true);
  assert.deepEqual(t.complete('aP'), ['apple']);
});

test('case-sensitive mode preserves case', () => {
  const t = new Trie({ caseSensitive: true });
  t.insert('Apple');
  t.insert('apple');
  assert.equal(t.length, 2);
  assert.equal(t.has('Apple'), true);
  assert.equal(t.has('APPLE'), false);
  assert.deepEqual(t.complete('Ap'), ['Apple']);
});

test('size tracks distinct words only', () => {
  const t = new Trie();
  t.insert('one');
  t.insert('ONE');
  t.insert('two');
  assert.equal(t.length, 2);
});

test('unicode code points are handled per character', () => {
  const t = new Trie();
  t.insert('cafe');
  t.insert('caf\u00e9');
  assert.deepEqual(t.complete('caf'), ['cafe', 'caf\u00e9']);
  assert.equal(t.has('caf\u00e9'), true);
});
