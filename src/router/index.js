import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { layout: 'default' },
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),
    meta: { layout: 'default' },
  },
  {
    path: '/:pathMatch(.*)*',
    // Change: Ensure redirect respects the base path
    redirect: '/',
  },
]

const router = createRouter({
  // This ensures the router matches the subfolder (e.g., /vue/test/) 
  // provided by Vite during the build process
  history: createWebHistory(import.meta.env.VITE_BASE_URL || import.meta.env.BASE_URL || '/'),
  routes,
  linkActiveClass: 'active',
})

export { router }
export default router
