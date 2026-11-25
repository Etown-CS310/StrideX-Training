/**
 * True if the string can be used as a Firestore document id.
 * Ids from URLs or request bodies are checked with this first, because Firestore throws
 * (and the API would answer 500) on ids like "a/b", "..", or "__name__".
 */
export function isDocId(id: unknown): id is string {
  return typeof id === 'string'
    && id !== ''
    && id !== '.'
    && id !== '..'
    && !id.includes('/')
    && !/^__.*__$/.test(id)
    && Buffer.byteLength(id, 'utf8') <= 1500;
}
