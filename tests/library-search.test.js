import test from 'node:test'
import assert from 'node:assert/strict'
import { createLibrarySearchStorage } from '../src/utils/library-search.js'

function memory() {
  const values = new Map()
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

test('library search survives a new instance only for the same project and account', () => {
  const storage = memory()
  const first = createLibrarySearchStorage(() => storage, 'demo-a')
  first.write('alice', 'ML09 Safari 0000')
  const reloaded = createLibrarySearchStorage(() => storage, 'demo-a')
  assert.equal(reloaded.read('alice'), 'ML09 Safari 0000')
  assert.equal(createLibrarySearchStorage(() => storage, 'demo-b').read('alice'), '')
  assert.equal(createLibrarySearchStorage(() => memory(), 'demo-a').read('alice'), '')
  assert.equal(reloaded.read('bob'), '')
  assert.equal(reloaded.read('alice'), '', 'a different account retires the prior selection')
})

test('library search bounds persisted input and removes empty, malformed or foreign state', () => {
  const storage = memory()
  const search = createLibrarySearchStorage(() => storage, 'demo-a')
  storage.setItem('other-feature', 'keep')
  search.write('alice', 'x'.repeat(512))
  const key = [...storage.values.keys()].find((key) => key !== 'other-feature')
  assert.deepEqual(JSON.parse(storage.getItem(key)), {
    version: 1,
    uid: 'alice',
    query: 'x'.repeat(512),
  })
  search.write('alice', 'x'.repeat(513))
  assert.equal(search.read('alice'), '')
  for (const value of [
    'broken',
    'x'.repeat(4097),
    'null',
    '{"version":2}',
    '{"version":1,"uid":"alice","query":42}',
  ]) {
    storage.setItem(key, value)
    assert.equal(search.read('alice'), '')
    assert.equal(storage.getItem(key), null)
  }
  search.write('alice', 'Nano')
  search.write('alice', '')
  assert.equal(search.read('alice'), '')
  search.write('alice', 'Nano')
  search.clear()
  assert.deepEqual([...storage.values], [['other-feature', 'keep']])
})

test('denied session storage and quota failures do not interrupt library actions', () => {
  for (const provider of [
    () => {
      throw Error('Storage denied')
    },
    () => ({
      getItem() {
        throw Error('Storage denied')
      },
      setItem() {
        throw Error('Quota')
      },
      removeItem() {
        throw Error('Storage denied')
      },
    }),
    () => undefined,
  ]) {
    const search = createLibrarySearchStorage(provider)
    assert.equal(search.read('alice'), '')
    assert.doesNotThrow(() => search.write('alice', 'Nano'))
    assert.doesNotThrow(() => search.clear())
  }
})
