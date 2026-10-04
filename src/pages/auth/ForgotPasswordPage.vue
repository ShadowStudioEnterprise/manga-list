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
      <h2 class="auth-card__title">Restablecer contraseña</h2>
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
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import { authRoute } from '@/utils/auth-redirect'
import { useAuthStore } from '@/stores/auth-store'
import { getFirebaseErrorMessage } from '@/utils/firebase-errors'

const $q = useQuasar()
const route = useRoute()
const authStore = useAuthStore()
const email = ref('')
const submitting = ref(false)
const emailRules = [
  (value) => Boolean(value) || 'El correo es obligatorio.',
  (value) => /^\S+@\S+\.\S+$/.test(value) || 'Introduce un correo válido.',
]

async function submit() {
  submitting.value = true
  try {
    await authStore.resetPassword(email.value)
    $q.notify({
      type: 'positive',
      timeout: 6000,
      message: 'Si existe una cuenta con ese correo, recibirás un enlace en unos minutos.',
    })
  } catch (error) {
    if (error?.code === 'auth/user-not-found') {
      $q.notify({
        type: 'positive',
        timeout: 6000,
        message: 'Si existe una cuenta con ese correo, recibirás un enlace en unos minutos.',
      })
    } else {
      $q.notify({
        type: 'negative',
        message: getFirebaseErrorMessage(error, 'No se ha podido enviar el enlace.'),
      })
    }
  } finally {
    submitting.value = false
  }
}
</script>
