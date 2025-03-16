<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useRecipesStore } from '@/stores/recipes'
import type { Recipe } from '@/stores/recipes'

const route = useRoute()
const recipeId = route.params.id
const recipe = ref<Recipe | null>(null)
const { getRecipe, error } = useRecipesStore()

onMounted(async () => {
  recipe.value = await getRecipe(recipeId as string)
  console.log('recipe', recipe)
})
</script>

<template>
  <div class="about p-8">
    <div v-if="error" class="text-red-500">
      {{ error }}
    </div>
    <div v-else-if="!recipe" class="text-gray-500">Loading...</div>
    <div v-else>
      <h1 class="text-3xl font-bold mb-4">{{ recipe.name }}</h1>
      <p v-if="recipe.description" class="text-gray-300 mb-4">
        {{ recipe.description }}
      </p>

      <div class="mb-6">
        <h2 class="text-xl font-semibold mb-2">Ingredients</h2>
        <ul class="list-disc pl-5">
          <li v-for="(ingredient, index) in recipe.recipe_ingredients" :key="index" class="mb-1">
            {{ ingredient.amount }} {{ ingredient.unit }} {{ ingredient.ingredient }}
          </li>
        </ul>
      </div>

      <div>
        <h2 class="text-xl font-semibold mb-2">Instructions</h2>
        <ol class="list-decimal pl-5">
          <li
            v-for="instruction in recipe.recipe_instructions"
            :key="instruction.step_number"
            class="mb-2"
          >
            {{ instruction.instruction }}
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
