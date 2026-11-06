import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
async function check(ownerPid, ttlMs, reason) {
  const dir = await mkdtemp(join(tmpdir(), 'ml09-guardian-'))
  const binary = join(dir, 'mock-tunnel'),
    stateFile = join(dir, 'state.json'),
    file = join(dir, 'config.json')
  await writeFile(binary, `#!${process.execPath}\nsetInterval(()=>{},1000)\n`, { mode: 0o700 })
  await writeFile(
    file,
    JSON.stringify({
      ownerPid,
      deadline: Date.now() + ttlMs,
      binary,
      localUrl: 'http://127.0.0.1:12345',
      stateFile,
      logFile: join(dir, 'log'),
      providerConfigFile: join(dir, 'empty.yml'),
    }),
  )
  const guardian = spawn(
    process.execPath,
    [fileURLToPath(new URL('./tunnel-guardian.mjs', import.meta.url)), file],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  )
  let stderr = ''
  guardian.stderr.on('data', (part) => (stderr += part))
  try {
    const exit = await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(Error('Guardian failed to exit')), 6500)
      guardian.once('exit', (code) => {
        clearTimeout(t)
        resolve(code)
      })
      guardian.once('error', reject)
    })
    assert.equal(exit, 0, stderr)
    const state = JSON.parse(await readFile(stateFile))
    assert.equal(state.closed, true)
    assert.equal(state.reason, reason)
    assert.throws(() => process.kill(state.childPid, 0), { code: 'ESRCH' })
  } finally {
    guardian.kill('SIGKILL')
    await rm(dir, { recursive: true })
  }
}
test('independent guardian kills a live tunnel at absolute deadline', { timeout: 8000 }, () =>
  check(process.pid, 3000, 'absolute-deadline'),
)
test('independent guardian kills a tunnel after owner disappears', { timeout: 8000 }, () =>
  check(2147483647, 5000, 'owner-exited'),
)
