<template>
  <div class="hex-info">
    <div><strong>Hex:</strong> {{ hex?.label || '—' }}</div>
    <div><strong>Terrain:</strong> {{ hex?.terrain || 'Unknown' }}</div>
    <div>
      <strong>Notes:</strong>
      <p class="note-text">{{ hex?.terrain ? hex.playerNotes || '' : '' }}</p>
    </div>
    <div v-if="isGM">
      <strong>GM Notes:</strong>
      <p class="note-text">{{ hex?.gmNotes || '' }}</p>
    </div>
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
  padding: 0.05rem .05rem;
  text-align: left;
  white-space: normal;
  /* allow line wrapping */
  word-wrap: break-word;
  /* break long words if needed */
  overflow-wrap: break-word;
}

.hex-info>div {
  width: 100%;
}

.note-text {
  margin: 0.2rem 0 0.5rem 0;
  white-space: pre-wrap;
  word-break: break-word;
  max-width: 100%;
}
</style>
