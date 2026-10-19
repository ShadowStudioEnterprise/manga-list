---
layout: home

hero:
  name: MangaList
  text: Documentación técnica
  tagline: Arquitectura, desarrollo y mantenimiento de MangaList.
  actions:
    - theme: brand
      text: Empezar
      link: /guide/introduction
    - theme: alt
      text: Ver repositorio
      link: https://github.com/ShadowStudioEnterprise/manga-list

features:
  - title: Arquitectura
    details: Vue 3, Quasar, Pinia y Firebase.
    link: /architecture/overview

  - title: Base de datos
    details: Firestore, consultas, paginación y sincronización.
    link: /database/firestore

  - title: Seguridad
    details: Autenticación, reglas y límites gratuitos de Firebase Spark.
    link: /security/spark

  - title: Desarrollo
    details: Instalación, configuración, pruebas y mantenimiento.
    link: /development/installation

  - title: Operaciones
    details: Despliegues, verificaciones y recuperación.
    link: /operations/deployment

  - title: Roadmap
    details: Evolución hacia MangaList 1.0.
    link: /roadmap/
---

# Sobre MangaList

MangaList es una aplicación para gestionar bibliotecas
personales de manga, manhwa y manhua.

Permite registrar obras, seguir capítulos, guardar fuentes
de lectura, filtrar colecciones e importar o exportar datos.

La aplicación utiliza Firebase Authentication y Cloud
Firestore, con restricciones orientadas al plan Spark.

Esta documentación se actualiza conforme evoluciona
el código del repositorio.

Consulta el [índice de informes técnicos](reports/index.md) para encontrar las
revisiones, verificaciones y propuestas agrupadas por tema.
