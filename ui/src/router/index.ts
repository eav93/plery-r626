import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/pages/DashboardPage.vue'),
    },
    {
      path: '/network/lan',
      name: 'lan',
      component: () => import('@/pages/LanPage.vue'),
    },
    {
      path: '/network/wan',
      name: 'wan',
      component: () => import('@/pages/WanPage.vue'),
    },
    {
      path: '/network/wifi',
      name: 'wifi',
      component: () => import('@/pages/WifiPage.vue'),
    },
    {
      path: '/system/reboot',
      name: 'reboot',
      component: () => import('@/pages/RebootPage.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
    },
  ],
})

export default router
