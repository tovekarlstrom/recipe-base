<script setup lang="ts">
import { ref, computed } from 'vue'
import InputComponent from './InputComponent.vue'
import OptionsComponent from '@/components/OptionsComponent.vue'
import { useRouter } from 'vue-router'
import { useUserPreferencesStore } from '@/stores/userPreferencesStore'

const router = useRouter()
const userPreferencesStore = useUserPreferencesStore()

const text = ref('Välkommen till ReceptBas')
const input = ref('')
const index = ref(-1)
const userAnswers = ref<string[]>([])
const showForm = ref(false)
const isComplete = ref(false)

const textArray = [
  {
    text: 'Hur bra känner du dig i köket?',
    inputType: 'slider',
    options: ['Dålig', 'Medel', 'Avancerad', 'Professionell'],
  },
  {
    text: 'Kan du enkelt läsa recept?',
    inputType: 'slider',
    options: ['Ja', 'Nej'],
  },
  {
    text: 'Har du eller någon i hushållet några allergier eller kostrestriktioner?',
    inputType: 'text',
  },
]

const currentQuestion = computed(() => {
  if (index.value >= 0 && index.value < textArray.length) {
    return textArray[index.value]
  }
  return null
})

const next = () => {
  if (index.value === -1) {
    // Start the questionnaire
    index.value = 0
    showForm.value = true
    text.value = textArray[0].text
    return
  }

  if (index.value < textArray.length) {
    userAnswers.value = [...userAnswers.value, input.value]
    input.value = ''

    if (index.value + 1 < textArray.length) {
      index.value++
      text.value = textArray[index.value].text
    } else {
      // Questionnaire complete
      isComplete.value = true
      showForm.value = false
      text.value = 'Tack för att du slutförde enkäten!'

      // Store user preferences
      userPreferencesStore.updatePreferences({
        dietary_restrictions: userAnswers.value[2] ? [userAnswers.value[2]] : [],
        other_preferences: [
          `Kokvana: ${userAnswers.value[0]}`,
          `Kan läsa recept: ${userAnswers.value[1]}`,
        ],
      })

      setTimeout(redirectToHome, 3000)
    }
  }
}

const redirectToHome = () => {
  localStorage.setItem('firstTime', 'false')
  router.push('/')
}

const handleInput = (value: string) => {
  input.value = value
}
</script>

<template>
  <div
    class="mt-[18%] bg-gradient-to-b from-black-900 via-black-900/80 to-black-900 flex flex-col items-center justify-center p-4"
  >
    <div class="max-w-2xl w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
      <!-- Progress indicator -->
      <div class="mb-8">
        <div class="flex justify-between items-center mb-2">
          <span class="text-gray-400 text-sm">Framsteg</span>
          <span class="text-blue-400 text-sm">{{ index + 1 }}/{{ textArray.length }}</span>
        </div>
        <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-blue-500 transition-all duration-300"
            :style="{
              width: `${((index + 1) / textArray.length) * 100}%`,
            }"
          ></div>
        </div>
      </div>

      <!-- Content -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-4">{{ text }}</h1>
        <p v-if="index === -1" class="text-gray-300 text-lg">
          För att få ut mesta möjliga av ReceptBas, vänligen fyll i följande information
        </p>
      </div>

      <!-- Form -->
      <div v-if="showForm && currentQuestion" class="mb-8">
        <OptionsComponent
          v-if="currentQuestion.inputType === 'slider'"
          v-model="input"
          :options="currentQuestion.options || []"
        />
        <InputComponent
          v-if="currentQuestion.inputType === 'text'"
          v-model="input"
          @input="handleInput"
          placeholder="Skriv dina allergier eller kostrestriktioner här..."
        />
      </div>

      <!-- Success message -->
      <div v-if="isComplete" class="text-center">
        <div class="mb-4">
          <svg
            class="w-16 h-16 text-green-500 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p class="text-gray-300 text-lg">
          Tack för att du slutförde enkäten! Du omdirigeras till hemsidan om några sekunder...
        </p>
      </div>

      <!-- Navigation buttons -->
      <div class="flex justify-center">
        <button
          v-if="!isComplete"
          class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          @click="next"
        >
          {{ index === -1 ? 'Starta' : 'Nästa' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
