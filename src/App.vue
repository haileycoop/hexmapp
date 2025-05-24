<template>
  <div id="app">
    <header class="app-header">
      <p>{{ isGMView ? 'Nightsong (GM View)' : 'Nightsong' }}</p>
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