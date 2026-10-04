import { acceptHMRUpdate, defineStore } from 'pinia'
import {
  initializeAuth,
  loginWithEmail,
  loginWithGoogle as loginWithGoogleService,
  logout as logoutService,
  observeAuthState,
  registerWithEmail,
  resetPassword as resetPasswordService,
  serializeAuthUser,
} from '@/services/auth-service'
import { deleteCurrentAccount as deleteCurrentAccountService } from '@/services/account-service'
import { toAppError } from '@/utils/firebase-errors'
import { useMangaStore } from '@/stores/manga-store'
import { useSettingsStore } from '@/stores/settings-store'

let stopAuthStoreObserver = null
let storeInitializationPromise = null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    initialized: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.user?.uid),
  },

  actions: {
    initialize() {
      if (storeInitializationPromise) {
        return storeInitializationPromise
      }

      this.loading = true
      this.error = null

      if (!stopAuthStoreObserver) {
        stopAuthStoreObserver = observeAuthState(
          (firebaseUser) => {
            const previousUid = this.user?.uid
            this.user = serializeAuthUser(firebaseUser)
            const currentUid = this.user?.uid
            const mangaStore = useMangaStore()

            if (currentUid && currentUid !== previousUid) {
              mangaStore.subscribe(currentUid)
            } else if (!currentUid) {
              mangaStore.unsubscribe()
            }
          },
          (error) => {
            const appError = toAppError(error, 'No se ha podido comprobar tu sesión.')
            this.error = appError.message
          },
        )
      }

      storeInitializationPromise = initializeAuth()
        .then((firebaseUser) => {
          this.user = serializeAuthUser(firebaseUser)
          this.initialized = true
          return this.user
        })
        .catch((error) => {
          const appError = toAppError(error, 'No se ha podido comprobar tu sesión.')
          this.error = appError.message
          this.initialized = true

          if (appError.code === 'app/firebase-not-configured') {
            return null
          }

          storeInitializationPromise = null
          throw appError
        })
        .finally(() => {
          this.loading = false
        })

      return storeInitializationPromise
    },

    async login(email, password) {
      this.loading = true
      this.error = null

      try {
        const firebaseUser = await loginWithEmail(email, password)
        this.user = serializeAuthUser(firebaseUser)
        return this.user
      } catch (error) {
        const appError = toAppError(error, 'No se ha podido iniciar sesión.')
        this.error = appError.message
        throw appError
      } finally {
        this.loading = false
      }
    },

    async register(email, password) {
      this.loading = true
      this.error = null

      try {
        const firebaseUser = await registerWithEmail(email, password)
        this.user = serializeAuthUser(firebaseUser)
        return this.user
      } catch (error) {
        const appError = toAppError(error, 'No se ha podido crear la cuenta.')
        this.error = appError.message
        throw appError
      } finally {
        this.loading = false
      }
    },

    async loginWithGoogle() {
      this.loading = true
      this.error = null

      try {
        const firebaseUser = await loginWithGoogleService()
        this.user = serializeAuthUser(firebaseUser)
        return this.user
      } catch (error) {
        const appError = toAppError(error, 'No se ha podido iniciar sesión con Google.')
        this.error = appError.message
        throw appError
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      this.error = null

      try {
        await logoutService()
      } catch (error) {
        const appError = toAppError(error, 'No se ha podido cerrar la sesión.')
        this.error = appError.message
        throw appError
      } finally {
        this.loading = false
      }
    },

    async resetPassword(email) {
      this.loading = true
      this.error = null

      try {
        await resetPasswordService(email)
      } catch (error) {
        const appError = toAppError(error, 'No se ha podido enviar el correo de recuperación.')
        this.error = appError.message
        throw appError
      } finally {
        this.loading = false
      }
    },

    async deleteCurrentAccount(options) {
      this.loading = true
      this.error = null

      const mangaStore = useMangaStore()
      const settingsStore = useSettingsStore()
      const uid = this.user?.uid
      mangaStore.unsubscribe()

      try {
        await deleteCurrentAccountService(options)
        settingsStore.resetSettings()
        this.user = null
      } catch (error) {
        const appError = toAppError(error, 'No se ha podido eliminar la cuenta.')
        this.error = appError.message

        if (uid) {
          mangaStore.subscribe(uid)
        }

        throw appError
      } finally {
        this.loading = false
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
