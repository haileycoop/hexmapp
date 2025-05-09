<!-- GMView.vue -->
<template>
  <div class="view-container">
    <header class="app-header">
      <h1>GM View</h1>
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
  hexes.value = await fetchHexData()
})
</script>