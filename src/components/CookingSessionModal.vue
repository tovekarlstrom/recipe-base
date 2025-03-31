<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Recipe } from '@/stores/recipes'
import { aiAgent } from '@/functions/geminiAgent'

const props = defineProps<{
  recipe: Recipe
}>()

const emit = defineEmits(['close'])

const currentStep = ref(0)
const isLoading = ref(false)
const detailedSteps = ref<
  Array<{
    step: number
    instruction: string
    tips: string[]
    estimatedTime?: string
  }>
>([])

async function generateDetailedSteps() {
  isLoading.value = true
  try {
    const prompt = `You are a professional chef creating detailed cooking steps. Your response must be a valid JSON array.

    Recipe details:
    Name: ${props.recipe.name}
    Description: ${props.recipe.description || 'No description provided'}
    Ingredients: ${props.recipe.recipe_ingredients.map((i) => `${i.amount || ''} ${i.unit || ''} ${i.ingredient}`).join(', ')}

    Original steps:
    ${props.recipe.recipe_instructions.map((i) => `${i.step_number}. ${i.instruction}`).join('\n')}

    Create a JSON array of objects with this exact structure:
    [
      {
        "step": 1,
        "instruction": "Detailed instruction text",
        "tips": ["Tip 1", "Tip 2"],
        "estimatedTime": "5-10 minutes"
      }
    ]

    Requirements for each step:
    1. Clear, beginner-friendly instructions
    2. 2 helpful tips
    3. Estimated time
    4. Common mistakes to avoid

    IMPORTANT: Your response must be ONLY the JSON array, with no additional text or explanation. And the response must be in swedish`

    const text = await aiAgent({ prompt })

    console.log('Raw AI response:', text) // Debug log

    try {
      // Try to clean the response if it contains markdown code blocks
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim()
      console.log('Cleaned response:', cleanedText) // Debug log

      detailedSteps.value = JSON.parse(cleanedText)
    } catch (e) {
      console.error('Failed to parse AI response:', e)
      console.error('Response text:', text) // Debug log
      // Fallback to original steps if parsing fails
      detailedSteps.value = props.recipe.recipe_instructions.map((instruction) => ({
        step: instruction.step_number,
        instruction: instruction.instruction,
        tips: [],
        estimatedTime: undefined,
      }))
    }
  } catch (error) {
    console.error('Error generating detailed steps:', error)
    // Fallback to original steps if AI fails
    detailedSteps.value = props.recipe.recipe_instructions.map((instruction) => ({
      step: instruction.step_number,
      instruction: instruction.instruction,
      tips: [],
      estimatedTime: undefined,
    }))
  } finally {
    isLoading.value = false
  }
}

function nextStep() {
  if (currentStep.value < detailedSteps.value.length - 1) {
    currentStep.value++
  }
}

function previousStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function closeSession() {
  emit('close')
}

onMounted(() => {
  generateDetailedSteps()
})
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-gray-800 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <h2 class="text-2xl font-bold text-white">Koksession</h2>
        <button @click="closeSession" class="text-gray-400 hover:text-white transition-colors">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"
        ></div>
        <p class="text-gray-300">Genererar detaljerade koksteg...</p>
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Current Step -->
        <div class="bg-gray-700 rounded-xl p-6 mb-8">
          <div class="flex items-start gap-4">
            <div
              class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
            >
              {{ currentStep + 1 }}
            </div>
            <div class="flex-1">
              <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-semibold text-white">Nuvarande steg</h3>
                <span v-if="detailedSteps[currentStep]?.estimatedTime" class="text-blue-400">
                  {{ detailedSteps[currentStep].estimatedTime }}
                </span>
              </div>
              <p class="text-gray-200 text-lg mb-6">
                {{ detailedSteps[currentStep]?.instruction }}
              </p>

              <!-- Tips -->
              <div v-if="detailedSteps[currentStep]?.tips.length > 0" class="mt-6">
                <h4 class="text-lg font-semibold text-white mb-3">Tips & Tricks</h4>
                <ul class="space-y-2">
                  <li
                    v-for="(tip, index) in detailedSteps[currentStep].tips"
                    :key="index"
                    class="text-gray-300 flex items-start gap-2"
                  >
                    <svg
                      class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {{ tip }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Relevant Ingredients -->
        <div class="bg-gray-700 rounded-xl p-6 mb-8">
          <h3 class="text-xl font-semibold text-white mb-4">Relevant Ingredients</h3>
          <ul class="space-y-2">
            <li
              v-for="(ingredient, index) in props.recipe.recipe_ingredients"
              :key="index"
              class="text-gray-200 flex items-center gap-2"
            >
              <svg
                class="w-5 h-5 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {{ ingredient.amount }} {{ ingredient.unit }} {{ ingredient.ingredient }}
            </li>
          </ul>
        </div>

        <!-- Controls -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button
              @click="previousStep"
              :disabled="currentStep === 0"
              class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous Step
            </button>
            <span class="text-white">
              Step {{ currentStep + 1 }} of {{ detailedSteps.length }}
            </span>
            <button
              @click="nextStep"
              :disabled="currentStep === detailedSteps.length - 1"
              class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next Step
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
