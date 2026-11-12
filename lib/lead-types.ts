export const LOOKING_TO_OPTIONS = ['Buy', 'Rent', 'Sell'] as const
export type LookingTo = (typeof LOOKING_TO_OPTIONS)[number]

export const FINANCING_OPTIONS = ['Yes', 'No', 'Unknown'] as const
export type FinancingReadiness = (typeof FINANCING_OPTIONS)[number]

export type LeadForm = {
  fullName: string
  email: string
  phone: string
  lookingTo: LookingTo | ''
  area: string
  budget: string
  timeline: string
  financing: FinancingReadiness
  notes: string
}

export type LeadScore = 'hot' | 'warm' | 'cold'

export type ScoredLead = LeadForm & {
  id: string
  score: LeadScore
  explanation: string
  reasons: string[]
  firstMessage: string
  createdAt: string
}
