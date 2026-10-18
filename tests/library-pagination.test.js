import test from 'node:test'
import assert from 'node:assert/strict'
import { computed, effectScope, ref } from 'vue'
import {
  useLibraryPagination,
  LIBRARY_PAGE_SIZE,
} from '../src/composables/use-library-pagination.js'

test('pagination traverses every filtered record exactly once, including a partial final page', () => {
  const scope = effectScope()
  try {
    const records = Array.from({ length: 1000 }, (_, id) => ({ id, name: 'Duplicate title' }))
    const { page, pageInfo } = scope.run(() => useLibraryPagination(ref(records), () => 'stable'))
    const visited = []
    for (let index = 1; index <= pageInfo.value.pageCount; index++) {
      page.value = index
      assert.ok(pageInfo.value.items.length <= LIBRARY_PAGE_SIZE)
      visited.push(...pageInfo.value.items.map(({ id }) => id))
    }
    assert.deepEqual(
      visited,
      records.map(({ id }) => id),
    )
    assert.equal(pageInfo.value.items.length, 16)
    assert.equal(pageInfo.value.start, 985)
    assert.equal(pageInfo.value.end, 1000)
    assert.equal(records.length, 1000)
  } finally {
    scope.stop()
  }
})

test('filter and sort changes reset to page one; realtime updates retain page and removals clamp it', () => {
  const scope = effectScope()
  try {
    const source = ref(Array.from({ length: 100 }, (_, id) => ({ id })))
    const evenOnly = ref(false)
    const descending = ref(false)
    const filtered = computed(() => {
      const records = source.value.filter(({ id }) => !evenOnly.value || id % 2 === 0)
      return descending.value ? records.reverse() : records
    })
    const { page, pageInfo } = scope.run(() =>
      useLibraryPagination(filtered, () => [evenOnly.value, descending.value]),
    )
    page.value = 4
    source.value = source.value.map((item) => ({ ...item, chapter: 'updated' }))
    assert.equal(pageInfo.value.page, 4)
    evenOnly.value = true
    assert.equal(pageInfo.value.page, 1)
    assert.equal(pageInfo.value.total, 50)
    assert.deepEqual(
      pageInfo.value.items.map(({ id }) => id),
      Array.from({ length: 24 }, (_, id) => id * 2),
    )
    page.value = 3
    descending.value = true
    assert.equal(pageInfo.value.page, 1)
    assert.equal(pageInfo.value.items[0].id, 98)
    page.value = 3
    source.value = source.value.slice(0, 10)
    assert.equal(pageInfo.value.page, 1)
    assert.equal(pageInfo.value.total, 5)
    source.value = []
    assert.deepEqual(
      {
        page: pageInfo.value.page,
        start: pageInfo.value.start,
        end: pageInfo.value.end,
        items: pageInfo.value.items,
      },
      { page: 1, start: 0, end: 0, items: [] },
    )
  } finally {
    scope.stop()
  }
})

test('pagination bounds invalid page numbers and resets when the owner changes', () => {
  const scope = effectScope()
  try {
    const owner = ref('alice')
    const { page, pageInfo } = scope.run(() =>
      useLibraryPagination(ref(Array.from({ length: 25 }, (_, id) => id)), () => owner.value),
    )
    for (const invalid of [-10, 0, NaN, -Infinity]) {
      page.value = invalid
      assert.equal(pageInfo.value.page, 1)
    }
    page.value = Infinity
    assert.equal(pageInfo.value.page, 2)
    assert.deepEqual(pageInfo.value.items, [24])
    owner.value = 'bob'
    assert.equal(page.value, 1)
  } finally {
    scope.stop()
  }
})
