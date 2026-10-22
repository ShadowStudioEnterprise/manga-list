<script setup>
const sections = [
  [
    '01',
    'Arquitectura',
    'Entiende cómo encajan la aplicación, la sesión y la sincronización.',
    '/architecture/overview',
    'Vue · Quasar · Pinia',
  ],
  [
    '02',
    'Base de datos',
    'Explora el modelo de obras, las consultas y los límites de lectura.',
    '/database/firestore',
    'Modelo · Consultas',
  ],
  [
    '03',
    'Seguridad',
    'Conoce las restricciones y el inventario de servicios del plan Spark.',
    '/security/spark',
    'Privacidad · Spark',
  ],
  [
    '04',
    'Desarrollo',
    'Prepara el entorno y encuentra el camino para contribuir.',
    '/development/installation',
    'Instalación · Pruebas',
  ],
  [
    '05',
    'Operaciones',
    'Consulta los procedimientos de verificación y mantenimiento.',
    '/operations/deployment',
    'Verificación · Recuperación',
  ],
  [
    '06',
    'Roadmap',
    'Sigue las decisiones y el trabajo pendiente hacia la versión 1.0.',
    '/roadmap/',
    'Proyecto · Evolución',
  ],
]
</script>

<template>
  <div class="ml-portal">
    <section id="sobre-mangalist" class="ml-hero" aria-labelledby="portal-title">
      <div class="ml-hero-copy">
        <p class="ml-eyebrow">MANGALIST / DOCUMENTACIÓN</p>
        <h1 id="portal-title">Cada lectura,<br />en su <span>sitio.</span></h1>
        <p class="ml-lead">
          Tu biblioteca de manga, manhwa y manhua. Privada, organizada y siempre con el último
          capítulo a mano.
        </p>
        <p class="ml-hero-detail">
          Descubre cómo funciona MangaList y cómo contribuir a su desarrollo.
        </p>
        <div class="ml-actions">
          <a class="ml-button ml-primary" href="/guide/introduction"
            >Explorar la guía <span aria-hidden="true">↗</span></a
          >
          <a
            class="ml-button ml-secondary"
            href="https://mangalist-61bb8.web.app"
            target="_blank"
            rel="noopener noreferrer"
            >Abrir MangaList <span class="ml-sr-only">(nueva pestaña)</span
            ><span aria-hidden="true">↗</span></a
          >
        </div>
        <ul class="ml-principles" aria-label="Sobre el producto">
          <li>Biblioteca personal</li>
          <li>Seguimiento de capítulos</li>
          <li>Web y PWA</li>
        </ul>
      </div>
      <div class="ml-scene" aria-hidden="true">
        <div class="ml-scene-label">TU PRÓXIMO CAPÍTULO EMPIEZA AQUÍ</div>
        <div class="ml-library">
          <div class="ml-library-top">
            <span class="ml-mini-brand">M<span>↗</span></span
            ><span>Mi biblioteca</span><span class="ml-library-dots">•••</span>
          </div>
          <div class="ml-library-heading">
            Historias por continuar<span>3 lecturas · ejemplo ilustrativo</span>
          </div>
          <div class="ml-book-row">
            <div class="ml-cover ml-cover-one">
              <span>01</span><b>ÓRBITA<br />DE PAPEL</b>
            </div>
            <div>
              <span class="ml-book-type">MANGA</span><strong>Órbita de papel</strong
              ><span>Capítulo 24</span>
            </div>
            <span class="ml-reading-dot"></span>
          </div>
          <div class="ml-book-row">
            <div class="ml-cover ml-cover-two">
              <span>02</span><b>JARDÍN<br />LUNAR</b>
            </div>
            <div>
              <span class="ml-book-type">MANHWA</span><strong>Jardín lunar</strong
              ><span>Capítulo 12.5</span>
            </div>
            <span class="ml-reading-dot"></span>
          </div>
          <div class="ml-book-row">
            <div class="ml-cover ml-cover-three">
              <span>03</span><b>RUTAS<br />DEL SOL</b>
            </div>
            <div>
              <span class="ml-book-type">MANHUA</span><strong>Rutas del sol</strong
              ><span>Capítulo 08</span>
            </div>
            <span class="ml-reading-dot"></span>
          </div>
          <div class="ml-library-bottom">Tus historias. Tu ritmo. <span>↗</span></div>
        </div>
        <span class="ml-scene-note">Un lugar para recordar dónde lo dejaste.</span>
      </div>
    </section>

    <section class="ml-explore" aria-labelledby="explore-title">
      <div class="ml-section-heading">
        <div>
          <p class="ml-eyebrow">EL MAPA DEL PROYECTO</p>
          <h2 id="explore-title">Encuentra tu punto de partida.</h2>
        </div>
        <p>De la primera instalación<br />a los detalles del sistema.</p>
      </div>
      <div class="ml-section-grid">
        <a
          v-for="[number, title, description, link, topics] in sections"
          :key="number"
          class="ml-section-card"
          :href="link"
        >
          <div class="ml-card-top">
            <span>{{ number }}</span
            ><span aria-hidden="true">↗</span>
          </div>
          <h3>{{ title }}</h3>
          <p>{{ description }}</p>
          <span class="ml-card-topics">{{ topics }}</span>
        </a>
      </div>
    </section>

    <section class="ml-evidence" aria-labelledby="evidence-title">
      <div>
        <p class="ml-eyebrow">DECISIONES CON CONTEXTO</p>
        <h2 id="evidence-title">El proyecto, por dentro.</h2>
        <p>
          Revisiones, propuestas y evidencias agrupadas por tema. Cada informe conserva su fecha y
          sus límites; no certifica por sí solo la versión publicada.
        </p>
      </div>
      <a class="ml-button ml-secondary" href="/reports/"
        >Consultar los informes <span aria-hidden="true">↗</span></a
      >
    </section>
    <p class="ml-portal-note">
      Este portal es público y estático. No accede a tu biblioteca ni requiere iniciar sesión.
    </p>
  </div>
</template>
