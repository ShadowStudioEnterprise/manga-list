import { createHash } from 'node:crypto'
import { lstatSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectBuildInfo } from './build-info.mjs'

const EVIDENCE = 'build-evidence.json'
const SOURCE_FILES = [
  'release-contract.json',
  'spark-policy.json',
  'firestore.rules',
  'firebase.json',
  'package-lock.json',
  'src-pwa/package-lock.json',
]
const hash = (value) => createHash('sha256').update(value).digest('hex')
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

function inventory(directory) {
  assert(
    lstatSync(directory).isDirectory() && !lstatSync(directory).isSymbolicLink(),
    'Build directory must be a real directory',
  )
  const files = Object.create(null)
  function visit(folder) {
    for (const name of readdirSync(folder).sort()) {
      const path = resolve(folder, name)
      const stat = lstatSync(path)
      assert(!stat.isSymbolicLink(), 'Symbolic links are not accepted in a build')
      if (stat.isDirectory()) visit(path)
      else {
        assert(stat.isFile(), 'Unsupported build entry')
        const key = relative(directory, path).replaceAll('\\', '/')
        if (key !== EVIDENCE) files[key] = hash(readFileSync(path))
      }
    }
  }
  visit(directory)
  assert(files['index.html'] && files['build-info.json'], 'Incomplete build')
  return Object.fromEntries(Object.entries(files).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
}

function sourceHashes(root) {
  return Object.fromEntries(
    SOURCE_FILES.map((file) => [file, hash(readFileSync(resolve(root, file)))]),
  )
}

export function createEvidence(root, mode) {
  assert(['spa', 'pwa'].includes(mode), 'Unsupported build mode')
  const directory = resolve(root, 'dist', mode)
  const files = inventory(directory)
  const info = readJson(resolve(directory, 'build-info.json'))
  assert(info.mode === mode, 'Build mode mismatch')
  const evidence = { version: 1, application: info, sourceHashes: sourceHashes(root), files }
  writeFileSync(resolve(directory, EVIDENCE), JSON.stringify(evidence, null, 2) + '\n')
  return evidence
}

export function verifyEvidence(
  root,
  directory,
  { mode, project, allowDirtyDemo = false, source = collectBuildInfo(root) },
) {
  assert(['spa', 'pwa'].includes(mode), 'Unsupported build mode')
  const policy = readJson(resolve(root, 'spark-policy.json'))
  assert(policy.plan === 'SPARK' && policy.billingAllowed === false, 'Spark policy required')
  assert(
    policy.project === 'mangalist-61bb8' &&
      JSON.stringify(policy.services) === JSON.stringify(['auth', 'firestore', 'hosting']),
    'Unexpected service inventory',
  )
  assert([policy.project, 'demo-mangalist'].includes(project), 'Unsupported target project')
  assert(!allowDirtyDemo || project === 'demo-mangalist', 'Dirty build exception is demo-only')
  const currentFiles = inventory(directory)
  const evidence = readJson(resolve(directory, EVIDENCE))
  const info = evidence.application
  assert(
    evidence.version === 1 && info?.mode === mode && info.project === project,
    'Build version/mode/project mismatch',
  )
  assert(
    /^[a-f0-9]{40}$/.test(info.revision) && info.revision === source.revision,
    'Build source revision is missing or stale',
  )
  assert(
    typeof info.dirty === 'boolean' && typeof source.dirty === 'boolean',
    'Missing source state',
  )
  assert(
    allowDirtyDemo || (info.dirty === false && source.dirty === false),
    'Clean source and build required',
  )
  assert(
    typeof info.builtAt === 'string' && new Date(info.builtAt).toISOString() === info.builtAt,
    'Invalid build time',
  )
  assert(
    JSON.stringify(info.compatibility) ===
      JSON.stringify(readJson(resolve(root, 'release-contract.json'))),
    'Incompatible client contracts',
  )
  assert(
    JSON.stringify(evidence.sourceHashes) === JSON.stringify(sourceHashes(root)),
    'Critical build inputs changed',
  )
  assert(
    JSON.stringify(info) === JSON.stringify(readJson(resolve(directory, 'build-info.json'))),
    'Build stamp and evidence differ',
  )
  assert(
    JSON.stringify(evidence.files) === JSON.stringify(currentFiles),
    'Build files changed, missing or added',
  )
  if (mode === 'pwa')
    assert(
      evidence.files['sw.js'] && evidence.files['manifest.json'],
      'PWA worker or manifest missing',
    )
  return evidence
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [operation, mode, ...args] = process.argv.slice(2)
    const root = process.cwd()
    if (operation === 'create' && args.length === 0) {
      createEvidence(root, mode)
      console.log(`Build evidence created for ${mode}; this is not deployment approval.`)
    } else {
      assert(operation === 'verify', 'Expected create or verify')
      let project
      let directory = resolve(root, 'dist', mode || '')
      let allowDirtyDemo = false
      while (args.length) {
        const key = args.shift()
        if (key === '--project') project = args.shift()
        else if (key === '--dir') directory = resolve(args.shift() || '')
        else if (key === '--allow-dirty-demo') allowDirtyDemo = true
        else throw new Error('Unknown verification option')
      }
      verifyEvidence(root, directory, { mode, project, allowDirtyDemo })
      console.log(
        `Build consistency verified for ${project}/${mode}; no remote state or deployment certified.`,
      )
    }
  } catch (error) {
    console.error(`Build verification blocked: ${error.message}`)
    process.exitCode = 1
  }
}
