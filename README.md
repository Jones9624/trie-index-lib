# trie-index-lib

A small, dependency-free trie that returns sorted autocomplete matches for a fixed vocabulary.

```js
import { Trie } from './src/index.js';

const trie = new Trie();
trie.insert('apple');
trie.insert('apricot');
trie.insert('banana');

trie.complete('ap');   // ['apple', 'apricot']
trie.has('apple');      // true
trie.length;            // 3
```

## Why this exists

The problem is a fixed vocabulary: a known, finite set of words that a user types a prefix of. A trie is the natural fit because it shares prefixes, so lookup cost depends on the length of the prefix rather than the number of words. The trade-off is that a trie spends memory on every shared prefix node, and it does not support fuzzy matching or ranking by frequency. For a fixed vocabulary that is the right trade: predictable O(prefix) lookup, no scoring machinery, and no dependencies.

## What the API guarantees

- `insert(word)` returns `true` when the word is new, `false` when it was already present. Empty strings throw `RangeError`; non-strings throw `TypeError`.
- `has(word)` is an exact membership check after normalisation.
- `complete(prefix)` returns every stored word starting with `prefix`, in lexicographic order. A prefix that matches nothing returns `[]`, and an empty prefix returns every word.
- `length` is the number of distinct stored words.

## The awkward edge

Case handling is a deliberate choice, not an accident. By default the trie lowercases everything on insert and lookup, so `insert('Apple')` and `insert('apple')` are the same word. That keeps autocomplete forgiving for human input. If you need `Apple` and `apple` to coexist, construct the trie with `new Trie({ caseSensitive: true })`; then normalisation is skipped entirely and `has('APPLE')` will be `false` for a stored `'apple'`.

The implementation iterates each node's children in sorted order, so `complete` is deterministic regardless of insertion order. It does not preserve insertion order, and it does not rank results by anything other than lexicographic order.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

