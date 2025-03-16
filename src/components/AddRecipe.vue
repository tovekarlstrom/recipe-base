<script setup lang="ts">
import { ref } from 'vue'
import { uploadTextToDatabase } from '@/functions/storeRecipes'

const recipeName = ref('')
const description = ref('')
const servings = ref(4)
const ingredients = ref<{ ingredient: string; amount: string; unit: string }[]>([
  { ingredient: '', amount: '', unit: '' },
])
const instructions = ref<{ step: number; text: string }[]>([{ step: 1, text: '' }])
const isSubmitting = ref(false)

function addIngredient() {
  ingredients.value.push({ ingredient: '', amount: '', unit: '' })
}

function removeIngredient(index: number) {
  ingredients.value.splice(index, 1)
}

function addInstruction() {
  instructions.value.push({ step: instructions.value.length + 1, text: '' })
}

function removeInstruction(index: number) {
  instructions.value.splice(index, 1)
  // Reorder remaining steps
  instructions.value.forEach((instruction, i) => {
    instruction.step = i + 1
  })
}

async function handleSubmit() {
  if (
    !recipeName.value ||
    !description.value ||
    !servings.value ||
    ingredients.value.some((i) => !i.ingredient) ||
    instructions.value.some((i) => !i.text)
  ) {
    alert('Please fill in all required fields')
    return
  }

  isSubmitting.value = true
  try {
    await uploadTextToDatabase({
      name: recipeName.value,
      description: description.value,
      servings: servings.value,
      ingredients: ingredients.value.map((i) => ({
        ingredient: i.ingredient,
        amount: i.amount || '',
        unit: i.unit || '',
      })),
      instructions: instructions.value.map((i) => ({ step_number: i.step, instruction: i.text })),
    })

    alert('Recipe added successfully!')
    // Reset form
    recipeName.value = ''
    description.value = ''
    servings.value = 4
    ingredients.value = [{ ingredient: '', amount: '', unit: '' }]
    instructions.value = [{ step: 1, text: '' }]
  } catch (error) {
    console.error('Error adding recipe:', error)
    alert('Failed to add recipe. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col w-full text-left">
    <h2 class="text-2xl font-bold text-white mb-6">Add New Recipe</h2>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div>
        <label for="recipeName" class="block text-gray-300 mb-2 font-medium">Recipe Name</label>
        <input
          v-model="recipeName"
          type="text"
          id="recipeName"
          class="w-full bg-gray-600 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
          placeholder="Enter recipe name"
          required
        />
      </div>
      <div>
        <label for="description" class="block text-gray-300 mb-2 font-medium">Description</label>
        <input
          v-model="description"
          type="text"
          id="description"
          class="w-full bg-gray-600 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
          placeholder="Enter description"
          required
        />
      </div>
      <div>
        <label for="servings" class="block text-gray-300 mb-2 font-medium"
          >Number of Servings</label
        >
        <input
          v-model.number="servings"
          type="number"
          id="servings"
          min="1"
          class="w-full bg-gray-600 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
          required
        />
      </div>

      <div class="space-y-3">
        <label class="block text-gray-300 font-medium">Ingredients</label>
        <div v-for="(ingredient, index) in ingredients" :key="index" class="flex gap-2">
          <input
            v-model="ingredient.amount"
            type="text"
            class="w-24 bg-gray-600 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
            placeholder="Amount"
          />
          <input
            v-model="ingredient.unit"
            type="text"
            class="w-24 bg-gray-600 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
            placeholder="Unit"
          />
          <input
            v-model="ingredient.ingredient"
            type="text"
            class="flex-1 bg-gray-600 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
            placeholder="Ingredient name"
            required
          />
          <button
            type="button"
            @click="removeIngredient(index)"
            class="px-3 py-2 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <button
          type="button"
          @click="addIngredient"
          class="w-full px-4 py-2.5 bg-blue-950 text-gray-300 rounded-xl hover:bg-gray-600 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Add Ingredient</span>
        </button>
      </div>

      <div class="space-y-3">
        <label class="block text-gray-300 font-medium">Instructions</label>
        <div
          v-for="(instruction, index) in instructions"
          :key="index"
          class="flex gap-2 items-center"
        >
          <div
            class="w-8 h-8 bg-gray-600 text-gray-300 rounded-full flex items-center justify-center font-medium"
          >
            {{ instruction.step }}
          </div>
          <input
            v-model="instruction.text"
            type="text"
            class="flex-1 bg-gray-600 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
            placeholder="Step instruction"
            required
          />
          <button
            type="button"
            @click="removeInstruction(index)"
            class="px-3 py-2 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <button
          type="button"
          @click="addInstruction"
          class="w-full px-4 py-2.5 bg-blue-950 text-gray-300 rounded-xl hover:bg-gray-600 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Add Step</span>
        </button>
      </div>

      <div class="flex justify-end pt-4">
        <button
          type="submit"
          :disabled="isSubmitting"
          class="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {{ isSubmitting ? 'Adding Recipe...' : 'Add Recipe' }}
        </button>
      </div>
    </form>
  </div>
</template>
