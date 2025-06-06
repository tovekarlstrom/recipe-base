import { RunnableSequence } from '@langchain/core/runnables'
import { PromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { supabase } from '@/supabase/supabaseClient'

const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0,
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
})

const outputParser = new StringOutputParser()

const prompt = PromptTemplate.fromTemplate(
  `
 Är detta ett personligt påstående? "{input}"
 svara endast med "true" eller "false" i små bokstäver.
  `,
)

const userInfoSummerizerPrompt = PromptTemplate.fromTemplate(
  `Summera informationen i JSON format: "{input}"
  Returnera ett JSON objekt med följande struktur:
    "summary": "kort sammanfattning av informationen"
  `,
)

const userInfoSummerizerChain = RunnableSequence.from([userInfoSummerizerPrompt, llm, outputParser])

const relevanceChecker = RunnableSequence.from([prompt, llm, outputParser])

export async function storeRelevanceChecker(input: string, userId: string) {
  const res = await relevanceChecker.invoke({ input })
  if (res.toLowerCase() === 'true') {
    console.log('storeRelevanceChecker', input)
    await userInfoSummerizer(input, userId)
  }

  return res.toLowerCase() === 'true'
}

export async function userInfoSummerizer(input: string, userId: string) {
  console.log('userInfoSummerizer', input)
  try {
    const res = await userInfoSummerizerChain.invoke({ input })
    return await storeUserInfo(res, userId)
  } catch (e) {
    console.error('Failed to parse JSON:', e)
    return null
  }
}

export async function storeUserInfo(input: string, userId: string) {
  console.log('storeUserInfo input:', input)
  try {
    // Clean the input string by removing any markdown code block markers
    const cleanedInput = input.replace(/```json\n|\n```/g, '').trim()
    console.log('Cleaned input:', cleanedInput)

    // Parse the JSON
    const userInfo = JSON.parse(cleanedInput)
    console.log('Parsed userInfo:', userInfo)

    // Store in Supabase
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        summary: userInfo.summary,
        preferences: userInfo.preferences,
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error('Error storing user preferences:', error)
      return null
    }

    return data
  } catch (e) {
    console.error('Failed to parse JSON in storeUserInfo:', e)
    return null
  }
}
