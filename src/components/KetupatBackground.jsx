import { useEffect, useRef } from 'react'

const SPACING = 24
const VIS = 1.5 // apparent drawing scale on desktop (phones use 1); keeps the dot grid the size it has always had

// The neon is a sequence of square "paths" around the screen centre, stepping from the biggest square to the
// smallest (toward the centre). Step k appears STEP seconds after step k-1; each square stays HOLD seconds and then
// fades out over FADE seconds. Every square spins clockwise, continuously (every frame). Dots near an outline light up.
// When the smallest step has appeared, the sequence starts again from the biggest.
const STEPS = 8, STEP = 0.8, HOLD = 2.4, FADE = 0.5, FADE_IN = 0.45 // slow, soft steps: no sudden flashes
const CYCLE = STEPS * STEP
const ROT = Math.PI / 4 // rad/s, clockwise (45 deg per second)
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x) } // smoothstep
const BAND = 46         // how far from an outline a dot still glows (wider = fatter neon)

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

export default function KetupatBackground() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let w, h, dpr, vis = VIS, raf

    // The canvas has no CSS size of its own (it would render at bitmap size, off the viewport), so pin it to the
    // viewport and draw in logical units scaled by vis.
    const resize = () => {
      const cw = document.documentElement.clientWidth, ch = window.innerHeight
      vis = cw < 700 ? 1 : VIS
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = cw / vis; h = ch / vis
      canvas.width = cw * dpr; canvas.height = ch * dpr
      canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px'
      ctx.setTransform(dpr * vis, 0, 0, dpr * vis, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const diamond = (x, y, r) => {
      ctx.beginPath()
      ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y)
      ctx.closePath(); ctx.fill()
    }

    const draw = (ms) => {
      const t = ms / 1000
      const cx = w / 2, cy = h / 2
      const rMax = Math.hypot(w, h) / 2 // biggest step: its outline reaches the screen corners
      const diag = Math.hypot(w, h)

      ctx.clearRect(0, 0, w, h)

      // faint cybernetic grid
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(52,245,164,0.05)'
      ctx.beginPath()
      for (let x = 0; x < w; x += SPACING * 4) { ctx.moveTo(x, 0); ctx.lineTo(x, h) }
      for (let y = 0; y < h; y += SPACING * 4) { ctx.moveTo(0, y); ctx.lineTo(w, y) }
      ctx.stroke()

      // live squares: half-side R (fixed per step: biggest first), rotation, opacity
      const rings = []
      const cyc = Math.floor(t / CYCLE)
      for (const cy0 of [cyc - 1, cyc]) { // previous cycle too, so its last squares can finish fading
        for (let k = 0; k < STEPS; k++) {
          const age = t - (cy0 * CYCLE + k * STEP)
          if (age < 0 || age >= HOLD + FADE) continue
          const R = rMax * (1 - k / STEPS)
          const f = ease(age / FADE_IN) * (age > HOLD ? ease((HOLD + FADE - age) / FADE) : 1) // eased fade-in, stays HOLD s, eased fade-out
          const a = t * ROT + k * 0.14 // clockwise on screen (canvas y points down); tiny twist per step
          rings.push({ R, f, c: Math.cos(a), s: Math.sin(a) })
        }
      }

      // thin outline of each square so the shape itself reads, under the dots
      ctx.lineWidth = 1
      for (const r of rings) {
        ctx.strokeStyle = `rgba(52,245,164,${0.2 * r.f})`
        ctx.beginPath()
        const x1 = r.R * r.c, y1 = r.R * r.s
        ctx.moveTo(cx + x1 - y1, cy + y1 + x1); ctx.lineTo(cx - x1 - y1, cy - y1 + x1)
        ctx.lineTo(cx - x1 + y1, cy - y1 - x1); ctx.lineTo(cx + x1 + y1, cy + y1 - x1)
        ctx.closePath(); ctx.stroke()
      }

      // dot grid. Dim dots share ONE path/fill; only lit dots are drawn one by one, with a larger translucent
      // diamond as glow (canvas shadowBlur per dot would be far too slow).
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      ctx.beginPath()
      const lit = []
      for (let gx = SPACING / 2; gx < w; gx += SPACING) {
        for (let gy = SPACING / 2; gy < h; gy += SPACING) {
          const dx = gx - cx, dy = gy - cy
          let I = 0
          for (const r of rings) {
            const u = dx * r.c + dy * r.s, v = -dx * r.s + dy * r.c // point in the square's own (rotated) frame
            const d = Math.abs(Math.max(Math.abs(u), Math.abs(v)) - r.R)
            if (d < BAND) { const k = (1 - d / BAND) * r.f; if (k > I) I = k }
          }
          if (I < 0.04) {
            const q = 1.3
            ctx.moveTo(gx, gy - q); ctx.lineTo(gx + q, gy); ctx.lineTo(gx, gy + q); ctx.lineTo(gx - q, gy); ctx.closePath()
          } else lit.push(gx, gy, I)
        }
      }
      ctx.fill()
      for (let i = 0; i < lit.length; i += 3) {
        const gx = lit[i], gy = lit[i + 1], I = lit[i + 2]
        const [r, g, b] = gradient(Math.hypot(gx - cx, gy - cy) / diag * 1.6 + t * 0.08)
        const rgb = `${r | 0},${g | 0},${b | 0}`
        if (I > 0.3) { ctx.fillStyle = `rgba(${rgb},${0.14 * I})`; diamond(gx, gy, 4 + 11 * I * I) }
        ctx.fillStyle = `rgba(${rgb},${0.25 + 0.75 * I})`
        diamond(gx, gy, 1.3 + 4.2 * I * I)
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={ref} className="fixed inset-0 z-0 pointer-events-none opacity-[.38]" aria-hidden />
}
