import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

interface agentInterface {
  prompt: string
}

export async function aiAgent({ prompt }: agentInterface) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()
  return text
}
