<script setup>
const betaUrl = 'https://mangalist-61bb8.web.app'
const benefits = [
  [
    '01',
    'Recuerda el capítulo.',
    'Guarda dónde lo dejaste, también si es un especial o un capítulo con decimales. Retoma la historia a tu ritmo.',
  ],
  [
    '02',
    'Dale orden a tu lista.',
    'Separa lo que sigues, lo pendiente y lo terminado. Combina búsqueda, tipos y géneros para encontrar tu próxima lectura.',
  ],
  [
    '03',
    'Reúne tus fuentes.',
    'Conserva varios enlaces por obra y elige uno principal. Tu siguiente capítulo está en la web donde lo lees.',
  ],
]
const questions = [
  [
    '¿Puedo leer manga dentro de MangaList?',
    'MangaList organiza tu biblioteca y tus enlaces. No aloja capítulos ni incluye un catálogo de lectura: continúas leyendo en tus fuentes externas.',
  ],
  [
    '¿Necesito una cuenta?',
    'Para guardar y sincronizar tu biblioteca, sí. La Beta ofrece acceso con correo y contraseña o Google. Esta página y la documentación se pueden consultar sin iniciar sesión.',
  ],
  [
    '¿Funciona en el móvil y sin conexión?',
    'La aplicación se adapta a móvil y escritorio y se puede instalar como PWA en navegadores compatibles. La sincronización requiere conexión; los borradores locales opcionales no sustituyen una copia de seguridad.',
  ],
  [
    '¿Puedo traer mi lista o guardar una copia?',
    'Puedes importar JSON, CSV y TXT y revisar una vista previa antes de confirmar. Puedes exportar JSON y CSV; JSON conserva toda la información de la biblioteca.',
  ],
  [
    '¿Qué significa que está en Beta?',
    'El producto sigue en desarrollo y puede cambiar. Guarda copias de tu biblioteca y consulta la guía y el roadmap para conocer las funciones y los límites actuales.',
  ],
]
</script>

<template>
  <div class="ml-landing">
    <nav class="lp-section-nav" aria-label="En esta portada">
      <span>UNA BIBLIOTECA. MUCHAS HISTORIAS.</span>
      <div>
        <a href="#beneficios">Por qué MangaList</a><a href="#demo">Ver la aplicación</a
        ><a href="#preguntas">Preguntas</a>
      </div>
    </nav>

    <section id="sobre-mangalist" class="lp-hero" aria-labelledby="landing-title">
      <div class="lp-hero-copy">
        <p class="lp-eyebrow"><span class="lp-beta">BETA</span> TU ESPACIO DE LECTURA</p>
        <h1 id="landing-title">Cada lectura,<br />en su <em>sitio.</em></h1>
        <p class="lp-lead">Más historias.<br />Menos «¿por dónde iba?».</p>
        <p class="lp-description">
          Organiza tu manga, manhwa y manhua. Guarda el último capítulo y vuelve a tus fuentes de
          lectura desde un mismo lugar.
        </p>
        <div class="lp-actions">
          <a class="lp-button lp-primary" :href="betaUrl"
            >Abrir MangaList Beta <span aria-hidden="true">↗</span></a
          >
          <a class="lp-text-link" href="#demo"
            >Echar un vistazo <span aria-hidden="true">↓</span></a
          >
        </div>
        <p class="lp-small">Tu biblioteca personal · Web y PWA · Sin catálogo de capítulos</p>
      </div>
      <figure class="lp-hero-art">
        <div class="lp-edition" aria-hidden="true">
          <span>MANGA / MANHWA / MANHUA</span><span>VOL. 01</span>
        </div>
        <div class="lp-paper-stack">
          <div class="lp-cover-word" aria-hidden="true">CONTINUAR<br /><span>LEYENDO.</span></div>
          <img
            src="/screenshots/library-desktop.jpg"
            width="1265"
            height="712"
            fetchpriority="high"
            alt="Biblioteca de MangaList: búsqueda, filtros, favoritos y capítulo actual en cada obra de prueba."
          />
          <div class="lp-art-footer" aria-hidden="true">
            <span>HISTORIAS POR CONTINUAR</span><span>↗</span>
          </div>
        </div>
        <figcaption>
          La aplicación real, con obras sintéticas de prueba. Captura de una revisión anterior de la
          Beta.
        </figcaption>
      </figure>
    </section>

    <section id="beneficios" class="lp-section" aria-labelledby="benefits-title">
      <div class="lp-section-heading">
        <p class="lp-eyebrow">01 / A TU RITMO</p>
        <h2 id="benefits-title">Tu lista crece.<br /><em>El orden se queda.</em></h2>
        <p>De esa recomendación que no quieres perder a la serie que sigues cada semana.</p>
      </div>
      <div class="lp-benefits">
        <article v-for="[number, title, description] in benefits" :key="number">
          <span class="lp-number">{{ number }}</span>
          <h3>{{ title }}</h3>
          <p>{{ description }}</p>
        </article>
      </div>
    </section>

    <section id="demo" class="lp-section lp-demo" aria-labelledby="demo-title">
      <div class="lp-section-heading">
        <p class="lp-eyebrow">02 / POR DENTRO</p>
        <h2 id="demo-title">Así se ve tu<br /><em>próximo capítulo.</em></h2>
        <p>
          Capturas auténticas de la interfaz. Los títulos «AUDITORÍA» son datos de prueba, no
          bibliotecas personales.
        </p>
      </div>
      <div class="lp-demo-grid">
        <figure class="lp-demo-library">
          <div class="lp-shot-header">
            <span>BIBLIOTECA / ESCRITORIO</span
            ><a href="/screenshots/library-desktop.jpg"
              >Ampliar captura <span class="ml-sr-only">de la biblioteca</span
              ><span aria-hidden="true">↗</span></a
            >
          </div>
          <img
            src="/screenshots/library-desktop.jpg"
            width="1265"
            height="712"
            loading="lazy"
            alt="Vista de escritorio de la biblioteca con cuatro obras de prueba, filtros por estado, tipo y género y seguimiento de capítulos."
          />
          <figcaption>
            Encuentra una obra y comprueba dónde la dejaste.
            <a href="/screenshots/library-mobile.jpg">Ver la captura móvil completa</a>.
          </figcaption>
        </figure>
        <figure class="lp-demo-import">
          <div class="lp-shot-header">
            <span>IMPORTAR / EXPORTAR</span
            ><a href="/screenshots/import-preview.jpg"
              >Ampliar captura <span class="ml-sr-only">de importación</span
              ><span aria-hidden="true">↗</span></a
            >
          </div>
          <img
            src="/screenshots/import-preview.jpg"
            width="804"
            height="1167"
            loading="lazy"
            alt="Previsualización real de importación: una obra nueva, un duplicado y un error, con selección antes de confirmar y exportación JSON o CSV."
          />
          <figcaption>Revisa antes de importar. Conserva una copia al exportar.</figcaption>
        </figure>
      </div>
      <p class="lp-demo-note">
        Las capturas documentan la revisión del 16/10/2026; la Beta puede haber evolucionado.
        <a href="/guide/introduction">Consulta las funciones actuales en la guía →</a>
      </p>
    </section>

    <section class="lp-how lp-section" aria-labelledby="how-title">
      <div>
        <p class="lp-eyebrow">03 / EMPIEZA POR UNA HISTORIA</p>
        <h2 id="how-title">Del «lo apunto»<br />al «lo continúo».</h2>
      </div>
      <ol>
        <li><strong>Entra en la Beta.</strong><span>Crea tu cuenta o inicia sesión.</span></li>
        <li>
          <strong>Añade tu primera obra.</strong
          ><span>Guarda su título, el capítulo y tus enlaces, o importa tu lista.</span>
        </li>
        <li>
          <strong>Vuelve cuando quieras seguir.</strong
          ><span>Busca la obra y abre tu fuente de lectura.</span>
        </li>
      </ol>
    </section>

    <section id="preguntas" class="lp-section lp-faq" aria-labelledby="faq-title">
      <div class="lp-section-heading">
        <p class="lp-eyebrow">04 / ANTES DE EMPEZAR</p>
        <h2 id="faq-title">Unas páginas<br /><em>de contexto.</em></h2>
        <p>Lo que conviene saber antes de guardar tu primera lectura.</p>
      </div>
      <div class="lp-questions">
        <details v-for="[question, answer] in questions" :key="question">
          <summary>{{ question }}</summary>
          <p>{{ answer }}</p>
        </details>
        <a class="lp-text-link" href="/guide/introduction"
          >Leer la guía completa <span aria-hidden="true">→</span></a
        >
      </div>
    </section>

    <section class="lp-final" aria-labelledby="cta-title">
      <p class="lp-eyebrow">EL MARCAPÁGINAS DE TUS HISTORIAS</p>
      <h2 id="cta-title">La próxima lectura<br />ya tiene <em>su sitio.</em></h2>
      <a class="lp-button" :href="betaUrl"
        >Empezar en MangaList Beta <span aria-hidden="true">↗</span></a
      >
      <p>Aplicación en desarrollo. Tú eliges qué leer y dónde.</p>
    </section>
    <nav class="lp-footer-links" aria-label="Recursos del proyecto">
      <a href="/project/">Portal técnico</a><a href="/roadmap/">Roadmap</a
      ><a href="/reports/">Informes y evidencias</a
      ><a href="https://github.com/ShadowStudioEnterprise/manga-list">Código fuente</a>
    </nav>
  </div>
</template>
