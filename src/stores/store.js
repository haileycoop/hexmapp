import { defineStore } from 'pinia'

export const useMainStore = defineStore('main', {
  state: () => ({
    isGM: false,
    selectedHex: null,
    showFog: true
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
    setSelectedHex(hex) {
      this.selectedHex = hex
    },
    toggleFog() {
      this.showFog = !this.showFog
    }    
  }
})
