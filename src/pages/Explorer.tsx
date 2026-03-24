import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import {
  deleteFontById,
  fetchCurrentFont,
  fetchNextFont,
  fetchPreviousFont,
  getFontProgress,
  injectGoogleFont,
} from '../lib/font-api'
import type { Font } from '../types/font'

const defaultSubtitle =
  'Build expressive interfaces quickly. This specimen shows how the typeface balances personality and clarity at display and body sizes.'

const fontSwapVariants = {
  initial: { opacity: 0, y: -8, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: 8, filter: 'blur(6px)' },
}

function getFontFamily(font: Font | null) {
  return font
    ? `"${font.name}", 'Sora', sans-serif`
    : `'Sora', sans-serif`
}

function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
}

export function Explorer() {
  const [font, setFont] = useState<Font | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [motionKey, setMotionKey] = useState(0)
  const [titleText, setTitleText] = useState('')
  const [subtitleText, setSubtitleText] = useState(defaultSubtitle)
  const [deleting, setDeleting] = useState(false)

  const fetchedRef = useRef(false)
  const busyRef = useRef(false)

  const fontFamily = useMemo(() => getFontFamily(font), [font])
  const progress = useMemo(() => getFontProgress(font?.id ?? null), [font])

  const applyFont = useCallback((next: Font) => {
    setFont(next)
    setTitleText(next.name)
    if (next.meta.google_css_url) injectGoogleFont(next.meta.google_css_url)
    setMotionKey((k) => k + 1)
  }, [])

  const navigate = useCallback(async (fetchFn: () => Promise<Font>, errorMsg: string) => {
    if (busyRef.current) return
    busyRef.current = true
    setLoading(true)
    setError(null)
    try {
      applyFont(await fetchFn())
    } catch {
      setError(errorMsg)
    } finally {
      busyRef.current = false
      setLoading(false)
    }
  }, [applyFont])

  const goNext = useCallback(() => navigate(fetchNextFont, 'Could not load font.'), [navigate])
  const goPrev = useCallback(() => navigate(fetchPreviousFont, 'Could not go back.'), [navigate])

  const deleteCurrent = useCallback(async () => {
    if (!font || busyRef.current) return
    busyRef.current = true
    setDeleting(true)
    setError(null)
    try {
      await deleteFontById(font.id)
      applyFont(await fetchCurrentFont())
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(msg.toLowerCase().includes('no fonts') ? 'No fonts left.' : 'Delete failed.')
      if (msg.toLowerCase().includes('no fonts')) setFont(null)
    } finally {
      busyRef.current = false
      setDeleting(false)
    }
  }, [applyFont, font])

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    void goNext()
  }, [goNext])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return
      if (e.code === 'Space' || e.key === 'ArrowDown') {
        e.preventDefault()
        void goNext()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        void goPrev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev])

  const stop = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <div className="relative flex min-h-screen flex-col bg-[#f7f6f3] text-zinc-900">
      <header className="flex items-start justify-between px-4 pb-2 pt-4 sm:px-6">
        <div>
          <span className="font-mono text-sm text-zinc-600">funts.app</span>
          <p className="text-[11px] text-zinc-400">space / tap next · ↑↓ browse</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>
            {progress.position > 0
              ? `${progress.position} / ${progress.total}`
              : `${progress.total} fonts`}
          </span>
          <button
            type="button"
            onClick={() => void goPrev()}
            disabled={deleting || loading}
            className="rounded-full border border-zinc-300 px-3 py-1 transition enabled:hover:bg-zinc-100 disabled:opacity-40"
          >
            back
          </button>
          <button
            type="button"
            onClick={() => void goNext()}
            disabled={deleting || loading}
            className="rounded-full border border-zinc-300 px-3 py-1 transition enabled:hover:bg-zinc-100 disabled:opacity-40"
          >
            next
          </button>
          <button
            type="button"
            onClick={() => void deleteCurrent()}
            disabled={!font || deleting || loading}
            className="rounded-full border border-zinc-300 px-3 py-1 transition enabled:hover:bg-zinc-100 disabled:opacity-40"
          >
            {deleting ? 'deleting…' : 'delete'}
          </button>
        </div>
      </header>

      <main
        className="flex flex-1 items-center justify-center px-5"
        onClick={() => void goNext()}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={motionKey}
            variants={fontSwapVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="w-full max-w-3xl text-center"
            style={{ fontFamily }}
          >
            {loading && !font ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-zinc-400" />
            ) : (
              <>
                <input
                  value={titleText || font?.name || ''}
                  onChange={(e) => setTitleText(e.target.value)}
                  onClick={stop}
                  className="w-full bg-transparent text-center text-5xl font-semibold tracking-tight outline-none sm:text-7xl lg:text-8xl"
                />
                <textarea
                  value={subtitleText}
                  onChange={(e) => setSubtitleText(e.target.value)}
                  onClick={stop}
                  rows={3}
                  className="mt-4 w-full resize-none bg-transparent text-center text-sm leading-7 text-zinc-600 outline-none sm:text-base"
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {error && (
        <p className="absolute bottom-12 left-1/2 -translate-x-1/2 text-xs text-red-600">{error}</p>
      )}

      <footer className="flex items-end justify-between px-4 pb-4 text-sm sm:px-6">
        <p className="text-zinc-700" style={{ fontFamily }}>
          {font?.name ?? '…'}
        </p>
        <p className="text-zinc-500">{font?.meta.designer || ''}</p>
      </footer>
    </div>
  )
}
