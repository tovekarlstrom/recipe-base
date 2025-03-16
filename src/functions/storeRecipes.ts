import { generateEmbedding } from './common'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_KEY as string,
)

export interface RecipeData {
  name: string
  description?: string
  servings: number
  ingredients: {
    ingredient: string
    amount?: string
    unit?: string
  }[]
  instructions: {
    step_number: number
    instruction: string
  }[]
}

export async function uploadTextToDatabase(recipeData: RecipeData) {
  try {
    // Generate embedding for the full recipe text
    const fullText = `Recipe: ${recipeData.name}\n\nDescription: ${recipeData.description || ''}\n\nServings: ${recipeData.servings}\n\nIngredients:\n${recipeData.ingredients.map((i) => `${i.amount} ${i.unit} ${i.ingredient}`).join('\n')}\n\nInstructions:\n${recipeData.instructions.map((i) => i.instruction).join('\n')}`
    const embedding = await generateEmbedding(fullText)

    if (!embedding || embedding.length === 0) {
      throw new Error('Failed to generate embedding')
    }

    // Insert the recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert([
        {
          name: recipeData.name,
          description: recipeData.description,
          servings: recipeData.servings,
          embedding: embedding,
        },
      ])
      .select()
      .single()

    if (recipeError) {
      throw recipeError
    }

    // Insert ingredients with separate amount and unit
    const { error: ingredientsError } = await supabase.from('recipe_ingredients').insert(
      recipeData.ingredients.map((ing) => ({
        recipe_id: recipe.id,
        ingredient: ing.ingredient,
        amount: ing.amount || null,
        unit: ing.unit || null,
      })),
    )

    if (ingredientsError) {
      throw ingredientsError
    }

    // Insert instructions
    const { error: instructionsError } = await supabase.from('recipe_instructions').insert(
      recipeData.instructions.map((instruction, index) => ({
        recipe_id: recipe.id,
        step_number: index + 1,
        instruction: instruction.instruction,
      })),
    )

    if (instructionsError) {
      throw instructionsError
    }

    return recipe
  } catch (error) {
    console.error('Error storing recipe:', error)
    throw error
  }
}
