<template>
  <div class="hexmap-container">
    <div class="hex-sidebar">
      <HexInfo :hex="selectedHex" :isGM="props.isGM" />
    </div>
    <div class="hexmap-svg-wrapper" @click="clearSelection">
      <svg ref="svgRef" :viewBox="`${minX} ${minY} ${width} ${height}`" preserveAspectRatio="xMidYMid meet"
        class="hexmap-svg" @mousedown="startPan" @mousemove="onPan" @mouseup="endPan" @mouseleave="endPan"
        @wheel.prevent="onZoom" width="1500" height="1500">
        <g :transform="`translate(${pan.x}, ${pan.y}) scale(${zoom})`">
          <image href="/maps/inkarnate-map.jpg" :x="cx0 - originInImage.x" :y="cy0 - originInImage.y" width="2048"
            height="1536" />
          <g v-for="hex in enrichedHexes" :key="hex.label">
            <!-- Main hex -->
            <polygon :points="hex.corners.map(p => `${p.x},${p.y}`).join(' ')"
              :fill="hex.terrain ? 'transparent' : '#ccc'" class="hexagon" @click.stop="selectHex(hex)" />
            <!-- Inset highlight -->
            <polygon v-if="hex.label === selectedHex?.label"
              :points="insetCorners(hex.corners).map(p => `${p.x},${p.y}`).join(' ')" class="hex-highlight"
              @click.stop="selectHex(hex)" />
            <!-- Label -->
            <text :x="hex.cx" :y="hex.cy" text-anchor="middle" dominant-baseline="middle" class="hex-label">
              {{ hex.label }}
            </text>
          </g>
        </g>

      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { fetchHexData } from '../services/sheetService'
import HexInfo from './HexInfo.vue'

// ————————————————————————
// Backdrop management
// ————————————————————————
const originInImage = { x: 1290, y: 816 } // center of a 2048x1536 image
const { cx: cx0, cy: cy0 } = axialToPixel({ q: 0, r: 0 })

// ————————————————————————
// Pan & zoom logic
// ————————————————————————
const svgRef = ref(null)
const pan = ref({ x: 0, y: 0 })
const zoom = ref(1)

let isPanning = false
let lastPos = { x: 0, y: 0 }

function startPan(e) {
  isPanning = true
  lastPos = { x: e.clientX, y: e.clientY }
}

function onPan(e) {
  if (!isPanning) return
  const dx = e.clientX - lastPos.x
  const dy = e.clientY - lastPos.y
  pan.value.x += dx
  pan.value.y += dy
  lastPos = { x: e.clientX, y: e.clientY }
}

function endPan() {
  isPanning = false
}

function onZoom(e) {
  const direction = e.deltaY > 0 ? -1 : 1
  const scaleFactor = 1 + direction * 0.1
  zoom.value = Math.min(Math.max(zoom.value * scaleFactor, 0.2), 4)
}

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
import {
  hexSize,
  axialToPixel,
  hexagonPoints,
  axialFromIndex,
  TOTAL_HEX_COUNT
} from '../utils/hexUtils'

// ————————————————————————
// Enrich hexes
// ————————————————————————
const enrichedHexes = computed(() => {
  return Array.from({ length: TOTAL_HEX_COUNT }, (_, i) => {
    const axial = axialFromIndex(i)
    const { cx, cy } = axialToPixel(axial)
    const corners = hexagonPoints(cx, cy)
    const row = raw.value[i] || {}
    const visible = row.visible === 'TRUE'
    return {
      cx, cy, corners,
      label: row.hex || `${i}`,
      terrain: props.isGM || visible ? row.terrain : undefined,
      playerNotes: props.isGM || visible ? row.playerNotes : '',
      gmNotes: props.isGM ? row.gmNotes || '' : ''
    }
  })
})

// ————————————————————————
// Compute viewBox (only radius 10)
// ————————————————————————
import { axialDistance } from '../utils/hexUtils'

const radiusForView = 10
const coreHexes = enrichedHexes.value.filter((_, i) =>
  axialDistance(axialFromIndex(i)) <= radiusForView
)

const all = coreHexes.flatMap(h => h.corners)
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

// ————————————————————————
// Selected hex highlight
// ————————————————————————
function insetCorners(corners, scale = 0.92) {
  // Shrink points towards the hex center
  const cx = corners.reduce((sum, p) => sum + p.x, 0) / 6
  const cy = corners.reduce((sum, p) => sum + p.y, 0) / 6
  return corners.map(p => ({
    x: cx + (p.x - cx) * scale,
    y: cy + (p.y - cy) * scale
  }))
}

</script>

<style scoped>
.hexmap-container {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: calc(100vh - 3rem);
  /* minus header */
  overflow: hidden;
}

.hex-sidebar {
  flex: 0 0 20vw;
  /* start as 20% of the screen width */
  max-width: 300px;
  /* cap it so it doesn't get huge */
  min-width: 100px;
  /* keeps it readable on small screens */
  background: #eee;
  color: #333;
  font-size: 1rem;
  padding: 1rem;
  box-sizing: border-box;
  border-right: 1px solid #ccc;
  overflow-y: auto;
}

.hexmap-svg-wrapper {
  width: 75%;
  height: 100%;
  overflow: hidden;
}

.hexmap-svg {
  cursor: grab;
  user-select: none;
  touch-action: none;
  /* for mobile drag */
}

.hexmap-svg-wrapper {
  width: 75%;
  height: 100%;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hex-label {
  font-size: 0.6em;
  fill: #000;
  pointer-events: none;
}

.hexagon {
  stroke: #000;
  stroke-width: 1;
  transition: stroke 0.2s, stroke-width 0.2s;
}

.hex-highlight {
  fill: none;
  stroke: #ff6600;
  stroke-width: 2;
  pointer-events: none;
}
</style>
