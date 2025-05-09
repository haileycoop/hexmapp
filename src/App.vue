<template>
  <div id="app">
    <header class="app-header">
      <h1>HexMapp</h1>
      <p>{{ isGMView ? 'GM View' : '' }}</p>
    </header>
    <main class="app-main">
      <HexMap :isGM="isGMView" />
    </main>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import HexMap from './components/HexMap.vue'

const route = useRoute()
const isGMView = computed(() => route.path.startsWith('/gm'))
</script>

<style>
#app {
  max-width: none;
  padding: 20px;
}

h1 {
  margin: 0 0 1rem;
  font-size: 20pt;
}

body {
  margin: 0;
}
</style>
