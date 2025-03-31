<template>
  <div @click="handleClick" class="relative group flex items-center justify-end">
    <!-- Hover text -->
    <span
      class="absolute right-14 bg-gray-700 text-white px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
    >
      Fråga Gramz
    </span>

    <!-- Icon bubble -->
    <div
      class="bg-gray-600 max-w-2xl w-12 h-12 rounded-3xl p-2 flex items-center justify-center hover:bg-gray-700 transition-colors duration-200"
    >
      <Icon icon="noto:old-woman" class="w-8 h-8" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

const emit = defineEmits(['openChat'])

function handleClick() {
  emit('openChat')
}
</script>
