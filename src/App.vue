<template>
  <div id="app">
    <header class="app-header">
      <p>{{ isGMView ? 'HexMapp (GM View)' : 'HexMapp' }}</p>
    </header>
    <main class="app-main">
      <HexMap :isGM="isGMView" />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import HexMap from './components/HexMap.vue'

const route = useRoute()
const isGMView = computed(() => route.path.startsWith('/gm'))
</script>

<style>
#app {
  display: flex;
  flex-direction: column;
  /* Stack vertically */
  height: 100vh;
}

.app-header {
  flex: 0 0 auto;
  padding: .1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  /* or center if you want center-aligned text */
  gap: 0.1rem;
}

.app-main {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
