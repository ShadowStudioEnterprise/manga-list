<template>
  <q-card flat bordered class="auth-card">
    <q-card-section class="q-pb-none">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        :to="authRoute('/login', route.query.redirect)"
        aria-label="Volver al login"
      />
      <p class="eyebrow text-primary q-mt-lg q-mb-sm">Recupera el acceso</p>
      <h1 class="auth-card__title">Restablecer contraseña</h1>
      <p class="text-grey-7 q-mb-none">
        Te enviaremos un enlace si el correo pertenece a una cuenta.
      </p>
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

        <q-btn
          class="full-width"
          unelevated
          color="primary"
          no-caps
          label="Enviar enlace"
          type="submit"
          :loading="submitting"
        />
      </q-form>
      <div role="status">
        <p v-if="notice" class="text-positive q-mt-md q-mb-none">{{ notice }}</p>
      </div>
      <div role="alert">
        <p v-if="errorMessage" class="text-negative q-mt-md q-mb-none">{{ errorMessage }}</p>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { authRoute } from '@/utils/auth-redirect'
import { useAuthStore } from '@/stores/auth-store'
import { getFirebaseErrorMessage } from '@/utils/firebase-errors'

const route = useRoute()
const authStore = useAuthStore()
const email = ref('')
const submitting = ref(false)
const notice = ref('')
const errorMessage = ref('')
const genericNotice = 'Si existe una cuenta con ese correo, recibirás un enlace en unos minutos.'
const emailRules = [
  (value) => Boolean(value) || 'El correo es obligatorio.',
  (value) => /^\S+@\S+\.\S+$/.test(value) || 'Introduce un correo válido.',
]

async function submit() {
  notice.value = ''
  errorMessage.value = ''
  submitting.value = true
  try {
    await authStore.resetPassword(email.value)
    notice.value = genericNotice
  } catch (error) {
    if (error?.code === 'auth/user-not-found') {
      notice.value = genericNotice
    } else {
      errorMessage.value = getFirebaseErrorMessage(error, 'No se ha podido enviar el enlace.')
    }
  } finally {
    submitting.value = false
  }
}
</script>
