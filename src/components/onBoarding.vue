<script setup lang="ts">
import { ref, computed } from 'vue'
import InputComponent from './InputComponent.vue'
import OptionsComponent from '@/components/OptionsComponent.vue'
import { useRouter } from 'vue-router'
import { useUserPreferencesStore } from '@/stores/userPreferences'

const router = useRouter()
const userPreferencesStore = useUserPreferencesStore()

const text = ref('Welcome to RecipeBase')
const input = ref('')
const index = ref(-1)
const userAnswers = ref<string[]>([])
const showForm = ref(false)
const isComplete = ref(false)

const textArray = [
  {
    text: 'How well do you know your way around the kitchen?',
    inputType: 'slider',
    options: ['Beginner', 'Intermediate', 'Advanced', 'Professional'],
  },
  {
    text: 'Can you easily read recipes?',
    inputType: 'slider',
    options: ['Yes', 'No'],
  },
  {
    text: 'Do you or someone in the household have any allergies or dietary restrictions?',
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
      text.value = 'Thank you for completing the questionnaire!'

      // Store user preferences
      userPreferencesStore.setPreferences({
        cookingExperience: userAnswers.value[0] as
          | 'Beginner'
          | 'Intermediate'
          | 'Advanced'
          | 'Professional',
        canReadRecipes: userAnswers.value[1] === 'Yes',
        dietaryRestrictions: userAnswers.value[2],
      })

      setTimeout(redirectToHome, 3000)
    }
  }
}

const redirectToHome = () => {
  router.push('/')
}

const handleInput = (value: string) => {
  input.value = value
}
</script>

<template>
  <div class="flex flex-col items-center justify-center h-screen">
    <h1 style="color: white">{{ text }}</h1>
    <p v-if="index === -1" style="color: white">
      To get the most out of RecipeBase, please fill in the following information
    </p>
    <div v-if="showForm && currentQuestion">
      <OptionsComponent
        v-if="currentQuestion.inputType === 'slider'"
        v-model="input"
        :options="currentQuestion.options || []"
      />
      <InputComponent
        v-if="currentQuestion.inputType === 'text'"
        v-model="input"
        @input="handleInput"
      />
    </div>
    <button v-if="!isComplete" class="bg-blue-500 text-white p-2 px-4 rounded-md" @click="next">
      {{ index === -1 ? 'Start' : 'Next' }}
    </button>
  </div>
</template>
