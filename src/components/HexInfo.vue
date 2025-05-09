<template>
  <div class="hex-info">
    <div><strong>Hex:</strong> {{ hex?.label || '—' }}</div>
    <div><strong>Terrain:</strong> {{ hex?.terrain || 'Unknown' }}</div>
    <div><strong>Notes:</strong> {{ hex?.terrain ? hex.playerNotes || '' : '' }}</div>
    <div v-if="isGM"><strong>GM Notes:</strong> {{ hex?.gmNotes || '' }}</div>
  </div>
</template>

<script setup>
const props = defineProps({
  hex: Object,
  isGM: Boolean
})
</script>

<style scoped>
.hex-info {
  width: 100%;
  background: #eee;
  color: #333;
  font-size: .5rem;
  padding: 0.05rem .1rem;
  box-sizing: border-box;
  text-align: left;
  border-bottom: 1px solid #ccc;
}
</style>
