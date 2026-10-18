import { computed, ref, watch } from 'vue'

export const LIBRARY_PAGE_SIZE = 24

// Paginate an already filtered and sorted in-memory library. This makes no backend requests.
export function useLibraryPagination(items, resetKey) {
  const page = ref(1)
  const pageCount = computed(() => Math.max(1, Math.ceil(items.value.length / LIBRARY_PAGE_SIZE)))
  watch(
    resetKey,
    () => {
      page.value = 1
    },
    { flush: 'sync' },
  )
  watch(
    pageCount,
    (count) => {
      page.value = Math.min(page.value, count)
    },
    { flush: 'sync' },
  )

  const pageInfo = computed(() => {
    const total = items.value.length
    const current = Math.min(pageCount.value, Math.max(1, Math.trunc(Number(page.value)) || 1))
    const offset = (current - 1) * LIBRARY_PAGE_SIZE
    return {
      page: current,
      pageCount: pageCount.value,
      total,
      start: total ? offset + 1 : 0,
      end: Math.min(total, offset + LIBRARY_PAGE_SIZE),
      items: items.value.slice(offset, offset + LIBRARY_PAGE_SIZE),
    }
  })
  return { page, pageInfo }
}
