import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { z } from 'zod'
import type { Recipe } from '@/types/recipe'

const model = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.2,
  openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
})

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    category: z.array(z.string()).describe('List of categories that best describe the recipe'),
  }),
)

const prompt = PromptTemplate.fromTemplate(`
Du är en AI som kategoriserar recept. Givet ett recepts titel, ingredienser och instruktioner, returnera kategorin som bäst beskriver receptet.

Möjliga kategorier:
- Vegansk
- Vegetarisk
- Glutenfri (endast recept som inte innehåller produkter som innehåller gluten)
- Laktosfri (endast recept som inte innehåller produkter som innehåller laktos)
- Lågt kaloritag
- Högt protein
- Fika
- Förrätt (recept som kan serveras som förrätt)
- Huvudrätt (recept som kan serveras som huvudrätt)
- Efterrätt (recept som kan serveras som efterrätt)
- Soppa
- Sallad
- Snack
- Drink

{format_instructions}

Recept:
{recipe}
`)

const chain = RunnableSequence.from([prompt, model, parser])

export async function categorizeRecipe({ recipe }: { recipe: Recipe }) {
  try {
    const result = await chain.invoke({
      recipe,
      format_instructions: parser.getFormatInstructions(),
    })
    return {
      category: result.category,
    }
  } catch (err) {
    console.error('Error categorizing recipe:', err)
    throw err
  }
}
