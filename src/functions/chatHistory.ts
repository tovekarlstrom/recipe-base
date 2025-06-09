import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages'
import { AGENT_PROMPTS } from '../prompts/agentPrompts'

// Initialize the chat model
const chatModel = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.7,
  openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
})

// Store chat history
let chatHistory: (HumanMessage | AIMessage | SystemMessage)[] = [
  new SystemMessage(AGENT_PROMPTS.CO_CHEF),
]

export function useChatHistory() {
  const addMessage = (role: 'user' | 'assistant', content: string) => {
    if (role === 'user') {
      chatHistory.push(new HumanMessage(content))
    } else {
      chatHistory.push(new AIMessage(content))
    }
  }

  const getChatHistory = () => {
    return chatHistory
  }

  const clearChatHistory = () => {
    chatHistory = [new SystemMessage(AGENT_PROMPTS.CO_CHEF)]
  }

  const getChatModel = () => {
    return chatModel
  }

  return {
    addMessage,
    getChatHistory,
    clearChatHistory,
    getChatModel,
  }
}
