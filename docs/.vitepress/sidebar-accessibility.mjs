// VitePress 1.6.x nests a focusable caret inside a group with role=button.
// Keep its component/styles and make the caret the single native disclosure.
export function sidebarAccessibility() {
  return {
    name: 'mangalist-sidebar-accessibility',
    enforce: 'pre',
    transform(source, id) {
      if (!id.replaceAll('\\', '/').endsWith('/theme-default/components/VPSidebarItem.vue')) return
      const header = /      :role="itemRole"\s+v-on="[\s\S]*?"\s+:tabindex="item.items && 0"/
      const caret = /      <div\s+v-if="item.collapsed != null[\s\S]*?<\/div>/
      if (!header.test(source) || !caret.test(source))
        throw new Error('Review VitePress sidebar accessibility adapter after dependency update')
      return source.replace(header, '').replace(
        caret,
        `      <button
        v-if="item.collapsed != null && item.items && item.items.length"
        type="button"
        class="caret"
        :aria-label="item.text"
        :aria-expanded="!collapsed"
        @click="toggle"
      >
        <span class="vpi-chevron-right caret-icon" />
      </button>`,
      )
    },
  }
}
