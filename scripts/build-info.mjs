import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function collectBuildInfo(root = process.cwd()) {
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      timeout: 10000,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  let revision = null
  let dirty = true
  try {
    const head = git('rev-parse', 'HEAD')
    if (/^[a-f0-9]{40}$/.test(head)) {
      revision = head
      dirty = git('status', '--porcelain', '--untracked-files=normal') !== ''
    }
  } catch {
    /* Archives without Git remain explicitly unverified development builds. */
  }
  return {
    revision,
    dirty,
    builtAt: new Date().toISOString(),
    compatibility: JSON.parse(readFileSync(resolve(root, 'release-contract.json'), 'utf8')),
  }
}

export function buildInfoPlugin(info, mode) {
  let project = null
  return {
    name: 'mangalist-build-info',
    configResolved(config) {
      const definition = config.define?.['import.meta.env.VITE_FIREBASE_PROJECT_ID']
      if (typeof definition === 'string') project = JSON.parse(definition)
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'build-info.json',
        source: JSON.stringify({ ...info, mode, project }, null, 2) + '\n',
      })
    },
  }
}
