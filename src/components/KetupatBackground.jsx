import { useEffect, useRef } from 'react'

const SPACING = 24
// Gemini-inspired palette: purple, blue, green, amber
const STOPS = [[168, 85, 247], [59, 130, 246], [52, 245, 164], [251, 191, 36]]

function gradient(t) {
  t = ((t % 1) + 1) % 1
  const p = t * STOPS.length
  const i = Math.floor(p)
  const f = p - i
  const a = STOPS[i % STOPS.length]
  const b = STOPS[(i + 1) % STOPS.length]
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
}

// y = A sin(bx + c) + d
export default function KetupatBackground() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let w, h, dpr, raf
    let scrollTarget = window.scrollY
    let scrollSmooth = scrollTarget
    let velocity = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const onScroll = () => { scrollTarget = window.scrollY }
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', onScroll, { passive: true })

    const diamond = (x, y, r) => {
      ctx.beginPath()
      ctx.moveTo(x, y - r)
      ctx.lineTo(x + r, y)
      ctx.lineTo(x, y + r)
      ctx.lineTo(x - r, y)
      ctx.closePath()
      ctx.fill()
    }

    const draw = (ms) => {
      const t = ms / 1000
      const prev = scrollSmooth
      scrollSmooth += (scrollTarget - scrollSmooth) * 0.06 // damping / inertia
      velocity += ((scrollSmooth - prev) - velocity) * 0.1

      const A = h * (0.16 + Math.min(Math.abs(velocity) * 0.004, 0.05))
      const b = (Math.PI * 2) / (w * 0.75)
      const c = t * 0.9 + velocity * 0.05
      const d = h * 0.5 + Math.sin(scrollSmooth * 0.0018) * h * 0.22 - (scrollSmooth * 0.05) % h * 0
      const band = 70
      const snake = (x, phase = 0, amp = A) => amp * Math.sin(b * x + c + phase) + d

      ctx.clearRect(0, 0, w, h)

      // cybernetic math overlay
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(52,245,164,0.05)'
      ctx.beginPath()
      for (let x = 0; x < w; x += SPACING * 4) { ctx.moveTo(x, 0); ctx.lineTo(x, h) }
      for (let y = 0; y < h; y += SPACING * 4) { ctx.moveTo(0, y); ctx.lineTo(w, y) }
      ctx.stroke()
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.beginPath()
      ctx.moveTo(0, d); ctx.lineTo(w, d)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(52,245,164,0.18)'
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      for (let x = 0; x <= w; x += 6) { const y = snake(x); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }
      ctx.stroke()
      ctx.setLineDash([])
      ctx.font = '12px "Chivo Mono", monospace'
      ctx.fillStyle = 'rgba(52,245,164,0.35)'
      ctx.fillText('y = A sin(bx + c) + d', 24, h - 56)
      ctx.fillStyle = 'rgba(255,255,255,0.22)'
      ctx.fillText(`A=${A.toFixed(0)}  b=${b.toFixed(4)}  c=${(c % (Math.PI * 2)).toFixed(2)}  d=${d.toFixed(0)}`, 24, h - 36)

      // ketupat grid. Far dots share ONE path/fill; only dots near the curve are drawn individually,
      // with a larger translucent diamond as glow (canvas shadowBlur per dot was the main cost).
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      ctx.beginPath()
      const near = []
      for (let gx = SPACING / 2; gx < w; gx += SPACING) {
        const sy = snake(gx)
        for (let gy = SPACING / 2; gy < h; gy += SPACING) {
          const dist = Math.abs(gy - sy)
          if (dist > band) {
            const r = 1.3
            ctx.moveTo(gx, gy - r); ctx.lineTo(gx + r, gy); ctx.lineTo(gx, gy + r); ctx.lineTo(gx - r, gy); ctx.closePath()
          } else near.push(gx, gy, sy)
        }
      }
      ctx.fill()
      for (let i = 0; i < near.length; i += 3) {
        const gx = near[i], gy = near[i + 1], sy = near[i + 2]
        const k = 1 - Math.abs(gy - sy) / band
        const [r, g, bl] = gradient(gx / w * 0.8 + t * 0.08 + (gy - sy) / 600)
        const rgb = `${r | 0},${g | 0},${bl | 0}`
        if (k > 0.35) { ctx.fillStyle = `rgba(${rgb},${0.14 * k})`; diamond(gx, gy, 3 + 6 * k * k) }
        ctx.fillStyle = `rgba(${rgb},${0.25 + 0.75 * k})`
        diamond(gx, gy, 1.3 + 2.4 * k * k)
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return <canvas ref={ref} className="fixed inset-0 z-0 pointer-events-none" aria-hidden />
}
