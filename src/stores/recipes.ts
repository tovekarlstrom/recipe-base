import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_KEY as string,
)

export interface Recipe {
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

export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  watch(recipes, () => {
    console.log('recipes', recipes.value)
  })

  async function fetchRecipes() {
    try {
      console.log('fetchRecipes')
      // If we already have recipes, use them
      if (recipes.value.length > 0) {
        isLoading.value = false
        return recipes.value
      }

      isLoading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('recipes')
        .select(
          `
          id,
          name,
          description,
          servings,
          created_at,
          updated_at,
          recipe_ingredients (
            ingredient,
            amount,
            unit
          ),
          recipe_instructions (
            step_number,
            instruction
          )
        `,
        )
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }
      console.log('recipes fetched', data)
      recipes.value = data || []
    } catch (err) {
      console.error('Error fetching recipes:', err)
      error.value = 'Failed to load recipes. Please try again later.'
      return []
    } finally {
      isLoading.value = false
    }
  }

  // Start loading recipes without waiting
  async function prefetchRecipes() {
    if (recipes.value.length === 0) {
      isLoading.value = true
      const result = await fetchRecipes()
      return result
    }
    return recipes.value
  }

  async function getRecipe(id: string): Promise<Recipe | null> {
    // If we don't have recipes, fetch them
    if (recipes.value.length === 0) {
      await fetchRecipes()
    }
    // Return the recipe from our stored recipes
    return recipes.value.find((r) => r.id === id) || null
  }

  function clearRecipes() {
    recipes.value = []
    isLoading.value = false
    error.value = null
  }

  return {
    recipes,
    isLoading,
    error,
    fetchRecipes,
    prefetchRecipes,
    getRecipe,
    clearRecipes,
  }
})
