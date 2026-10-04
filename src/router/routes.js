const routes = [
  {
    path: '/',
    redirect: '/library',
  },
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { guestOnly: true },
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/pages/auth/LoginPage.vue'),
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/pages/auth/RegisterPage.vue'),
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: () => import('@/pages/auth/ForgotPasswordPage.vue'),
      },
    ],
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'library',
        name: 'library',
        component: () => import('@/pages/LibraryPage.vue'),
      },
      {
        path: 'add',
        name: 'add-manga',
        component: () => import('@/pages/AddMangaPage.vue'),
      },
      {
        path: 'manga/:id',
        name: 'manga-detail',
        component: () => import('@/pages/MangaDetailPage.vue'),
        props: true,
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/pages/SettingsPage.vue'),
      },
      {
        path: 'settings/import-export',
        name: 'import-export',
        component: () => import('@/pages/ImportExportPage.vue'),
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
]

export default routes
