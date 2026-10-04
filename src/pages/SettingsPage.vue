<template>
  <q-page class="page-shell settings-page">
    <header class="page-heading">
      <p class="eyebrow text-primary q-mb-xs">Personaliza MangaList</p>
      <h1 class="page-title q-my-none">Ajustes</h1>
      <p class="page-subtitle q-mb-none">Gestiona tu cuenta, tus datos y el acceso rápido.</p>
    </header>

    <div class="settings-stack q-mt-lg">
      <q-card flat bordered>
        <q-card-section class="row items-center q-gutter-md">
          <q-avatar size="52px" color="primary" text-color="white" icon="person" />
          <div class="col min-width-0">
            <h2 class="text-h6 text-weight-bold q-my-none">Tu cuenta</h2>
            <p class="text-grey-7 ellipsis q-mb-none">{{ authStore.user?.email }}</p>
          </div>
        </q-card-section>
        <q-separator />
        <q-list separator>
          <q-item clickable to="/settings/import-export">
            <q-item-section avatar><q-icon name="swap_vert" color="primary" /></q-item-section>
            <q-item-section>
              <q-item-label>Importar o exportar datos</q-item-label>
              <q-item-label caption>Descarga una copia o trae otra biblioteca.</q-item-label>
            </q-item-section>
            <q-item-section side><q-icon name="chevron_right" /></q-item-section>
          </q-item>
          <q-item v-if="usesPassword" clickable @click="sendPasswordReset">
            <q-item-section avatar><q-icon name="lock_reset" color="primary" /></q-item-section>
            <q-item-section>
              <q-item-label>Cambiar contraseña</q-item-label>
              <q-item-label caption>Recibirás un enlace seguro por correo.</q-item-label>
            </q-item-section>
            <q-item-section side><q-spinner v-if="sendingReset" size="20px" /></q-item-section>
          </q-item>
          <q-item clickable @click="logout">
            <q-item-section avatar><q-icon name="logout" color="primary" /></q-item-section>
            <q-item-section>
              <q-item-label>Cerrar sesión</q-item-label>
              <q-item-label caption>La biblioteca seguirá sincronizada.</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <q-card flat bordered>
        <q-card-section>
          <div class="row items-center q-gutter-sm">
            <q-avatar icon="bookmark_add" color="secondary" text-color="white" />
            <div>
              <h2 class="text-h6 text-weight-bold q-my-none">Marcador + MangaList</h2>
              <p class="text-caption text-grey-7 q-mb-none">Guarda una obra desde cualquier web.</p>
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <ol class="bookmarklet-steps q-mt-none">
            <li>Arrastra el botón a la barra de marcadores de tu navegador.</li>
            <li>Cuando estés leyendo, pulsa <strong>+ MangaList</strong>.</li>
            <li>Revisa el título, URL y capítulo detectado antes de guardar.</li>
          </ol>

          <div class="row q-gutter-sm items-center">
            <a
              :href="bookmarkletCode"
              class="bookmarklet-button"
              draggable="true"
              title="Arrastra este botón a tu barra de marcadores"
            >
              <q-icon name="add" /> MangaList
            </a>
            <q-btn
              flat
              no-caps
              icon="content_copy"
              label="Copiar código"
              @click="copyBookmarklet"
            />
          </div>
          <p class="text-caption text-grey-7 q-mt-md q-mb-none">
            MangaList solo recibe el título y la URL visibles en la pestaña; no realiza scraping.
          </p>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="danger-card">
        <q-card-section>
          <p class="eyebrow text-negative q-mb-xs">Zona peligrosa</p>
          <h2 class="text-h6 text-weight-bold q-my-none">Eliminar cuenta</h2>
          <p class="text-grey-7 q-mb-md">
            Borra de forma permanente tu biblioteca y tu usuario. Esta acción no se puede deshacer.
          </p>
          <q-btn
            outline
            color="negative"
            no-caps
            icon="delete_forever"
            label="Eliminar cuenta"
            @click="deleteDialog = true"
          />
        </q-card-section>
      </q-card>
    </div>

    <q-dialog v-model="deleteDialog" persistent aria-labelledby="delete-account-title">
      <q-card class="dialog-card">
        <q-form @submit="deleteAccount">
          <q-card-section class="row items-start no-wrap q-gutter-md">
            <q-avatar icon="warning" color="negative" text-color="white" />
            <div class="col">
              <div id="delete-account-title" class="text-h6">Eliminar tu cuenta</div>
              <p class="q-mb-none">Se borrarán todas tus obras y después tu acceso a MangaList.</p>
            </div>
          </q-card-section>
          <q-card-section class="q-gutter-md">
            <q-input
              v-if="usesPassword"
              v-model="deletePassword"
              outlined
              type="password"
              label="Contraseña actual *"
              autocomplete="current-password"
              :rules="[(value) => Boolean(value) || 'Introduce tu contraseña.']"
            />
            <q-input
              v-model.trim="deleteConfirmation"
              outlined
              label="Escribe ELIMINAR *"
              autocomplete="off"
              :rules="[(value) => value === 'ELIMINAR' || 'Escribe ELIMINAR en mayúsculas.']"
            />
            <q-banner rounded class="bg-red-1 text-negative">
              Si usas Google se abrirá una ventana para confirmar de nuevo tu identidad.
            </q-banner>
            <p v-if="deleting && deleteProgress" class="text-caption text-grey-7 q-mb-none">
              {{ deleteProgress }} obras eliminadas…
            </p>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn v-close-popup flat no-caps label="Cancelar" :disable="deleting" />
            <q-btn
              unelevated
              color="negative"
              no-caps
              label="Eliminar definitivamente"
              type="submit"
              :loading="deleting"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { buildBookmarkletCode } from '@/utils/bookmarklet-utils'
import { getFirebaseErrorMessage } from '@/utils/firebase-errors'
import { useAuthStore } from '@/stores/auth-store'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const sendingReset = ref(false)
const deleteDialog = ref(false)
const deleteConfirmation = ref('')
const deletePassword = ref('')
const deleting = ref(false)
const deleteProgress = ref(0)

const usesPassword = computed(() => authStore.user?.providerIds?.includes('password') ?? false)
const addPageUrl = `${window.location.origin}${window.location.pathname}#/add`
const bookmarkletCode = buildBookmarkletCode(addPageUrl)

async function sendPasswordReset() {
  sendingReset.value = true
  try {
    await authStore.resetPassword(authStore.user.email)
    $q.notify({
      type: 'positive',
      message: 'Te hemos enviado un enlace para cambiar la contraseña.',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getFirebaseErrorMessage(error, 'No se ha podido enviar el enlace.'),
    })
  } finally {
    sendingReset.value = false
  }
}

async function logout() {
  try {
    await authStore.logout()
    await router.replace('/login')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getFirebaseErrorMessage(error, 'No se ha podido cerrar la sesión.'),
    })
  }
}

async function copyBookmarklet() {
  try {
    await navigator.clipboard.writeText(bookmarkletCode)
    $q.notify({ type: 'positive', message: 'Código del marcador copiado.' })
  } catch {
    $q.notify({
      type: 'negative',
      message: 'No se ha podido copiar. Arrastra el botón directamente.',
    })
  }
}

async function deleteAccount() {
  deleting.value = true
  deleteProgress.value = 0
  try {
    await authStore.deleteCurrentAccount({
      password: deletePassword.value,
      onProgress: ({ deletedCount }) => {
        deleteProgress.value = deletedCount
      },
    })
    deleteDialog.value = false
    $q.notify({ type: 'positive', message: 'Tu cuenta y tus datos se han eliminado.' })
    await router.replace('/login')
  } catch (error) {
    let message = getFirebaseErrorMessage(error, 'No se ha podido eliminar la cuenta.')
    if (error?.firestoreDataDeleted) {
      message =
        'La biblioteca se eliminó, pero la cuenta sigue activa. Vuelve a intentarlo para completar el borrado.'
    } else if (error?.partialDataDeletion) {
      message = `Se eliminaron ${error.deletedCount} obras antes del fallo. Vuelve a intentarlo para completar el borrado.`
    }
    $q.notify({
      type: 'negative',
      timeout: 7000,
      message,
    })
  } finally {
    deleting.value = false
  }
}
</script>
