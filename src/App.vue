<template>
  <div id="app">
    <!-- main layout-->
    <div class="layout-header">
      <div class="layout-header-left">
        <p>{{ isGMView ? 'Nightsong (GM View)' : 'Nightsong' }}</p>
      </div>
      <div class="layout-header-right">
        <!-- Movement Info toggle button -->
        <button @click="showMovements = !showMovements" :class="{ active: showMovements }"
          :title="showMovements ? 'View Hex Info' : 'View Movement Log'" aria-label="Toggle info panel">
          {{ showMovements ? '🥾' : '🧭' }}
        </button>
        <!-- Fog toggle button (GM only) -->
        <button v-if="isGMView" @click="store.toggleFog" :class="['fog-toggle', { active: store.showFog }]"
          :title="store.showFog ? 'Hide fog' : 'Show fog'">
          <span class="fog-icon" :class="{ active: store.showFog }">☁️</span>
        </button>
        <!-- GM Mode button -->
        <button @click="showModal = true" title="Unlock GM Mode">🔑</button>
      </div>
    </div>
    <div class="layout-main-small">
      <HexInfo v-if="!showMovements" :hex="selectedHex" :isGM="isGMView" />
      <MovementInfo v-else :movements="partyMovements" :allHexes="store.enrichedHexes"
        @selectHex="hex => store.setSelectedHex(hex, { fromMovement: true })" />
    </div>
    <div class="layout-main-large">
      <HexMap :isGM="isGMView" :selectedHex="selectedHex" @update:selectedHex="store.setSelectedHex" />
    </div>
    <!-- GM lock modal-->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <template v-if="!isGMView">
          <form @submit.prevent="unlockGM">
            <label for="gm-key">Enter GM key</label>
            <input id="gm-key" v-model="key" type="password" ref="gmInput" :autofocus="!isMobile"
              placeholder="Spoilers inside..." autocomplete="off" autocorrect="off" spellcheck="false" />
            <div class="modal-buttons">
              <button type="submit">Unlock</button>
              <button type="button" @click="closeModal">Cancel</button>
            </div>
          </form>
        </template>
        <template v-else>
          <p>You are in GM mode.</p>
          <div class="modal-buttons">
            <button @click="leaveGM">Leave GM View</button>
            <button type="button" @click="closeModal">Cancel</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from './stores/store'
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import HexInfo from './components/HexInfo.vue'
import HexMap from './components/HexMap.vue'
import MovementInfo from './components/MovementInfo.vue'

const store = useMainStore()
const showModal = ref(false)
const key = ref('')
const gmInput = ref(null)
const showMovements = ref(false)

// Load GM state on mount
onMounted(async () => {
  store.loadGMFromStorage()
  await store.loadHexData()
  await store.loadMovementData()
  // console.log('✅ Movements loaded:', store.movements)
})

// Computed helpers
const selectedHex = computed(() => store.selectedHex)
const isGMView = computed(() => store.isGM)
const partyMovements = computed(() =>
  store.movements.filter(m => m.faction === 'The Party')
)


// ————————————————————————
// GM View Unlock / Reset
// ————————————————————————

function unlockGM() {
  if (store.unlockGM(key.value)) {
    closeModal()
  } else {
    alert('Incorrect key')
  }
}

function leaveGM() {
  store.resetGM()
  closeModal()
}

function closeModal() {
  showModal.value = false
  key.value = ''

  // 1. Blur the input field to dismiss the keyboard
  document.activeElement?.blur()

  // 2. Wait for the keyboard to dismiss, then reset viewport
  setTimeout(() => {
    // Scroll to top in case layout got pushed down
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

    // 3. Force a viewport recalculation by toggling meta tag
    const metaViewport = document.querySelector('meta[name=viewport]')
    if (metaViewport) {
      const originalContent = metaViewport.content
      // Add a harmless tweak to force a visual reflow
      metaViewport.content = originalContent + ', maximum-scale=1.01'

      // Restore the original value shortly after
      setTimeout(() => {
        metaViewport.content = originalContent
      }, 50)
    }
  }, 150)
}

// ————————————————————————
// Scroll lock when modal is open
// ————————————————————————

watch(showModal, async (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
  if (val) {
    await nextTick()
    gmInput.value?.focus()
  }
})
</script>
