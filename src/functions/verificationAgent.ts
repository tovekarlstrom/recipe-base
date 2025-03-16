import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(apiKey)

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',
})

const generationConfig = {
  temperature: 2,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
}

export async function run({ startWord, userInput }: { startWord: string; userInput: string }) {
  const chatSession = model.startChat({
    generationConfig,
    history: [],
  })

  const prompt1 = `Du är en Verifikationsagent som kontrollerar om användarens angivna ord skapar ett giltigt sammansatt ord. Ett sammansatt ord består av två eller fler enskilda ord som tillsammans bildar ett nytt ord med en tydlig betydelse, t.ex. "sol" + "ros" = "solros".

### **Uppgift:**
1. Ta emot två ord: det första ordet ${startWord} ges av systemet, och det andra ordet ges av användaren ${userInput}.
2. Kontrollera om kombinationen av dessa två ord bildar ett korrekt sammansatt ord på svenska.
3. Om ordet är giltigt, bekräfta det genom ett positivt svar.
4. Om ordet är ogiltigt, svara i boolean format : true


- **Exempel på giltig input:**
  - Startord: "fisk"
  - Användarens ord: "gratäng"
  - Resultat: true


  Retunera endast true eller false baserat på din analys, svara inte med någon annan text än true eller false
`

  const result = await chatSession.sendMessage(prompt1)
  const responseText = result.response.text()
  console.log(`Verification: ${responseText}`)

  return responseText
}
