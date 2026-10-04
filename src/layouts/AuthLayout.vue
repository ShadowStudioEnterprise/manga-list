<template>
  <q-layout view="hHh lpR fFf" class="auth-layout">
    <q-page-container>
      <q-page class="auth-page row items-stretch">
        <section class="auth-hero col-12 col-md-5 column justify-between q-pa-xl">
          <router-link class="brand-link" to="/login" aria-label="Ir al inicio de MangaList">
            <q-icon name="auto_stories" size="32px" />
            <span>MangaList</span>
          </router-link>

          <div class="auth-hero__copy">
            <p class="eyebrow">Tu biblioteca, siempre contigo</p>
            <h1>Nunca vuelvas a olvidar por qué capítulo ibas.</h1>
            <p>
              Guarda tus mangas, manhwas y manhuas, continúa leyendo en un toque y sincroniza tu
              progreso entre dispositivos.
            </p>
          </div>

          <p class="auth-hero__footer">Privado por diseño · Simple por elección</p>
        </section>

        <section class="auth-panel col-12 col-md-7 flex flex-center q-pa-md q-pa-sm-xl">
          <div class="auth-panel__content">
            <q-banner v-if="!isFirebaseConfigured" rounded class="bg-orange-1 text-warning q-mb-md">
              <template #avatar><q-icon name="settings_alert" /></template>
              Firebase aún no está configurado. Copia <code>.env.example</code> a
              <code>.env</code> y añade las credenciales de tu proyecto.
            </q-banner>
            <router-view />
          </div>
        </section>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { isFirebaseConfigured } from '@/boot/firebase'
</script>
