import { useEffect, useRef } from 'react'

// Content leaving the screen gets blurred: a frosted band at the top when swiping down,
// at the bottom when swiping up. The top band keeps a faint resting blur as depth.
// The rAF loop only runs while scrolling and stops once the values settle (no per-frame cost when idle).
const band = (side) => ({
  position: 'fixed', left: 0, right: 0, [side]: 0, height: '26vh', zIndex: 40, pointerEvents: 'none',
  backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
  maskImage: `linear-gradient(to ${side === 'top' ? 'bottom' : 'top'}, #000 0%, transparent 100%)`,
  WebkitMaskImage: `linear-gradient(to ${side === 'top' ? 'bottom' : 'top'}, #000 0%, transparent 100%)`,
  opacity: 0.45, willChange: 'opacity', transform: 'translateZ(0)',
})

export default function ScrollBlur() {
  const top = useRef(null), bottom = useRef(null)
  useEffect(() => {
    let raf = 0, last = window.scrollY, v = 0, to = '', bo = ''
    const tick = () => {
      const y = window.scrollY
      v += ((y - last) - v) * 0.18; last = y
      const down = Math.min(1, Math.max(0, v / 28)), up = Math.min(1, Math.max(0, -v / 28))
      const t = (Math.round(Math.min(1, 0.45 + down * 0.55) * 100) / 100).toString(), b = (Math.round(up * 100) / 100).toString()
      if (t !== to) { top.current.style.opacity = to = t }
      if (b !== bo) { bottom.current.style.opacity = bo = b }
      raf = Math.abs(v) < 0.05 && t === '0.45' && b === '0' ? 0 : requestAnimationFrame(tick)
    }
    const wake = () => { if (!raf) raf = requestAnimationFrame(tick) }
    window.addEventListener('scroll', wake, { passive: true })
    wake()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', wake) }
  }, [])
  return (<><div ref={top} style={band('top')} aria-hidden /><div ref={bottom} style={band('bottom')} aria-hidden /></>)
}
