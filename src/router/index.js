import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      layout: 'default',
    },
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "about" */ '../views/About.vue'
      ),
    meta: {
      layout: 'default',
    },
  },
]

const router = createRouter({
  history: createWebHistory('/vue/'), // history mode with base /vue/
  routes,
  linkActiveClass: 'active',
})

export { router }
export default router
