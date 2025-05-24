<template>
  <div class="movement-log">
    <div v-for="(entry, index) in movements" :key="index" class="movement-entry"
      :class="{ active: selectedIndex === index }" @click="select(index)">
      <strong>{{ entry.date }}:</strong> {{ entry.text }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  movements: Array
})

const emit = defineEmits(['selectHex'])

const selectedIndex = ref(null)

function select(index) {
  selectedIndex.value = index
  emit('selectHex', props.movements[index].hex)
}
</script>

<style scoped>
.movement-log {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.movement-entry {
  padding: 0.5rem;
  font-size: 0.6rem;
  background: #f4f4f4;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.movement-entry.active {
  background: #d0eaff;
  border-color: #3399ff;
}
</style>
