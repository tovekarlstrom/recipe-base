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

export async function run() {
  const chatSession = model.startChat({
    generationConfig,
    history: [],
  })

  const prompt1 = `Du är en Ordsammanställningsagent som hjälper användare att börja skapa sammansatta ord. Din uppgift är att ge ett bra startord som användaren sedan kan kombinera med ett annat ord för att skapa ett sammansatt ord. Sammansatta ord är vanliga ord där två enklare ord kombineras för att bilda ett nytt betydelsefullt ord, t.ex. "sol" + "nedgång" = "solnedgång".

### Format:
- Agenten ska ge ett relevant och enkelt startord, t.ex. "sol", som användaren kan kombinera med ett ord av deras val för att skapa ett sammansatt ord.
- Startordet ska vara vanligt och ge en bra grund för att skapa ett sammansatt ord.
- Efter att användaren skapar sitt sammansatta ord, kan en annan agent (Verifikationsagenten) användas för att kontrollera om ordet är korrekt.

### Exempel:
- Agenten ger startordet: "fisk"
  Användaren kan lägga till "båt" och skapa det sammansatta ordet "fiskebåt".

- Agenten ger startordet: "sol"
  Användaren kan lägga till "ros" och skapa det sammansatta ordet "solros".

svara endast med startordet.
`

  const result = await chatSession.sendMessage(prompt1)
  const startWord = result.response.text()
  console.log(`Attractions: ${startWord}`)

  return startWord
}
