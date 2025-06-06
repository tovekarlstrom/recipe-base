import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

export async function generateEmbedding(text: string) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    const embedding = response.data[0].embedding
    console.log('Generated embedding dimensions:', embedding.length)
    return embedding
  } catch (error) {
    console.log('Error generating embeddings: ', error)
    throw new Error('Failed to generate embedding')
  }
}
