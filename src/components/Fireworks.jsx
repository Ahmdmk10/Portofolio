import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'

// Polite fireworks: a small burst on clicks / taps (mouse, touch, pen) in empty space only. Links, buttons, form
// fields and cards never trigger it, bursts are rate-limited, and a small toggle (remembered in this browser) turns it off.
// Original note: 'click' only fires for the primary button and for taps,
// not for scroll gestures. The loop only runs while sparks are alive, so it costs nothing when idle.
const GRAVITY = 0.00018   // px / ms^2
const MAX = 600
const COOLDOWN = 300     // ms between bursts
const SKIP = 'a, button, input, textarea, select, label, summary, [role="button"], [data-no-fx]'
const KEY = 'portfolio_fx'

export default function Fireworks() {
  const ref = useRef(null)
  const [on, setOn] = useState(() => { try { return localStorage.getItem(KEY) !== 'off' } catch { return true } })
  const onRef = useRef(on)
  useEffect(() => { onRef.current = on; try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* private mode */ } }, [on])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let w = 0, h = 0, dpr = 1, raf = 0, last = 0
    let parts = [], flashes = []

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = document.documentElement.clientWidth; h = window.innerHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const burst = (x, y) => {
      const hue = Math.random() * 360, rainbow = Math.random() < 0.4
      const colour = () => (rainbow ? Math.random() * 360 : hue + (Math.random() - 0.5) * 50)
      const add = (n, speed, life, size, ring) => {
        for (let i = 0; i < n; i++) {
          const a = ring ? (i / n) * Math.PI * 2 : Math.random() * Math.PI * 2
          const v = ring ? speed : speed * (0.25 + Math.random() * 0.75)
          parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, age: 0, size, hue: colour(), twinkle: Math.random() < 0.3 })
        }
      }
      add(46, 0.5, 1200, 1.8, false)  // round shell
      add(18, 0.38, 1000, 2, true)   // ring
      add(10, 0.14, 1600, 1.5, false) // slow glitter that hangs and falls
      flashes.push({ x, y, age: 0, hue })
      if (parts.length > MAX) parts = parts.slice(parts.length - MAX)
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame) }
    }

    const frame = (now) => {
      const dt = Math.min(now - last, 40); last = now
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineCap = 'round'
      for (const f of flashes) { // quick bloom at the burst centre
        f.age += dt
        const p = f.age / 260
        if (p >= 1) continue
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 90 * (0.4 + p))
        g.addColorStop(0, `hsla(${f.hue},100%,90%,${0.9 * (1 - p)})`); g.addColorStop(1, `hsla(${f.hue},100%,60%,0)`)
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, 90 * (0.4 + p), 0, Math.PI * 2); ctx.fill()
      }
      flashes = flashes.filter((f) => f.age < 260)
      const drag = Math.pow(0.9965, dt)
      for (const p of parts) {
        p.age += dt
        p.vx *= drag; p.vy = p.vy * drag + GRAVITY * dt
        const ox = p.x, oy = p.y
        p.x += p.vx * dt; p.y += p.vy * dt
        const k = 1 - p.age / p.life
        if (k <= 0) continue
        const a = (p.twinkle ? 0.55 + 0.45 * Math.sin(p.age * 0.05) : 1) * Math.min(1, k * 1.6)
        ctx.strokeStyle = `hsla(${p.hue},100%,${55 + 30 * k}%,${a * 0.35})`; ctx.lineWidth = p.size * 3.2 * k + 1
        ctx.beginPath(); ctx.moveTo(ox - p.vx * 16, oy - p.vy * 16); ctx.lineTo(p.x, p.y); ctx.stroke() // glow trail
        ctx.strokeStyle = `hsla(${p.hue},100%,85%,${a})`; ctx.lineWidth = p.size * k + 0.4
        ctx.beginPath(); ctx.moveTo(ox - p.vx * 9, oy - p.vy * 9); ctx.lineTo(p.x, p.y); ctx.stroke()
      }
      parts = parts.filter((p) => p.age < p.life)
      ctx.globalCompositeOperation = 'source-over'
      if (parts.length || flashes.length) raf = requestAnimationFrame(frame)
      else { raf = 0; ctx.clearRect(0, 0, w, h) }
    }

    let lastBurst = 0
    const onClick = (e) => {
      if (!onRef.current || e.detail === 0) return          // off, or keyboard-synthesised click
      if (e.target instanceof Element && e.target.closest(SKIP)) return // never on interactive things
      const now = performance.now()
      if (now - lastBurst < COOLDOWN) return
      lastBurst = now
      burst(e.clientX, e.clientY)
    }
    window.addEventListener('click', onClick)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('click', onClick); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <>
      <canvas ref={ref} className="pointer-events-none fixed left-0 top-0 z-[95]" aria-hidden />
      <button type="button" onClick={() => setOn((v) => !v)} aria-pressed={on} aria-label={on ? 'Matikan efek kembang api' : 'Nyalakan efek kembang api'}
        title={on ? 'Efek klik: nyala' : 'Efek klik: mati'}
        className={`fixed bottom-4 left-4 z-[96] flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] backdrop-blur-sm transition-colors ${on ? 'border-emerald-400/50 bg-black/50 text-emerald-300' : 'border-white/15 bg-black/50 text-white/40'}`}>
        <Sparkles size={12} />fx {on ? 'on' : 'off'}
      </button>
    </>
  )
}
