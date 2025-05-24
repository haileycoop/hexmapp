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
  movements: Array,
  allHexes: Array
})

const emit = defineEmits(['selectHex'])

const selectedIndex = ref(null)

function select(index) {
  selectedIndex.value = index

  const label = props.movements[index]?.hex?.trim?.()

  // 🔍 TEMP LOGS for debugging
  // console.log('🔍 Looking for hex with label:', label)
  // console.log('📦 Available hex labels:', props.allHexes.map(h => `[${h.label}]`).join(', '))

  const hex = props.allHexes.find(h => h.label?.trim?.() === label)

  if (!hex) {
    console.warn('❌ No matching hex found for movement:', label)
  } else {
    emit('selectHex', hex)
  }
}


</script>
