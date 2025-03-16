<script setup lang="ts">
import RecipeCard from './RecipeCard.vue'
import { useRecipesStore } from '@/stores/recipes'
import { storeToRefs } from 'pinia'

const store = useRecipesStore()
const { recipes, isLoading, error } = storeToRefs(store)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <h2 class="text-3xl font-bold text-white mb-8">All Recipes</h2>

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <div v-else-if="error" class="text-red-500 text-center py-8">
      {{ error }}
    </div>

    <div v-else-if="recipes.length === 0" class="text-gray-400 text-center py-8">
      No recipes found. Add your first recipe!
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      <RecipeCard v-for="recipe in recipes" :key="recipe.id" :recipe="recipe" />
    </div>
  </div>
</template>
