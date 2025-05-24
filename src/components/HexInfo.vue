<template>
  <div class="hex-info">
    <div><strong>Hex:</strong> {{ hex?.label || '—' }}</div>
    <div><strong>Terrain:</strong> {{ hex?.terrain || 'Unknown' }}</div>
    <div>
      <strong>Notes:</strong>
      <p class="note-text">{{ hex?.playerNotes || '—' }}</p>
    </div>
    <div v-if="isGM">
      <strong>GM Notes:</strong>
      <p class="note-text">{{ hex?.gmNotes || '—' }}</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  hex: Object,
  isGM: Boolean
})
</script>
