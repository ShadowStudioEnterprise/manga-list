import { defineConfig } from 'vitepress'
import { cpSync } from 'node:fs'
import { resolve } from 'node:path'
import { reportsSidebar } from './reports.mts'

export default defineConfig({
  lang: 'es-ES',
  title: 'MangaList Docs',
  description: 'Documentación técnica de MangaList',
  cleanUrls: true,
  lastUpdated: true,
  // Keep the historical reports' relative JSON download links available.
  buildEnd(siteConfig) {
    cpSync(resolve(siteConfig.srcDir, 'measurements'), resolve(siteConfig.outDir, 'measurements'), {
      recursive: true,
    })
  },

  themeConfig: {
    siteTitle: 'MangaList Docs',

    nav: [
      { text: 'Inicio', link: '/' },
      { text: 'Guía', link: '/guide/introduction' },
      { text: 'Arquitectura', link: '/architecture/overview' },
      { text: 'Roadmap', link: '/roadmap/' },
      { text: 'Informes', link: '/reports/' },
      {
        text: 'Aplicación',
        link: 'https://mangalist-61bb8.web.app',
      },
    ],

    sidebar: {
      '/reports/': reportsSidebar,
      '/': [
        {
          text: 'Introducción',
          items: [{ text: 'Visión general', link: '/guide/introduction' }],
        },
        {
          text: 'Arquitectura',
          items: [
            { text: 'Sistema', link: '/architecture/overview' },
            { text: 'Firestore', link: '/database/firestore' },
          ],
        },
        {
          text: 'Seguridad',
          items: [{ text: 'Firebase Spark', link: '/security/spark' }],
        },
        {
          text: 'Desarrollo',
          items: [{ text: 'Instalación', link: '/development/installation' }],
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
    },

    footer: {
      message: 'Proyecto MangaList',
      copyright: 'Documentación del proyecto MangaList',
    },
  },
})
