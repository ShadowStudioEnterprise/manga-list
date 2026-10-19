import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, execSync } from 'node:child_process'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const read = (file) => readFileSync(resolve(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))
const assert = (value, message) => {
  if (!value) throw new Error(message)
}

export function validateConfig(config, policy) {
  assert(
    policy.plan === 'SPARK' && policy.billingAllowed === false,
    'Spark without billing is mandatory',
  )
  assert(
    JSON.stringify(policy.services) === JSON.stringify(['auth', 'firestore', 'hosting']),
    'Service inventory changed',
  )
  assert(
    Object.keys(config).every((key) => ['hosting', 'firestore', 'emulators'].includes(key)),
    'Unsupported Firebase service',
  )
  assert(
    config.firestore?.rules === 'firestore.rules' &&
      Object.keys(config.firestore).every((key) => ['rules', 'predeploy'].includes(key)) &&
      JSON.stringify(config.firestore.predeploy) === JSON.stringify(['npm run check:spark:remote']),
    'Only existing default Firestore rules supported',
  )
  assert(
    Array.isArray(config.hosting) && config.hosting.length === 2,
    'Only app and docs Hosting sites supported',
  )
  const app = config.hosting.find((site) => site.target === 'app')
  const docs = config.hosting.find((site) => site.target === 'docs')
  assert(
    app?.public === 'dist/pwa' && docs?.public === 'docs/.vitepress/dist',
    'Unexpected Hosting target',
  )
  for (const site of config.hosting) {
    const allowed = [
      'target',
      'public',
      'ignore',
      'predeploy',
      'headers',
      ...(site === app ? ['rewrites'] : ['cleanUrls', 'redirects']),
    ]
    assert(
      Object.keys(site).every((key) => allowed.includes(key)),
      'Unapproved Hosting feature',
    )
    assert(
      site.predeploy?.includes('npm run check:spark:remote'),
      'Remote billing check required before Hosting deployment',
    )
  }
  assert(
    JSON.stringify(app.predeploy) ===
      JSON.stringify([
        'npm run check:spark:remote',
        'npm run build:pwa',
        'npm run check:release',
      ]) &&
      JSON.stringify(docs.predeploy) ===
        JSON.stringify(['npm run check:spark:remote', 'npm run docs:build']),
    'Unexpected predeploy command',
  )
  assert(docs.cleanUrls === true, 'Docs require clean URLs')
  assert(
    docs.redirects === undefined ||
      (Array.isArray(docs.redirects) &&
        docs.redirects.every(
          (rule) =>
            Object.keys(rule).every((key) => ['source', 'destination', 'type'].includes(key)) &&
            /^\/[a-z0-9-]+(?:\.html)?$/.test(rule.source) &&
            /^\/reports\/[a-z0-9-]+\/[a-z0-9-]+$/.test(rule.destination) &&
            rule.type === 301,
        )),
    'Only static local report redirects allowed',
  )
  assert(
    app.rewrites?.every(
      (rule) =>
        Object.keys(rule).every((key) => ['source', 'destination', 'regex'].includes(key)) &&
        typeof rule.destination === 'string',
    ),
    'Only static rewrites allowed',
  )
  assert(
    Object.keys(config.emulators || {}).every((key) => ['auth', 'firestore', 'ui'].includes(key)),
    'Unexpected emulator',
  )
  return true
}

export function validateHostingTargets(rc, project) {
  const projects = rc.targets || {}
  assert(Object.keys(projects).length === 1 && projects[project], 'Unexpected target project')
  const targets = projects[project]
  assert(Object.keys(targets).length === 1 && targets.hosting, 'Unexpected target service')
  const hosting = targets.hosting
  assert(
    Object.keys(hosting).length === 2 &&
      JSON.stringify(hosting.app) === JSON.stringify([project]) &&
      JSON.stringify(hosting.docs) === JSON.stringify(['mangalist-docs']),
    'Unexpected Hosting target mapping',
  )
}

export function validateRemote(billing, database, project) {
  assert(
    billing.name === `projects/${project}/billingInfo`,
    'Billing evidence targets another project',
  )
  assert(
    billing.billingEnabled === false && !billing.billingAccountName,
    'Billing must be disabled and unlinked',
  )
  assert(
    database.name === `projects/${project}/databases/(default)`,
    'Unexpected Firestore database',
  )
  assert(
    database.type === 'FIRESTORE_NATIVE' && database.databaseEdition === 'STANDARD',
    'Only Firestore Standard supported',
  )
}

// This deliberately conservative text scan also covers side-effect imports,
// literal dynamic imports, CommonJS and direct internal Firebase SDK entrypoints.
// It is not a parser or a defense against calculated/obfuscated module names.
export function validateClientSource(source, path = 'client') {
  const imports =
    /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*)['"`]((?:firebase|@firebase)[^'"`\s]*)['"`]/g
  for (const match of source.matchAll(imports)) {
    assert(
      ['firebase/app', 'firebase/auth', 'firebase/firestore'].includes(match[1]),
      `Unsupported SDK: ${path}: ${match[1]}`,
    )
  }
  assert(
    !/https:\/\/[^\s'"]*(?:cloudfunctions\.net|run\.app)/i.test(source),
    `Paid backend endpoint: ${path}`,
  )
  assert(
    !/httpsCallable|signInWithPhoneNumber|PhoneAuthProvider|initializeAppCheck/.test(source),
    `Unapproved service/provider: ${path}`,
  )
}

export function validateDependencyManifest(manifest, path = 'manifest') {
  // npm lockfile package keys include node_modules paths, even when a package
  // is only transitive and absent from the root dependency map.
  const forbidden =
    /(?:^|node_modules\/)(?:firebase-admin|firebase-functions|@google-cloud\/[^/]+)$/
  function inspect(value) {
    if (!value || typeof value !== 'object') return
    for (const [key, child] of Object.entries(value)) {
      assert(!forbidden.test(key), `Server dependency: ${path}: ${key}`)
      inspect(child)
    }
  }
  inspect(manifest)
}

export function validatePackageScripts(commands) {
  assert(
    commands && typeof commands === 'object' && !Array.isArray(commands),
    'Missing npm scripts',
  )
  const required = {
    'check:spark': 'node scripts/check-spark.mjs',
    'check:spark:remote': 'node scripts/check-spark.mjs --remote',
    'deploy:hosting':
      'npm run check:spark:remote && firebase deploy --only hosting:app --project mangalist-61bb8',
    'deploy:docs':
      'npm run check:spark:remote && firebase deploy --only hosting:docs --project mangalist-61bb8',
    'docs:build': 'vitepress build docs',
    build: 'quasar build && node scripts/build-evidence.mjs create spa',
    'build:pwa': 'quasar build -m pwa && node scripts/build-evidence.mjs create pwa',
    'check:release': 'node scripts/build-evidence.mjs verify pwa --project mangalist-61bb8',
    'audit:dependencies':
      'npm audit --audit-level=low && npm audit --prefix src-pwa --audit-level=low',
  }
  for (const [name, command] of Object.entries(required)) {
    assert(
      Object.hasOwn(commands, name) && commands[name] === command,
      `Protected npm script changed: ${name}`,
    )
  }
}

export function validateWorkflow(source, path = 'workflow') {
  // Conservative literal scan, including comments; indirect commands still need review.
  assert(
    !/firebase\s+(?:deploy|hosting:channel:deploy|hosting:clone)|gcloud\s+(?:run|billing)|npm\s+run(?:-script)?\s+deploy(?::[\w-]+)?|firebase-hosting-merge|FirebaseExtended\/action-hosting-deploy/i.test(
      source,
    ),
    `Deployment/billing command in ${path}`,
  )
}

function files(folder) {
  return readdirSync(resolve(root, folder), { withFileTypes: true })
    .filter((entry) => entry.name !== 'node_modules')
    .flatMap((entry) => {
      const path = `${folder}/${entry.name}`
      return entry.isDirectory() ? files(path) : [path]
    })
}

export function checkLocal() {
  const policy = json('spark-policy.json')
  assert(policy.project === 'mangalist-61bb8', 'Unexpected production project')
  assert(
    !process.env.GCLOUD_PROJECT || process.env.GCLOUD_PROJECT === policy.project,
    'CLI target differs from Spark policy',
  )
  validateConfig(json('firebase.json'), policy)
  validateHostingTargets(json('.firebaserc'), policy.project)
  validatePackageScripts(json('package.json').scripts)
  assert(
    JSON.stringify(json('release-contract.json')) ===
      JSON.stringify({
        version: 1,
        sparkOnly: true,
        deletionBarrier: 1,
        boundedLibraryQuery: 1001,
        recoverableImport: 1,
        verifiedExport: 2,
      }),
    'Release contract changes require an explicit compatibility review',
  )
  const aliases = Object.values(json('.firebaserc').projects)
  assert(
    aliases.every((project) => project === policy.project),
    'Unexpected Firebase alias',
  )
  for (const folder of ['src', 'src-pwa']) {
    for (const path of files(folder)) {
      if (/\.(?:[cm]?[jt]sx?|vue)$/.test(path)) validateClientSource(read(path), path)
    }
  }
  for (const file of [
    'package.json',
    'package-lock.json',
    'src-pwa/package.json',
    'src-pwa/package-lock.json',
  ]) {
    validateDependencyManifest(json(file), file)
  }
  // No deployment workflow is approved; all mutations stay manual.
  for (const path of files('.github/workflows')) {
    validateWorkflow(read(path), path)
  }
  console.log('Spark local compatibility checks passed (remote state not certified).')
  return policy
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(root, 'scripts/check-spark.mjs')) {
  try {
    const args = process.argv.slice(2)
    assert(
      args.length === 0 || (args.length === 1 && args[0] === '--remote'),
      'Expected no arguments or --remote',
    )
    const policy = checkLocal()
    if (args.length === 1) {
      // Read-only, fresh evidence. No cached attestations or bypass flag.
      const inspect = (args) => {
        const options = { encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] }
        const parameters = [...args, '--format=json', '--quiet']
        // Windows requires a shell for .cmd. All arguments come from the fixed
        // commands below and the exact project asserted by checkLocal, not input.
        for (const value of parameters)
          assert(/^[a-zA-Z0-9=()._-]+$/.test(value), 'Unsafe CLI argument')
        return JSON.parse(
          process.platform === 'win32'
            ? execSync(
                // Quoting the bare command name breaks %~dp0 in PATH-resolved
                // batch files on Windows. Keep the fixed name unquoted.
                `gcloud.cmd ${parameters.map((value) => `"${value}"`).join(' ')}`,
                options,
              )
            : execFileSync('gcloud', parameters, options),
        )
      }
      const billing = inspect(['billing', 'projects', 'describe', policy.project])
      const database = inspect([
        'firestore',
        'databases',
        'describe',
        '--database=(default)',
        `--project=${policy.project}`,
      ])
      validateRemote(billing, database, policy.project)
      console.log('Remote billing disabled/unlinked and Firestore Standard confirmed.')
    }
  } catch (error) {
    console.error(`Spark validation blocked: ${error.message}`)
    process.exitCode = 1
  }
}
