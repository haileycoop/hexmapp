<template>
  <div class="hex-info">
    <p v-if="hex">Terrain: {{ hex.terrain || 'Unknown' }}</p>
    <p v-else>Click any hex</p>
  </div>
</template>

<script setup>
const props = defineProps({
  hex: Object
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
