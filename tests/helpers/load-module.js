import { readFile } from 'node:fs/promises'
import { resolve, dirname, extname } from 'node:path'
import { SourceTextModule, SyntheticModule } from 'node:vm'
import { parse, compileScript } from '@vue/compiler-sfc'

const root = resolve(import.meta.dirname, '../..')

// Execute the actual scripts with controlled boundaries; no Firebase credentials or browser needed.
export async function loadModule(file, overrides = {}, env = {}) {
  const cache = new Map()
  async function synthetic(name, exports) {
    const module = new SyntheticModule(
      Object.keys(exports),
      function () {
        for (const [key, value] of Object.entries(exports)) this.setExport(key, value)
      },
      { identifier: name },
    )
    return module
  }
  async function load(path) {
    if (cache.has(path)) return cache.get(path)
    // Cache construction before awaiting I/O: diamond imports share one instance.
    const pending = (async () => {
      let source = await readFile(path, 'utf8')
      if (path.endsWith('.vue')) {
        source = compileScript(parse(source, { filename: path }).descriptor, { id: path }).content
      }
      return new SourceTextModule(source, {
        identifier: path,
        initializeImportMeta(meta) {
          meta.env = env
        },
      })
    })()
    cache.set(path, pending)
    return pending
  }
  const linker = async (specifier, referencing) => {
    if (Object.hasOwn(overrides, specifier)) return synthetic(specifier, overrides[specifier])
    if (specifier === '#q-app')
      return synthetic(specifier, {
        defineConfig: (value) => value,
        defineBoot: (value) => value,
      })
    if (specifier.endsWith('.vue')) return synthetic(specifier, { default: {} })
    if (specifier.startsWith('@/') || specifier.startsWith('.')) {
      let target = specifier.startsWith('@/')
        ? resolve(root, 'src', specifier.slice(2))
        : resolve(dirname(referencing.identifier), specifier)
      if (!extname(target)) target += '.js'
      return load(target)
    }
    return synthetic(specifier, await import(specifier))
  }
  const module = await load(resolve(root, file))
  await module.link(linker)
  await module.evaluate()
  return module.namespace
}
