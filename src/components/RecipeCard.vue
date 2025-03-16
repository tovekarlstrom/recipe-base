<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  recipe: {
    id: string
    name: string
    description: string | null
    servings: number
    created_at: string
    updated_at: string
    recipe_ingredients: {
      ingredient: string
      amount: string | null
      unit: string | null
    }[]
    recipe_instructions: {
      step_number: number
      instruction: string
    }[]
  }
}

const props = defineProps<Props>()

const formattedDate = computed(() => {
  return new Date(props.recipe.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})
</script>

<template>
  <div
    @click="$router.push(`recipe/${props.recipe.id}`)"
    class="bg-gray-700 rounded-2xl p-6 hover:bg-gray-600 min-w-[300px] transition-colors duration-200"
  >
    <div class="flex justify-between items-start mb-4">
      <h3 class="text-xl font-bold text-white">{{ recipe.name }}</h3>
      <span class="text-gray-400 text-xs">{{ formattedDate }}</span>
    </div>

    <p v-if="recipe.description" class="text-gray-300 mb-4">{{ recipe.description }}</p>

    <div class="flex items-center gap-2 mb-4">
      <span class="text-gray-400">Servings:</span>
      <span class="text-white">{{ recipe.servings }}</span>
    </div>

    <div class="mb-4">
      <h4 class="text-white font-semibold mb-2">Ingredients</h4>
      <ul class="space-y-1">
        <li
          v-for="(ingredient, index) in recipe.recipe_ingredients"
          :key="index"
          class="text-gray-300"
        >
          {{ ingredient.amount }} {{ ingredient.unit }} {{ ingredient.ingredient }}
        </li>
      </ul>
    </div>

    <div>
      <h4 class="text-white font-semibold mb-2">Instructions</h4>
      <ol class="space-y-2">
        <li
          v-for="instruction in recipe.recipe_instructions"
          :key="instruction.step_number"
          class="text-gray-300"
        >
          <span class="font-semibold text-blue-400">{{ instruction.step_number }}.</span>
          {{ instruction.instruction }}
        </li>
      </ol>
    </div>
  </div>
</template>
