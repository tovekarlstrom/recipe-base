<script setup lang="ts">
import { Icon } from '@iconify/vue'
import ChatInterface from './ChatInterface.vue'

const emit = defineEmits(['closeChat'])

const handleClose = () => {
  console.log('Closing chat field')
  emit('closeChat')
}
</script>

<template>
  <div class="bg-gray-800 rounded-2xl p-6 max-w-4xl w-full mx-4 relative h-[80vh]">
    <button
      @click="handleClose"
      class="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors z-10"
    >
      <Icon icon="mdi:close" class="w-6 h-6" />
    </button>

    <ChatInterface @closeChat="handleClose" />
  </div>
</template>
