import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { fetchRandomFont, injectGoogleFont } from '../lib/font-api'
import { cn } from '../lib/utils'
import type { Font } from '../types/font'

const defaultSubtitle =
  'Build expressive interfaces quickly. This specimen shows how the typeface balances personality and clarity at display and body sizes.'

const fontSwapVariants = {
  initial: { opacity: 0, y: -8, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: 8, filter: 'blur(6px)' },
}

function getFontFamily(font: Font | null) {
  if (!font) {
    return `'Sora', 'Avenir Next', 'Segoe UI', sans-serif`
  }

  return `"${font.name}", 'Sora', 'Avenir Next', 'Segoe UI', sans-serif`
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tag = target.tagName
  return (
    target.isContentEditable ||
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT'
  )
}

function stringifyValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => stringifyValue(item)).join(', ')
  }

  if (value === null || value === undefined) {
    return '—'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  const text = String(value).trim()
  return text.length > 0 ? text : '—'
}

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  className?: string
  multiline?: boolean
}

function EditableText({
  value,
  onChange,
  className,
  multiline = false,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const startEditing = () => {
    setDraft(value)
    setEditing(true)
  }

  if (editing) {
    if (multiline) {
      return (
        <textarea
          autoFocus
          rows={4}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            const next = draft.trim()
            if (next) {
              onChange(next)
            }
            setEditing(false)
          }}
          className={cn(
            'w-full resize-none bg-transparent text-center outline-none',
            className,
          )}
        />
      )
    }

    return (
      <input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          const next = draft.trim()
          if (next) {
            onChange(next)
          }
          setEditing(false)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            const next = draft.trim()
            if (next) {
              onChange(next)
            }
            setEditing(false)
          }
        }}
        className={cn('w-full bg-transparent text-center outline-none', className)}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className={cn('w-full cursor-text text-center', className)}
    >
      {value}
    </button>
  )
}

export function Explorer() {
  const [font, setFont] = useState<Font | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fontMotionIndex, setFontMotionIndex] = useState(0)
  const [titleText, setTitleText] = useState('')
  const [subtitleText, setSubtitleText] = useState(defaultSubtitle)

  const fetchedRef = useRef(false)
  const loadingRef = useRef(false)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)

  const fontFamily = useMemo(() => getFontFamily(font), [font])

  const metaEntries = useMemo(() => {
    if (!font?.raw?.metadata) {
      return []
    }

    return Object.entries(font.raw.metadata)
  }, [font])

  const tagEntries = useMemo(() => {
    if (!font?.raw?.tags) {
      return []
    }

    return Object.entries(font.raw.tags)
  }, [font])

  const requestNewFont = useCallback(async () => {
    if (loadingRef.current) {
      return
    }

    loadingRef.current = true
    setLoading(true)
    setFetchError(null)

    try {
      const next = await fetchRandomFont()
      setFont(next)
      setTitleText(next.name)
      if (next.meta.google_css_url) {
        injectGoogleFont(next.meta.google_css_url)
      }
      setFontMotionIndex((prev) => prev + 1)
    } catch {
      setFetchError('Could not load a font. Press Space to retry.')
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (fetchedRef.current) {
      return
    }

    fetchedRef.current = true
    void requestNewFont()
  }, [requestNewFont])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return
      }

      if (event.code === 'Space' || event.key === 'ArrowDown') {
        event.preventDefault()
        void requestNewFont()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [requestNewFont])

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
      touchStartRef.current = null
      return
    }

    const touch = event.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }
  }

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || isEditableTarget(event.target)) {
      return
    }

    const start = touchStartRef.current
    touchStartRef.current = null

    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    const elapsed = Date.now() - start.time

    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && elapsed < 280) {
      void requestNewFont()
    }
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#f7f6f3] text-zinc-900"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-4 pb-2 pt-4 sm:px-6">
        <div className="pointer-events-auto flex flex-col">
          <span className="font-mono text-sm text-zinc-600">funts.app</span>
          <span className="text-[11px] text-zinc-400">space / tap = shuffle</span>
        </div>

        <div className="pointer-events-auto w-[min(44vw,520px)] max-h-[38vh] overflow-auto text-[11px] leading-5 text-zinc-600">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">metadata</p>
          {metaEntries.map(([key, value]) => (
            <p key={`meta-${key}`}>
              <span className="text-zinc-400">{key}:</span> {stringifyValue(value)}
            </p>
          ))}
          <p className="mb-1 mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">tags</p>
          {tagEntries.map(([key, value]) => (
            <p key={`tag-${key}`}>
              <span className="text-zinc-400">{key}:</span> {stringifyValue(value)}
            </p>
          ))}
        </div>
      </header>

      <main className="grid min-h-screen grid-cols-1 pt-20 lg:grid-cols-[1fr_320px] lg:pt-10">
        <section className="flex items-center justify-center px-5 pb-20 lg:pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${font?.id ?? 'loading'}-${fontMotionIndex}`}
              variants={fontSwapVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.14, ease: 'easeOut' }}
              className="w-full max-w-3xl text-center"
              style={{ fontFamily }}
            >
              {loading && !font ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                </div>
              ) : (
                <>
                  <EditableText
                    value={titleText || font?.name || 'Font'}
                    onChange={setTitleText}
                    className="text-5xl font-semibold tracking-tight sm:text-7xl lg:text-8xl"
                  />
                  <div className="mx-auto mt-4 max-w-2xl">
                    <EditableText
                      value={subtitleText}
                      onChange={setSubtitleText}
                      multiline
                      className="text-sm leading-7 text-zinc-600 sm:text-base"
                    />
                  </div>
                </>
              )}

              {fetchError ? (
                <p className="mt-3 text-xs text-red-600">{fetchError}</p>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </section>

        <aside className="hidden border-l border-zinc-200/70 px-5 py-10 lg:block" style={{ fontFamily }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">elements</p>
          <div className="mt-4 space-y-4 text-sm text-zinc-700">
            <button className="rounded-full border border-zinc-300 px-4 py-1 text-sm">Primary Action</button>
            <input
              className="w-full border-b border-zinc-300 bg-transparent py-2 text-sm outline-none"
              placeholder="Input element"
              readOnly
            />
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Navigation · Dashboard · Settings</p>
            <p className="text-xs text-zinc-500">1234567890</p>
          </div>
        </aside>
      </main>

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-4 pb-4 text-sm sm:px-6">
        <p className="pointer-events-auto text-zinc-700" style={{ fontFamily }}>
          {font?.name ?? 'Loading font...'}
        </p>
        <p className="pointer-events-auto text-zinc-500">{font?.meta.designer || 'Unknown Designer'}</p>
      </footer>
    </div>
  )
}

