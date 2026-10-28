import { spawn } from 'node:child_process'

// Auth-only: no Java, live project, credentials or remote configuration required.
const child = spawn(
  'firebase emulators:exec --project demo-mangalist --only auth "node --test tests/built-auth/*.test.js"',
  { cwd: new URL('..', import.meta.url), env: process.env, shell: true, stdio: 'inherit' },
)
child.on('error', (error) => {
  console.error(error.message)
  process.exitCode = 1
})
child.on('exit', (code) => {
  process.exitCode = code ?? 1
})
