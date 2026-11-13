import { useEffect, useRef } from 'react'

// A snake that slithers along a sine path. Scrolling down stretches it, scrolling up shrinks it.
// Colour: hue sweeps through the RGB wheel over time and along the body.
const STEP = 8
const BASE_LEN = 260
const MIN_LEN = 70

export default function SnakeLayer() {
  const ref = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let w, h, dpr, raf
    let lastY = window.scrollY, smooth = lastY
    let len = BASE_LEN, headX = -20, prevT = performance.now()

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      w = window.innerWidth; h = window.innerHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const frame = (now) => {
      const dt = Math.min(now - prevT, 50); prevT = now
      const t = now / 1000
      const sy = window.scrollY
      const dy = sy - lastY; lastY = sy
      smooth += (sy - smooth) * 0.06

      // swipe down (dy > 0) grows the snake, swipe up shrinks it; it relaxes back to its base length when idle
      len += dy * 1.7
      len += (BASE_LEN - len) * Math.min(1, dt * 0.0012)
      len = Math.max(MIN_LEN, Math.min(len, w * 1.25))
      headX += (150 * dt) / 1000 + dy * 0.5
      if (headX - len > w + 40) headX = -20
      if (headX < -len) headX = w // scrolled up hard: re-enter from the right

      const A = h * 0.13, b = (Math.PI * 2) / (w * 0.55)
      const d = h * 0.62 + Math.sin(smooth * 0.0018 + 1.2) * h * 0.18
      const yAt = (x, i, s) => d + A * Math.sin(b * x + t * 1.3) + Math.sin(i * 0.35 - t * 7) * 3.2 * (1 - s)

      ctx.clearRect(0, 0, w, h)
      ctx.lineCap = 'round'
      const n = Math.ceil(len / STEP)
      const hue0 = t * 80
      const pts = []
      for (let i = 0; i <= n; i++) {
        const x = headX - i * STEP
        pts.push([x, yAt(x, i, i / n)])
      }
      // draw tail -> head so the head ends up on top; glow pass then core pass
      for (const pass of [0, 1]) {
        for (let i = n - 1; i >= 0; i--) {
          const [x0, y0] = pts[i + 1], [x1, y1] = pts[i]
          if (x1 < -20 || x0 > w + 20) continue
          const s = i / n
          const width = 1.4 + (1 - Math.pow(s, 0.8)) * 8
          ctx.strokeStyle = `hsla(${(hue0 + i * 2.4) % 360}, 95%, 60%, ${pass ? 0.95 : 0.14})`
          ctx.lineWidth = pass ? width : width * 3
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke()
        }
      }
      // head
      const [hx, hy] = pts[0]
      ctx.fillStyle = `hsl(${hue0 % 360}, 95%, 65%)`
      ctx.beginPath(); ctx.arc(hx, hy, 7.5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#05080a'
      ctx.beginPath(); ctx.arc(hx + 2.5, hy - 2.5, 1.5, 0, Math.PI * 2); ctx.arc(hx + 2.5, hy + 2.5, 1.5, 0, Math.PI * 2); ctx.fill()

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={ref} className="fixed inset-0 z-[1] pointer-events-none" aria-hidden />
}
