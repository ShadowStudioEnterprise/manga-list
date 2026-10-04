<template>
  <q-card flat bordered class="auth-card">
    <q-card-section class="q-pb-none">
      <q-banner v-if="route.query.sessionError" rounded class="bg-orange-1 text-warning q-mb-md">
        <template #avatar><q-icon name="cloud_off" /></template>
        No hemos podido comprobar tu sesión. Inténtalo de nuevo en unos segundos.
      </q-banner>
      <p class="eyebrow text-primary q-mb-sm">Bienvenido de nuevo</p>
      <h2 class="auth-card__title">Inicia sesión</h2>
      <p class="text-grey-7 q-mb-none">Tu próxima lectura está justo donde la dejaste.</p>
    </q-card-section>

    <q-card-section>
      <q-form class="q-gutter-md" @submit="submit">
        <q-input
          v-model.trim="email"
          outlined
          type="email"
          label="Correo electrónico"
          autocomplete="email"
          :rules="emailRules"
          lazy-rules
        >
          <template #prepend><q-icon name="mail_outline" /></template>
        </q-input>

        <q-input
          v-model="password"
          outlined
          :type="showPassword ? 'text' : 'password'"
          label="Contraseña"
          autocomplete="current-password"
          :rules="requiredRules"
          lazy-rules
        >
          <template #prepend><q-icon name="lock_outline" /></template>
          <template #append>
            <q-btn
              flat
              round
              dense
              :icon="showPassword ? 'visibility_off' : 'visibility'"
              :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <div class="row justify-end">
          <router-link class="text-link" :to="authRoute('/forgot-password', route.query.redirect)"
            >¿Has olvidado la contraseña?</router-link
          >
        </div>

        <q-btn
          class="full-width"
          unelevated
          color="primary"
          no-caps
          size="md"
          label="Entrar"
          type="submit"
          :loading="submitting"
        />
      </q-form>

      <div class="auth-divider"><span>o continúa con</span></div>

      <q-btn
        class="full-width"
        outline
        no-caps
        icon="account_circle"
        label="Google"
        :loading="googleLoading"
        @click="loginWithGoogle"
      />
    </q-card-section>

    <q-card-section class="text-center q-pt-none">
      <span class="text-grey-7">¿Aún no tienes cuenta? </span>
      <router-link
        class="text-link text-weight-medium"
        :to="authRoute('/register', route.query.redirect)"
        >Crear cuenta</router-link
      >
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'
import { getFirebaseErrorMessage } from '@/utils/firebase-errors'
import { authDestination, authRoute } from '@/utils/auth-redirect'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const googleLoading = ref(false)

const requiredRules = [(value) => Boolean(value) || 'Este campo es obligatorio.']
const emailRules = [
  ...requiredRules,
  (value) => /^\S+@\S+\.\S+$/.test(value) || 'Introduce un correo válido.',
]

function destination() {
  return authDestination(route.query.redirect)
}

async function submit() {
  submitting.value = true
  try {
    await authStore.login(email.value, password.value)
    await router.replace(destination())
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getFirebaseErrorMessage(error, 'No hemos podido iniciar sesión.'),
    })
  } finally {
    submitting.value = false
  }
}

async function loginWithGoogle() {
  googleLoading.value = true
  try {
    await authStore.loginWithGoogle()
    await router.replace(destination())
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getFirebaseErrorMessage(error, 'No hemos podido completar el acceso con Google.'),
    })
  } finally {
    googleLoading.value = false
  }
}
</script>
