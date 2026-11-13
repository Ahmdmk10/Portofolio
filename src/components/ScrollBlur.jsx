import { useEffect, useRef } from 'react'

// Content leaving the screen gets blurred: a frosted band at the top when swiping down,
// at the bottom when swiping up. The top band keeps a faint resting blur as depth.
const band = (side) => ({
  position: 'fixed', left: 0, right: 0, [side]: 0, height: '34vh', zIndex: 40, pointerEvents: 'none',
  backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
  maskImage: `linear-gradient(to ${side === 'top' ? 'bottom' : 'top'}, #000 0%, transparent 100%)`,
  WebkitMaskImage: `linear-gradient(to ${side === 'top' ? 'bottom' : 'top'}, #000 0%, transparent 100%)`,
  opacity: 0, willChange: 'opacity',
})

export default function ScrollBlur() {
  const top = useRef(null), bottom = useRef(null)
  useEffect(() => {
    let raf, last = window.scrollY, v = 0
    const tick = () => {
      const y = window.scrollY
      v += ((y - last) - v) * 0.18; last = y
      const down = Math.min(1, Math.max(0, v / 28)), up = Math.min(1, Math.max(0, -v / 28))
      top.current.style.opacity = String(Math.min(1, 0.45 + down * 0.55))
      bottom.current.style.opacity = String(up)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (<><div ref={top} style={band('top')} aria-hidden /><div ref={bottom} style={band('bottom')} aria-hidden /></>)
}
