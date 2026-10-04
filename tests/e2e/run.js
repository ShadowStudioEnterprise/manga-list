import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { delimiter, join, resolve } from 'node:path'

const environment = { ...process.env }
// Oracle's Windows PATH shim starts another java.exe process, which can outlive
// the Firebase CLI. Launch the actual runtime so the CLI can stop its emulator.
if (process.platform === 'win32') {
  const java = spawnSync('java', ['-XshowSettings:properties', '-version'], { encoding: 'utf8' })
  const javaHome = java.stderr?.match(/^\s*java\.home\s*=\s*(.+)$/m)?.[1].trim()
  if (java.status !== 0 || !javaHome || !existsSync(join(javaHome, 'bin', 'java.exe'))) {
    throw new Error('Install Java 21 or newer and make java available on PATH.')
  }
  const pathKey = Object.keys(environment).find((key) => key.toLowerCase() === 'path') || 'PATH'
  environment[pathKey] = `${join(javaHome, 'bin')}${delimiter}${environment[pathKey] || ''}`
}

const child = spawn(
  'firebase emulators:exec --project demo-mangalist --only auth,firestore "playwright test"',
  { cwd: resolve(import.meta.dirname, '../..'), env: environment, shell: true, stdio: 'inherit' },
)
child.on('error', (error) => {
  console.error(error.message)
  process.exitCode = 1
})
child.on('exit', (code) => {
  process.exitCode = code ?? 1
})
