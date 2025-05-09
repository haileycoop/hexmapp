<template>
  <div class="hexmap-container" @click="clearSelection">
    <div class="hex-popup">
      <HexInfo :hex="selectedHex" />
    </div>
    <svg :viewBox="`${minX} ${minY} ${width} ${height}`" preserveAspectRatio="xMidYMid meet" class="hexmap-svg">
      <g v-for="hex in enrichedHexes" :key="hex.label">
        <!-- draw hexagon -->
        <polygon :points="hex.corners.map(p => `${p.x},${p.y}`).join(' ')"
          :fill="terrainColors[hex.terrain] || terrainColors.default" stroke="#000" stroke-width="1"
          @click.stop="selectHex(hex)" />
        <!-- label -->
        <text :x="hex.cx" :y="hex.cy" text-anchor="middle" dominant-baseline="middle" class="hex-label">
          {{ hex.label }}
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { fetchHexData } from '../services/sheetService'
import { axialFromIndex } from '../utils/hexUtils'
import HexInfo from './HexInfo.vue'

// ————————————————————————
// Selection logic
// ————————————————————————
const selectedHex = ref(null)
function selectHex(hex) {
  selectedHex.value = hex
}
function clearSelection() {
  selectedHex.value = null
}

// ————————————————————————
// Accept props
// ————————————————————————
const props = defineProps({
  isGM: Boolean
})

// ————————————————————————
// Spreadsheet data
// ————————————————————————
const raw = ref([])
onMounted(async () => {
  raw.value = await fetchHexData()
})

// ————————————————————————
// Hex geometry
// ————————————————————————
const hexSize = 30
function axialToPixel({ q, r }) {
  return {
    cx: hexSize * (1.5 * q),
    cy: hexSize * (Math.sqrt(3) * (r + q / 2))
  }
}

function hexagonPoints(cx, cy) {
  const pts = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i
    pts.push({ x: cx + hexSize * Math.cos(a), y: cy + hexSize * Math.sin(a) })
  }
  return pts
}

// ————————————————————————
// Enrich hexes
// ————————————————————————
const enrichedHexes = computed(() => {
  const count = 331 // radius 10 spiral
  return Array.from({ length: count }, (_, i) => {
    const axial = axialFromIndex(i)
    const { cx, cy } = axialToPixel(axial)
    const corners = hexagonPoints(cx, cy)
    const row = raw.value[i] || {}
    const visible = row.visible === 'TRUE'
    return {
      cx, cy, corners,
      label: row.hex || `${i}`,
      terrain: props.isGM || visible ? row.terrain : undefined
    }
  })
})

// ————————————————————————
// Compute viewBox
// ————————————————————————
const all = enrichedHexes.value.flatMap(h => h.corners)
const xs = all.map(p => p.x)
const ys = all.map(p => p.y)
const minX = Math.min(...xs)
const minY = Math.min(...ys)
const width = Math.max(...xs) - minX
const height = Math.max(...ys) - minY

// ————————————————————————
// Color lookup
// ————————————————————————
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
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hex-popup {
  width: 100%;
  background: #eee;
  color: #333;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  box-sizing: border-box;
  text-align: left;
  border-bottom: 1px solid #ccc;
  margin-bottom: 0.25rem;
}

.hexmap-svg {
  width: 100%;
  height: 100%;
  background: #fff;
  border: 1px solid #ccc;
  display: block;
}

.hex-label {
  font-size: 0.6em;
  fill: #000;
  pointer-events: none;
}
</style>
