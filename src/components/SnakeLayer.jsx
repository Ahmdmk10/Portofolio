import { useEffect, useRef } from 'react'

// White line-art snake in the style of a Japanese irezumi drawing: outline only (transparent inside),
// a broad head covered in cobblestone scales, fish-scale rows along the body, and curling cloud (kumo) swirls.
// It slides in from the top-left corner, then crawls down the page in a zigzag as you scroll.
// The route is a fixed function x(y) of page position, so scrolling up retraces it instead of jumping.
const MAXN = 360      // safety cap on body samples
const SPU = 2         // body sample spacing, in route samples (2 x 4px = 8px)
const WAVE = 520      // px per body undulation: ~3 waves visible at once
const TONGUE_PTS = 1650 // segments per tongue branch (3 branches ~ 5000)
// Where the snake must stay out of the way: text blocks (dimmed a lot) and the hero portrait (dimmed more, so it
// is the one star of that area). Rects are measured from the DOM every other frame.
const TEXT_SEL = 'h1, h2, h3, h4, p, li'
const STAR_SEL = '[data-star]'
const VIS = 1.5       // apparent drawing scale on desktop (phones use 1)
const INK = '255,255,255'

const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t) }

// Head geometry in pixels (local axes: a along the snake toward the nose, c across).
const HW = 44, HL = 80

// Pre-computed cobblestone scales for the head, in local pixel coords. Small near the neck, big plates at the snout.
function makeHeadScales() {
  let seed = 7
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  const cells = []
  let a = -HL * 0.95, row = 0
  while (a < HL * 0.98) {
    const R = 4.5 + 8 * ((a + HL) / (2 * HL))
    for (let c = -HW + (row % 2 ? R * 0.95 : 0); c < HW; c += R * 1.9) {
      const verts = []
      const rot = 0
      for (let k = 0; k < 6; k++) { const ang = rot + (k * Math.PI) / 3, rr = R * (0.88 + rnd() * 0.1); verts.push([Math.cos(ang) * rr, Math.sin(ang) * rr * 0.9]) }
      cells.push({ a: a + (rnd() - 0.5) * R * 0.4, c: c + (rnd() - 0.5) * R * 0.4, verts })
    }
    a += R * 1.65; row++
  }
  return cells
}

export default function SnakeLayer() {
  const ref = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const scales = makeHeadScales()
    let w, h, dpr, vis = VIS, raf, frameNo = 0
    let dims = [] // [x, y, w, h, strength] in logical units
    const t0 = performance.now()
    let prev = t0

    // The canvas has no CSS size of its own, so it used to render at bitmap size (1.5x the viewport) and the
    // right half of the route ran off-screen. Now it is pinned to the viewport and drawn in "logical" units
    // scaled by VIS, which keeps the snake the same apparent size while the route fits the visible width.
    const resize = () => {
      const cw = document.documentElement.clientWidth, ch = window.innerHeight // clientWidth excludes the scrollbar
      vis = cw < 700 ? 1 : VIS
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = cw / vis; h = ch / vis
      canvas.width = cw * dpr; canvas.height = ch * dpr
      canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px'
      ctx.setTransform(dpr * vis, 0, 0, dpr * vis, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // ---- route: a smooth S-curve made only of circular arcs, swinging between ~5 characters from each edge.
    // One lap (left edge -> right edge -> back) is built once per resize, squashed vertically so a swing takes
    // about a screen of scrolling, then resampled to equal spacing and repeated down the page.
    const MARGIN = 95 // head centre; body half-width (~42) + slither (4) leaves ~5 characters of gap to the screen edge
    const DS = 4      // px between route samples
    let xs = [], ys = [], M = 1, lapDy = 1, ds = DS
    const buildRoute = () => {
      const W = w - 2 * MARGIN, alpha = 0 // heading is horizontal at the crossings: the route is a chain of true semicircular arcs
      const rho = W / (2 * (1 - Math.sin(alpha))) // arcs only: apex-to-apex width fixes the radius
      // turtle starts at the left apex heading straight down; heading theta is measured clockwise from +x on screen
      let x = MARGIN, y = 0, th = Math.PI / 2
      const rx = [x], ry = [y]
      const walk = (len, dir) => {
        const n = Math.max(1, Math.round(len / 2)), step = len / n
        for (let k = 0; k < n; k++) { const dth = dir * (step / rho), mid = th + dth / 2; x += Math.cos(mid) * step; y += Math.sin(mid) * step; th += dth; rx.push(x); ry.push(y) }
      }
      // ccw down to heading alpha (right-down), cw across to heading pi-alpha (right apex is the midpoint),
      // ccw back to straight down (the left apex): one lap
      walk((Math.PI / 2 - alpha) * rho, -1)
      walk((Math.PI - 2 * alpha) * rho, 1)
      walk((Math.PI / 2 - alpha) * rho, -1)
      // squash vertically so a full left-right-left lap descends ~2.8 screens (round turns, never stretched past 1)
      const kappa = Math.min(1, (h * 2.8) / (ry[ry.length - 1] || 1))
      for (let k = 0; k < ry.length; k++) ry[k] *= kappa
      // close the lap in x, then resample at equal arc length
      const drift = rx[rx.length - 1] - rx[0]
      for (let k = 0; k < rx.length; k++) rx[k] -= (drift * k) / (rx.length - 1)
      const cum = [0]
      for (let k = 1; k < rx.length; k++) cum.push(cum[k - 1] + Math.hypot(rx[k] - rx[k - 1], ry[k] - ry[k - 1]))
      M = Math.round(cum[cum.length - 1] / DS); ds = cum[cum.length - 1] / M // equal spacing that closes the lap exactly
      xs = []; ys = []
      for (let m = 0, k = 0; m <= M; m++) {
        const d = m * ds
        while (k < cum.length - 2 && cum[k + 1] < d) k++
        const f = (d - cum[k]) / Math.max(1e-6, cum[k + 1] - cum[k])
        xs.push(rx[k] + (rx[k + 1] - rx[k]) * f); ys.push(ry[k] + (ry[k + 1] - ry[k]) * f)
      }
      lapDy = ys[M]
    }
    buildRoute()
    window.addEventListener('resize', buildRoute)

    // route(u): u in index units; u < 0 runs straight up the left edge so the snake enters from the top-left.
    const route = (u, out) => {
      if (u < 0) { out[0] = MARGIN; out[1] = u * ds; return out }
      const n = Math.floor(u / M), r = u - n * M, i0 = Math.min(M - 1, Math.floor(r)), f = r - i0
      out[0] = xs[i0] + (xs[i0 + 1] - xs[i0]) * f
      out[1] = ys[i0] + (ys[i0 + 1] - ys[i0]) * f + n * lapDy
      return out
    }
    // inverse: which u puts the head at page height Y (y is strictly increasing along the route)
    const uForY = (Y) => {
      if (Y <= 0) return Y / ds
      const n = Math.floor(Y / lapDy), r = Y - n * lapDy
      let lo = 0, hi = M
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ys[mid] <= r) lo = mid; else hi = mid }
      return n * M + lo + (r - ys[lo]) / Math.max(1e-6, ys[lo + 1] - ys[lo])
    }

    let uHead = 0
    const tmp = [0, 0]
    const frame = (now) => {
      const dt = Math.min(now - prev, 50); prev = now
      const t = (now - t0) / 1000
      const sy = window.scrollY / vis // logical units, like the route
      // intro: glide in from the corner, then lead the viewport so the head sits ~45% down the screen
      const intro = smooth(0, 2.4, t) * h * 0.45 - h * 0.25
      const targetY = Math.max(sy + h * 0.45, sy + intro)
      uHead += (uForY(targetY) - uHead) * Math.min(1, dt * 0.006)

      // The body stretches: the tail stays pinned to the route's start (top-left of the page) and the head
      // advances with the scroll, so the snake gets longer as you read down. Only the on-screen part is sampled,
      // on a fixed grid (global index K) so the pattern stays glued to the body instead of sliding with the head.
      const U = [uHead], K = [0], px0 = [], py0 = []
      route(uHead, tmp); px0.push(tmp[0]); py0.push(tmp[1] - sy)
      let kk = Math.floor(uHead / SPU); if (uHead - kk * SPU < SPU * 0.5) kk--
      let tailEnd = false
      for (; U.length < MAXN; kk--) {
        const u = kk * SPU
        if (u < 0) { U.push(0); K.push(-1); route(0, tmp); px0.push(tmp[0]); py0.push(tmp[1] - sy); tailEnd = true; break }
        route(u, tmp); U.push(u); K.push(kk); px0.push(tmp[0]); py0.push(tmp[1] - sy)
        if (tmp[1] - sy < -220) break
      }
      void tailEnd
      const n = U.length - 1 // last index
      const px = Float32Array.from(px0), py = Float32Array.from(py0)
      const dHead = (i) => (uHead - U[i]) * ds, dTail = (i) => U[i] * ds
      const phase = (i) => (U[i] * ds) / WAVE * Math.PI * 2 - t * 1.4
      // tiny slither along the normal (kept small: a bigger one bends the turns unevenly, so left and right looked different): grows away from the head, dies out at the pinned tail
      for (let i = 1; i <= n; i++) {
        const a0 = px0[i - 1] - px0[Math.min(n, i + 1)], b0 = py0[i - 1] - py0[Math.min(n, i + 1)], m = Math.hypot(a0, b0) || 1
        const off = Math.sin(phase(i) * 1 + 1) * 4 * smooth(0, 160, dHead(i)) * smooth(0, 220, dTail(i))
        px[i] = px0[i] - (b0 / m) * off; py[i] = py0[i] + (a0 / m) * off
      }
      // thick near the head, slimming along the body, a fine point at the tail; 3 soft bulges per ~1500px
      const half = (i) => {
        const dh = dHead(i), dtl = dTail(i)
        const base = 5 + 33 * (1 - 0.1 * smooth(0, 1500, dh)) // stays thick all the way back
        return base * (0.72 + 0.28 * smooth(0, 70, dh)) * (1 + 0.11 * Math.sin(phase(i)) * smooth(0, 120, dh)) * (0.4 + 0.6 * smooth(0, 160, dtl))
      }
      const dirHead = (() => { route(uHead - 3, tmp); const bx = tmp[0], by = tmp[1]; route(uHead, tmp); const dx = tmp[0] - bx, dy = tmp[1] - by, m = Math.hypot(dx, dy) || 1; return [dx / m, dy / m] })()
      const dir = (i) => { // unit tangent pointing toward the head
        if (i === 0) return dirHead
        const a = i - 1, b = Math.min(n, i + 1)
        const dx = px[a] - px[b], dy = py[a] - py[b]; const m = Math.hypot(dx, dy) || 1
        return [dx / m, dy / m]
      }

      ctx.clearRect(0, 0, w, h)
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      const stroke = (a, wd) => { ctx.strokeStyle = `rgba(${INK},${a})`; ctx.lineWidth = wd; ctx.stroke() }
      // RGB neon: hue cycles over time and along the body. Glow is faked with wide additive passes (cheap, and it can
      // change colour per segment, which canvas shadowBlur cannot), under a bright near-white core.
      const hue0 = (t * 70) % 360
      const stops = (g, alpha, light) => { for (let k = 0; k <= 6; k++) g.addColorStop(k / 6, `hsla(${(hue0 + k * 60) % 360},100%,${light}%,${alpha})`); return g }
      const neonPath = (mk, wd) => { // strokes the current path as an RGB neon tube; mk() returns a fresh gradient
        ctx.globalCompositeOperation = 'lighter'
        ctx.strokeStyle = stops(mk(), 0.12, 55); ctx.lineWidth = wd * 6; ctx.stroke()
        ctx.strokeStyle = stops(mk(), 0.3, 55); ctx.lineWidth = wd * 3; ctx.stroke()
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = stops(mk(), 0.98, 86); ctx.lineWidth = wd; ctx.stroke()
      }
      const detailGlow = `hsla(${(hue0 + 180) % 360},100%,62%,.95)`
      const glow = (a, wd) => { ctx.shadowColor = detailGlow; ctx.shadowBlur = 7; stroke(a, wd); ctx.shadowBlur = 0 } // soft neon on fine details

      // ---- body outline (closed loop) + inner offset line for the tattoo "double line" look
      const loop = (k) => {
        ctx.beginPath()
        for (let i = 0; i <= n; i++) { const [dx, dy] = dir(i), hw = half(i) * k; const x = px[i] - dy * hw, y = py[i] + dx * hw; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }
        for (let i = n; i >= 0; i--) { const [dx, dy] = dir(i), hw = half(i) * k; ctx.lineTo(px[i] + dy * hw, py[i] - dx * hw) }
        ctx.closePath()
      }
      // body edges in short chunks, each with its own hue so the colour runs along the snake
      for (const sg of [1, -1]) {
        for (let i = 0; i < n; i += 3) {
          const j = Math.min(n, i + 3), hue = (hue0 + dHead(i) * 0.3) % 360
          ctx.beginPath()
          for (let k = i; k <= j; k++) { const [dx, dy] = dir(k), hw = half(k); const x = px[k] - sg * dy * hw, y = py[k] + sg * dx * hw; k === i ? ctx.moveTo(x, y) : ctx.lineTo(x, y) }
          ctx.globalCompositeOperation = 'lighter'
          ctx.strokeStyle = `hsla(${hue},100%,55%,.1)`; ctx.lineWidth = 13; ctx.stroke()
          ctx.strokeStyle = `hsla(${hue},100%,55%,.24)`; ctx.lineWidth = 6.5; ctx.stroke()
          ctx.globalCompositeOperation = 'source-over'
          ctx.strokeStyle = `hsla(${hue},100%,86%,.98)`; ctx.lineWidth = 2.2; ctx.stroke()
        }
      }
      loop(0.86); stroke(0.3, 1)

      // ---- cyber-body: honeycomb cells, PCB traces with vias, edge pads, data bus, code glyphs
      const frame2 = (i) => { const [dx, dy] = dir(i); return [dx, dy, -dy, dx] }
      const at = (i, a, c) => { const [dx, dy, nx, ny] = frame2(i); return [px[i] + dx * a + nx * c, py[i] + dy * a + ny * c] }

      // volume: curved engraving hatch on one flank + a highlight line on the other, so the body reads as a round tube
      ctx.beginPath()
      for (let i = 1; i < n; i++) {
        const hw = half(i), a = at(i, 0, hw * 0.96), b = at(i, -hw * 0.5, hw * 0.4), c = at(i, -hw * 0.22, hw * 0.7)
        ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(c[0], c[1], b[0], b[1])
      }
      stroke(0.22, 1)
      ctx.beginPath()
      for (let i = 1; i <= n; i++) { const q = at(i, 0, -half(i) * 0.58); i === 1 ? ctx.moveTo(q[0], q[1]) : ctx.lineTo(q[0], q[1]) }
      stroke(0.5, 1.6)

      // honeycomb scales (hexagonal cells, staggered rows)
      ctx.beginPath()
      for (let i = 1; i < n; i++) {
        if (K[i] < 0 || K[i] % 2) continue
        const row = K[i] / 2, hw = half(i), r = Math.min(8.5, hw * 0.19), step = r * 1.732
        for (let c = -hw * 0.9 + (row % 2 ? step / 2 : 0); c < hw * 0.9; c += step) {
          if (Math.abs(c) + r > hw * 0.93) continue
          for (let k = 0; k < 6; k++) { const ang = (k * Math.PI) / 3, q = at(i, Math.cos(ang) * r * 0.92, c + Math.sin(ang) * r * 0.92); k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]) }
          ctx.closePath()
        }
      }
      stroke(0.16, 1)

      // PCB traces: orthogonal runs with 45-degree bends ending in a via ring, alternating sides
      ctx.beginPath()
      for (let i = 1; i < n; i++) {
        if (K[i] < 0 || K[i] % 10) continue
        const k = K[i] / 10, hw = half(i), sg = k % 2 ? 1 : -1, v = k % 3, c0 = sg * hw * 0.62
        const run = hw * (0.4 + 0.25 * v), jog = hw * 0.28
        const pts = [[0, c0], [-run, c0], [-run - jog, c0 - sg * jog], [-run - jog - hw * (0.3 + 0.2 * (2 - v)), c0 - sg * jog]]
        pts.forEach(([a, c], j) => { const q = at(i, a, c); j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]) })
        const e = pts[3], q = at(i, e[0], e[1]), vr = Math.max(2, hw * 0.08)
        ctx.moveTo(q[0] + vr, q[1]); ctx.arc(q[0], q[1], vr, 0, Math.PI * 2)
        const s0 = at(i, 0, c0); ctx.moveTo(s0[0] + 1.6, s0[1]); ctx.arc(s0[0], s0[1], 1.6, 0, Math.PI * 2)
      }
      glow(0.85, 1.2)

      // data bus: dashed spine with square nodes
      ctx.beginPath()
      for (let i = 1; i <= n; i++) { const g = K[i] < 0 ? 0 : K[i] % 3; if (g === 2) continue; const q = at(i, 0, 0); ctx.lineTo(q[0], q[1]); if (g === 1) ctx.moveTo(q[0], q[1]) }
      glow(0.4, 1)

      // code glyphs along the body: readable text on a cleared patch so hex cells don't clutter it
      ctx.font = '600 11px "Chivo Mono", ui-monospace, monospace'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      const GLYPH = ['{ }', '</>', '0x4F', '1010', '&&', '=>', '0110', '#!', '[ ]', 'FF', '0101', '||', '0xA3', '::']
      const glyph = (txt, i, c, size, alpha) => {
        const [dx, dy] = dir(i), q = at(i, 0, c)
        let ang = Math.atan2(dy, dx); if (Math.abs(ang) > Math.PI / 2) ang += Math.PI // keep text upright-ish
        ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(ang)
        ctx.font = `600 ${size}px "Chivo Mono", ui-monospace, monospace`
        const wd = txt.length * size * 0.62 + 4
        ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = '#000'; ctx.fillRect(-wd / 2, -size * 0.65, wd, size * 1.3)
        ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(${INK},${alpha})`; ctx.shadowColor = detailGlow; ctx.shadowBlur = 8; ctx.fillText(txt, 0, 1); ctx.shadowBlur = 0
        ctx.restore()
      }
      for (let i = 1; i < n; i++) {
        if (K[i] < 0 || K[i] % 14) continue
        const k = K[i] / 14, hw = half(i), size = Math.max(7, Math.min(15, hw * 0.4))
        glyph(GLYPH[(k * 5 + 2) % GLYPH.length], i, 0, size, 0.95)
      }

      // ---- head
      const [dx, dy] = dir(0), nx = -dy, ny = dx
      const hx = px[0], hy = py[0]
      const P = (a, c) => [hx + dx * a + nx * c, hy + dy * a + ny * c]
      const bz = (c1, c2, e) => ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], e[0], e[1])
      const headShape = () => {
        ctx.beginPath()
        const s = P(-HL * 0.92, HW * 0.6); ctx.moveTo(s[0], s[1])
        bz(P(-HL * 0.7, HW * 1.1), P(-HL * 0.05, HW * 1.15), P(HL * 0.5, HW * 0.62))   // cheek
        bz(P(HL * 0.8, HW * 0.42), P(HL * 1.0, HW * 0.3), P(HL * 1.0, HW * 0.14))      // snout
        bz(P(HL * 1.04, HW * 0.05), P(HL * 1.04, -HW * 0.05), P(HL * 1.0, -HW * 0.14)) // blunt nose
        bz(P(HL * 1.0, -HW * 0.3), P(HL * 0.8, -HW * 0.42), P(HL * 0.5, -HW * 0.62))
        bz(P(-HL * 0.05, -HW * 1.15), P(-HL * 0.7, -HW * 1.1), P(-HL * 0.92, -HW * 0.6))
        ctx.closePath()
      }
      // erase body lines under the head (still transparent: the background dots show through), then draw the scales
      headShape()
      ctx.globalCompositeOperation = 'destination-out'; ctx.fill(); ctx.globalCompositeOperation = 'source-over'
      ctx.save(); ctx.clip()
      ctx.beginPath()
      for (const cell of scales) {
        const [cx, cy] = P(cell.a, cell.c)
        cell.verts.forEach(([vx, vy], k) => {
          const x = cx + dx * vx + nx * vy, y = cy + dy * vx + ny * vy
          k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
        })
        ctx.closePath()
      }
      stroke(0.55, 1)
      ctx.restore()
      // head outline
      headShape()
      neonPath(() => (ctx.createConicGradient ? ctx.createConicGradient(t * 1.2, hx, hy) : ctx.createLinearGradient(hx - 80, hy, hx + 80, hy)), 2.4)
      // brow ridges + nostrils
      ctx.beginPath()
      for (const sg of [1, -1]) {
        const a = P(0, sg * HW * 0.78), b = P(HL * 0.42, sg * HW * 0.62), c = P(HL * 0.2, sg * HW * 0.82)
        ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(c[0], c[1], b[0], b[1])
        const n = P(HL * 0.86, sg * HW * 0.2); ctx.moveTo(n[0] + 2.5, n[1]); ctx.arc(n[0], n[1], 2.5, 0, Math.PI * 2)
      }
      stroke(0.9, 1.4)
      // eyes: ring, red iris, slit pupil, glint
      for (const sg of [1, -1]) {
        const [ex, ey] = P(HL * 0.22, sg * HW * 0.66)
        ctx.beginPath(); ctx.arc(ex, ey, 9.5, 0, Math.PI * 2); ctx.fillStyle = `hsl(${hue0},100%,55%)`; ctx.fill(); stroke(0.97, 1.6)
        ctx.beginPath(); ctx.ellipse(ex, ey, 1.9, 6.2, Math.atan2(dy, dx), 0, Math.PI * 2); ctx.fillStyle = '#12090a'; ctx.fill()
        ctx.beginPath(); ctx.arc(ex - 2.6, ey - 2.8, 1.7, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fill()
      }
      // long forked tongue, flicking. Built from TONGUE_PTS tiny segments per branch (~5000 in total) with a travelling
      // wave along it, so it reads as one smooth, living curve rather than straight sticks.
      const flick = 0.5 + 0.5 * Math.max(0, Math.sin(t * 4.5))
      const A0 = HL * 1.02, stemLen = 52 * flick, prongLen = 26 * flick, spread = 13 * flick
      const wave = (q, amp) => Math.sin(t * 11 - q * 7) * amp * q            // ripples toward the tip, still at the root
      const stemC = (q) => wave(q, 3.2 * flick)
      ctx.beginPath()
      for (let k = 0; k <= TONGUE_PTS; k++) {
        const q = k / TONGUE_PTS, pt = P(A0 + stemLen * q, stemC(q))
        k ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])
      }
      const c0 = stemC(1)
      for (const sg of [1, -1]) {
        for (let k = 0; k <= TONGUE_PTS; k++) {
          const q = k / TONGUE_PTS
          // prongs swing outward in a smooth arc, then curl slightly back in toward the tips
          const c = c0 + sg * spread * (Math.sin(q * Math.PI * 0.5) - 0.22 * q * q) + wave(q, 1.6 * flick) * sg
          const pt = P(A0 + stemLen + prongLen * q, c)
          k ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])
        }
      }
      { const a = P(A0, 0), b = P(A0 + stemLen + prongLen, 0); neonPath(() => ctx.createLinearGradient(a[0], a[1], b[0], b[1]), 1.6) }

      // ---- keep readable things readable: erase most of the snake behind text blocks and the portrait
      if (frameNo++ % 2 === 0) {
        dims = []
        const vh = window.innerHeight
        const add = (el, strength, pad) => {
          const b = el.getBoundingClientRect()
          if (b.width < 8 || b.bottom < -30 || b.top > vh + 30) return
          dims.push([(b.left - pad) / vis, (b.top - pad) / vis, (b.width + pad * 2) / vis, (b.height + pad * 2) / vis, strength])
        }
        document.querySelectorAll(TEXT_SEL).forEach((el) => add(el, 0.72, 10))
        document.querySelectorAll(STAR_SEL).forEach((el) => add(el, 0.88, 0))
      }
      ctx.globalCompositeOperation = 'destination-out'
      for (const [x, y, rw, rh, a] of dims) {
        // two nested rects give a soft edge without any blur
        ctx.fillStyle = `rgba(0,0,0,${a * 0.4})`; ctx.fillRect(x - 8, y - 8, rw + 16, rh + 16)
        ctx.fillStyle = `rgba(0,0,0,${a * 0.6})`; ctx.fillRect(x, y, rw, rh)
      }
      ctx.globalCompositeOperation = 'source-over'

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={ref} className="fixed inset-0 z-[1] pointer-events-none opacity-[.56]" aria-hidden />
}
