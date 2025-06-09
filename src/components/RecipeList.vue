<script setup lang="ts">
import RecipeCard from './RecipeCard.vue'
import { useRecipesStore } from '@/stores/recipes'
import { storeToRefs } from 'pinia'
import GetCategory from './GetCategory.vue'
import { ref } from 'vue'
import type { Recipe } from '@/stores/recipes'
const store = useRecipesStore()
const { recipes, isLoading, error } = storeToRefs(store)
const filteredRecipes = ref<Recipe[]>(recipes.value)
const filterByCategory = (category: string) => {
  if (category === 'Alla kategorier') {
    filteredRecipes.value = recipes.value
  } else {
    filteredRecipes.value = recipes.value.filter((recipe) => recipe.category?.includes(category))
    console.log(filteredRecipes.value)
    console.log(recipes.value)
    return filteredRecipes.value
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <h2 class="text-3xl font-bold text-white mb-8">Alla recept</h2>
    <GetCategory @filter="filterByCategory" />

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <div v-else-if="error" class="text-red-500 text-center py-8">
      {{ error }}
    </div>

    <div
      v-else-if="recipes.length === 0 || filteredRecipes.length === 0"
      class="text-gray-400 text-center py-8"
    >
      Inga recept hittades.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      <RecipeCard v-for="recipe in filteredRecipes" :key="recipe.id" :recipe="recipe" />
    </div>
  </div>
</template>
