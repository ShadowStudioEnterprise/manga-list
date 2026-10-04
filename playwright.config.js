import { defineConfig, devices } from '@playwright/test'

// Never run against an existing server or a live Firebase project.
if (
  process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8188' ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9199'
) {
  throw new Error('Run npm run test:e2e to start the isolated Firebase emulators.')
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:9100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 9100',
    url: 'http://127.0.0.1:9100',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      QCLI_FIREBASE_EMULATORS: 'true',
      VITE_FIREBASE_API_KEY: 'demo-mangalist-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'demo-mangalist.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'demo-mangalist',
      VITE_FIREBASE_STORAGE_BUCKET: 'demo-mangalist.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
      VITE_FIREBASE_APP_ID: '1:123456789:web:demo',
    },
  },
})
