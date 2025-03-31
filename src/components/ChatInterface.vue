<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { useAgent } from '@/agent'
import type { Recipe } from '@/types/recipe'
import router from '@/router'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  recipes?: Recipe[]
}

const emit = defineEmits(['closeChat'])

const { chatWithUser } = useAgent()
const messages = ref<Message[]>([])
const userInput = ref('')
const isLoading = ref(false)
const chatContainer = ref<HTMLElement | null>(null)
const messagesEnd = ref<HTMLElement | null>(null)

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
  messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
}

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  const userMessage = userInput.value.trim()
  messages.value.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date(),
  })

  userInput.value = ''
  isLoading.value = true

  try {
    const response = await chatWithUser(userMessage)
    messages.value.push({
      role: 'assistant',
      content: response.text,
      recipes: response.recipes,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Error sending message:', error)
    messages.value.push({
      role: 'assistant',
      content: 'Jag beklagar, men jag stötte på ett fel. Kan du försöka igen?',
      timestamp: new Date(),
    })
  } finally {
    isLoading.value = false
  }

  await scrollToBottom()
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

onMounted(() => {
  // Add initial greeting message
  messages.value.push({
    role: 'assistant',
    content:
      '👋 Hej! Jag är Gramz och jag kan hjälpa dig att utforska recept, skapa nya, och svara på alla frågor du har. Vad vill du laga idag?',
    timestamp: new Date(),
  })
})

const handleRecipeClick = async (recipe: Recipe) => {
  try {
    console.log('Navigating to recipe:', recipe.id)
    await router.push(`/recipe/${recipe.id}`)
    console.log('Navigation complete')
    emit('closeChat')
  } catch (error) {
    console.error('Error navigating to recipe:', error)
  }
}
</script>

<template>
  <div class="flex flex-col h-full bg-gray-800 rounded-2xl">
    <!-- Chat Header -->
    <div class="p-4 border-b border-gray-700">
      <h2 class="text-xl font-bold text-white">Chatta med Co-Chef</h2>
    </div>

    <!-- Chat Messages -->
    <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="['flex', message.role === 'user' ? 'justify-end' : 'justify-start']"
      >
        <div
          :class="[
            'max-w-[80%] rounded-2xl px-4 py-2',
            message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100',
          ]"
        >
          <p class="whitespace-pre-wrap">{{ message.content }}</p>

          <!-- Recipe Results -->
          <div v-if="message.recipes && message.recipes.length > 0" class="mt-4 space-y-3">
            <div
              v-for="recipe in message.recipes"
              :key="recipe.id"
              class="bg-gray-600 rounded-xl p-3 hover:bg-gray-500 transition-colors cursor-pointer"
              @click="handleRecipeClick(recipe)"
            >
              <h3 class="font-semibold text-white">{{ recipe.name }}</h3>
              <p v-if="recipe.description" class="text-sm text-gray-300 mt-1">
                {{ recipe.description }}
              </p>
              <div class="flex gap-4 text-xs text-gray-400 mt-2">
                <span>{{ recipe.ingredients.length }} ingredienser</span>
                <span>{{ recipe.instructions.length }} steg</span>
              </div>
            </div>
          </div>

          <span class="text-xs opacity-70 mt-1 block">
            {{ message.timestamp.toLocaleTimeString() }}
          </span>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div v-if="isLoading" class="flex justify-start">
        <div class="bg-gray-700 rounded-2xl px-4 py-2">
          <div class="flex space-x-2">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>

      <div ref="messagesEnd"></div>
    </div>

    <!-- Input Area -->
    <div class="p-4 border-t border-gray-700">
      <div class="flex gap-2">
        <textarea
          v-model="userInput"
          @keypress="handleKeyPress"
          placeholder="Skriv ditt meddelande..."
          class="flex-1 bg-gray-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 resize-none"
          rows="1"
        ></textarea>
        <button
          @click="sendMessage"
          :disabled="isLoading || !userInput.trim()"
          class="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Icon v-if="isLoading" icon="mdi:loading" class="w-5 h-5 animate-spin" />
          <Icon v-else icon="mdi:send" class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>
