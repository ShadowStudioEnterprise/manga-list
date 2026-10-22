import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const documents = [
  ['LICENSE', 'LICENSE.txt', 'Licencia del proyecto: Apache-2.0'],
  ['NOTICE', 'NOTICE.txt', 'Avisos del proyecto'],
  ['LICENSE-SCOPE.md', 'LICENSE-SCOPE.txt', 'Alcance de la licencia'],
  ['ASSET-PROVENANCE.md', 'ASSET-PROVENANCE.txt', 'Procedencia de los iconos'],
  ['THIRD-PARTY-NOTICES.md', 'THIRD-PARTY-NOTICES.txt', 'Licencias y avisos de terceros'],
  [
    'proposals/ml14/distribution-license-texts.md',
    'COMPONENT-LICENSES.txt',
    'Textos complementarios de componentes',
  ],
]

export function legalAssets(root) {
  const assets = documents.map(([source, fileName]) => ({
    fileName: `legal/${fileName}`,
    source: readFileSync(resolve(root, source), 'utf8'),
  }))
  const links = documents
    .map(([, file, title]) => `<li><a href="./${file}">${title}</a></li>`)
    .join('\n')
  assets.push({
    fileName: 'legal/index.html',
    source: `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Licencias de software · MangaList</title>
<style>body{font:1rem/1.6 system-ui,sans-serif;max-width:48rem;margin:3rem auto;padding:0 1.25rem;color:#202034;background:#fff}a{color:#4338ca}li{margin:.8rem 0}a:focus-visible{outline:3px solid #4338ca;outline-offset:4px}</style></head>
<body><main><h1>Licencias de software</h1><p>MangaList · Copyright 2026 Francisco Navarrete Lopez.</p>
<p>Las aportaciones originales están bajo Apache License 2.0. Los componentes de terceros conservan sus propias licencias y avisos. Consulta los textos completos:</p><ul>${links}</ul>
<p>La licencia no concede acceso a datos privados ni derechos sobre obras o marcas de terceros. Los textos se incluyen en esta distribución y pueden guardarse para su consulta.</p></main></body></html>`,
  })
  return assets
}

export function legalNoticesPlugin(root) {
  let base = '/'
  return {
    name: 'mangalist-legal-notices',
    configResolved(config) {
      base = config.base
    },
    configureServer(server) {
      const assets = legalAssets(root)
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split('?')[0]
        const asset = assets.find((item) => `${base}${item.fileName}` === pathname)
        if (!asset) return next()
        response.setHeader(
          'Content-Type',
          asset.fileName.endsWith('.html')
            ? 'text/html; charset=utf-8'
            : 'text/plain; charset=utf-8',
        )
        response.end(asset.source)
      })
    },
    generateBundle() {
      for (const asset of legalAssets(root)) this.emitFile({ type: 'asset', ...asset })
    },
  }
}
