<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipesStore } from '@/stores/recipes'
import type { Recipe } from '@/stores/recipes'

const route = useRoute()
const router = useRouter()
const recipeId = route.params.id
const recipe = ref<Recipe | null>(null)
const { getRecipe, error } = useRecipesStore()
const isCookingSession = ref(false)
const currentStep = ref(0)

onMounted(async () => {
  recipe.value = await getRecipe(recipeId as string)
  console.log('recipe', recipe)
})

function startCookingSession() {
  isCookingSession.value = true
  currentStep.value = 0
}

function nextStep() {
  if (recipe.value && currentStep.value < recipe.value.recipe_instructions.length - 1) {
    currentStep.value++
  }
}

function previousStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function endCookingSession() {
  isCookingSession.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-900">
    <div v-if="error" class="text-red-500 p-8">
      {{ error }}
    </div>
    <div v-else-if="!recipe" class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    <div v-else class="max-w-4xl mx-auto px-4 py-8">
      <!-- Recipe Header -->
      <div
        class="bg-gray-800 rounded-2xl p-8 mb-8 transform hover:scale-[1.02] transition-transform duration-300"
      >
        <div class="flex justify-between items-start mb-6">
          <h1 class="text-4xl font-bold text-white">{{ recipe.name }}</h1>
          <button
            @click="router.push('/')"
            class="text-gray-400 hover:text-white transition-colors"
          >
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
        <p v-if="recipe.description" class="text-gray-300 text-lg mb-6">
          {{ recipe.description }}
        </p>
        <div class="flex items-center gap-4 text-gray-400">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{{ recipe.recipe_instructions.length }} steps</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span>{{ recipe.recipe_ingredients.length }} ingredients</span>
          </div>
        </div>
      </div>

      <!-- Ingredients Section -->
      <div
        class="bg-gray-800 rounded-2xl p-8 mb-8 transform hover:scale-[1.02] transition-transform duration-300"
      >
        <h2 class="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <svg class="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          Ingredients
        </h2>
        <ul class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <li
            v-for="(ingredient, index) in recipe.recipe_ingredients"
            :key="index"
            class="bg-gray-700 rounded-xl p-4 text-white flex items-center gap-3 transform hover:scale-[1.02] transition-transform duration-200"
          >
            <div
              class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold"
            >
              {{ index + 1 }}
            </div>
            <span>{{ ingredient.amount }} {{ ingredient.unit }} {{ ingredient.ingredient }}</span>
          </li>
        </ul>
      </div>

      <!-- Instructions Section -->
      <div
        class="bg-gray-800 rounded-2xl p-8 mb-8 transform hover:scale-[1.02] transition-transform duration-300"
      >
        <h2 class="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <svg class="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          Instructions
        </h2>
        <div class="space-y-6">
          <div
            v-for="(instruction, index) in recipe.recipe_instructions"
            :key="instruction.step_number"
            class="bg-gray-700 rounded-xl p-6 text-white transform hover:scale-[1.02] transition-transform duration-200"
            :class="{ 'ring-2 ring-blue-500': isCookingSession && currentStep === index }"
          >
            <div class="flex items-start gap-4">
              <div
                class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              >
                {{ instruction.step_number }}
              </div>
              <p class="text-lg">{{ instruction.instruction }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Cooking Session Controls -->
      <div
        v-if="isCookingSession"
        class="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4"
      >
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button
              @click="previousStep"
              :disabled="currentStep === 0"
              class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous Step
            </button>
            <span class="text-white">
              Step {{ currentStep + 1 }} of {{ recipe.recipe_instructions.length }}
            </span>
            <button
              @click="nextStep"
              :disabled="currentStep === recipe.recipe_instructions.length - 1"
              class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next Step
            </button>
          </div>
          <button
            @click="endCookingSession"
            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            End Session
          </button>
        </div>
      </div>

      <!-- Start Cooking Button -->
      <div v-if="!isCookingSession" class="fixed bottom-8 right-8">
        <button
          @click="startCookingSession"
          class="px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-500 transform hover:scale-105 transition-all duration-200 flex items-center gap-2 shadow-lg"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Start Cooking Session
        </button>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bg-gray-800 {
  animation: fadeIn 0.5s ease-out;
}
</style>
