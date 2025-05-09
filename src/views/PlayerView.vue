<!-- PlayerView.vue -->
<template>
  <div class="view-container">
    <header class="app-header">
      <h1>Player View</h1>
    </header>
    <main class="app-main">
      <HexMap :hexes="hexes" />
    </main>
  </div>
</template>

<script setup>
// No export needed—Vue handles it behind the scenes
import { onMounted, ref } from 'vue'
import { fetchHexData } from '../services/sheetService'
import HexMap from '../components/HexMap.vue'

const hexes = ref([])

onMounted(async () => {
  const allHexes = await fetchHexData()
  hexes.value = allHexes.map(h =>
    h.visible === 'TRUE'
      ? h
      : { ...h, terrain: undefined }
  )
})
</script>

<style scoped>
h1 {
  margin-bottom: 1rem;
}

/* You can add player-specific styles here */
</style>