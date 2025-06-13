import { generateEmbedding } from './common'
import { supabase } from '@/supabase/supabaseClient'
import type { Recipe } from '@/types/recipe'

export async function searchRecipesByText(
  query: string,
  matchThreshold = 0.4,
  matchCount = 7,
): Promise<Recipe[]> {
  try {
    console.log('Generating embedding for search query')
    // Format the search query to match how recipes are stored
    const normalizedQuery = query.toLowerCase()

    const searchText = [
      `Recipe: ${normalizedQuery}`,
      '',
      `Description: ${normalizedQuery}`,
      '',
      'Servings: 4',
      '',
      'Ingredients:',
      normalizedQuery,
      '',
      'Instructions:',
      normalizedQuery,
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
      return data as Recipe[]
    }
    return []
  } catch (error) {
    console.error('Could not search recipes:', error)
    return []
  }
}
