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
  `Analysera följande användarinput och extrahera ALL relevant information och preferenser. Användaren kan nämna flera saker samtidigt (som både preferenser och utrustningsbegränsningar). Returnera ett JSON-objekt med följande struktur:
  {{
    "preferences": {{
      "equipment": ["lista med ALL utrustning som nämns. Om användaren säger att de INTE har något, MÅSTE du lägga till det som 'ingen X'. T.ex. om användaren säger 'jag har ingen ugn', lägg till 'ingen ugn'"],
      "dislikes": ["lista med ALL mat eller ingredienser som användaren ogillar. Använd alltid svenska ord, t.ex. 'banan' istället för 'banana'"],
      "likes": ["lista med ALL mat eller kök som användaren gillar"],
      "dietary_restrictions": ["lista med ALL kostrestriktioner eller allergier"],
      "other_preferences": ["lista med ALL andra matlagningspreferenser"]
    }}
  }}

  VIKTIGT:
  - Extrahera ALL relevant information från inputen, inte bara det första som nämns
  - Om användaren nämner flera saker (t.ex. både ogillar och utrustning), inkludera ALLA
  - Var noggrann med att fånga varje preferens eller begränsning som nämns
  - Inkludera endast kategorier som är relevanta för inputen. Om en kategori inte nämns, använd en tom array
  - Var specifik och koncis i listorna
  - Använd alltid svenska ord i listorna
  - För utrustning: om användaren säger att de INTE har något, MÅSTE du lägga till det som 'ingen X'
  - Returnera alltid giltig JSON

  Exempel:
  1. Input: "Jag har ingen ugn men har en luftfritös"
  Output: {{
    "preferences": {{
      "equipment": ["ingen ugn", "har luftfritös"],
      "dislikes": [],
      "likes": [],
      "dietary_restrictions": [],
      "other_preferences": []
    }}
  }}

  2. Input: "jag har ingen ugn"
  Output: {{
    "preferences": {{
      "equipment": ["ingen ugn"],
      "dislikes": [],
      "likes": [],
      "dietary_restrictions": [],
      "other_preferences": []
    }}
  }}

  3. Input: "jag gillar inte papaya"
  Output: {{
    "preferences": {{
      "equipment": [],
      "dislikes": ["papaya"],
      "likes": [],
      "dietary_restrictions": [],
      "other_preferences": []
    }}
  }}

  Användarinput: "{input}"`,
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
  console.log('userInfoSummerizer input:', input)
  try {
    const res = await userInfoSummerizerChain.invoke({ input })
    console.log('LangChain output:', res)

    // Validate the structure of the output
    if (!res || typeof res !== 'object' || !res.preferences) {
      console.error('Invalid output structure from LangChain:', res)
      return null
    }

    // Validate that all required arrays exist
    const requiredArrays = [
      'equipment',
      'dislikes',
      'likes',
      'dietary_restrictions',
      'other_preferences',
    ]
    for (const key of requiredArrays) {
      if (!Array.isArray(res.preferences[key])) {
        console.error(`Missing or invalid array for ${key}:`, res.preferences[key])
        res.preferences[key] = []
      }
    }

    return await storeUserInfo(JSON.stringify(res), userId)
  } catch (e) {
    console.error('Failed in userInfoSummerizer:', e)
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
      console.log('Parsed userInfo:', userInfo)
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError)
      return null
    }

    // Validate the structure
    if (!userInfo || !userInfo.preferences) {
      console.error('Invalid userInfo structure:', userInfo)
      return null
    }

    // Get existing preferences
    const { data: existingData, error: fetchError } = await supabase
      .from('user_preferences_v2')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned"
      console.error('Error fetching existing preferences:', fetchError)
      return null
    }

    console.log('Existing preferences:', existingData)

    // Helper function to merge arrays and remove duplicates
    const mergeArrays = (existing: string[] = [], newItems: string[] = []) => {
      return [...new Set([...existing, ...newItems])]
    }

    // Prepare the data for upsert
    const preferencesData = {
      user_id: userId,
      equipment: mergeArrays(existingData?.equipment || [], userInfo.preferences.equipment || []),
      dislikes: mergeArrays(existingData?.dislikes || [], userInfo.preferences.dislikes || []),
      likes: mergeArrays(existingData?.likes || [], userInfo.preferences.likes || []),
      dietary_restrictions: mergeArrays(
        existingData?.dietary_restrictions || [],
        userInfo.preferences.dietary_restrictions || [],
      ),
      other_preferences: mergeArrays(
        existingData?.other_preferences || [],
        userInfo.preferences.other_preferences || [],
      ),
    }

    console.log('Merged preferences:', preferencesData)

    // Store in Supabase using upsert
    const { data, error } = await supabase
      .from('user_preferences_v2')
      .upsert(preferencesData)
      .select()

    if (error) {
      console.error('Error storing user preferences:', error)
      return null
    }

    console.log('Successfully stored preferences:', data)

    // Update the store
    const userPreferencesStore = useUserPreferencesStore()
    await userPreferencesStore.updatePreferences({
      equipment: preferencesData.equipment,
      dislikes: preferencesData.dislikes,
      likes: preferencesData.likes,
      dietary_restrictions: preferencesData.dietary_restrictions,
      other_preferences: preferencesData.other_preferences,
    })

    return data
  } catch (e) {
    console.error('Failed to process user info:', e)
    return null
  }
}
