<template>
  <q-card flat bordered>
    <q-card-section>
      <h2 class="text-h6 text-weight-bold q-my-none">Acceso y seguridad</h2>
      <p class="q-mt-sm q-mb-sm ellipsis">{{ authStore.user?.email }}</p>
      <p class="text-caption">Métodos de acceso: {{ methods }}</p>
      <div class="row q-gutter-sm">
        <q-btn outline no-caps label="Cambiar correo" :disable="busy" @click="open('email')" />
        <q-btn
          v-if="usesPassword"
          outline
          no-caps
          label="Cambiar contraseña ahora"
          :disable="busy"
          @click="open('password')"
        />
        <q-btn
          v-else
          outline
          no-caps
          label="Añadir contraseña"
          :disable="busy"
          @click="open('linkPassword')"
        />
        <q-btn
          v-if="!usesGoogle"
          outline
          no-caps
          label="Vincular Google"
          :disable="busy"
          @click="open('google')"
        />
        <q-btn
          flat
          no-caps
          label="Actualizar datos de acceso"
          :loading="refreshing"
          :disable="busy"
          @click="refreshIdentity"
        />
      </div>
      <p class="text-caption q-mt-md q-mb-none">
        Los métodos vinculados abren la misma biblioteca. No se fusionan cuentas existentes.
      </p>
      <p v-if="notice" role="status" class="q-mt-md q-mb-none">{{ notice }}</p>
    </q-card-section>
    <q-dialog
      v-model="dialog"
      :persistent="busy"
      aria-labelledby="credential-title"
      @hide="clearSecrets"
    >
      <q-card class="dialog-card">
        <q-form @submit="submit">
          <q-card-section>
            <h2 id="credential-title" class="text-h6 q-my-none">{{ title }}</h2>
            <p v-if="action === 'email'">
              Enviaremos un enlace a tu nuevo correo. Tu dirección cambiará después de verificarlo.
              Al volver, pulsa «Actualizar datos de acceso» o inicia sesión de nuevo.
            </p>
            <p v-if="action === 'google'">
              Elige la cuenta Google que quieras vincular. Si pertenece a otra cuenta de MangaList,
              el cambio se rechazará.
            </p>
            <p v-if="!usesPassword">Google abrirá una ventana para confirmar tu identidad.</p>
          </q-card-section>
          <q-card-section class="q-gutter-md">
            <q-input
              v-if="usesPassword"
              v-model="currentPassword"
              outlined
              type="password"
              label="Contraseña actual"
              autocomplete="current-password"
              :disable="busy"
              :rules="[required]"
            />
            <q-input
              v-if="action === 'email'"
              v-model.trim="newEmail"
              outlined
              type="email"
              label="Nuevo correo electrónico"
              autocomplete="email"
              :disable="busy"
              :rules="[required]"
            />
            <template v-if="action === 'password' || action === 'linkPassword'">
              <q-input
                v-model="newPassword"
                outlined
                type="password"
                label="Nueva contraseña"
                autocomplete="new-password"
                :disable="busy"
                :rules="[(value) => value.length >= 6 || 'Utiliza al menos 6 caracteres.']"
              />
              <q-input
                v-model="confirmation"
                outlined
                type="password"
                label="Confirmar nueva contraseña"
                autocomplete="new-password"
                :disable="busy"
                :rules="[(value) => value === newPassword || 'Las contraseñas no coinciden.']"
              />
            </template>
            <q-banner v-if="error" role="alert" rounded class="bg-red-1 text-negative">{{
              error
            }}</q-banner>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps label="Cancelar" :disable="busy" @click="dialog = false" />
            <q-btn
              unelevated
              no-caps
              color="primary"
              label="Confirmar cambio"
              type="submit"
              :loading="busy"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth-store'
import { serializeAuthUser } from '@/services/auth-service'
import {
  addGoogleAccess,
  addPasswordAccess,
  changeAccountPassword,
  refreshAccountIdentity,
  requestAccountEmailChange,
} from '@/services/credential-service'
import { getFirebaseErrorMessage } from '@/utils/firebase-errors'

const authStore = useAuthStore()
const dialog = ref(false)
const action = ref('email')
const busy = ref(false)
const refreshing = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmation = ref('')
const newEmail = ref('')
const error = ref('')
const notice = ref('')
const usesPassword = computed(() => authStore.user?.providerIds?.includes('password'))
const usesGoogle = computed(() => authStore.user?.providerIds?.includes('google.com'))
const methods = computed(() =>
  [usesPassword.value && 'Email y contraseña', usesGoogle.value && 'Google']
    .filter(Boolean)
    .join(', '),
)
const title = computed(
  () =>
    ({
      email: 'Cambiar correo',
      password: 'Cambiar contraseña ahora',
      linkPassword: 'Añadir contraseña',
      google: 'Vincular Google',
    })[action.value],
)
const required = (value) => Boolean(value) || 'Completa este campo.'

watch(
  () => authStore.user?.uid,
  () => {
    dialog.value = false
    clearSecrets()
    notice.value = ''
  },
)

function clearSecrets() {
  currentPassword.value = ''
  newPassword.value = ''
  confirmation.value = ''
  newEmail.value = ''
  error.value = ''
}

function open(value) {
  clearSecrets()
  notice.value = ''
  action.value = value
  dialog.value = true
}

async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    let user
    if (action.value === 'email')
      user = await requestAccountEmailChange(currentPassword.value, newEmail.value)
    else if (action.value === 'password')
      user = await changeAccountPassword(currentPassword.value, newPassword.value)
    else if (action.value === 'linkPassword')
      user = await addPasswordAccess(currentPassword.value, newPassword.value)
    else user = await addGoogleAccess(currentPassword.value)
    if (authStore.user?.uid === user.uid) authStore.user = serializeAuthUser(user)
    notice.value =
      action.value === 'email'
        ? 'Enlace enviado al nuevo correo. La dirección actual se conserva hasta completar la verificación.'
        : 'Acceso actualizado. Tu biblioteca se conserva.'
    dialog.value = false
    clearSecrets()
  } catch (cause) {
    error.value = getFirebaseErrorMessage(cause, 'No se ha podido actualizar el acceso.')
    currentPassword.value = ''
    newPassword.value = ''
    confirmation.value = ''
  } finally {
    busy.value = false
  }
}

async function refreshIdentity() {
  if (busy.value || refreshing.value) return
  refreshing.value = true
  try {
    const user = await refreshAccountIdentity()
    if (authStore.user?.uid === user.uid) authStore.user = serializeAuthUser(user)
    notice.value = 'Datos de acceso actualizados.'
  } catch (cause) {
    notice.value = getFirebaseErrorMessage(
      cause,
      'No se han podido actualizar los datos de acceso.',
    )
  } finally {
    refreshing.value = false
  }
}
</script>
