import { createRouter, createWebHistory } from 'vue-router'
import GMView from './views/GMView.vue'
import PlayerView from './views/PlayerView.vue'

const routes = [
  { path: '/gm', component: GMView },
  { path: '/player', component: PlayerView },
  { path: '/', redirect: '/player' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
