import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

const routes = [
  { path: '/gm', component: App },
  { path: '/player', component: App },
  { path: '/', redirect: '/player' }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
