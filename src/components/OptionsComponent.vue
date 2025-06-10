<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  options: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const currentIndex = ref(0)

// Reset currentIndex when options change
watch(
  () => props.options,
  () => {
    currentIndex.value = 0
    emit('update:modelValue', props.options[0])
  },
  { immediate: true },
)

const updateValue = (index: number) => {
  currentIndex.value = index
  emit('update:modelValue', props.options[index])
}

// Update currentIndex when modelValue changes
watch(
  () => props.modelValue,
  (newValue) => {
    const index = props.options.indexOf(newValue)
    if (index !== -1) {
      currentIndex.value = index
    }
  },
)
</script>

<template>
  <div class="flex justify-center mb-4 gap-4 w-full">
    <button
      v-for="(option, index) in options"
      :key="option"
      @click="updateValue(index)"
      :class="[
        'px-4 py-2 rounded-lg transition-colors',
        currentIndex === index
          ? 'bg-blue-500 text-white'
          : 'bg-gray-600 text-gray-300 hover:bg-gray-500',
      ]"
    >
      {{ option }}
    </button>
  </div>
</template>
