import { generateEmbedding } from './common'
import { createClient } from '@supabase/supabase-js'
// import { HfInference } from '@huggingface/inference'

// const client = new HfInference(import.meta.env.VITE_HF_ACCESS_TOKEN)

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY)

interface SearchResult {
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
  similarity: number
}

export async function searchRecipesByText(
  query: string,
  matchThreshold = 0.4,
  matchCount = 7,
): Promise<SearchResult[]> {
  try {
    console.log('Generating embedding for search query')
    // Format the search query to match how recipes are stored
    const normalizedQuery = query.toLowerCase()
    // Add variations of the search term
    const searchVariations = [
      normalizedQuery,
      normalizedQuery.replace(/e$/, 'a'), // Handle common Swedish word endings
      normalizedQuery.replace(/a$/, 'e'),
      normalizedQuery.replace(/en$/, 'a'),
      normalizedQuery.replace(/a$/, 'en'),
    ].join(' ')

    const searchText = [
      `Recipe: ${searchVariations}`,
      '',
      `Description: ${searchVariations}`,
      '',
      'Servings: 4',
      '',
      'Ingredients:',
      searchVariations,
      '',
      'Instructions:',
      searchVariations,
    ].join('\n')

    console.log('Search text:', searchText)
    const embedding = await generateEmbedding(searchText)

    if (embedding && embedding.length > 0) {
      console.log('Searching for matching recipes')
      console.log('Using match threshold:', matchThreshold)
      console.log('Using match count:', matchCount)
      const { data, error } = await supabase.rpc('match_recipes', {
        query_embedding: embedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
      })
      if (error) {
        console.error('Error matching recipes:', error)
        return []
      }
      console.log('Found recipes:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('First recipe similarity:', data[0].similarity)
      }
      return data as SearchResult[]
    }
    return []
  } catch (error) {
    console.error('Could not search recipes:', error)
    return []
  }
}

// export async function handleChatbotPrompt(results, text) {
//   if (results.length > 0) {
//     const topResults = results.slice(0, 3);
//     const context = topResults.map(
//       (result, index) => `Document ${index}: ${result.sentence}`
//     );

//     const message = `
//         You are an AI assistant tasked with answering questions based on provided context information. Your goal is to use the given context to provide accurate and relevant answers to user queries. The queries will be in any language but you should always answer in swedish.

// First, here is the context information you should use to inform your answers:

// <context>
// {${context}}
// </context>

// Now, I will present you with a question from a user. Your task is to answer this question using only the information provided in the context above. Do not use any external knowledge or information that is not contained within the given context.

// Here is the user's question:

// <question>
// {${text}}
// </question>

// Please follow these steps to formulate your response:

// 1. Carefully read and analyze the provided context.
// 2. Identify information within the context that is relevant to answering the user's question.
// 3. Formulate a clear and concise answer based solely on the relevant information from the context.
// 4. If the context does not contain sufficient information to fully answer the question, state this clearly in your response.

// Present your answer in the following format in Swedish in a text that rhymes:
// <answer>
// [Ditt svar här]
// </answer>
// If you cannot answer the question based on the given context, your response should be:

// I apologize, but I don't have enough information in the provided context to answer this question accurately.

// Remember, your goal is to provide accurate information based on the given extra context. Do not speculate or include information from outside the provided context.

//         `;

//     const chatbotResponse = queryChatbot(message);
//     console.log(chatbotResponse);
//     return chatbotResponse;
//   }
// }

// async function queryChatbot(message) {
//   try {
//     let out = "";

//     console.log(message);
//     const stream = client.chatCompletionStream({
//       model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
//       messages: [{ role: "user", content: message }],
//       temperature: 0.5,
//       max_tokens: 1000,
//     });

//     for await (const chunk of stream) {
//       if (chunk.choices && chunk.choices.length > 0) {
//         const newContent = chunk.choices[0].delta.content;
//         out += newContent;
//       }
//     }
//     return out;
//   } catch (error) {
//     console.error("Could not call chatbot: ", error);
//   }
// }
