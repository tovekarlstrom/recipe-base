import OpenAI from 'openai'
import { searchRecipesByText } from './queryDatabase'
import { uploadTextToDatabase } from './storeRecipes'
import type { Recipe } from '../types/recipe'
import { setTimer } from '@/services/timer'
import { AGENT_PROMPTS } from '../prompts/agentPrompts'
import { useRecipesStore } from '@/stores/recipes'
import { useChatHistory } from './chatHistory'
import { useUserPreferencesStore } from '@/stores/userPreferences'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

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

export function useOpenAIAgent() {
  const { addMessage, getChatHistory } = useChatHistory()
  const userPreferencesStore = useUserPreferencesStore()

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
            console.log('Storing recipe:', args.recipeData)
            const recipeData = {
              name: args.recipeData.name,
              description: args.recipeData.description,
              servings: args.recipeData.servings,
              ingredients: args.recipeData.ingredients.map((ing) => ({
                ingredient: ing.ingredient,
                amount: ing.amount || '',
                unit: ing.unit || '',
              })),
              instructions: args.recipeData.instructions.map((inst) => ({
                step_number: inst.step_number,
                instruction: inst.instruction,
              })),
            }
            await uploadTextToDatabase(recipeData)
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
    console.log('message', message)
    try {
      // Add user message to chat history
      addMessage('user', message)

      // Get user preferences
      const preferences = userPreferencesStore.preferences
      let systemPrompt = AGENT_PROMPTS.CO_CHEF

      // Add user preferences to system prompt if available
      if (preferences) {
        systemPrompt += `\n\nUser Profile:
- Cooking Experience: ${preferences.cookingExperience}
- Can Read Recipes: ${preferences.canReadRecipes ? 'Yes' : 'No'}
- Dietary Restrictions: ${preferences.dietaryRestrictions || 'None'}

Please adapt your responses based on this user profile.`
        // Please adapt your responses based on these preferences:
        // 1. Avoid suggesting recipes with disliked ingredients
        // 2. Consider dietary restrictions and allergies when recommending recipes
        // 3. Adjust cooking instructions based on the user's skill level
        // 4. Prioritize recipes from favorite cuisines when relevant
        // 5. Always mention if a recipe needs modifications to accommodate restrictions or allergies
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...getChatHistory().map((msg) => {
            const role = msg._getType() === 'human' ? 'user' : 'assistant'
            return {
              role,
              content: msg.content.toString(),
            } as const
          }),
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'setTimer',
              description: 'sets a timer for a requested amount of time',
              parameters: {
                type: 'object',
                properties: {
                  duration: {
                    type: 'number',
                    description: 'duration in seconds',
                  },
                },
                required: ['duration'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'searchRecipe',
              description: 'searches for a recipe by name',
              parameters: {
                type: 'object',
                properties: {
                  recipe: {
                    type: 'string',
                    description: 'the name of the recipe',
                  },
                },
                required: ['recipe'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'storeRecipe',
              description: 'stores a new recipe in the database',
              parameters: {
                type: 'object',
                properties: {
                  recipeData: {
                    type: 'object',
                    description: 'the recipe data to store',
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      servings: { type: 'number' },
                      ingredients: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            ingredient: { type: 'string' },
                            amount: { type: 'string' },
                            unit: { type: 'string' },
                          },
                          required: ['ingredient'],
                        },
                      },
                      instructions: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            step_number: { type: 'number' },
                            instruction: { type: 'string' },
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
          },
        ],
      })

      const response = completion.choices[0].message
      let recipes: Recipe[] | undefined

      if (response.tool_calls?.[0]) {
        console.log('Tool call received:', response.tool_calls[0])
        const toolCall = response.tool_calls[0]
        const functionCall = {
          name: toolCall.function.name as FunctionName,
          args: JSON.parse(toolCall.function.arguments),
        }
        console.log('Parsed function call:', functionCall)
        const functionResult = await handleFunctionCall(functionCall)
        console.log('Function result:', functionResult)

        if (functionResult.recipes) {
          recipes = functionResult.recipes
        }

        // Get the final response after function execution
        const finalCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            ...getChatHistory().map((msg) => {
              const role = msg._getType() === 'human' ? 'user' : 'assistant'
              return {
                role,
                content: msg.content.toString(),
              } as const
            }),
            {
              role: 'assistant',
              content: null,
              tool_calls: [toolCall],
            },
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(functionResult),
            },
          ],
        })

        const responseText = finalCompletion.choices[0].message.content || ''
        // Add assistant message to chat history
        addMessage('assistant', responseText)

        return {
          text: responseText,
          recipes,
        }
      }

      const responseText = response.content || ''
      // Add assistant message to chat history
      addMessage('assistant', responseText)

      return {
        text: responseText,
        recipes,
      }
    } catch (error) {
      console.error('Error in chat:', error)
      throw new Error('Failed to process chat message')
    }
  }

  const createRecipe = async (requirements: string): Promise<string> => {
    try {
      const preferences = userPreferencesStore.preferences
      let systemPrompt = AGENT_PROMPTS.RECIPE_CREATION_PROMPT

      // Add user preferences to system prompt if available
      if (preferences) {
        systemPrompt += `\n\nUser Profile:
- Cooking Experience: ${preferences.cookingExperience}
- Can Read Recipes: ${preferences.canReadRecipes ? 'Yes' : 'No'}
- Dietary Restrictions: ${preferences.dietaryRestrictions || 'None'}

Please adapt the recipe creation based on this user profile.`

        // Add specific instructions based on user preferences
        if (preferences.cookingExperience === 'Beginner') {
          systemPrompt +=
            '\n- Use simple, basic cooking techniques\n- Include detailed explanations for each step\n- Avoid complex terminology'
        }
        if (!preferences.canReadRecipes) {
          systemPrompt +=
            '\n- Provide very detailed, step-by-step instructions\n- Include visual cues and descriptions\n- Break down complex steps into smaller parts'
        }
        if (preferences.dietaryRestrictions) {
          systemPrompt += `\n- Ensure the recipe is compatible with these dietary restrictions: ${preferences.dietaryRestrictions}\n- Suggest appropriate substitutions if needed`
        }
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: requirements,
          },
        ],
      })

      return completion.choices[0].message.content || ''
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
