import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import Terminal from './Terminal.jsx'

const Rise = ({ i, className, children }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 + i * 0.1, ease: [0.2, 0.9, 0.2, 1] }}>{children}</motion.div>
)
import Stage from './Stage.jsx'
import IdCard from './IdCard.jsx'

const W = 272, H = 420
const SEGS = 12, SEG_LEN = 24, ANCHOR_Y = -20 // ~288px of rope
const GRAVITY = 0.55, DAMP = 0.991, STEP = 1000 / 60

export default function Hero() {
  const leftRef = useRef(null)
  const areaRef = useRef(null)
  const cardRef = useRef(null)
  const tiltRef = useRef(null)
  const ropeRef = useRef(null)
  const stitchRef = useRef(null) // darker strands
  const lightRef = useRef(null) // lighter strands
  const kickRef = useRef(() => {})

  useEffect(() => {
    const area = areaRef.current
    let width = area.clientWidth
    let pts = [], B
    const drag = { on: false, ox: 0, oy: 0, px: 0, py: 0 }
    const tilt = { tx: 0, ty: 0, x: 0, y: 0, flip: 0, ft: 0 } // ft = flip target (0 front, 180 back)
    const tap = { t: 0 }

    const init = () => {
      const ax = width / 2
      pts = Array.from({ length: SEGS + 1 }, (_, i) => {
        const y = ANCHOR_Y + i * SEG_LEN
        return { x: ax, y, px: ax - i * 0.9, py: y } // slight swing-in on load
      })
      const a = pts[SEGS]
      B = { x: a.x, y: a.y + H, px: a.x - 9, py: a.y + H }
    }
    init()

    const ro = new ResizeObserver(() => {
      const w = area.clientWidth
      if (w !== width) { width = w; init() }
    })
    ro.observe(area)

    const solve = (a, b, len, fixA) => {
      const dx = b.x - a.x, dy = b.y - a.y
      const d = Math.hypot(dx, dy) || 1e-6
      const diff = (d - len) / d
      if (fixA) { b.x -= dx * diff; b.y -= dy * diff }
      else {
        a.x += dx * diff * 0.5; a.y += dy * diff * 0.5
        b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5
      }
    }

    const step = () => {
      const A = pts[SEGS]
      for (let i = 1; i <= SEGS + 1; i++) {
        const p = i <= SEGS ? pts[i] : B
        const vx = (p.x - p.px) * DAMP, vy = (p.y - p.py) * DAMP
        p.px = p.x; p.py = p.y
        p.x += vx; p.y += vy + GRAVITY
      }
      if (drag.on) {
        const tx = drag.px - drag.ox, ty = drag.py - drag.oy
        const dx = (tx - (A.x + B.x) / 2) * 0.3, dy = (ty - (A.y + B.y) / 2) * 0.3
        A.x += dx; A.y += dy; B.x += dx; B.y += dy
      }
      for (let k = 0; k < 8; k++) { // fewer solver passes = a slightly stretchy, floppy rope
        pts[0].x = width / 2; pts[0].y = ANCHOR_Y
        for (let i = 0; i < SEGS; i++) solve(pts[i], pts[i + 1], SEG_LEN, i === 0)
        solve(pts[SEGS], B, H, false)
      }
    }

    const render = () => {
      const A = pts[SEGS]
      const theta = Math.atan2(-(B.x - A.x), B.y - A.y)
      cardRef.current.style.transform = `translate(${A.x - W / 2}px, ${A.y}px) rotate(${theta}rad)`
      tilt.x += (tilt.tx - tilt.x) * 0.12; tilt.y += (tilt.ty - tilt.y) * 0.12; tilt.flip += (tilt.ft - tilt.flip) * 0.14
      tiltRef.current.style.transform = `perspective(800px) rotateX(${tilt.y * -12}deg) rotateY(${tilt.x * 14 + tilt.flip}deg)`
      let d = `M${pts[0].x} ${pts[0].y}`
      for (let i = 1; i < pts.length - 1; i++) {
        d += ` Q${pts[i].x} ${pts[i].y} ${(pts[i].x + pts[i + 1].x) / 2} ${(pts[i].y + pts[i + 1].y) / 2}`
      }
      d += ` L${A.x} ${A.y}`
      ropeRef.current.setAttribute('d', d)

      // twisted-rope texture: short diagonal strands across the rope body, alternating light and dark
      const HW = 4.6, TILT = 3, STEP = 5
      let light = '', dark = '', n = 0
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i], p1 = pts[i + 1]
        const dx = p1.x - p0.x, dy = p1.y - p0.y, len = Math.hypot(dx, dy) || 1
        const tx = dx / len, ty = dy / len, nx = -ty, ny = tx
        const cnt = Math.max(1, Math.round(len / STEP))
        for (let k = 0; k < cnt; k++) {
          const x = p0.x + (dx * k) / cnt, y = p0.y + (dy * k) / cnt
          const seg = `M${(x + nx * HW - tx * TILT).toFixed(1)} ${(y + ny * HW - ty * TILT).toFixed(1)}L${(x - nx * HW + tx * TILT).toFixed(1)} ${(y - ny * HW + ty * TILT).toFixed(1)}`
          if (n++ % 2) dark += seg; else light += seg
        }
      }
      lightRef.current.setAttribute('d', light)
      stitchRef.current.setAttribute('d', dark)
    }

    let raf, last = performance.now(), acc = 0
    const frame = (now) => {
      acc = Math.min(acc + now - last, 100); last = now
      while (acc >= STEP) { step(); acc -= STEP }
      render()
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    // --- pointer handling on the card ---
    const card = cardRef.current
    const local = (e) => {
      const r = area.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top]
    }
    const down = (e) => {
      card.setPointerCapture(e.pointerId)
      const [x, y] = local(e)
      drag.on = true; drag.px = x; drag.py = y; tap.t = Date.now(); tap.x = x; tap.y = y
      drag.ox = x - (pts[SEGS].x + B.x) / 2
      drag.oy = y - (pts[SEGS].y + B.y) / 2
      card.style.cursor = 'grabbing'
    }
    const move = (e) => {
      const [x, y] = local(e)
      if (drag.on) { drag.px = x; drag.py = y }
      else { // hover swipe pushes the tag
        B.x += e.movementX * 0.12; pts[SEGS].x += e.movementX * 0.03
      }
      const r = tiltRef.current.getBoundingClientRect()
      tilt.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2))
      tilt.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2))
    }
    const cancel = () => { drag.on = false; card.style.cursor = 'grab' }
    const up = () => { // a short press without moving flips the card
      if (drag.on && Date.now() - tap.t < 350 && Math.hypot(drag.px - tap.x, drag.py - tap.y) < 6) tilt.ft = tilt.ft ? 0 : 180
      cancel()
    }
    const leave = () => { tilt.tx = 0; tilt.ty = 0 }
    card.addEventListener('pointerdown', down)
    card.addEventListener('pointermove', move)
    card.addEventListener('pointerup', up)
    card.addEventListener('pointercancel', cancel)
    card.addEventListener('pointerleave', leave)

    kickRef.current = () => { B.px -= (Math.random() > 0.5 ? 1 : -1) * 22; B.py -= 4 }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      card.removeEventListener('pointerdown', down)
      card.removeEventListener('pointermove', move)
      card.removeEventListener('pointerup', up)
      card.removeEventListener('pointercancel', cancel)
      card.removeEventListener('pointerleave', leave)
    }
  }, [])

  const toContact = () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })

  // Die-cut sticker: solid fill, off-white outline, hard offset shadow. Lifts and tilts on hover, still draggable.
  const Sticker = ({ children, className, rotate = 0, onClick }) => (
    <motion.span drag dragConstraints={leftRef} dragElastic={0.3} onClick={onClick}
      initial={{ rotate }} whileHover={{ scale: 1.12, rotate: rotate + 5, y: -3 }} whileTap={{ scale: 0.94 }}
      style={{ boxShadow: '3px 4px 0 rgba(0,0,0,.55)' }}
      className={`inline-flex items-center gap-1.5 rounded-full border-[3px] border-[#f2f1ee] px-3.5 py-1.5 font-sticker text-[15px] leading-none tracking-tight select-none cursor-grab active:cursor-grabbing ${className}`}>
      {children}
    </motion.span>
  )

  return (
    <section id="home" className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-32 pb-16 lg:pb-0 min-h-screen lg:flex lg:items-center">
      {/* BOTTOM LAYER: portrait on a 3D plinth. Text, terminal and ID card pass over it. */}
      <div className="pointer-events-none absolute inset-x-0 top-20 bottom-0 z-0 flex items-center justify-center opacity-40 lg:opacity-100"><Stage /></div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-center">
        {/* LEFT */}
        <div ref={leftRef} className="relative z-20 lg:col-span-5 lg:col-start-1 lg:row-start-1">
          <Rise i={0} className="flex flex-wrap gap-x-2.5 gap-y-3 mb-7">
            <Sticker rotate={-4} className="bg-emerald-400 text-[#05080a]">USU '26</Sticker>
            <Sticker rotate={3} className="bg-purple-500 text-white">CTF player</Sticker>
            <Sticker rotate={-2} className="bg-[#05080a] text-emerald-300"><i className="size-2 rounded-full bg-emerald-400 animate-pulse" />online</Sticker>
            <Sticker rotate={4} className="bg-amber-300 text-[#05080a]">cyber</Sticker>
            <Sticker rotate={-3} onClick={() => kickRef.current()} className="bg-[#f2f1ee] text-[#05080a]">play <span className="text-[11px]">▶</span></Sticker>
          </Rise>

          <Rise i={1}><h1 className="font-name drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)] text-5xl sm:text-6xl xl:text-7xl leading-[1.02] bg-gradient-to-br from-white via-white to-emerald-400 bg-clip-text text-transparent">
            AHMAD<br />MUMTAZUL<br />KAUTSAR
          </h1></Rise>
          <Rise i={2}><p className="mt-6 font-serif italic text-2xl sm:text-3xl max-w-lg leading-snug text-emerald-200/70">
            Computer Science Freshman and Cybersecurity enthusiast
          </p></Rise>
          <Rise i={3} className="mt-8 flex flex-wrap gap-4">
            <button onClick={toContact} className="px-6 py-3.5 rounded-full bg-white text-slate-950 font-semibold text-sm hover:bg-slate-200 hover:scale-105 transition-all flex items-center gap-2">
              Contact Me <ArrowUpRight className="w-4 h-4" />
            </button>
            <a href="#/code" className="px-6 py-3.5 rounded-full border border-white/15 bg-white/5 text-white font-semibold text-sm hover:bg-white/10 transition-all">View Works</a>
          </Rise>
          <Rise i={4}><Terminal /></Rise>
        </div>

        {/* RIGHT: physics badge. On lg the area stretches to the very top so the lanyard hangs from the screen edge. */}
        <div ref={areaRef} className="lg:col-span-4 relative z-20 h-[700px] lg:absolute lg:top-0 lg:right-0 lg:w-[30%] lg:h-[720px] w-full">
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.55))' }}>
            <path ref={ropeRef} stroke="#4b2d15" strokeWidth="11.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path ref={stitchRef} stroke="#7d522a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <path ref={lightRef} stroke="#c49a60" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          </svg>

          <div ref={cardRef} className="absolute left-0 top-0 origin-top select-none" style={{ width: W, height: H, cursor: 'grab', touchAction: 'none' }}>
            {/* swivel lobster clasp */}
            <svg viewBox="0 0 40 64" className="pointer-events-none absolute -top-[46px] left-1/2 z-10 h-14 w-9 -translate-x-1/2 drop-shadow-[0_2px_2px_rgba(0,0,0,.6)]">
              <defs><linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f4f4f5" /><stop offset=".5" stopColor="#9ca3af" /><stop offset="1" stopColor="#e4e4e7" /></linearGradient></defs>
              <rect x="12" y="2" width="16" height="22" rx="8" fill="none" stroke="url(#metal)" strokeWidth="4" />
              <rect x="16" y="22" width="8" height="8" rx="2" fill="url(#metal)" />
              <path d="M10 28h20a4 4 0 0 1 4 4v14a10 10 0 0 1-10 10h-8a10 10 0 0 1-10-10V32a4 4 0 0 1 4-4z" fill="url(#metal)" stroke="#71717a" strokeWidth="1" />
              <path d="M16 36h8v13a4 4 0 0 1-8 0z" fill="#0b0f0e" opacity=".85" />
            </svg>
            <div ref={tiltRef} className="h-full w-full" style={{ transformStyle: 'preserve-3d' }}><IdCard /></div>
          </div>
          <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[11px] text-white/40">klik kartu untuk membalik ↻</p>
        </div>
      </div>
    </section>
  )
}
