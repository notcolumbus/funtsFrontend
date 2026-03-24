export interface Font {
  id: string
  name: string
  meta: {
    google_css_url: string
    designer: string
  }
  technical: {
    category: string
    weights: string[]
  }
  tags: {
    mood: string[]
    use_case: string[]
  }
  scores: {
    heading_score: number
    body_score: number
  }
  pairing: {
    role: string
    pairs_well_with: string[]
  }
  raw?: {
    metadata: Record<string, unknown>
    tags: Record<string, unknown>
  }
}
