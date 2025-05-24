<template>
  <div class="hexmap-svg-wrapper" ref="wrapperRef" @click="clearSelection">
    <svg ref="svgRef" :viewBox="`${minX} ${minY} ${width} ${height}`" preserveAspectRatio="xMidYMid meet"
      class="hexmap-svg" @mousedown="startPan" @mousemove="onPan" @mouseup="endPan" @mouseleave="endPan"
      @wheel.prevent="onZoom">
      <g :transform="`translate(${pan.x}, ${pan.y}) scale(${zoom})`">
        <image href="/maps/inkarnate-map.jpg" :x="cx0 - originInImage.x" :y="cy0 - originInImage.y" width="2048"
          height="1536" />
        <g v-for="hex in enrichedHexes" :key="hex.label">
          <polygon :points="hex.corners.map(p => `${p.x},${p.y}`).join(' ')" :fill="hex.visibility === 'fog'
            ? '#919191'
            : hex.visibility === 'terrain'
              ? (terrainColors[hex.terrain] || terrainColors.default)
              : 'transparent'" class="hexagon" @click.stop="selectHex(hex)" />
          <polygon v-if="hex.label === props.selectedHex?.label"
            :points="insetCorners(hex.corners).map(p => `${p.x},${p.y}`).join(' ')" class="hex-highlight"
            @click.stop="selectHex(hex)" />
          <text :x="hex.cx" :y="hex.cy" text-anchor="middle" dominant-baseline="middle" class="hex-label">
            {{ hex.label }}
          </text>
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup>

// ————————————————————————
// Pulling in hex data, geometry math, props
// ————————————————————————

import { ref, onMounted, computed } from 'vue'
import { fetchHexData } from '../services/sheetService'
import {
  axialToPixel,
  hexagonPoints,
  axialFromIndex,
  axialDistance,
  TOTAL_HEX_COUNT
} from '../utils/hexUtils'
import { nextTick } from 'vue'
import { watchEffect } from 'vue'

const props = defineProps({
  isGM: Boolean,
  selectedHex: Object
})

// ————————————————————————
// Update the selected hex
// ————————————————————————

const emit = defineEmits(['update:selectedHex'])

function selectHex(hex) {
  emit('update:selectedHex', hex)
}

function clearSelection() {
  emit('update:selectedHex', null)
}

// ————————————————————————
// Centering background image
// ————————————————————————
const originInImage = { x: 1290, y: 816 }
const { cx: cx0, cy: cy0 } = axialToPixel({ q: 0, r: 0 })

// ————————————————————————
// Pan & zoom logic
// ————————————————————————

const wrapperRef = ref(null)

const defaultZoom = 2
const zoom = ref(defaultZoom)

const svgRef = ref(null)
const pan = ref({ x: 0, y: 0 })

let hasCentered = false

// const centerX = minX + width / 2
// const centerY = minY + height / 2

watchEffect(() => {
  if (hasCentered) return

  const wrapper = wrapperRef.value
  if (!wrapper || enrichedHexes.value.length === 0) return

  const wrapperWidth = wrapper.clientWidth
  const wrapperHeight = wrapper.clientHeight

  pan.value.x = (wrapperWidth / 2) / zoom.value - cx0
  pan.value.y = (wrapperHeight / 2) / zoom.value - cy0

  // pan.value.x = (wrapperWidth / 2) / zoom.value - centerX
  // pan.value.y = (wrapperHeight / 2) / zoom.value - centerY

  hasCentered = true
})

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
// Spreadsheet data + enriched hexes
// ————————————————————————

const raw = ref([])
onMounted(async () => {
  raw.value = await fetchHexData()
})

const enrichedHexes = computed(() => {
  return Array.from({ length: TOTAL_HEX_COUNT }, (_, i) => {
    const axial = axialFromIndex(i)
    const { cx, cy } = axialToPixel(axial)
    const corners = hexagonPoints(cx, cy)
    const row = raw.value[i] || {}
    const rawVisibility = (row.visible || '').toLowerCase().trim()
    const visibility = ['fog', 'terrain', 'clear'].includes(rawVisibility) ? rawVisibility : 'fog'

    return {
      cx, cy, corners,
      label: row.hex || `${i}`,
      terrain: (props.isGM || visibility !== 'fog') ? row.terrain : undefined,
      visibility
    }
  })
})

// ————————————————————————
// Viewbox calculation
// ————————————————————————

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
// Color map
// ————————————————————————

const terrainColors = {
  forest: '#625729',
  hills: '#998F50',
  plains: '#A0B260',
  foothills: '#907641',
  mountains: '#4E4025',
  water: '#7F9B9F',
  default: '#919191'
}

// ————————————————————————
// Highlight helper (set stroke inside hex)
// ————————————————————————

function insetCorners(corners, scale = 0.92) {
  const cx = corners.reduce((sum, p) => sum + p.x, 0) / 6
  const cy = corners.reduce((sum, p) => sum + p.y, 0) / 6
  return corners.map(p => ({
    x: cx + (p.x - cx) * scale,
    y: cy + (p.y - cy) * scale
  }))
}


</script>

<style scoped>
.hexmap-svg {
  width: 100%;
  height: 100%;
  cursor: grab;
  user-select: none;
  touch-action: none;
  /* for mobile drag */
}

.hexmap-svg-wrapper {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hex-label {
  font-size: 0.8em;
  fill: white;
  stroke: black;
  stroke-width: 0.5px;
  paint-order: stroke;
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