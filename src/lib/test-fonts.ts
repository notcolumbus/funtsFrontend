import type { Font } from '../types/font'

export const TEST_FONTS: Font[] = [
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    meta: {
      google_css_url:
        'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap',
      designer: 'Florian Karsten',
    },
    technical: {
      category: 'sans_serif',
      weights: ['300', '400', '500', '600', '700'],
    },
    tags: {
      mood: ['modern', 'technical', 'clean'],
      use_case: ['dashboard', 'saas', 'landing page'],
    },
    scores: {
      heading_score: 8.9,
      body_score: 7.8,
    },
    pairing: {
      role: 'headline',
      pairs_well_with: ['Inter', 'IBM Plex Sans'],
    },
  },
  {
    id: 'dm-sans',
    name: 'DM Sans',
    meta: {
      google_css_url:
        'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,100..1000&display=swap',
      designer: 'Colophon Foundry',
    },
    technical: {
      category: 'sans_serif',
      weights: ['400', '500', '700'],
    },
    tags: {
      mood: ['friendly', 'neutral', 'balanced'],
      use_case: ['product ui', 'mobile app', 'reading'],
    },
    scores: {
      heading_score: 8.1,
      body_score: 8.7,
    },
    pairing: {
      role: 'body',
      pairs_well_with: ['Playfair Display', 'Space Grotesk'],
    },
  },
  {
    id: 'playfair-display',
    name: 'Playfair Display',
    meta: {
      google_css_url:
        'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&display=swap',
      designer: 'Claus Eggers Sorensen',
    },
    technical: {
      category: 'serif',
      weights: ['400', '500', '600', '700', '800'],
    },
    tags: {
      mood: ['elegant', 'editorial', 'dramatic'],
      use_case: ['brand hero', 'magazine', 'portfolio'],
    },
    scores: {
      heading_score: 9.4,
      body_score: 6.6,
    },
    pairing: {
      role: 'display',
      pairs_well_with: ['DM Sans', 'Inter'],
    },
  },
  {
    id: 'ibm-plex-mono',
    name: 'IBM Plex Mono',
    meta: {
      google_css_url:
        'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap',
      designer: 'Mike Abbink & IBM',
    },
    technical: {
      category: 'monospace',
      weights: ['300', '400', '500', '600', '700'],
    },
    tags: {
      mood: ['precise', 'engineer', 'retro'],
      use_case: ['devtools', 'terminal ui', 'data'],
    },
    scores: {
      heading_score: 7.5,
      body_score: 7.1,
    },
    pairing: {
      role: 'accent',
      pairs_well_with: ['Manrope', 'DM Sans'],
    },
  },
  {
    id: 'manrope',
    name: 'Manrope',
    meta: {
      google_css_url:
        'https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap',
      designer: 'Mikhail Sharanda',
    },
    technical: {
      category: 'sans_serif',
      weights: ['200', '300', '400', '500', '600', '700', '800'],
    },
    tags: {
      mood: ['minimal', 'premium', 'clear'],
      use_case: ['fintech', 'analytics', 'docs'],
    },
    scores: {
      heading_score: 8.6,
      body_score: 8.9,
    },
    pairing: {
      role: 'all_rounder',
      pairs_well_with: ['Playfair Display', 'IBM Plex Mono'],
    },
  },
]

