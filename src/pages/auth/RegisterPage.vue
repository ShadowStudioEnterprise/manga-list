<template>
  <q-card flat bordered class="auth-card">
    <q-card-section class="q-pb-none">
      <p class="eyebrow text-primary q-mb-sm">Empieza tu biblioteca</p>
      <h2 class="auth-card__title">Crea tu cuenta</h2>
      <p class="text-grey-7 q-mb-none">Tu colección será privada y estará sincronizada.</p>
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
          hint="Mínimo 6 caracteres"
          autocomplete="new-password"
          :rules="passwordRules"
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

        <q-input
          v-model="confirmation"
          outlined
          :type="showPassword ? 'text' : 'password'"
          label="Repite la contraseña"
          autocomplete="new-password"
          :rules="confirmationRules"
          lazy-rules
        >
          <template #prepend><q-icon name="lock_outline" /></template>
        </q-input>

        <q-btn
          class="full-width"
          unelevated
          color="primary"
          no-caps
          size="md"
          label="Crear cuenta"
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
        @click="registerWithGoogle"
      />
    </q-card-section>

    <q-card-section class="text-center q-pt-none">
      <span class="text-grey-7">¿Ya tienes cuenta? </span>
      <router-link
        class="text-link text-weight-medium"
        :to="authRoute('/login', route.query.redirect)"
        >Iniciar sesión</router-link
      >
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'
import { getFirebaseErrorMessage } from '@/utils/firebase-errors'
import { authDestination, authRoute } from '@/utils/auth-redirect'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const confirmation = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const googleLoading = ref(false)

const emailRules = [
  (value) => Boolean(value) || 'El correo es obligatorio.',
  (value) => /^\S+@\S+\.\S+$/.test(value) || 'Introduce un correo válido.',
]
const passwordRules = [
  (value) => Boolean(value) || 'La contraseña es obligatoria.',
  (value) => value.length >= 6 || 'Debe tener al menos 6 caracteres.',
]
const confirmationRules = computed(() => [
  (value) => Boolean(value) || 'Repite la contraseña.',
  (value) => value === password.value || 'Las contraseñas no coinciden.',
])

async function submit() {
  submitting.value = true
  try {
    await authStore.register(email.value, password.value)
    $q.notify({ type: 'positive', message: 'Cuenta creada. Tu biblioteca está lista.' })
    await router.replace(authDestination(route.query.redirect))
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getFirebaseErrorMessage(error, 'No hemos podido crear la cuenta.'),
    })
  } finally {
    submitting.value = false
  }
}

async function registerWithGoogle() {
  googleLoading.value = true
  try {
    await authStore.loginWithGoogle()
    await router.replace(authDestination(route.query.redirect))
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
