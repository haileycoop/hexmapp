<template>
  <div class="hexmap-svg-wrapper" ref="wrapperRef" @click="clearSelection">
    <svg v-if="viewBoxString" ref="svgRef" :viewBox="viewBoxString" preserveAspectRatio="
      xMidYMid meet" class="hexmap-svg" @mousedown="startPan" @mousemove="onPan" @mouseup="endPan" @mouseleave="endPan"
      @wheel.prevent="onZoom" @touchstart="startTouchPan" @touchmove="onTouchMove" @touchend="endTouchPan"
      @touchcancel="endTouchPan">
      <g :transform="`translate(${pan.x}, ${pan.y}) scale(${zoom})`">
        <image href="/maps/inkarnate-map.jpg" :x="cx0 - originInImage.x" :y="cy0 - originInImage.y" width="2048"
          height="1536" />
        <!-- Display of each hex -->
        <g v-for="hex in enrichedHexes" :key="hex.label">
          <!-- Manage hex fill -->
          <polygon :points="hex.corners.map(p => `${p.x},${p.y}`).join(' ')" :fill="getFill(hex)" class="hexagon"
            @click.stop="selectHex(hex)" />
          <!-- Manage hex highlight -->
          <polygon v-if="hex.label === props.selectedHex?.label"
            :points="insetCorners(hex.corners).map(p => `${p.x},${p.y}`).join(' ')" class="hex-highlight"
            @click.stop="selectHex(hex)" />
          <!-- Display hex label -->
          <text :x="hex.cx" :y="hex.cy" text-anchor="middle" dominant-baseline="middle" class="hex-label">
            {{ hex.label }}
          </text>
          <!-- Display party location icon -->
          <circle v-if="hex.label === currentPartyHex" :cx="hex.cx" :cy="hex.cy - 21" r="12" fill="white"
            stroke-width="1" />
          <text v-if="hex.label === currentPartyHex" :x="hex.cx" :y="hex.cy - 16" text-anchor="middle"
            class="party-icon">
            🏕️
          </text>
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup>

// ————————————————————————
// Imports and props
// ————————————————————————

import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import {
  axialToPixel,
  hexagonPoints,
  hexSize,
  axialFromIndex,
  axialDistance,
  TOTAL_HEX_COUNT
} from '../utils/hexUtils'
import { useMainStore } from '../stores/store'

const store = useMainStore()

const enrichedHexes = computed(() => store.enrichedHexes)

const currentPartyHex = computed(() => {
  const latest = [...store.movements]
    .filter(m => m.faction === 'The Party')
    .pop()
  return latest?.hex || null
})

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

// DEBUG TOOL
// watch(() => props.selectedHex, (hex) => {
//   console.log('🟠 Selected hex in map:', hex?.label)
// })


// ————————————————————————
// Centering background image
// ————————————————————————
const originInImage = { x: 1290, y: 816 }
const { cx: cx0, cy: cy0 } = axialToPixel({ q: 0, r: 0 })

// ————————————————————————
// Viewbox calculation
// ————————————————————————

const radiusForView = 10

const mapGeometry = computed(() => {
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
  const centerX = minX + width / 2
  const centerY = minY + height / 2

  return { minX, minY, width, height, centerX, centerY }
})

// ————————————————————————
// ViewBox string (for safe rendering)
// ————————————————————————

const viewBoxString = computed(() => {
  const g = mapGeometry.value
  if (!g || !Number.isFinite(g.minX)) return ''
  return `${g.minX} ${g.minY} ${g.width} ${g.height}`
})

// ————————————————————————
// Template guards
// ————————————————————————

const mapReady = computed(() => {
  const g = mapGeometry.value
  return !!g && Number.isFinite(g.minX) && Number.isFinite(g.minY)
})

// ————————————————————————
// Pan & zoom logic
// ————————————————————————

const wrapperRef = ref(null)
const svgRef = ref(null)

const defaultZoom = 2
const zoom = ref(defaultZoom)
const pan = ref({ x: 0, y: 0 })

const hasCentered = ref(false)
const PAN_SENSITIVITY = 2 // Try 1.0 (normal), 1.5 (snappier), 2.0+ (fast)
const PAN_MARGIN = hexSize * 1.5

let resizeTimeout = null
let lastMidpoint = null

// ————————————————————————
// Helper: prevent "stutter" and clamp zoom
// ————————————————————————

let dxAccum = 0
let dyAccum = 0
let animationFrame = null

function applyPanDelta(dx, dy) {
  dxAccum += dx
  dyAccum += dy

  if (!animationFrame) {
    animationFrame = requestAnimationFrame(() => {
      pan.value.x += dxAccum
      pan.value.y += dyAccum

      const wrapper = wrapperRef.value
      if (wrapper) {
        const clamped = clampPan(
          pan.value,
          zoom.value,
          wrapper.clientWidth,
          wrapper.clientHeight,
          mapGeometry.value
        )
        pan.value.x = clamped.x
        pan.value.y = clamped.y
      }

      dxAccum = 0
      dyAccum = 0
      animationFrame = null
    })
  }
}


onMounted(() => {
  const handleResize = () => {
    clearTimeout(resizeTimeout)

    svgRef.value?.addEventListener('touchmove', e => e.preventDefault(), { passive: false })

    if (svgRef.value) {
      svgRef.value.addEventListener('touchmove', e => e.preventDefault(), { passive: false })
    }

    resizeTimeout = setTimeout(() => {
      if (hasCentered.value) return

      const wrapper = wrapperRef.value
      const geometry = mapGeometry.value
      if (!wrapper || enrichedHexes.value.length === 0 || !geometry) return

      const { centerX, centerY } = geometry
      const wrapperWidth = wrapper.clientWidth
      const wrapperHeight = wrapper.clientHeight

      pan.value.x = (wrapperWidth / 2) / zoom.value - centerX
      pan.value.y = (wrapperHeight / 2) / zoom.value - centerY

      hasCentered.value = true
    }, 200) // wait 200ms after last resize
  }

  window.addEventListener('resize', handleResize)

  // Initial call
  handleResize()

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    clearTimeout(resizeTimeout)
  })
})

function clampPan(pan, zoom, wrapperWidth, wrapperHeight, mapGeometry) {
  const { minX, minY, width, height } = mapGeometry

  // Convert viewport size from px to SVG units
  const viewWidth = wrapperWidth / zoom
  const viewHeight = wrapperHeight / zoom

  // Define bounds in SVG units
  const mapLeft = minX - PAN_MARGIN
  const mapRight = minX + width + PAN_MARGIN
  const mapTop = minY - PAN_MARGIN
  const mapBottom = minY + height + PAN_MARGIN

  // Calculate min/max pan values in SVG units
  const minPanX = wrapperWidth - mapRight * zoom
  const maxPanX = wrapperWidth - mapLeft * zoom - viewWidth * zoom

  const minPanY = wrapperHeight - mapBottom * zoom
  const maxPanY = wrapperHeight - mapTop * zoom - viewHeight * zoom

  return {
    x: Math.min(Math.max(pan.x, minPanX), maxPanX),
    y: Math.min(Math.max(pan.y, minPanY), maxPanY)
  }
}

// ————————————————————————
// Mouse pan & zoom handlers
// ————————————————————————

let isPanning = false
let lastPos = { x: 0, y: 0 }

function startPan(e) {
  isPanning = true
  lastPos = { x: e.clientX, y: e.clientY }
}

function onPan(e) {
  if (!isPanning) return
  const dx = (e.clientX - lastPos.x) * PAN_SENSITIVITY
  const dy = (e.clientY - lastPos.y) * PAN_SENSITIVITY
  applyPanDelta(dx, dy)
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
// Touch pan & zoom handlers
// ————————————————————————

let isTouchPanning = false
let lastTouchPos = { x: 0, y: 0 }
let initialPinchDistance = null
let initialZoom = zoom.value

function startTouchPan(e) {
  if (e.touches.length === 1) {
    // One finger drag
    isTouchPanning = true
    const touch = e.touches[0]
    lastTouchPos = { x: touch.clientX, y: touch.clientY }
  } else if (e.touches.length === 2) {
    isTouchPanning = false
    initialPinchDistance = getTouchDistance(e.touches[0], e.touches[1])
    initialZoom = zoom.value
    lastMidpoint = getMidpoint(e.touches[0], e.touches[1])
  }
}

function getTouchDistance(t1, t2) {
  const dx = t2.clientX - t1.clientX
  const dy = t2.clientY - t1.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function getMidpoint(t1, t2) {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2
  }
}

function onTouchMove(e) {
  if (e.touches.length === 1 && isTouchPanning) {
    const touch = e.touches[0]
    const dx = (touch.clientX - lastTouchPos.x) * PAN_SENSITIVITY
    const dy = (touch.clientY - lastTouchPos.y) * PAN_SENSITIVITY
    applyPanDelta(dx, dy)
    lastTouchPos = { x: touch.clientX, y: touch.clientY }
  } else if (e.touches.length === 2) {
    const newDistance = getTouchDistance(e.touches[0], e.touches[1])
    const scale = newDistance / initialPinchDistance
    const newZoom = Math.min(Math.max(initialZoom * scale, 0.2), 4)

    const newMidpoint = getMidpoint(e.touches[0], e.touches[1])
    const dx = newMidpoint.x - lastMidpoint.x
    const dy = newMidpoint.y - lastMidpoint.y

    const zoomDelta = newZoom / zoom.value
    pan.value.x = (pan.value.x - newMidpoint.x) * zoomDelta + newMidpoint.x + dx
    pan.value.y = (pan.value.y - newMidpoint.y) * zoomDelta + newMidpoint.y + dy

    zoom.value = newZoom
    lastMidpoint = newMidpoint
  }
}

function endTouchPan() {
  isTouchPanning = false
}

// ————————————————————————
// Pan to hex
// ————————————————————————

watch(() => props.selectedHex, (hex) => {
  if (hex && store.selectedViaMovement) {
    panToHex(hex)
    store.clearSelectedViaMovement()
  }
})

function panToHex(hex) {
  animatePanTo(hex.cx, hex.cy)
}

function animatePanTo(targetCx, targetCy, duration = 400) {
  const wrapper = wrapperRef.value
  if (!wrapper) return

  const startX = pan.value.x
  const startY = pan.value.y

  const wrapperWidth = wrapper.clientWidth
  const wrapperHeight = wrapper.clientHeight

  // Use a smaller offset to center higher up on small screens (e.g. 60% down)
  const anchorX = wrapperWidth * 0.5
  const anchorY = wrapperHeight * 0.5

  const targetX = anchorX / zoom.value - targetCx
  const targetY = anchorY / zoom.value - targetCy

  const startTime = performance.now()

  function animate(now) {
    const elapsed = now - startTime
    const t = Math.min(elapsed / duration, 1)
    const ease = 1 - Math.pow(1 - t, 3)

    pan.value.x = startX + (targetX - startX) * ease
    pan.value.y = startY + (targetY - startY) * ease

    if (t < 1) {
      requestAnimationFrame(animate)
    }
  }

  requestAnimationFrame(animate)
}


// ————————————————————————
// Color map & fill management
// ————————————————————————

const terrainColors = {
  forest: 'rgba(98, 87, 41, 1)',
  hills: 'rgba(153, 143, 80, 1)',
  plains: 'rgba(160, 178, 96, 1)',
  foothills: 'rgba(144, 118, 65, 1)',
  mountains: 'rgba(78, 64, 37, 1)',
  water: 'rgba(127, 155, 159, 1)',
  default: 'rgba(145, 145, 145, 1)'
}

function getFill(hex) {
  // Always transparent for "clear" hexes
  if (hex.visibility === 'clear') return 'transparent'

  // For players: always show fog/terrain fills
  if (!props.isGM) {
    return hex.visibility === 'fog'
      ? 'rgba(145, 145, 145, 1)'
      : terrainColors[hex.terrain] || terrainColors.default
  }

  // For GM: only show fog/terrain if showFog is ON
  if (store.showFog) {
    const baseColor =
      hex.visibility === 'fog'
        ? 'rgba(145, 145, 145, 1)'
        : terrainColors[hex.terrain] || terrainColors.default

    return baseColor.replace('1)', '1)') // semi-transparent overlay
  }

  // GM with fog turned OFF
  return 'transparent'
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
  overflow: hidden;
  display: block;
  position: relative;
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

.party-icon {
  font-size: 1.5rem;
  font-weight: bold;
  pointer-events: none;
}
</style>