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
  height: 100vh;
  max-width: 100%;
  box-sizing: border-box;
}

.app-header {
  text-align: center;
}

.app-main {
  flex-grow: 1;
  overflow: hidden;
}
</style>
