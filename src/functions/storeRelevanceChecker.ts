import { RunnableSequence } from '@langchain/core/runnables'
import { PromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { supabase } from '@/supabase/supabaseClient'
import { JsonOutputParser } from '@langchain/core/output_parsers'
import { useUserPreferencesStore } from '@/stores/userPreferencesStore'

const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0,
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
})

const outputParser = new StringOutputParser()
const jsonParser = new JsonOutputParser()

const prompt = PromptTemplate.fromTemplate(
  `
 Är detta ett personligt påstående? "{input}"
 svara endast med "true" eller "false" i små bokstäver.
  `,
)

const userInfoSummerizerPrompt = PromptTemplate.fromTemplate(
  `Analyze the following user input and extract ALL relevant preferences and information. The user might mention multiple things at once (like dislikes AND equipment limitations). Return a JSON object with the following structure:
  {{
    "preferences": {{
      "equipment": ["list of ALL equipment mentioned, e.g. 'no oven', 'has air fryer'"],
      "dislikes": ["list of ALL foods or ingredients the user dislikes"],
      "likes": ["list of ALL foods or cuisines the user likes"],
      "dietary_restrictions": ["list of ALL dietary restrictions or allergies"],
      "other_preferences": ["list of ALL other cooking preferences"]
    }}
  }}

  IMPORTANT:
  - Extract ALL relevant information from the input, not just the first thing mentioned
  - If the user mentions multiple things (e.g., both dislikes and equipment), include ALL of them
  - Be thorough in capturing every preference or limitation mentioned
  - Only include categories that are relevant to the input. If a category is not mentioned, use an empty array
  - Be specific and concise in the lists
  - Always return valid JSON

  User input: "{input}"`,
)

const userInfoSummerizerChain = RunnableSequence.from([userInfoSummerizerPrompt, llm, jsonParser])

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
    return await storeUserInfo(JSON.stringify(res), userId)
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

    let userInfo
    try {
      // Parse the JSON
      userInfo = JSON.parse(cleanedInput)
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError)
      return null
    }

    // Get existing preferences
    const { data: existingData } = await supabase
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .single()

    // Helper function to merge arrays and remove duplicates
    const mergeArrays = (existing: string[] = [], newItems: string[] = []) => {
      return [...new Set([...existing, ...newItems])]
    }

    // Merge with existing preferences if they exist
    const mergedPreferences = existingData
      ? {
          ...existingData.preferences,
          ...userInfo.preferences,
          // Merge arrays and remove duplicates
          equipment: mergeArrays(
            existingData.preferences.equipment,
            userInfo.preferences.equipment,
          ),
          dislikes: mergeArrays(existingData.preferences.dislikes, userInfo.preferences.dislikes),
          likes: mergeArrays(existingData.preferences.likes, userInfo.preferences.likes),
          dietary_restrictions: mergeArrays(
            existingData.preferences.dietary_restrictions,
            userInfo.preferences.dietary_restrictions,
          ),
          other_preferences: mergeArrays(
            existingData.preferences.other_preferences,
            userInfo.preferences.other_preferences,
          ),
        }
      : userInfo.preferences

    // Store in Supabase using upsert with conflict handling
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: userId,
          preferences: mergedPreferences,
        },
        {
          onConflict: 'user_preferences_user_id_key',
          ignoreDuplicates: false,
        },
      )
      .select()

    if (error) {
      console.error('Error storing user preferences:', error)
      return null
    }

    // Update the store
    const userPreferencesStore = useUserPreferencesStore()
    await userPreferencesStore.updatePreferences(mergedPreferences)

    return data
  } catch (e) {
    console.error('Failed to process user info:', e)
    return null
  }
}
