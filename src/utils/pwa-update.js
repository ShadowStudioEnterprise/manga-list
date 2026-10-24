import { ref } from 'vue'

export const pwaUpdateAvailable = ref(false)

export function observeWaitingUpdate(registration) {
  if (registration?.active && registration.waiting) pwaUpdateAvailable.value = true
}
