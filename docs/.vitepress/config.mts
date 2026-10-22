import { defineConfig } from 'vitepress'
import { cpSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { reportsSidebar } from './reports.mts'
import { legalNoticesPlugin } from '../../scripts/legal-notices.mjs'

export default defineConfig({
  vite: { plugins: [legalNoticesPlugin(resolve(import.meta.dirname, '../..'))] },
  lang: 'es-ES',
  title: 'MangaList Docs',
  description: 'Guía, arquitectura y desarrollo de tu biblioteca privada de lecturas.',
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/mangalist.svg' }]],
  cleanUrls: true,
  lastUpdated: true,
  // Keep the historical reports' relative JSON download links available.
  buildEnd(siteConfig) {
    cpSync(resolve(siteConfig.srcDir, 'measurements'), resolve(siteConfig.outDir, 'measurements'), {
      recursive: true,
    })
    // These public report downloads keep their existing relative URLs.
    for (const file of [
      'reports/accounts/ml-11-rules-audit.json',
      'reports/accounts/ml-12-rules-audit.json',
    ]) {
      const target = resolve(siteConfig.outDir, file)
      mkdirSync(dirname(target), { recursive: true })
      cpSync(resolve(siteConfig.srcDir, file), target)
    }
  },

  themeConfig: {
    logo: { src: '/mangalist.svg', alt: '' },
    siteTitle: 'MangaList Docs',
    outline: { label: 'En esta página' },
    docFooter: { prev: 'Anterior', next: 'Siguiente' },
    lastUpdated: { text: 'Última actualización' },
    sidebarMenuLabel: 'Secciones',
    darkModeSwitchLabel: 'Apariencia',
    lightModeSwitchTitle: 'Cambiar a modo claro',
    darkModeSwitchTitle: 'Cambiar a modo oscuro',
    skipToContentLabel: 'Saltar al contenido',
    returnToTopLabel: 'Volver arriba',

    nav: [
      { text: 'Guía', link: '/guide/introduction' },
      {
        text: 'Referencia',
        items: [
          { text: 'Arquitectura', link: '/architecture/overview' },
          { text: 'Diagramas técnicos', link: '/architecture/diagrams' },
          { text: 'Contratos internos', link: '/reference/services' },
          { text: 'Auditoría documental', link: '/maintenance/documentation-audit' },
          { text: 'Base de datos', link: '/database/firestore' },
          { text: 'Seguridad', link: '/security/spark' },
          { text: 'Desarrollo', link: '/development/installation' },
          { text: 'Operaciones', link: '/operations/deployment' },
        ],
      },
      {
        text: 'Proyecto',
        items: [
          { text: 'Roadmap', link: '/roadmap/' },
          { text: 'Informes', link: '/reports/' },
        ],
      },
      {
        text: 'Aplicación',
        link: 'https://mangalist-61bb8.web.app',
      },
    ],

    sidebar: {
      '/reports/': reportsSidebar,
      '/': [
        {
          text: 'Empezar',
          items: [
            { text: 'Visión general', link: '/guide/introduction' },
            { text: 'Instalación', link: '/development/installation' },
          ],
        },
        {
          text: 'Arquitectura',
          items: [
            { text: 'Sistema', link: '/architecture/overview' },
            { text: 'Diagramas técnicos', link: '/architecture/diagrams' },
            { text: 'Firestore', link: '/database/firestore' },
            { text: 'Servicios y errores', link: '/reference/services' },
            { text: 'Sincronización y Pinia', link: '/reference/synchronization' },
            { text: 'Importación y exportación', link: '/reference/import-export' },
            { text: 'Vigencia documental', link: '/maintenance/documentation-audit' },
          ],
        },
        {
          text: 'Seguridad',
          items: [{ text: 'Firebase Spark', link: '/security/spark' }],
        },
        {
          text: 'Operaciones',
          items: [{ text: 'Despliegues', link: '/operations/deployment' }],
        },
        {
          text: 'Proyecto',
          items: [{ text: 'Roadmap 1.0', link: '/roadmap/' }],
        },
        { text: 'Informes', items: [{ text: 'Índice de informes', link: '/reports/' }] },
      ],
    },

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/ShadowStudioEnterprise/manga-list',
      },
    ],

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: 'Buscar', buttonAriaLabel: 'Buscar en la documentación' },
              modal: {
                noResultsText: 'No se han encontrado resultados',
                resetButtonTitle: 'Borrar búsqueda',
                displayDetails: 'Mostrar detalles',
                backButtonTitle: 'Cerrar búsqueda',
                footer: { selectText: 'seleccionar', navigateText: 'navegar', closeText: 'cerrar' },
              },
            },
          },
        },
      },
    },

    footer: {
      message: 'Proyecto MangaList · <a href="/legal/index.html">Licencias de software</a>',
      copyright: 'Documentación del proyecto MangaList',
    },
  },
})
