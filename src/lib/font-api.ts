import type { Font } from '../types/font'
import { TEST_FONTS } from './test-fonts'
import { toSlug } from './utils'

const API_BASE =
  import.meta.env.VITE_FONTS_API_BASE ?? 'https://api.funts.amans.place'
const USE_TEST_FONTS = import.meta.env.VITE_USE_TEST_FONTS === 'true'

const loadedFontLinks = new Set<string>()
let cachedFonts: Font[] | null = null
let catalogPromise: Promise<Font[]> | null = null
let currentIndex = -1

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

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return value
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function tagArray(source: Record<string, unknown>, key: string): string[] {
  const value = source[key]
  if (Array.isArray(value)) {
    return asArray(value)
  }

  if (typeof value === 'string') {
    return asArray(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    )
  }

  return []
}

function normalizeFont(payload: unknown): Font {
  const row = asRecord(payload)
  const fontJson = parseMaybeJson(row.font_json)
  const source = asRecord(fontJson)

  const root = Object.keys(source).length > 0 ? source : row
  const meta = asRecord(root.meta)
  const technical = asRecord(root.technical)
  const scores = asRecord(root.scores)
  const pairing = asRecord(root.pairing)
  const tagsFromFont = asRecord(root.tags)
  const tagsFromRow = asRecord(parseMaybeJson(row.tags_json))
  const tags = Object.keys(tagsFromFont).length > 0 ? tagsFromFont : tagsFromRow

  const name = asText(row.name, asText(root.name, 'Untitled Font'))
  const fallbackId = toSlug(name) || 'untitled-font'
  const id = asText(row.id, asText(root.id, asText(row.slug, fallbackId)))
  const rawWeights = asArray(technical.weights)
  const weights =
    rawWeights.length > 0
      ? rawWeights
      : [asText(technical.weight_min), asText(technical.weight_max)].filter(
          Boolean,
        )
  const pairsFromRow = asArray(parseMaybeJson(row.pair_font_ids_json))

  return {
    id: asText(id, fallbackId),
    name,
    meta: {
      google_css_url: asText(
        meta.google_css_url,
        asText(row.google_css_url, asText(root.google_css_url)),
      ),
      designer: asText(meta.designer, 'Unknown Designer'),
    },
    technical: {
      category: asText(technical.category, 'Uncategorized'),
      weights,
    },
    tags: {
      mood: tagArray(tags, 'mood'),
      use_case: tagArray(tags, 'use_case'),
    },
    scores: {
      heading_score: asScore(scores.heading_score),
      body_score: asScore(scores.body_score),
    },
    pairing: {
      role: asText(pairing.role, 'Flexible'),
      pairs_well_with: (() => {
        const fromPairing = asArray(pairing.pairs_well_with)
        return fromPairing.length > 0 ? fromPairing : pairsFromRow
      })(),
    },
    raw: {
      metadata: meta,
      tags,
    },
  }
}

async function fetchFontCatalog(signal?: AbortSignal): Promise<Font[]> {
  if (USE_TEST_FONTS) {
    if (!cachedFonts) {
      cachedFonts = [...TEST_FONTS]
    }

    if (cachedFonts.length === 0) {
      throw new Error('No fonts available')
    }

    return cachedFonts
  }

  if (cachedFonts && cachedFonts.length > 0) {
    return cachedFonts
  }

  if (!catalogPromise) {
    catalogPromise = (async () => {
      const response = await fetch(`${API_BASE}/api/fonts`, { signal })

      if (!response.ok) {
        throw new Error(`Failed to fetch fonts (${response.status})`)
      }

      const payload = (await response.json()) as { fonts?: unknown[] }
      const rows = Array.isArray(payload.fonts) ? payload.fonts : []
      const normalized = rows.map((item) => normalizeFont(item))
      const valid = normalized.filter((item) => item.name && item.id)

      if (valid.length === 0) {
        throw new Error('No fonts returned from API')
      }

      cachedFonts = valid
      return valid
    })().finally(() => {
      catalogPromise = null
    })
  }

  return catalogPromise
}

function adjustIndexAfterRemove(removedIndex: number) {
  if (!cachedFonts || cachedFonts.length === 0) {
    currentIndex = -1
  } else if (removedIndex >= 0 && removedIndex < currentIndex) {
    currentIndex -= 1
  } else if (currentIndex >= cachedFonts.length) {
    currentIndex = 0
  }
}

export async function fetchCurrentFont(signal?: AbortSignal): Promise<Font> {
  const fonts = await fetchFontCatalog(signal)
  if (fonts.length === 0) {
    throw new Error('No fonts available')
  }

  if (currentIndex < 0 || currentIndex >= fonts.length) {
    currentIndex = 0
  }

  return fonts[currentIndex]
}

export async function fetchNextFont(signal?: AbortSignal): Promise<Font> {
  const fonts = await fetchFontCatalog(signal)
  if (fonts.length === 0) {
    throw new Error('No fonts available')
  }

  if (currentIndex < 0) {
    currentIndex = 0
  } else {
    currentIndex = (currentIndex + 1) % fonts.length
  }

  return fonts[currentIndex]
}

export async function fetchPreviousFont(signal?: AbortSignal): Promise<Font> {
  const fonts = await fetchFontCatalog(signal)
  if (fonts.length === 0) {
    throw new Error('No fonts available')
  }

  if (currentIndex < 0) {
    currentIndex = 0
  } else {
    currentIndex = (currentIndex - 1 + fonts.length) % fonts.length
  }

  return fonts[currentIndex]
}

export function getFontProgress(fontId?: string | null) {
  const total = cachedFonts?.length ?? 0
  if (!fontId || !cachedFonts) {
    return { position: 0, total }
  }

  const index = cachedFonts.findIndex((font) => font.id === fontId)
  return {
    position: index >= 0 ? index + 1 : 0,
    total,
  }
}

export async function deleteFontById(id: string) {
  const normalizedId = String(id)

  if (USE_TEST_FONTS) {
    if (!cachedFonts) {
      cachedFonts = [...TEST_FONTS]
    }

    const removedIndex = cachedFonts.findIndex((font) => font.id === normalizedId)
    if (removedIndex >= 0) {
      cachedFonts.splice(removedIndex, 1)
    }

    adjustIndexAfterRemove(removedIndex)

    return {
      deleted: removedIndex >= 0,
      id: normalizedId,
      changes: removedIndex >= 0 ? 1 : 0,
    }
  }

  const response = await fetch(
    `${API_BASE}/api/fonts/${encodeURIComponent(normalizedId)}`,
    { method: 'DELETE' },
  )

  if (response.status === 404) {
    throw new Error('Font not found')
  }

  if (!response.ok) {
    throw new Error(`Failed to delete font (${response.status})`)
  }

  let payload: Record<string, unknown> = {}
  try {
    payload = (await response.json()) as Record<string, unknown>
  } catch {
    // non-JSON response is OK
  }

  if (cachedFonts) {
    const removedIndex = cachedFonts.findIndex((font) => font.id === normalizedId)
    cachedFonts = cachedFonts.filter((font) => font.id !== normalizedId)
    adjustIndexAfterRemove(removedIndex)
  }

  return {
    deleted: true,
    id: normalizedId,
    changes: Number(payload.changes ?? 1),
  }
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
