import type { Font } from '../types/font'
import { TEST_FONTS } from './test-fonts'
import { toSlug } from './utils'

const API_BASE = 'https://api.funt.app'
const USE_TEST_FONTS = import.meta.env.VITE_USE_TEST_FONTS === 'true'

const loadedFontLinks = new Set<string>()

function asArray(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0)
}

function asText(value: unknown, fallback = '') {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return fallback
}

function asScore(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function normalizeFont(payload: unknown): Font {
  const root = (payload as Record<string, unknown>) ?? {}
  const source = (root.font as Record<string, unknown> | undefined) ?? root

  const meta = (source.meta as Record<string, unknown> | undefined) ?? {}
  const technical =
    (source.technical as Record<string, unknown> | undefined) ?? {}
  const tags = (source.tags as Record<string, unknown> | undefined) ?? {}
  const scores = (source.scores as Record<string, unknown> | undefined) ?? {}
  const pairing = (source.pairing as Record<string, unknown> | undefined) ?? {}

  const name = asText(source.name, 'Untitled Font')
  const fallbackId = toSlug(name) || 'untitled-font'

  return {
    id: asText(source.id, fallbackId),
    name,
    meta: {
      google_css_url: asText(meta.google_css_url),
      designer: asText(meta.designer, 'Unknown Designer'),
    },
    technical: {
      category: asText(technical.category, 'Uncategorized'),
      weights: asArray(technical.weights),
    },
    tags: {
      mood: asArray(tags.mood),
      use_case: asArray(tags.use_case),
    },
    scores: {
      heading_score: asScore(scores.heading_score),
      body_score: asScore(scores.body_score),
    },
    pairing: {
      role: asText(pairing.role, 'Flexible'),
      pairs_well_with: asArray(pairing.pairs_well_with),
    },
  }
}

export async function fetchRandomFont(signal?: AbortSignal): Promise<Font> {
  if (USE_TEST_FONTS) {
    const randomIndex = Math.floor(Math.random() * TEST_FONTS.length)
    return TEST_FONTS[randomIndex]
  }

  const response = await fetch(`${API_BASE}/shuffle`, { signal })

  if (!response.ok) {
    throw new Error(`Failed to fetch font (${response.status})`)
  }

  const payload = (await response.json()) as unknown
  return normalizeFont(payload)
}

export function injectGoogleFont(cssUrl: string) {
  const cleanUrl = cssUrl.trim()
  if (!cleanUrl || loadedFontLinks.has(cleanUrl)) {
    return
  }

  const existingLink = document.querySelector<HTMLLinkElement>(
    `link[rel="stylesheet"][href="${cleanUrl}"]`,
  )
  if (existingLink) {
    loadedFontLinks.add(cleanUrl)
    return
  }

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = cleanUrl
  link.dataset.funtGoogleFont = 'true'
  document.head.append(link)
  loadedFontLinks.add(cleanUrl)
}

export function getFontInstallCommand(font: Font) {
  return `npx kern add ${font.id}`
}
