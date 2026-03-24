import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, RefreshCcw } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { fetchRandomFont, injectGoogleFont } from '../lib/font-api'
import { cn } from '../lib/utils'
import type { Font } from '../types/font'

const TAB_COUNT = 3

const defaultSubtitle =
  'Build expressive interfaces quickly. This specimen shows how the typeface balances personality and clarity at display and body sizes.'

const defaultReading =
  'Great typography makes product decisions feel obvious. It keeps the interface calm, makes dense information easier to scan, and gives your words a voice without shouting. Keep this block editable so you can test the font in realistic paragraphs before you commit.'

const fontSwapVariants = {
  initial: { opacity: 0, y: -10, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: 10, filter: 'blur(6px)' },
}

const tabVariants = {
  initial: (direction: 1 | -1) => ({
    opacity: 0,
    x: direction > 0 ? 24 : -24,
  }),
  animate: { opacity: 1, x: 0 },
  exit: (direction: 1 | -1) => ({
    opacity: 0,
    x: direction > 0 ? -24 : 24,
  }),
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
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault()
              const next = draft.trim()
              if (next) {
                onChange(next)
              }
              setEditing(false)
            }
          }}
          className={cn(
            'w-full resize-none rounded-2xl border border-zinc-200 bg-white/70 p-4 text-zinc-800 outline-none ring-2 ring-transparent focus:ring-zinc-300',
            className,
          )}
          rows={10}
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
        className={cn(
          'w-full rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 text-center outline-none ring-2 ring-transparent focus:ring-zinc-300',
          className,
        )}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className={cn(
        'w-full cursor-text rounded-xl border border-transparent px-2 py-1 text-center transition hover:border-zinc-200/80',
        className,
      )}
    >
      {value}
    </button>
  )
}

export function Explorer() {
  const [font, setFont] = useState<Font | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [viewIndex, setViewIndex] = useState(0)
  const [viewDirection, setViewDirection] = useState<1 | -1>(1)
  const [fontMotionIndex, setFontMotionIndex] = useState(0)

  const [titleText, setTitleText] = useState('')
  const [subtitleText, setSubtitleText] = useState(defaultSubtitle)
  const [readingText, setReadingText] = useState(defaultReading)

  const fetchedRef = useRef(false)
  const loadingRef = useRef(false)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)

  const fontFamily = useMemo(() => getFontFamily(font), [font])

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

  const cycleTabs = useCallback((delta: 1 | -1) => {
    setViewDirection(delta)
    setViewIndex((prev) => (prev + delta + TAB_COUNT) % TAB_COUNT)
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
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        cycleTabs(-1)
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        cycleTabs(1)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [cycleTabs, requestNewFont])

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
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)
    const elapsed = Date.now() - start.time

    if (absX < 12 && absY < 12 && elapsed < 280) {
      void requestNewFont()
      return
    }

    if (absX > absY && absX > 40) {
      cycleTabs(dx > 0 ? -1 : 1)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#f7f6f3] text-[#1f1f1f]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-6">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-4 flex items-center justify-between"
        >
          <span className="font-mono text-sm tracking-wide text-zinc-500">funt.app</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void requestNewFont()}
              className="rounded-full border-zinc-200 bg-white text-zinc-700"
            >
              {loading ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCcw className="mr-1 h-3.5 w-3.5" />
              )}
              Shuffle
            </Button>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.05 }}
          className="flex flex-1 flex-col overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-white p-3 shadow-[0_20px_55px_-35px_rgba(24,24,27,0.35)] sm:p-4"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {['Specimen', 'Components', 'Reading'].map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setViewDirection(index > viewIndex ? 1 : -1)
                    setViewIndex(index)
                  }}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs transition',
                    viewIndex === index
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-500 hover:text-zinc-700',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="hidden items-center gap-1 sm:flex">
              {font ? (
                <>
                  <Badge variant="secondary" className="rounded-full bg-zinc-100 text-zinc-600">
                    {font.technical.category.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full bg-zinc-100 text-zinc-600">
                    {font.meta.designer}
                  </Badge>
                </>
              ) : null}
            </div>
          </div>

          {fetchError ? (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{fetchError}</p>
          ) : null}

          <div className="relative flex-1 overflow-hidden rounded-[1.5rem] bg-[#f6f5f1]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${font?.id ?? 'loading'}-${fontMotionIndex}`}
                variants={fontSwapVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="h-full"
              >
                <AnimatePresence custom={viewDirection} mode="wait" initial={false}>
                  <motion.div
                    key={viewIndex}
                    custom={viewDirection}
                    variants={tabVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.12, ease: 'easeOut' }}
                    className="h-full"
                  >
                    {viewIndex === 0 ? (
                      <SpecimenTab
                        font={font}
                        fontFamily={fontFamily}
                        titleText={titleText}
                        subtitleText={subtitleText}
                        onChangeTitle={setTitleText}
                        onChangeSubtitle={setSubtitleText}
                      />
                    ) : null}

                    {viewIndex === 1 ? (
                      <ComponentsTab font={font} fontFamily={fontFamily} />
                    ) : null}

                    {viewIndex === 2 ? (
                      <ReadingTab
                        fontFamily={fontFamily}
                        readingText={readingText}
                        onChangeReading={setReadingText}
                      />
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function SpecimenTab({
  font,
  fontFamily,
  titleText,
  subtitleText,
  onChangeTitle,
  onChangeSubtitle,
}: {
  font: Font | null
  fontFamily: string
  titleText: string
  subtitleText: string
  onChangeTitle: (value: string) => void
  onChangeSubtitle: (value: string) => void
}) {
  if (!font) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <section className="flex h-full items-center justify-center p-4 sm:p-8">
      <div
        className="w-full max-w-4xl rounded-[2rem] border border-white/70 bg-gradient-to-br from-white via-[#f5f4ef] to-[#ebe8dc] px-6 py-10 text-center shadow-[0_24px_80px_-45px_rgba(0,0,0,0.35)]"
        style={{ fontFamily }}
      >
        <EditableText
          value={titleText}
          onChange={onChangeTitle}
          className="mx-auto text-5xl font-semibold tracking-tight text-zinc-900 sm:text-7xl"
        />
        <div className="mx-auto mt-4 max-w-2xl">
          <EditableText
            value={subtitleText}
            onChange={onChangeSubtitle}
            className="text-sm leading-7 text-zinc-600 sm:text-base"
            multiline
          />
        </div>
      </div>
    </section>
  )
}

function ComponentsTab({ font, fontFamily }: { font: Font | null; fontFamily: string }) {
  return (
    <section className="h-full overflow-auto p-4 sm:p-8" style={{ fontFamily }}>
      <div className="mx-auto max-w-5xl space-y-4">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>UI Preview</CardTitle>
            <CardDescription>
              Clean shadcn components in the current font.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button>Primary</Button>
              <Button variant="outline">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Badge variant="secondary">{font?.technical.category ?? 'font'}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Search anything" />
              <Input placeholder="Email" type="email" />
            </div>
          </CardContent>
          <CardFooter className="text-xs text-zinc-500">
            {font ? `Designer: ${font.meta.designer}` : 'Loading'}
          </CardFooter>
        </Card>
      </div>
    </section>
  )
}

function ReadingTab({
  fontFamily,
  readingText,
  onChangeReading,
}: {
  fontFamily: string
  readingText: string
  onChangeReading: (value: string) => void
}) {
  return (
    <section className="h-full overflow-auto p-4 sm:p-8" style={{ fontFamily }}>
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-zinc-200 bg-white p-5 sm:p-7">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-zinc-400">Editable Reading Block</p>
        <EditableText
          value={readingText}
          onChange={onChangeReading}
          multiline
          className="min-h-[280px] text-left text-lg leading-8 text-zinc-700"
        />
      </div>
    </section>
  )
}
