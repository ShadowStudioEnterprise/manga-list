import { execFileSync } from 'node:child_process'
import { test } from '@playwright/test'

// Explicit manual config only: hardware must never be required by ordinary CI.
test('ML-15: physical Android demo authentication', async () => {
  const info = test.info()
  execFileSync(process.execPath, ['scripts/check-ml15-android.mjs'], {
    env: process.env,
    timeout: 150000,
    stdio: 'pipe',
  })
  await info.attach('android-summary', {
    path: 'test-results/ml15-android/summary.json',
    contentType: 'application/json',
  })
  await info.attach('android-library', {
    path: 'test-results/ml15-android/library.png',
    contentType: 'image/png',
  })
})
