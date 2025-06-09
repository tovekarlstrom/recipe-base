import OpenAI from 'openai'
import { searchRecipesByText } from './queryDatabase'
import { uploadTextToDatabase } from './storeRecipes'
import type { Recipe } from '../types/recipe'
import { setTimer } from '@/services/timer'
import { AGENT_PROMPTS } from '../prompts/agentPrompts'
import { useRecipesStore } from '@/stores/recipes'
import { useChatHistory } from './chatHistory'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useUserPreferencesStore } from '@/stores/userPreferencesStore'
import { categorizeRecipe } from './aiSorting'
import { storeUserInfo } from './storeRelevanceChecker'
import { supabase } from '@/supabase/supabaseClient'
// Initialize OpenAI
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

// Type definitions
type FunctionName =
  | 'setTimer'
  | 'searchRecipe'
  | 'storeRecipe'
  | 'categorizeRecipe'
  | 'storeUserInfo'

interface FunctionCall {
  name: FunctionName
  args: {
    duration?: number
    recipe?: string
    recipeData?: {
      name: string
      description: string
      servings: number
      recipe_ingredients: Array<{
        ingredient: string
        amount?: string
        unit?: string
      }>
      recipe_instructions: Array<{
        step_number: number
        instruction: string
      }>
    }
    sortRecipe?: string[]
    userInfo?: string
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
  const onboardingStore = useOnboardingStore()
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
        servings: result.servings,
        recipe_ingredients: result.recipe_ingredients.map((ri) => ({
          ingredient: ri.ingredient,
          amount: ri.amount || null,
          unit: ri.unit || null,
        })),
        recipe_instructions: result.recipe_instructions.map((ri) => ({
          step_number: ri.step_number,
          instruction: ri.instruction,
        })),
        created_at: result.created_at,
        updated_at: result.updated_at,
        category: result.category || [],
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
              recipe_ingredients: args.recipeData.recipe_ingredients.map((ing) => ({
                ingredient: ing.ingredient,
                amount: ing.amount || '',
                unit: ing.unit || '',
              })),
              recipe_instructions: args.recipeData.recipe_instructions.map((inst) => ({
                step_number: inst.step_number,
                instruction: inst.instruction,
              })),
              category: [] as string[],
            }
            const category = await categorizeRecipe({ recipe: recipeData })
            recipeData.category = category.category

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
      case 'storeUserInfo':
        if (args.userInfo) {
          const user = await supabase.auth.getUser()
          if (user.data.user) {
            // Convert the object to a string if it's not already a string
            const userInfoString =
              typeof args.userInfo === 'string' ? args.userInfo : JSON.stringify(args.userInfo)
            await storeUserInfo(userInfoString, user.data.user.id)
            return { success: true, message: 'User info stored successfully' }
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

      // Get user preferences from both stores
      const onboardingPreferences = onboardingStore.preferences
      const userPreferences = userPreferencesStore.preferences
      let systemPrompt = AGENT_PROMPTS.CO_CHEF

      // Add user profile from onboarding
      if (onboardingPreferences) {
        systemPrompt += `\n\nUser Profile:
- Cooking Experience: ${onboardingPreferences.cookingExperience}
- Can Read Recipes: ${onboardingPreferences.canReadRecipes ? 'Yes' : 'No'}
- Initial Dietary Restrictions: ${onboardingPreferences.dietaryRestrictions || 'None'}

Please adapt your responses based on this user profile.`
      }

      // Add user preferences from chat
      if (userPreferences) {
        systemPrompt += `\n\nUser Preferences:
${userPreferences.dietary_restrictions?.length ? `- Dietary Restrictions: ${userPreferences.dietary_restrictions.join(', ')}\n` : ''}
${userPreferences.dislikes?.length ? `- Dislikes: ${userPreferences.dislikes.join(', ')}\n` : ''}
${userPreferences.likes?.length ? `- Likes: ${userPreferences.likes.join(', ')}\n` : ''}
${userPreferences.equipment?.length ? `- Equipment: ${userPreferences.equipment.join(', ')}\n` : ''}
${userPreferences.other_preferences?.length ? `- Other Preferences: ${userPreferences.other_preferences.join(', ')}\n` : ''}

Please consider these preferences when suggesting recipes and providing cooking instructions.`
      }

      // Add instruction to detect and store user preferences
      systemPrompt += `\n\nIMPORTANT: When the user mentions personal preferences, dislikes, or limitations, you MUST call the storeUserInfo function with a structured JSON object. The response MUST be in this exact format:

{
  "preferences": {
    "equipment": ["list of equipment mentioned"],
    "dislikes": ["list of foods or ingredients disliked"],
    "likes": ["list of foods or cuisines liked"],
    "dietary_restrictions": ["list of dietary restrictions or allergies"],
    "other_preferences": ["list of other cooking preferences"]
  }
}

Examples:
1. User says "I don't like bananas":
{
  "preferences": {
    "dislikes": ["bananas"],
    "equipment": [],
    "likes": [],
    "dietary_restrictions": [],
    "other_preferences": []
  }
}

2. User says "I have an air fryer and I'm vegetarian":
{
  "preferences": {
    "equipment": ["has air fryer"],
    "dietary_restrictions": ["vegetarian"],
    "dislikes": [],
    "likes": [],
    "other_preferences": []
  }
}

3. User says "I love spicy food and Italian cuisine":
{
  "preferences": {
    "likes": ["spicy food", "Italian cuisine"],
    "equipment": [],
    "dislikes": [],
    "dietary_restrictions": [],
    "other_preferences": []
  }
}

Always include ALL categories in the response, even if they're empty arrays. This ensures consistent data structure.`

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
                      recipe_ingredients: {
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
                      recipe_instructions: {
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
                    required: [
                      'name',
                      'description',
                      'servings',
                      'recipe_ingredients',
                      'recipe_instructions',
                    ],
                  },
                },
                required: ['recipeData'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'storeUserInfo',
              description:
                'stores user preferences and information about their likes, dislikes, and cooking limitations',
              parameters: {
                type: 'object',
                properties: {
                  userInfo: {
                    type: 'string',
                    description:
                      'user preferences and information to store, such as food dislikes, equipment limitations, or dietary restrictions',
                  },
                },
                required: ['userInfo'],
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
      const onboardingPreferences = onboardingStore.preferences
      const userPreferences = userPreferencesStore.preferences
      let systemPrompt = AGENT_PROMPTS.RECIPE_CREATION_PROMPT

      // Add user profile from onboarding
      if (onboardingPreferences) {
        systemPrompt += `\n\nUser Profile:
- Cooking Experience: ${onboardingPreferences.cookingExperience}
- Can Read Recipes: ${onboardingPreferences.canReadRecipes ? 'Yes' : 'No'}
- Initial Dietary Restrictions: ${onboardingPreferences.dietaryRestrictions || 'None'}

Please adapt the recipe creation based on this user profile.`

        // Add specific instructions based on user profile
        if (onboardingPreferences.cookingExperience === 'Beginner') {
          systemPrompt +=
            '\n- Use simple, basic cooking techniques\n- Include detailed explanations for each step\n- Avoid complex terminology'
        }
        if (!onboardingPreferences.canReadRecipes) {
          systemPrompt +=
            '\n- Provide very detailed, step-by-step instructions\n- Include visual cues and descriptions\n- Break down complex steps into smaller parts'
        }
      }

      // Add user preferences from chat
      if (userPreferences) {
        systemPrompt += `\n\nUser Preferences:
${userPreferences.dietary_restrictions?.length ? `- Dietary Restrictions: ${userPreferences.dietary_restrictions.join(', ')}\n` : ''}
${userPreferences.dislikes?.length ? `- Dislikes: ${userPreferences.dislikes.join(', ')}\n` : ''}
${userPreferences.likes?.length ? `- Likes: ${userPreferences.likes.join(', ')}\n` : ''}
${userPreferences.equipment?.length ? `- Equipment: ${userPreferences.equipment.join(', ')}\n` : ''}
${userPreferences.other_preferences?.length ? `- Other Preferences: ${userPreferences.other_preferences.join(', ')}\n` : ''}

Please consider these preferences when creating the recipe.`
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
