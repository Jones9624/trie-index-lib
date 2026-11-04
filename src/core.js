const END = Symbol('end');

/**
 * A trie for fixed-vocabulary autocomplete.
 *
 * The trie stores whole words and returns completions that start with
 * a given prefix. Words are stored lowercased by default: fixed vocab
 * autocomplete is almost always case-insensitive, and normalising once
 * at insert time keeps lookup cheap. Pass `{ caseSensitive: true }` if
 * you genuinely need to distinguish 'Apple' from 'apple'.
 */
export class Trie {
  /**
   * @param {{ caseSensitive?: boolean }} [options]
   */
  constructor(options = {}) {
    this.caseSensitive = options.caseSensitive === true;
    this.root = Object.create(null);
    this.size = 0;
  }

  /**
   * Normalise a word for storage or lookup. Returning the original string
   * when case-sensitive avoids allocating a new string on every call.
   * @param {string} word
   * @returns {string}
   */
  _normalize(word) {
    if (typeof word !== 'string') {
      throw new TypeError('word must be a string');
    }
    return this.caseSensitive ? word : word.toLowerCase();
  }

  /**
   * Insert a word. Re-inserting the same word is a no-op and does not
   * change `size`. Empty strings are rejected because a completion list
   * containing '' is never useful to a caller.
   * @param {string} word
   * @returns {boolean} true if the word was newly added
   */
  insert(word) {
    const w = this._normalize(word);
    if (w.length === 0) {
      throw new RangeError('cannot insert an empty word');
    }
    let node = this.root;
    for (const ch of w) {
      let next = node[ch];
      if (next === undefined) {
        next = Object.create(null);
        node[ch] = next;
      }
      node = next;
    }
    if (node[END] === true) {
      return false;
    }
    node[END] = true;
    this.size += 1;
    return true;
  }

  /**
   * @param {string} word
   * @returns {boolean}
   */
  has(word) {
    const w = this._normalize(word);
    let node = this.root;
    for (const ch of w) {
      node = node[ch];
      if (node === undefined) {
        return false;
      }
    }
    return node[END] === true;
  }

  /**
   * Walk to the node for a prefix. Returns undefined if the prefix
   * diverges from every stored word.
   * @param {string} prefix
   * @returns {object|undefined}
   */
  _find(prefix) {
    let node = this.root;
    for (const ch of prefix) {
      node = node[ch];
      if (node === undefined) {
        return undefined;
      }
    }
    return node;
  }

  /**
   * Return every stored word that starts with `prefix`, in
   * lexicographic order.
   *
   * Ordering is produced by iterating the children of each node in
   * sorted key order, so the output is deterministic and does not rely
   * on the insertion order of the underlying object.
   *
   * @param {string} prefix
   * @returns {string[]}
   */
  complete(prefix) {
    const p = this._normalize(prefix);
    const start = this._find(p);
    if (start === undefined) {
      return [];
    }
    const results = [];
    const stack = [[start, p]];
    while (stack.length > 0) {
      const [node, word] = stack.pop();
      if (node[END] === true) {
        results.push(word);
      }
      const keys = Object.keys(node).filter((k) => k !== END);
      keys.sort();
      // Push in reverse so the smallest key is processed first.
      for (let i = keys.length - 1; i >= 0; i -= 1) {
        stack.push([node[keys[i]], word + keys[i]]);
      }
    }
    return results;
  }

  /**
   * Number of distinct words stored.
   * @returns {number}
   */
  get length() {
    return this.size;
  }
}
