import OpenAI from 'openai'

export const NEAR_AI_MODEL = process.env.NEAR_AI_MODEL || 'zai-org/GLM-5.1-FP8'

export function createNearAIClient() {
  const apiKey = process.env.NEAR_AI_API_KEY
  if (!apiKey) return null

  return new OpenAI({
    apiKey,
    baseURL: 'https://cloud-api.near.ai/v1',
    timeout: 55_000,
    maxRetries: 0,
  })
}

export function parseModelJson(content: string): unknown {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error('Invalid model JSON')
  return JSON.parse(cleaned.slice(start, end + 1))
}
