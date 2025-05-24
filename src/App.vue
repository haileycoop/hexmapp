<template>
  <div id="app">
    <div class="layout-header">
      <div class="layout-header-left">
        <p>{{ isGMView ? 'Nightsong (GM View)' : 'Nightsong' }}</p>
      </div>
      <div class="layout-header-right">
        <!-- TODO: add current date feature here -->
        <p>X</p>
      </div>
    </div>
    <div class="layout-main-small">
      <HexInfo :hex="selectedHex" :isGM="isGMView" />
    </div>
    <div class="layout-main-large">
      <HexMapDisplay :isGM="isGMView" :selectedHex="selectedHex" @update:selectedHex="selectedHex = $event" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import HexInfo from './components/HexInfo.vue'
import HexMapDisplay from './components/HexMapDisplay.vue'

const route = useRoute()
const isGMView = computed(() => route.path.startsWith('/gm'))
const selectedHex = ref(null)
</script>
