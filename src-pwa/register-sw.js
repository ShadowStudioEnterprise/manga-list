import { register } from 'register-service-worker'
import { observeWaitingUpdate } from '../src/utils/pwa-update'

register(import.meta.env.QUASAR_SERVICE_WORKER_FILE, {
  // Also report a worker that was already waiting when this tab opened.
  registered: observeWaitingUpdate,
  updated: observeWaitingUpdate,
  // An uncontrolled tab receives cached even when another client keeps an update waiting.
  cached: observeWaitingUpdate,
  // No polling, SKIP_WAITING messages, controller-change reloads or background writes.
})
