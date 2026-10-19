import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { delimiter, join } from 'node:path'

// Same Windows Java shim workaround as the existing browser emulator runner.
const env = { ...process.env }
if (process.platform === 'win32') {
  const java = spawnSync('java', ['-XshowSettings:properties', '-version'], { encoding: 'utf8' })
  const home = java.stderr?.match(/^\s*java\.home\s*=\s*(.+)$/m)?.[1].trim()
  if (java.status !== 0 || !home || !existsSync(join(home, 'bin', 'java.exe'))) {
    throw new Error('Java 21 or newer is required for local emulator tests.')
  }
  const key = Object.keys(env).find((key) => key.toLowerCase() === 'path') || 'PATH'
  env[key] = `${join(home, 'bin')}${delimiter}${env[key] || ''}`
}
const child = spawn(
  'firebase emulators:exec --project demo-mangalist --only firestore "npm run test:rules"',
  { cwd: new URL('..', import.meta.url), env, shell: true, stdio: 'inherit' },
)
child.on('error', (error) => {
  console.error(error.message)
  process.exitCode = 1
})
child.on('exit', (code) => {
  process.exitCode = code ?? 1
})
