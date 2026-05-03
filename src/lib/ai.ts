import OpenAI from 'openai'

const apiBase = import.meta.env.VITE_AI_API_BASE_URL || 'https://api.openai.com/v1'
const apiKey = import.meta.env.VITE_AI_API_KEY || 'placeholder-key'
export const defaultModel = import.meta.env.VITE_AI_DEFAULT_MODEL || 'gpt-4o-mini'

export const openaiClient = new OpenAI({
  apiKey,
  baseURL: apiBase,
  dangerouslyAllowBrowser: true,
})

export type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function streamChat(
  messages: Message[],
  model: string = defaultModel,
  onChunk: (chunk: string) => void,
  onDone?: () => void,
): Promise<void> {
  const stream = await openaiClient.chat.completions.create({
    model,
    messages,
    stream: true,
  })

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || ''
    if (content) onChunk(content)
  }

  onDone?.()
}

export async function generateText(
  prompt: string,
  systemPrompt?: string,
  model: string = defaultModel,
): Promise<string> {
  const messages: Message[] = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content: prompt })

  const response = await openaiClient.chat.completions.create({
    model,
    messages,
  })

  return response.choices[0]?.message?.content || ''
}

export const AVAILABLE_MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
]
