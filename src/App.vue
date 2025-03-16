<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import { useRecipesStore } from '@/stores/recipes'
import ChatField from '@/components/ChatField.vue'
import ChatBubble from '@/components/ChatBubble.vue'

const { prefetchRecipes } = useRecipesStore()
const isChatOpen = ref(false)

function handleChatOpen() {
  isChatOpen.value = !isChatOpen.value
}

onMounted(async () => {
  // Start loading recipes as soon as the app mounts
  await prefetchRecipes()
})
</script>

<template>
  <RouterView />
  <div v-if="isChatOpen" class="fixed inset-0 flex items-center justify-center z-10 bg-black/50">
    <ChatField @closeChat="handleChatOpen" />
  </div>
  <div class="fixed bottom-4 right-4">
    <ChatBubble @openChat="handleChatOpen" />
  </div>
</template>
