import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { searchRecipesByText } from './functions/queryDatabase'
import type { Recipe } from './types/recipe'
import { setTimer } from '@/services/timer'
import { uploadTextToDatabase, type RecipeData } from '@/functions/storeRecipes'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

// Define the system prompt for the co-chef
const CO_CHEF_PROMPT = `You are an experienced and friendly co-chef assistant. Your role is to help users explore recipes through interactive conversation. Follow these guidelines:

1. Answers and pressentations should be in swedish only
2. Be conversational and engaging, using a friendly, encouraging tone
3. Ask specific questions about:
   - Cuisine preferences
   - Dietary restrictions
   - Available ingredients
   - Cooking skill level
   - Time constraints
   - Equipment available
4. Guide users through recipe creation step by step
5. Provide helpful tips and explanations
6. Suggest recipe variations and substitutions
7. Keep responses concise and focused
8. Use emojis occasionally to make the conversation more engaging
9. If a user mentions specific ingredients or preferences, incorporate them into your suggestions

When searching for recipes:
- Use the searchRecipes function when the user wants to find existing recipes
- Present search results in a friendly, organized way
- Ask follow-up questions about the search results
- Suggest recipe modifications based on user preferences
- If the user mentions a recipe by name, use the searchRecipes function to find it
- If you find the recipe the user is looking for, stick to the recipe details and don't search for more recipes util the user asks for it

When selecting a recipe:
- Use the result of the searchRecipe to select the recipe the user want to know more about
- Present the recipe in a friendly, organized way
- If the user wants to know more about the recipe, use the recipe details to answer the question

When setting timers:
- Use the setTimer function when the user needs a cooking timer
- Convert time to seconds before calling setTimer
- For example, "set a timer for 5 minutes" should call setTimer(300)

Remember to:
- Break down complex cooking concepts into simple terms
- Offer encouragement and positive reinforcement
- Suggest safety tips when relevant
- Be patient and supportive
- Keep the conversation flowing naturally

Start by introducing yourself as their co-chef Gramz and asking about their cooking goals or preferences.`

// Define the recipe creation prompt
const RECIPE_CREATION_PROMPT = `Help the user create a recipe by:
1. Taking information about the following to create a recipe:
    - Name of the recipe
    - Description of the recipe
    - Number of Servings
    - Ingredients
    - Instructions
2. when all information is provided, create a recipe with the following format and call the storeRecipe function with the recipe as an argument:
    {
      name: string,
      description: string,
      servings: number,
      ingredients: Array<{
        ingredient: string,
        amount?: string,
        unit?: string
      }>,
      instructions: Array<{
        step_number: number,
        instruction: string
      }>
    }

Keep instructions clear and beginner-friendly.`

interface FunctionCall {
  name: string
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
  name: string
  response: {
    success?: boolean
    message?: string
    recipes?: Recipe[]
  }
}

export class Agent {
  private model = genAI.getGenerativeModel({
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
                    description: { type: SchemaType.STRING, nullable: true },
                    servings: { type: SchemaType.NUMBER },
                    ingredients: {
                      type: SchemaType.ARRAY,
                      items: {
                        type: SchemaType.OBJECT,
                        properties: {
                          ingredient: { type: SchemaType.STRING },
                          amount: { type: SchemaType.STRING, nullable: true },
                          unit: { type: SchemaType.STRING, nullable: true },
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
                  required: ['name', 'servings', 'ingredients', 'instructions'],
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

  private chat = this.model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: CO_CHEF_PROMPT }],
      },
    ],
  })

  async startTimer(duration: number): Promise<void> {
    console.log('Agent setting timer for', duration, 'seconds')
    try {
      setTimer(duration)
      console.log('Timer set successfully')
    } catch (error) {
      console.error('Error setting timer:', error)
    }
  }

  async searchRecipes(query: string): Promise<Recipe[]> {
    try {
      const searchResults = await searchRecipesByText(query)
      // Convert SearchResult to Recipe type
      console.log('searchResults', searchResults)
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
      return []
    }
  }

  async storeRecipe(recipeData: RecipeData): Promise<void> {
    console.log('Agent storing recipe:', recipeData)
    try {
      await uploadTextToDatabase(recipeData)
      console.log('Recipe stored successfully')
    } catch (error) {
      console.error('Error storing recipe:', error)
    }
  }

  async chatWithUser(message: string): Promise<{ text: string; recipes?: Recipe[] }> {
    try {
      let response = await this.chat.sendMessage(message)
      let recipes: Recipe[] | undefined

      while (true) {
        let functionCalled = false
        const candidates = response.response.candidates || []

        for (const candidate of candidates) {
          const parts = candidate.content?.parts || []
          for (const part of parts) {
            if (part.functionCall) {
              functionCalled = true
              const functionCall = part.functionCall as FunctionCall
              const functionName = functionCall.name
              const args = functionCall.args

              console.log(`Agent called ${functionName} with args:`, args)

              let functionResult: FunctionResponse['response']
              if (functionName === 'setTimer' && typeof args.duration === 'number') {
                await this.startTimer(args.duration)
                functionResult = {
                  success: true,
                  message: `Timer set for ${args.duration} seconds`,
                }
              } else if (functionName === 'searchRecipe' && typeof args.recipe === 'string') {
                recipes = await this.searchRecipes(args.recipe)
                functionResult = { recipes }
              } else if (functionName === 'storeRecipe' && args.recipeData) {
                await this.storeRecipe(args.recipeData)
                functionResult = {
                  success: true,
                  message: 'Recipe stored successfully',
                }
              } else {
                functionResult = { success: false, message: 'Invalid function arguments' }
              }

              response = await this.chat.sendMessage([
                {
                  functionResponse: {
                    name: functionName,
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
      return {
        text: 'I apologize, but I encountered an error. Could you please rephrase your question?',
      }
    }
  }

  async createRecipe(requirements: string): Promise<string> {
    try {
      const prompt = `${RECIPE_CREATION_PROMPT}\n\nUser requirements: ${requirements}`
      console.log('prompt', prompt)
      const result = await this.chat.sendMessage(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Error creating recipe:', error)
      return 'I apologize, but I encountered an error while creating the recipe. Could you please try again?'
    }
  }
}
