import base from './playwright.config.js'

if (process.env.MANGALIST_ANDROID_DEMO !== 'true')
  throw new Error('Explicit Android demo opt-in required')
export default {
  ...base,
  testMatch: 'ml15-android.manual.js',
  timeout: 180000,
  projects: [{ name: 'android-device' }],
  reporter: [['list'], ['json', { outputFile: 'test-results/android-browser-results.json' }]],
}
