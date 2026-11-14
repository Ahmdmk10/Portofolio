import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'

// Full-screen black "loading" cover shown while switching pages. App fades it in, swaps the page underneath, then fades it out.
export const COVER_IN = 1.5   // s, current page -> loading screen (fade to black)
export const COVER_OUT = 2.5  // s, loading screen -> destination page (slow reveal)
export const LOAD_TIME = 2   // s, the loading screen itself, fully black (progress bar fills over it)

const LABELS = { home: 'home', code: 'coding', design: 'design', learning: 'learning' }

export default function PageLoader({ route }) {
  const pct = useMotionValue(0)
  const text = useTransform(pct, (v) => `${String(Math.round(v)).padStart(3, '0')}%`)
  const width = useTransform(pct, (v) => `${v}%`)
  useEffect(() => {
    const c = animate(pct, 100, { duration: LOAD_TIME, delay: COVER_IN, ease: 'linear' })
    return () => c.stop()
  }, [pct])

  // Cover fades in and out smoothly; the glitch lives only in the loading animation itself.
  return (
    <motion.div className="fixed inset-0 z-[120] grid place-items-center overflow-hidden bg-black"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: COVER_OUT, ease: [0.4, 0, 0.2, 1] } }}
      transition={{ duration: COVER_IN, ease: [0.4, 0, 0.2, 1] }} role="status" aria-live="polite" aria-label="Memuat halaman">
      <div className="glitch-scan pointer-events-none absolute inset-0" />
      <i className="glitch-bar bg-[#ff2a6d]" style={{ top: '22%' }} />
      <i className="glitch-bar bg-[#05d9e8]" style={{ top: '61%', animationDelay: '.5s' }} />
      <i className="glitch-bar bg-emerald-400" style={{ top: '81%', animationDelay: '1s' }} />
      <div className="glitch-shake w-[min(78vw,320px)] select-none">
        <div className="mb-6 flex items-center gap-3">
          <motion.span className="block size-5 border border-emerald-400" animate={{ rotate: 360 }} transition={{ duration: 1.6, ease: 'linear', repeat: Infinity }} />
          <span className="glitch font-mono text-xs text-white/80" data-text={`loading /${LABELS[route] || route}_`}>loading <span className="text-emerald-300">/{LABELS[route] || route}</span>_</span>
        </div>
        <div className="h-px w-full bg-white/15"><motion.div className="h-px bg-emerald-400 shadow-[0_0_10px_rgba(52,245,164,.8)]" style={{ width }} /></div>
        <motion.p className="glitch mt-2 block text-right font-mono text-[11px] text-white/50" data-text="000%">{text}</motion.p>
      </div>
    </motion.div>
  )
}
