import { defineStore } from 'pinia'
import {
  axialFromIndex,
  axialToPixel,
  hexagonPoints,
  TOTAL_HEX_COUNT
} from '../utils/hexUtils'

export const useMainStore = defineStore('main', {
  state: () => ({
    isGM: false,
    selectedHex: null,
    selectedViaMovement: false,
    showFog: true,
    hexes: [],
    movements: []
  }),
  actions: {
    unlockGM(key) {
      const correctKey = import.meta.env.VITE_GM_KEY
      if (key === correctKey) {
        this.isGM = true
        localStorage.setItem('gmMode', 'true')
        return true
      }
      return false
    },
    loadGMFromStorage() {
      this.isGM = localStorage.getItem('gmMode') === 'true'
    },
    resetGM() {
      this.isGM = false
      localStorage.removeItem('gmMode')
    },
    setSelectedHex(hex, { fromMovement = false } = {}) {
      this.selectedHex = hex
      this.selectedViaMovement = fromMovement
    },
    clearSelectedViaMovement() {
      this.selectedViaMovement = false
    },
    toggleFog() {
      this.showFog = !this.showFog
    },
    async loadHexData() {
      const { fetchHexData } = await import('../services/sheetService')
      this.hexes = await fetchHexData()
    },
    async loadMovementData() {
      const { fetchMovementData } = await import('../services/sheetService')
      this.movements = await fetchMovementData()
    }
  },

  getters: {
    enrichedHexes: (state) => {
      return Array.from({ length: TOTAL_HEX_COUNT }, (_, i) => {
        const axial = axialFromIndex(i)
        const { cx, cy } = axialToPixel(axial)
        const corners = hexagonPoints(cx, cy)
        const row = state.hexes[i] || {}

        const rawVisibility = (row.visible || '').toLowerCase().trim()
        const visibility = ['fog', 'terrain', 'clear'].includes(rawVisibility) ? rawVisibility : 'fog'

        return {
          cx,
          cy,
          corners,
          label: row.hex || `${i}`,
          terrain: row.terrain,
          playerNotes: row.playerNotes || '',
          gmNotes: row.gmNotes || '',
          visibility
        }
      })
    }
  }
})
