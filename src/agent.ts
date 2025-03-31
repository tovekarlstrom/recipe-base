import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { searchRecipesByText } from './functions/queryDatabase'
import { uploadTextToDatabase } from './functions/storeRecipes'
import type { Recipe } from './types/recipe'
import { setTimer } from '@/services/timer'
import { AGENT_PROMPTS } from './prompts/agentPrompts'
import { useRecipesStore } from '@/stores/recipes'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

// Type definitions
type FunctionName = 'setTimer' | 'searchRecipe' | 'storeRecipe'

interface FunctionCall {
  name: FunctionName
  args: {
    duration?: number
    recipe?: string
    recipeData?: {
      name: string
      description: string
      servings: number
      ingredients: Array<{
        ingredient: string
        amount?: string
        unit?: string
      }>
      instructions: Array<{
        step_number: number
        instruction: string
      }>
    }
  }
}

interface FunctionResponse {
  name: FunctionName
  response: {
    success?: boolean
    message?: string
    recipes?: Recipe[]
  }
}

interface ChatResponse {
  text: string
  recipes?: Recipe[]
}

// Create a composable for the AI agent
export function useAgent() {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    tools: [
      {
        functionDeclarations: [
          {
            name: 'setTimer',
            description: 'sets a timer for a requested amount of time',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                duration: {
                  type: SchemaType.NUMBER,
                  description: 'duration in seconds',
                },
              },
              required: ['duration'],
            },
          },
          {
            name: 'searchRecipe',
            description: 'searches for a recipe by name',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                recipe: {
                  type: SchemaType.STRING,
                  description: 'the name of the recipe',
                },
              },
              required: ['recipe'],
            },
          },
          {
            name: 'storeRecipe',
            description: 'stores a new recipe in the database',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                recipeData: {
                  type: SchemaType.OBJECT,
                  description: 'the recipe data to store',
                  properties: {
                    name: { type: SchemaType.STRING },
                    description: { type: SchemaType.STRING },
                    servings: { type: SchemaType.NUMBER },
                    ingredients: {
                      type: SchemaType.ARRAY,
                      items: {
                        type: SchemaType.OBJECT,
                        properties: {
                          ingredient: { type: SchemaType.STRING },
                          amount: { type: SchemaType.STRING },
                          unit: { type: SchemaType.STRING },
                        },
                        required: ['ingredient'],
                      },
                    },
                    instructions: {
                      type: SchemaType.ARRAY,
                      items: {
                        type: SchemaType.OBJECT,
                        properties: {
                          step_number: { type: SchemaType.NUMBER },
                          instruction: { type: SchemaType.STRING },
                        },
                        required: ['step_number', 'instruction'],
                      },
                    },
                  },
                  required: ['name', 'description', 'servings', 'ingredients', 'instructions'],
                },
              },
              required: ['recipeData'],
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  })

  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: AGENT_PROMPTS.CO_CHEF }],
      },
    ],
  })

  const startTimer = async (duration: number): Promise<void> => {
    try {
      await setTimer(duration)
      console.log('Timer set successfully')
    } catch (error) {
      console.error('Error setting timer:', error)
      throw new Error('Failed to set timer')
    }
  }

  const searchRecipes = async (query: string): Promise<Recipe[]> => {
    try {
      const searchResults = await searchRecipesByText(query)
      return searchResults.map((result) => ({
        id: result.id,
        name: result.name,
        description: result.description || '',
        ingredients: result.recipe_ingredients.map((ri) =>
          `${ri.amount || ''} ${ri.unit || ''} ${ri.ingredient}`.trim(),
        ),
        instructions: result.recipe_instructions.map((ri) => ri.instruction),
        created_at: result.created_at,
        updated_at: result.updated_at,
      }))
    } catch (error) {
      console.error('Error searching recipes:', error)
      throw new Error('Failed to search recipes')
    }
  }

  const handleFunctionCall = async (
    functionCall: FunctionCall,
  ): Promise<FunctionResponse['response']> => {
    const { name, args } = functionCall
    const recipesStore = useRecipesStore()

    switch (name) {
      case 'setTimer':
        if (typeof args.duration === 'number') {
          await startTimer(args.duration)
          return {
            success: true,
            message: `Timer set for ${args.duration} seconds`,
          }
        }
        break
      case 'searchRecipe':
        if (typeof args.recipe === 'string') {
          const recipes = await searchRecipes(args.recipe)
          return { recipes }
        }
        break
      case 'storeRecipe':
        if (args.recipeData) {
          try {
            await uploadTextToDatabase(args.recipeData)
            // Clear the recipes store and fetch new recipes
            recipesStore.clearRecipes()
            await recipesStore.fetchRecipes()
            return { success: true, message: 'Recipe stored successfully' }
          } catch (error) {
            console.error('Error storing recipe:', error)
            return { success: false, message: 'Failed to store recipe' }
          }
        }
        break
    }

    return { success: false, message: 'Invalid function arguments' }
  }

  const chatWithUser = async (message: string): Promise<ChatResponse> => {
    try {
      let response = await chat.sendMessage(message)
      let recipes: Recipe[] | undefined

      while (true) {
        const candidates = response.response.candidates || []
        let functionCalled = false

        for (const candidate of candidates) {
          const parts = candidate.content?.parts || []
          for (const part of parts) {
            if (part.functionCall) {
              functionCalled = true
              const functionCall = part.functionCall as FunctionCall
              const functionResult = await handleFunctionCall(functionCall)

              if (functionResult.recipes) {
                recipes = functionResult.recipes
              }

              response = await chat.sendMessage([
                {
                  functionResponse: {
                    name: functionCall.name,
                    response: functionResult,
                  },
                },
              ])
              break
            }
          }
          if (functionCalled) break
        }

        if (!functionCalled) {
          return {
            text: response.response.text(),
            recipes,
          }
        }
      }
    } catch (error) {
      console.error('Error in chat:', error)
      throw new Error('Failed to process chat message')
    }
  }

  const createRecipe = async (requirements: string): Promise<string> => {
    try {
      const prompt = `${AGENT_PROMPTS.RECIPE_CREATION_PROMPT}\n\nUser requirements: ${requirements}`
      const result = await chat.sendMessage(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Error creating recipe:', error)
      throw new Error('Failed to create recipe')
    }
  }

  return {
    chatWithUser,
    createRecipe,
  }
}
