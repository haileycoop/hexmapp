<template>
  <div class="hexmap-container">
    <svg :viewBox="viewBox" preserveAspectRatio="xMidYMid meet" class="hexmap-svg">
      <g v-for="hex in enrichedHexes" :key="hex.label">
        <polygon :points="hex.corners.map(p => `${p.x},${p.y}`).join(' ')"
          :fill="terrainColors[hex.terrain] || terrainColors.default" stroke="#000" stroke-width="1" />
        <text :x="hex.cx" :y="hex.cy" text-anchor="middle" dominant-baseline="middle" class="hex-label">
          {{ hex.label }}
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { fetchHexData } from '../services/sheetService'

// pull in all our hex-utils in one go:
import {
  hexSize,
  axialFromIndex,
  axialToPixel,
  hexagonPoints,
  TOTAL_HEX_COUNT
} from '../utils/hexUtils.js'

// 1) load your sheet data (already in spiral order)
const rawData = ref([])
onMounted(async () => {
  rawData.value = await fetchHexData()
})

// 2) GM vs Player toggle
const route = useRoute()
const viewIsGM = computed(() => route.path.startsWith('/gm'))

// 3) build & enrich all hexes in one array
const enrichedHexes = computed(() => {
  return Array.from({ length: TOTAL_HEX_COUNT }, (_, i) => {
    // spiral → axial → pixel
    const axial = axialFromIndex(i)
    const { cx, cy } = axialToPixel(axial)
    const corners = hexagonPoints(cx, cy)

    // merge on your sheet row:
    const row = rawData.value[i] || {}
    const visible = row.visible === 'TRUE'

    return {
      cx, cy, corners,
      label: row.hex || `${i}`,
      terrain: (viewIsGM.value || visible) ? row.terrain : undefined
    }
  })
})

// 4) compute viewBox so nothing ever clips
const viewBox = computed(() => {
  const allPts = enrichedHexes.value.flatMap(h => h.corners)
  const xs = allPts.map(p => p.x)
  const ys = allPts.map(p => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const w = Math.max(...xs) - minX
  const h = Math.max(...ys) - minY
  return `${minX} ${minY} ${w} ${h}`
})

// 5) simple terrain→color map
const terrainColors = {
  forest: '#228B22',
  swamp: '#6B8E23',
  plains: '#F4A460',
  desert: '#EDC9AF',
  mountains: '#A9A9A9',
  water: '#1E90FF',
  default: '#CCCCCC'
}
</script>

<style scoped>
.hexmap-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.hexmap-svg {
  width: 100%;
  height: 100%;
  display: block;
  background: #fff;
  border: 1px solid #ccc;
}

.hex-label {
  font-size: 0.6em;
  fill: #000;
  pointer-events: none;
}
</style>
